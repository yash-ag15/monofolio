import { useEffect, useRef, useState } from 'react';

// A CodeMirror 6 HTML editor, loaded on demand (only when someone opens the Code tool)
// so the rest of the app stays light. Monochrome syntax colours to match the app.
export default function CodeEditor({ value, onChange, apiRef }) {
  const host = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let view;
    let cancelled = false;
    Promise.all([import('codemirror'), import('@codemirror/lang-html'), import('@codemirror/view'), import('@codemirror/language'), import('@lezer/highlight')]).then(([cm, langHtml, viewMod, lang, hl]) => {
      if (cancelled || !host.current) return;
      const { EditorView } = viewMod;
      const t = hl.tags;
      const mono = lang.HighlightStyle.define([
        { tag: [t.tagName, t.angleBracket], color: '#f4f4f4', fontWeight: '600' },
        { tag: t.attributeName, color: '#a8a8a8' },
        { tag: [t.attributeValue, t.string], color: '#d6d6d6', fontStyle: 'italic' },
        { tag: [t.propertyName, t.variableName], color: '#e8e8e8' },
        { tag: [t.number, t.unit, t.color, t.keyword, t.atom, t.bool], color: '#ffffff', fontWeight: '600' },
        { tag: [t.comment, t.meta], color: '#6f6f6f', fontStyle: 'italic' },
        { tag: [t.punctuation, t.bracket, t.operator], color: '#8a8a8a' },
      ]);
      const theme = EditorView.theme(
        {
          '&': { height: '100%', backgroundColor: '#0b0b0b', color: '#e6e6e6', fontSize: '12.5px' },
          '.cm-scroller': { fontFamily: "'JetBrains Mono', ui-monospace, monospace", lineHeight: '1.6' },
          '.cm-gutters': { backgroundColor: '#0b0b0b', color: '#555', border: 'none', borderRight: '1px solid #1e1e1e' },
          '.cm-activeLine': { backgroundColor: '#141414' },
          '.cm-activeLineGutter': { backgroundColor: '#141414', color: '#bbb' },
          '.cm-cursor': { borderLeftColor: '#fff' },
          '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': { backgroundColor: '#3a3a3a !important' },
          '.cm-panels': { backgroundColor: '#111', color: '#ddd', borderTop: '1px solid #222' },
          '.cm-panels input, .cm-panels button': { color: '#111' },
          '.cm-searchMatch': { backgroundColor: '#444', outline: '1px solid #888' },
          '.cm-matchingBracket': { backgroundColor: '#333', outline: '1px solid #777' },
          '.cm-foldPlaceholder': { backgroundColor: '#222', border: 'none', color: '#aaa' },
        },
        { dark: true }
      );
      view = new EditorView({
        doc: value,
        parent: host.current,
        extensions: [
          cm.basicSetup,
          langHtml.html(),
          lang.syntaxHighlighting(mono),
          theme,
          EditorView.updateListener.of((u) => {
            if (u.docChanged) onChangeRef.current(u.state.doc.toString());
          }),
        ],
      });
      if (apiRef) {
        apiRef.current = {
          // replace the whole document (e.g. re-sync from the design)
          set(doc) {
            view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: doc } });
          },
          // jump to the first occurrence of some text
          jump(text) {
            const i = view.state.doc.toString().indexOf(text);
            if (i < 0) return false;
            view.dispatch({ selection: { anchor: i }, effects: EditorView.scrollIntoView(i, { y: 'start', yMargin: 20 }) });
            view.focus();
            return true;
          },
          lines: () => view.state.doc.lines,
        };
      }
      setReady(true);
    });
    return () => {
      cancelled = true;
      if (view) view.destroy();
      if (apiRef) apiRef.current = null;
    };
    // the editor owns its document after mounting; external replacements go through apiRef.set
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="code-editor" ref={host}>
      {!ready && <div className="code-loading">Loading editor…</div>}
    </div>
  );
}
