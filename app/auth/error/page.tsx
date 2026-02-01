export default function AuthErrorPage() {
  return (
    <div
      className="flex min-h-screen items-center justify-center cr-grid-bg"
      style={{ background: 'var(--surface-0)' }}
    >
      <div className="text-center animate-boot">
        <div
          className="cr-badge mb-4 inline-block"
          style={{ background: 'var(--danger-dim)', color: 'var(--danger-text)' }}
        >
          Auth Error
        </div>
        <h1
          className="text-xl font-semibold mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          Authentication Failed
        </h1>
        <p
          className="text-sm mb-6"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Something went wrong during sign in. Please try again.
        </p>
        <a href="/" className="cr-btn cr-btn-accent">
          &larr; Return to Control Panel
        </a>
      </div>
    </div>
  );
}
