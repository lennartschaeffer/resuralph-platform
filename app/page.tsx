"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useUser } from "@/app/hooks/useUser";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [pdfInput, setPdfInput] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleOpenPdf(e: React.FormEvent) {
    e.preventDefault();
    const url = pdfInput.trim();
    if (!url) return;
    const encoded = Buffer.from(url).toString("base64");
    router.push(`/view/${encoded}`);
  }

  function handleOpenSample() {
    const sampleUrl = `${window.location.origin}/sample.pdf`;
    const encoded = Buffer.from(sampleUrl).toString("base64");
    router.push(`/view/${encoded}`);
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--surface-0)" }}
    >
      {/* ── Top Bar ── */}
      <header
        className={`flex items-center justify-between px-6 h-12 border-b ${mounted ? "animate-boot" : "opacity-0"}`}
        style={{
          background: "var(--surface-1)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <Image
              src="/ralph.jpeg"
              alt="ResuRalph"
              width={22}
              height={22}
              className="rounded"
              style={{ border: "1px solid var(--border-default)" }}
            />
            <span
              className="text-xs font-semibold tracking-widest uppercase"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--text-primary)",
              }}
            >
              ResuRalph
            </span>
          </div>
          <div className="cr-divider" />
          <span
            className="text-[10px] tracking-wider uppercase"
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--text-tertiary)",
            }}
          >
            Resume Reviews
          </span>
        </div>

        <div className="flex items-center gap-3">
          {!loading && user ? (
            <div className="flex items-center gap-2">
              <div
                className="cr-status-dot animate-pulse-glow"
                style={{ background: "var(--success)" }}
              />
              <span
                className="text-[11px]"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-secondary)",
                }}
              >
                {user.email || "Authenticated"}
              </span>
            </div>
          ) : !loading ? (
            <a
              href="/login"
              className="cr-btn cr-btn-accent"
              style={{ fontSize: "10px" }}
            >
              Sign In
            </a>
          ) : null}
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-xl">
          {/* System Identification Block */}
          <div
            className={`mb-10 ${mounted ? "animate-boot-delay-1" : "opacity-0"}`}
          >
            <div
              className="flex items-center gap-2 mb-4"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              <div
                className="cr-status-dot animate-status-blink"
                style={{ background: "var(--accent)" }}
              />
              <span
                className="text-[10px] tracking-widest uppercase"
                style={{ color: "var(--text-tertiary)" }}
              >
                A better way for resume reviews on discord.
              </span>
            </div>
            <h1
              className="text-3xl font-bold tracking-tight leading-tight mb-3"
              style={{
                fontFamily: "var(--font-body)",
                color: "var(--text-primary)",
              }}
            >
              ResuRalph
              <br />
              <span style={{ color: "var(--accent-bright)" }}>
                Annotation Platform
              </span>
            </h1>
            <p
              className="text-sm leading-relaxed max-w-md"
              style={{ color: "var(--text-secondary)" }}
            >
              Open any resume PDF to begin reviewing. Select text to create
              annotations. Authenticate via Discord for write access.
            </p>
          </div>

          {/* ── PDF URL Input ── */}
          <form
            onSubmit={handleOpenPdf}
            className={`mb-6 ${mounted ? "animate-boot-delay-2" : "opacity-0"}`}
          >
            <label
              className="block mb-2 text-[10px] tracking-widest uppercase"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--text-tertiary)",
              }}
            >
              PDF Target URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={pdfInput}
                onChange={(e) => setPdfInput(e.target.value)}
                placeholder="https://example.com/resume.pdf"
                className="cr-input flex-1"
                style={{ fontSize: "13px" }}
              />
              <button
                type="submit"
                className="cr-btn cr-btn-accent"
                disabled={!pdfInput.trim()}
              >
                Open
              </button>
            </div>
          </form>

          {/* ── Divider with label ── */}
          <div
            className={`flex items-center mb-6 ${mounted ? "animate-boot-delay-3" : "opacity-0"}`}
          >
            <div
              className="flex-1 h-px"
              style={{ background: "var(--border-subtle)" }}
            />

            <div
              className="flex-1 h-px"
              style={{ background: "var(--border-subtle)" }}
            />
          </div>

          {/* ── System Metadata ── */}
          <div
            className={`mt-10 flex items-center gap-4 ${mounted ? "animate-boot-delay-4" : "opacity-0"}`}
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <span
              className="text-[10px] tracking-wider uppercase"
              style={{ color: "var(--text-tertiary)" }}
            >
              By @Lenny
            </span>
            <div className="cr-divider" style={{ height: "12px" }} />
            <span
              className="text-[10px] tracking-wider uppercase"
              style={{ color: "var(--text-tertiary)" }}
            >
              v1.0
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
