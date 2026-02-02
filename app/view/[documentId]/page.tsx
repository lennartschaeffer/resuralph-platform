"use client";

import dynamic from "next/dynamic";
import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/hooks/useUser";

const PDFViewer = dynamic(() => import("@/app/components/PDFViewer"), {
  ssr: false,
  loading: () => (
    <div
      className="flex items-center justify-center h-full"
      style={{ background: 'var(--surface-0)' }}
    >
      <div className="flex items-center gap-2 animate-boot">
        <div
          className="cr-status-dot animate-status-blink"
          style={{ background: 'var(--accent)' }}
        />
        <span
          className="text-xs"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}
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
  const { user, loading } = useUser();
  const router = useRouter();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPdfUrl() {
      try {
        const res = await fetch(`/api/documents/${documentId}/pdf`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to load document");
          return;
        }
        const data = await res.json();
        setPdfUrl(data.url);
      } catch {
        setError("Failed to load document");
      }
    }
    fetchPdfUrl();
  }, [documentId]);

  const handleLoginClick = useCallback(() => {
    const currentPath = `/view/${documentId}`;
    router.push(`/login?next=${encodeURIComponent(currentPath)}`);
  }, [documentId, router]);

  if (error) {
    return (
      <div
        className="flex items-center justify-center h-screen"
        style={{ background: 'var(--surface-0)' }}
      >
        <div className="text-center">
          <div
            className="cr-badge mb-3 inline-block"
            style={{ background: 'var(--danger-dim)', color: 'var(--danger-text)' }}
          >
            Error
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--danger-text)' }}>
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div
        className="flex items-center justify-center h-screen"
        style={{ background: 'var(--surface-0)' }}
      >
        <div className="flex items-center gap-2 animate-boot">
          <div
            className="cr-status-dot animate-status-blink"
            style={{ background: 'var(--accent)' }}
          />
          <span
            className="text-xs"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}
          >
            Loading document...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen" style={{ background: 'var(--surface-0)' }}>
      <PDFViewer
        pdfUrl={pdfUrl}
        documentId={documentId}
        isAuthenticated={!loading && !!user}
        onLoginClick={handleLoginClick}
      />
    </div>
  );
}
