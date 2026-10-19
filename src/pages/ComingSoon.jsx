import { Icon } from '../components/ui.jsx';

export default function ComingSoon({ item, go }) {
  return (
    <div className="page">
      <div className="empty" style={{ padding: 56 }}>
        <Icon name={item.icon} size={28} />
        <h2 style={{ color: 'var(--fg)', marginTop: 14, fontSize: 20 }}>{item.label}</h2>
        <p style={{ marginTop: 8, maxWidth: 440, marginInline: 'auto' }}>
          This tool is up next. It will reuse everything in your Dev Identity, so the data you add now carries over automatically.
        </p>
        <div className="row" style={{ justifyContent: 'center', marginTop: 20 }}>
          <button className="btn" onClick={() => go('studio')}>Open Portfolio Studio</button>
          <button className="btn secondary" onClick={() => go('profile')}>Edit Dev Identity</button>
        </div>
      </div>
    </div>
  );
}
