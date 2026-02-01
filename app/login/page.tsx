import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signInWithDiscord } from "@/app/auth/actions";
import Image from "next/image";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { next } = await searchParams;

  if (user) {
    redirect(next ?? "/");
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6 cr-grid-bg"
      style={{ background: 'var(--surface-0)' }}
    >
      <div
        className="w-full max-w-sm animate-boot"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        {/* Header strip */}
        <div
          className="flex items-center gap-2 px-5 py-3"
          style={{
            background: 'var(--surface-3)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div
            className="cr-status-dot"
            style={{ background: 'var(--accent)' }}
          />
          <span
            className="text-[10px] tracking-widest uppercase"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-tertiary)',
            }}
          >
            Authentication Required
          </span>
        </div>

        <div className="px-6 py-8">
          <div className="flex items-center gap-3 mb-6">
            <Image
              src="/ralph.jpeg"
              alt="ResuRalph"
              width={28}
              height={28}
              className="rounded"
              style={{ border: '1px solid var(--border-default)' }}
            />
            <div>
              <h1
                className="text-base font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                Sign in to ResuRalph
              </h1>
              <p
                className="text-xs mt-0.5"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Authenticate to create annotations
              </p>
            </div>
          </div>

          <form>
            <input type="hidden" name="next" value={next ?? "/"} />
            <button
              formAction={signInWithDiscord}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded transition-all duration-200"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '12px',
                fontWeight: 500,
                letterSpacing: '0.03em',
                textTransform: 'uppercase' as const,
                background: 'var(--accent-dim)',
                color: 'var(--accent-bright)',
                border: '1px solid var(--accent)',
                borderRadius: 'var(--radius-md)',
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                const t = e.currentTarget;
                t.style.background = 'var(--accent)';
                t.style.color = 'var(--text-primary)';
                t.style.boxShadow = '0 0 20px var(--accent-glow)';
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                const t = e.currentTarget;
                t.style.background = 'var(--accent-dim)';
                t.style.color = 'var(--accent-bright)';
                t.style.boxShadow = 'none';
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z" />
              </svg>
              Continue with Discord
            </button>
          </form>

          <p
            className="text-center mt-5 text-[11px]"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-tertiary)',
            }}
          >
            Read-only access available without sign-in
          </p>
        </div>
      </div>

      {/* Back link */}
      <a
        href="/"
        className="mt-6 text-[11px] transition-colors duration-200"
        style={{
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-tertiary)',
          textDecoration: 'none',
        }}
        onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
          e.currentTarget.style.color = 'var(--text-secondary)';
        }}
        onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
          e.currentTarget.style.color = 'var(--text-tertiary)';
        }}
      >
        &larr; Back to control panel
      </a>
    </div>
  );
}
