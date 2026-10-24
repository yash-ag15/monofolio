// Product analytics (PostHog), privacy-first. Off unless NEXT_PUBLIC_POSTHOG_KEY is set.
// Resumes are full of names, phone numbers and emails, so: no session recordings, no autocapture of
// clicks or text, no form contents — only the named events below and which page of the app is open.
// Turn on "Discard IP data" in the PostHog project settings as well.

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

let ph = null;
let loading = null;
const queue = [];

function load() {
  if (!KEY || typeof window === 'undefined') return null;
  if (!loading)
    loading = import('posthog-js').then(({ default: posthog }) => {
      posthog.init(KEY, {
        api_host: HOST,
        persistence: 'localStorage', // no cookies
        person_profiles: 'identified_only', // guests stay anonymous
        autocapture: false,
        capture_pageview: false, // sent by hand below, as the app page only (hash routes)
        capture_pageleave: false,
        disable_session_recording: true,
        disable_surveys: true,
        mask_all_text: true,
        mask_all_element_attributes: true,
        save_referrer: true,
      });
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

/** Signed in: tie this browser's events to the account (by id only — no email or name). */
export const identify = (user) => run((p) => p.identify(String(user.id), { google: !!user.google }));

/** Signed out: start a fresh anonymous visitor. */
export const resetAnalytics = () => run((p) => p.reset());

if (KEY && typeof window !== 'undefined') {
  const page = () => run((p) => p.capture('$pageview', { $current_url: `${window.location.origin}${screen()}`, screen: screen() }));
  page();
  window.addEventListener('hashchange', page);
}
