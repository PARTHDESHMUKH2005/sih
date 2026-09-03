export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M24 4 L44 40 H4 Z" fill="var(--brand-500)" />
      <path d="M24 4 L34 22 L14 22 Z" fill="var(--brand-400)" />
      <path d="M12 40 L20 26 L28 34 L32 28 L44 40 Z" fill="var(--accent)" opacity="0.9" />
    </svg>
  );
}
