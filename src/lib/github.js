import { useEffect } from 'react';
import { useStore } from '../store.jsx';

// Uses GitHub's public REST API — no token required (60 requests/hour per IP).
const API = 'https://api.github.com';

async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
  if (res.status === 404) throw new Error('GitHub user not found.');
  if (res.status === 403) throw new Error('GitHub rate limit reached (60 requests/hour without a token). Try again later.');
  if (!res.ok) throw new Error(`GitHub request failed (${res.status}).`);
  return res.json();
}

export async function fetchGitHub(username) {
  const u = String(username || '').trim().replace(/^@/, '').replace(/^https?:\/\/github\.com\//i, '').split('/')[0];
  if (!u) throw new Error('Enter a GitHub username.');
  const [user, repos] = await Promise.all([
    getJson(`${API}/users/${encodeURIComponent(u)}`),
    getJson(`${API}/users/${encodeURIComponent(u)}/repos?per_page=100&sort=updated`),
  ]);
  return {
    user: {
      login: user.login,
      name: user.name,
      avatar: user.avatar_url,
      bio: user.bio,
      blog: user.blog,
      location: user.location,
      followers: user.followers,
      publicRepos: user.public_repos,
      url: user.html_url,
    },
    repos: repos.map((r) => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      description: r.description || '',
      url: r.html_url,
      homepage: r.homepage || '',
      language: r.language || '',
      topics: r.topics || [],
      stars: r.stargazers_count,
      forks: r.forks_count,
      fork: r.fork,
      archived: r.archived,
      updated: r.pushed_at,
    })),
  };
}

const prettyName = (name) =>
  name
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

export function repoToProject(r) {
  const tech = [r.language, ...(r.topics || []).slice(0, 4)].filter(Boolean);
  return {
    name: prettyName(r.name),
    description: r.description,
    tech: [...new Set(tech)].join(', '),
    link: r.homepage,
    repo: r.url,
    stars: r.stars,
    highlight: false,
    bullets: '',
    source: 'github',
  };
}

const norm = (u) => String(u || '').toLowerCase().replace(/\/+$/, '').replace(/\.git$/, '');

// Refresh stars / descriptions / homepages of projects already linked to a repo.
// Fields the user wrote themselves (non-empty description, link) are kept.
export function refreshLinkedProjects(projects, repos) {
  let updated = 0;
  const next = projects.map((p) => {
    const r = repos.find((x) => norm(x.url) === norm(p.repo));
    if (!r) return p;
    const patch = {
      stars: r.stars,
      description: p.description || r.description,
      link: p.link || r.homepage,
    };
    if (patch.stars !== p.stars || patch.description !== p.description || patch.link !== p.link) updated++;
    return { ...p, ...patch };
  });
  return { projects: next, updated };
}

export function isLinked(projects, repo) {
  return projects.some((p) => norm(p.repo) === norm(repo.url));
}

export function languageStats(repos) {
  const counts = {};
  repos.filter((r) => !r.fork && r.language).forEach((r) => (counts[r.language] = (counts[r.language] || 0) + 1));
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([lang, n]) => ({ lang, n, pct: Math.round((n / total) * 100) }));
}

const HOUR = 60 * 60 * 1000;

// When auto-sync is on, refresh linked repos at most once an hour on app load.
export function useAutoSync() {
  const { state, dispatch } = useStore();
  const { username, autoSync, lastSync } = state.github;
  useEffect(() => {
    if (!autoSync || !username || Date.now() - lastSync < HOUR) return;
    let cancelled = false;
    fetchGitHub(username)
      .then((data) => {
        if (cancelled) return;
        dispatch({ type: 'github/set', patch: { ...data, lastSync: Date.now() } });
        const { projects } = refreshLinkedProjects(state.profile.projects, data.repos);
        dispatch({ type: 'list/set', key: 'projects', items: projects });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSync, username]);
}
