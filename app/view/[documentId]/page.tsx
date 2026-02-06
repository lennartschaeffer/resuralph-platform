"use client";

import dynamic from "next/dynamic";
import { use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/hooks/useUser";
import { usePdfUrl } from "@/app/hooks/usePdfUrl";

const PDFViewer = dynamic(() => import("@/app/components/PDFViewer"), {
  ssr: false,
  loading: () => (
    <div
      className="flex items-center justify-center h-full"
      style={{ background: "var(--surface-0)" }}
    >
      <div className="flex items-center gap-2 animate-boot">
        <div
          className="cr-status-dot animate-status-blink"
          style={{ background: "var(--accent)" }}
        />
        <span
          className="text-xs"
          style={{
            fontFamily: "var(--font-mono)",
            color: "var(--text-tertiary)",
          }}
        >
          Initializing viewer...
        </span>
      </div>
    </div>
  ),
});

interface PageProps {
  params: Promise<{
    documentId: string;
  }>;
}

export default function ViewPage({ params }: PageProps) {
  const { documentId } = use(params);
  const { user, loading: userLoading, error: authError } = useUser();
  const router = useRouter();
  const { pdfUrl, error, loading: pdfLoading } = usePdfUrl(documentId);

  const handleLoginClick = useCallback(() => {
    const currentPath = `/view/${documentId}`;
    router.push(`/login?next=${encodeURIComponent(currentPath)}`);
  }, [documentId, router]);

  if (error) {
    return (
      <div
        className="flex items-center justify-center h-screen"
        style={{ background: "var(--surface-0)" }}
      >
        <div className="text-center">
          <div
            className="cr-badge mb-3 inline-block"
            style={{
              background: "var(--danger-dim)",
              color: "var(--danger-text)",
            }}
          >
            Error
          </div>
          <p
            className="text-sm font-medium"
            style={{ color: "var(--danger-text)" }}
          >
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (pdfLoading || !pdfUrl) {
    return (
      <div
        className="flex items-center justify-center h-screen"
        style={{ background: "var(--surface-0)" }}
      >
        <div className="flex items-center gap-2 animate-boot">
          <div
            className="cr-status-dot animate-status-blink"
            style={{ background: "var(--accent)" }}
          />
          <span
            className="text-xs"
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--text-tertiary)",
            }}
          >
            Loading document...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ background: "var(--surface-0)" }}>
      {authError && (
        <div
          className="px-4 py-2 flex items-center justify-center gap-2 shrink-0"
          style={{
            background: "var(--danger-dim)",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ color: "var(--danger-text)" }}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span
            className="text-xs"
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--danger-text)",
            }}
          >
            {authError}
          </span>
        </div>
      )}
      <div className="flex-1 min-h-0">
        <PDFViewer
          pdfUrl={pdfUrl}
          documentId={documentId}
          isAuthenticated={!userLoading && !!user}
          onLoginClick={handleLoginClick}
        />
      </div>
    </div>
  );
}
