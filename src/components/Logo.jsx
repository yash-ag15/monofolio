// The Monofolio mark: three fanned pages (one profile → site, resume, card) with an M on the front one.
// Uses the text colour for the pages and the background colour for the M, so it works in light and dark mode.
export function LogoMark({ size = 28 }) {
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect className="lm-page lm-back" x="4" y="6" width="15" height="21" rx="4" />
      <rect className="lm-page lm-mid" x="4" y="6" width="15" height="21" rx="4" />
      <rect className="lm-page" x="4" y="6" width="15" height="21" rx="4" />
      <path className="lm-m" d="M7.5 21v-9l4 4.5 4-4.5v9" />
    </svg>
  );
}

