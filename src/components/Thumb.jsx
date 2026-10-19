import { useEffect, useRef, useState } from 'react';

// Thumbnails mount one after another (not all at once) so the browser loads them smoothly.
let nextSlot = 0;
function scheduleMount(cb) {
  const now = performance.now();
  const at = Math.max(now, nextSlot);
  nextSlot = at + 110;
  return setTimeout(cb, at - now);
}

// Live mini-render of a full page, mounted only when scrolled into view.
export function Thumb({ html, scale, height, width = 1280, eager = false }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(eager);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const io = new IntersectionObserver(
      (es) => {
        if (es[0].isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);
  useEffect(() => {
    if (!visible || show) return;
    const t = scheduleMount(() => setShow(true));
    return () => clearTimeout(t);
  }, [visible, show]);
  return (
    <div className="vthumb" style={{ height }} ref={ref}>
      {show ? <iframe title="Preview" srcDoc={html} tabIndex={-1} sandbox="allow-scripts" style={{ width, height: height / scale, transform: `scale(${scale})` }} /> : <div className="thumb-skel" />}
    </div>
  );
}

// A clickable card. Iframes can't live inside <button>, so this is a div with button semantics.
export function Pressable({ className, onActivate, children, label }) {
  return (
    <div
      className={className}
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={onActivate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onActivate();
        }
      }}
    >
      {children}
    </div>
  );
}
