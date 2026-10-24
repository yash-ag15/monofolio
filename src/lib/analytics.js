// Product analytics (PostHog), privacy-first. Off unless NEXT_PUBLIC_POSTHOG_KEY is set.
// About a person we keep only their name and college (setPersonInfo) — no email, phone, location or anything
// else from their profile or resume. No session recordings, no autocapture of clicks or text, no form contents:
// just the named events below and which page of the app is open.
// Turn on "Discard client IP data" in the PostHog project settings as well.

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
// events go to /ingest on our own domain (rewritten to PostHog in next.config.mjs) so ad blockers don't drop them
const UI_HOST = (process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com').includes('eu.') ? 'https://eu.posthog.com' : 'https://us.posthog.com';

let ph = null;
let loading = null;
const queue = [];

function load() {
  if (!KEY || typeof window === 'undefined') return null;
  if (!loading)
    loading = import('posthog-js').then(({ default: posthog }) => {
      posthog.init(KEY, {
        api_host: '/ingest',
        ui_host: UI_HOST,
        persistence: 'localStorage', // no cookies
        person_profiles: 'identified_only', // guests stay anonymous
        autocapture: false,
        capture_dead_clicks: false,
        capture_heatmaps: false,
        capture_pageview: false, // sent by hand below, as the app page only (hash routes)
        capture_pageleave: false,
        disable_session_recording: true,
        disable_surveys: true,
        mask_all_text: true,
        mask_all_element_attributes: true,
        save_referrer: true,
      });
      posthog.register({ $geoip_disable: true }); // don't work out city / country from the IP address
      ph = posthog;
      queue.splice(0).forEach((fn) => fn(ph));
      return ph;
    });
  return loading;
}
const run = (fn) => {
  if (!KEY || typeof window === 'undefined') return;
  if (ph) fn(ph);
  else {
    queue.push(fn);
    load();
  }
};

// which screen is open: "/resume", "/studio"… — never query strings or anything typed
const screen = () => `/${(window.location.hash.replace(/^#\/?/, '').split(/[?/]/)[0] || '')}`;

/** A named event with a few plain properties (counts, template ids — never resume or profile text). */
export const track = (event, props) => run((p) => p.capture(event, props));

/** Signed in: tie this browser's events to the account, by its id only (no email). */
export const identify = (user) => run((p) => p.identify(String(user.id)));

/** The only things we keep about a person: their name and college, from their own profile. */
let lastPerson = '';
export function setPersonInfo({ name, college }) {
  const info = Object.fromEntries(Object.entries({ name: (name || '').trim(), college: (college || '').trim() }).filter(([, v]) => v));
  const sig = JSON.stringify(info);
  if (!Object.keys(info).length || sig === lastPerson) return;
  lastPerson = sig;
  run((p) => p.setPersonProperties(info));
}

/** Signed out: start a fresh anonymous visitor. */
export const resetAnalytics = () => {
  lastPerson = '';
  run((p) => p.reset());
};

if (KEY && typeof window !== 'undefined') {
  const page = () => run((p) => p.capture('$pageview', { $current_url: `${window.location.origin}${screen()}`, screen: screen() }));
  page();
  window.addEventListener('hashchange', page);
}
