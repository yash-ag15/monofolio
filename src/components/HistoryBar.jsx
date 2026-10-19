import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store.jsx';
import { THEMES } from '../portfolio/themes.js';
import { Icon, useToast } from './ui.jsx';

const isTyping = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

// Undo / Redo / Reset for the portfolio design, plus Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y.
export default function HistoryBar() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [menu, setMenu] = useState(false);
  const menuRef = useRef(null);
  const h = state.history || { past: [], future: [] };
  const lastPast = h.past[h.past.length - 1];
  const nextFuture = h.future[0];
  const themeName = (THEMES[state.design.layout] || THEMES.classic).name;

  const undo = () => {
    if (!lastPast) return;
    dispatch({ type: 'design/undo' });
    toast(`Undid: ${lastPast.label}`);
  };
  const redo = () => {
    if (!nextFuture) return;
    dispatch({ type: 'design/redo' });
    toast(`Redid: ${nextFuture.label}`);
  };
  const reset = (scope) => {
    dispatch({ type: 'design/reset', scope });
    setMenu(false);
    toast(scope === 'theme' ? `${themeName} reset to its original look — press Undo to get your changes back` : 'Everything reset — press Undo to get it back');
  };

  // keyboard shortcuts (text fields keep their own native undo)
  const latest = useRef({ undo, redo });
  latest.current = { undo, redo };
  useEffect(() => {
    const onKey = (e) => {
      if (!(e.ctrlKey || e.metaKey) || isTyping(document.activeElement)) return;
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) {
        e.preventDefault();
        latest.current.undo();
      } else if ((k === 'z' && e.shiftKey) || k === 'y') {
        e.preventDefault();
        latest.current.redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!menu) return;
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [menu]);

  return (
    <div className="history-bar" ref={menuRef}>
      <button className="btn ghost icon" onClick={undo} disabled={!lastPast} title={lastPast ? `Undo: ${lastPast.label} (Ctrl+Z)` : 'Nothing to undo'} aria-label="Undo">
        <Icon name="undo" />
      </button>
      <button className="btn ghost icon" onClick={redo} disabled={!nextFuture} title={nextFuture ? `Redo: ${nextFuture.label} (Ctrl+Shift+Z)` : 'Nothing to redo'} aria-label="Redo">
        <Icon name="redo" />
      </button>
      <button className="btn ghost sm" onClick={() => setMenu(!menu)} aria-expanded={menu} aria-haspopup="menu">
        <Icon name="refresh" /> Reset
      </button>
      {menu && (
        <div className="history-menu" role="menu">
          <button role="menuitem" onClick={() => reset('theme')}>
            <b>Reset {themeName}</b>
            <span>Undo all your tweaks to this theme — colours, fonts, animations, 3D — and get its original look back. Keeps your section order, hidden sections, brief, custom CSS and 3D model.</span>
          </button>
          <button role="menuitem" onClick={() => reset('all')}>
            <b>Start over</b>
            <span>Every design setting back to the defaults (the plain Minimal theme).</span>
          </button>
          <p>Your profile content is never touched. Changed your mind? Press Undo.</p>
        </div>
      )}
    </div>
  );
}
