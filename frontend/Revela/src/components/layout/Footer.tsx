export function Footer() {
  return (
    <footer
      className="flex items-center justify-center"
      style={{
        height: 40,
        fontSize: 12,
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--border)',
        background: 'var(--surface)',
      }}
    >
      <span>Revela - робить приховане видимим</span>
      <span style={{ margin: '0 8px', color: 'var(--text-disabled)' }}>·</span>
      <span>v0.1.0</span>
      <span style={{ margin: '0 8px', color: 'var(--text-disabled)' }}>·</span>
      <a
        href="#docs"
        onClick={(e) => e.preventDefault()}
        style={{ color: 'var(--accent)', textDecoration: 'none' }}
      >
        Документація
      </a>
      <span style={{ margin: '0 8px', color: 'var(--text-disabled)' }}>·</span>
      <a
        href="#support"
        onClick={(e) => e.preventDefault()}
        style={{ color: 'var(--accent)', textDecoration: 'none' }}
      >
        Підтримка
      </a>
    </footer>
  );
}
