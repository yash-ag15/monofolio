import { useMemo, useState } from 'react';
import { useStore } from '../app/store.jsx';
import { Icon, Switch, useToast } from '../components/ui.jsx';
import { fetchGitHub, isLinked, languageStats, refreshLinkedProjects, repoToProject } from '../lib/github.js';

const ago = (ts) => {
  if (!ts) return 'never';
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
};

export default function GitHubSync({ go }) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const gh = state.github;
  const projects = state.profile.projects;
  const [username, setUsername] = useState(gh.username || (state.profile.socials.find((s) => /github/i.test(s.label))?.url || '').replace(/^https?:\/\/github\.com\//i, '').split('/')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState({});
  const [filter, setFilter] = useState('');
  const [hideForks, setHideForks] = useState(true);

  const sync = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchGitHub(username);
      dispatch({ type: 'github/set', patch: { ...data, username: data.user.login, lastSync: Date.now() } });
      const { projects: next, updated } = refreshLinkedProjects(projects, data.repos);
      if (updated) dispatch({ type: 'list/set', key: 'projects', items: next });
      toast(`Fetched ${data.repos.length} repositories${updated ? ` · refreshed ${updated} linked project${updated > 1 ? 's' : ''}` : ''}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const repos = useMemo(
    () =>
      gh.repos
        .filter((r) => (hideForks ? !r.fork : true))
        .filter((r) => !filter || `${r.name} ${r.description} ${r.language}`.toLowerCase().includes(filter.toLowerCase()))
        .sort((a, b) => b.stars - a.stars || new Date(b.updated) - new Date(a.updated)),
    [gh.repos, hideForks, filter]
  );

  const chosen = repos.filter((r) => selected[r.id] && !isLinked(projects, r));
  const importSelected = () => {
    dispatch({ type: 'list/set', key: 'projects', items: [...projects, ...chosen.map(repoToProject)] });
    setSelected({});
    toast(`Imported ${chosen.length} project${chosen.length > 1 ? 's' : ''} — add highlights in Dev Identity`);
  };

  const langs = languageStats(gh.repos);
  const totalStars = gh.repos.filter((r) => !r.fork).reduce((a, r) => a + r.stars, 0);
  const linkedCount = projects.filter((p) => /github\.com/i.test(p.repo || '')).length;

  const fillProfile = () => {
    const u = gh.user;
    const patch = {};
    const b = state.profile.basics;
    if (!b.name && u.name) patch.name = u.name;
    if (!b.location && u.location) patch.location = u.location;
    if (!b.website && u.blog) patch.website = u.blog;
    if (!b.tagline && u.bio) patch.tagline = u.bio;
    dispatch({ type: 'basics/set', patch });
    if (!state.profile.socials.some((s) => /github/i.test(s.label))) {
      dispatch({ type: 'list/set', key: 'socials', items: [...state.profile.socials, { label: 'GitHub', url: u.url }] });
    }
    toast(Object.keys(patch).length ? 'Filled empty profile fields from GitHub' : 'Your profile already has these details');
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Live GitHub Sync</h1>
          <p>Pull repositories into your portfolio as projects. Linked projects keep their stars and descriptions up to date — and the published site refreshes star counts live.</p>
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            sync();
          }}
        >
          <div className="field" style={{ flex: 1, minWidth: 220 }}>
            <span>GitHub username</span>
            <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="octocat" autoComplete="off" />
          </div>
          <button className="btn" type="submit" disabled={loading || !username.trim()} style={{ alignSelf: 'flex-end' }}>
            <Icon name={gh.repos.length ? 'refresh' : 'github'} /> {loading ? 'Syncing…' : gh.repos.length ? 'Sync now' : 'Connect'}
          </button>
        </form>
        {error && (
          <p className="small" style={{ marginTop: 10, fontWeight: 600 }}>
            ⚠ {error}
          </p>
        )}
        <div className="row" style={{ marginTop: 14, justifyContent: 'space-between' }}>
          <Switch checked={gh.autoSync} onChange={(v) => dispatch({ type: 'github/set', patch: { autoSync: v } })} label="Auto-sync when I open the app (max once an hour)" />
          <span className="small muted">Last synced: {ago(gh.lastSync)}</span>
        </div>
        <p className="small muted" style={{ marginTop: 8 }}>
          No login or token needed — uses GitHub’s public API (60 requests/hour).
        </p>
      </div>

      {gh.user && (
        <div className="grid-2" style={{ marginBottom: 16, alignItems: 'start' }}>
          <div className="card card-pad stack">
            <div className="gh-user">
              <img src={gh.user.avatar} alt="" />
              <div>
                <h3 style={{ fontSize: 16 }}>{gh.user.name || gh.user.login}</h3>
                <a className="small muted" href={gh.user.url} target="_blank" rel="noopener noreferrer">
                  @{gh.user.login}
                </a>
              </div>
            </div>
            <div className="grid-3">
              <div className="stat">
                <b>{gh.user.publicRepos}</b>
                <span className="small muted">Repos</span>
              </div>
              <div className="stat">
                <b>{totalStars}</b>
                <span className="small muted">Stars</span>
              </div>
              <div className="stat">
                <b>{gh.user.followers}</b>
                <span className="small muted">Followers</span>
              </div>
            </div>
            <button className="btn secondary sm" onClick={fillProfile} style={{ justifySelf: 'start' }}>
              Fill empty profile fields from GitHub
            </button>
          </div>
          <div className="card card-pad stack">
            <h3 style={{ fontSize: 14 }}>Top languages</h3>
            <div className="lang-bars">
              {langs.slice(0, 6).map((l) => (
                <div className="lang-bar" key={l.lang}>
                  <span>{l.lang}</span>
                  <div className="progress">
                    <i style={{ width: `${l.pct}%` }} />
                  </div>
                  <span className="mono muted">{l.pct}%</span>
                </div>
              ))}
              {!langs.length && <span className="small muted">No language data yet.</span>}
            </div>
            <span className="small muted">{linkedCount} portfolio project{linkedCount === 1 ? '' : 's'} linked to GitHub</span>
          </div>
        </div>
      )}

      {gh.repos.length > 0 && (
        <div className="card">
          <div className="card-head">
            <div>
              <h3>Repositories</h3>
              <p>Select the ones that represent your best work.</p>
            </div>
            <div className="row">
              <Switch checked={hideForks} onChange={setHideForks} label="Hide forks" />
              <button className="btn sm" disabled={!chosen.length} onClick={importSelected}>
                <Icon name="plus" /> Import {chosen.length || ''}
              </button>
            </div>
          </div>
          <div className="card-pad">
            <input className="input" placeholder="Filter repositories…" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ marginBottom: 12 }} />
            <div className="repo-list">
              {repos.map((r) => {
                const linked = isLinked(projects, r);
                return (
                  <label key={r.id} className={`repo ${selected[r.id] || linked ? 'on' : ''}`}>
                    <input type="checkbox" disabled={linked} checked={linked || !!selected[r.id]} onChange={(e) => setSelected({ ...selected, [r.id]: e.target.checked })} />
                    <div style={{ minWidth: 0 }}>
                      <h4>
                        {r.name}
                        {linked && <span className="badge solid">In portfolio</span>}
                        {r.archived && <span className="badge">archived</span>}
                      </h4>
                      {r.description && <p>{r.description}</p>}
                      <div className="meta">
                        {r.language && <span>{r.language}</span>}
                        <span>★ {r.stars}</span>
                        <span>⑂ {r.forks}</span>
                        <span>updated {new Date(r.updated).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </label>
                );
              })}
              {!repos.length && <div className="empty">No repositories match.</div>}
            </div>
          </div>
        </div>
      )}

      {!gh.repos.length && !loading && (
        <div className="empty">
          Connect your GitHub to import projects. You can also add projects manually in{' '}
          <a href="#/profile" onClick={() => go('profile')}>
            Dev Identity
          </a>
          .
        </div>
      )}
    </div>
  );
}
