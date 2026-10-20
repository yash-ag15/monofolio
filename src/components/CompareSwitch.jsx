// Temporary: switch between landing page A (#/) and B (#/b) while choosing one.
export default function CompareSwitch({ current }) {
  return (
    <div className="cmp" role="group" aria-label="Compare landing pages">
      <span>Landing</span>
      <a href="#/" className={current === 'a' ? 'on' : ''}>
        A
      </a>
      <a href="#/b" className={current === 'b' ? 'on' : ''}>
        B
      </a>
    </div>
  );
}
