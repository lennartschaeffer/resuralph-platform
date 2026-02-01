"use client";

import dynamic from "next/dynamic";
import { use, useCallback } from "react";
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
    pdfUrl: string;
  }>;
}

export default function ViewPage({ params }: PageProps) {
  const { pdfUrl } = use(params);
  const { user, loading } = useUser();
  const router = useRouter();

  // Decode from base64
  const decodedPdfUrl = Buffer.from(pdfUrl, "base64").toString("utf-8");

  const handleLoginClick = useCallback(() => {
    const currentPath = `/view/${pdfUrl}`;
    router.push(`/login?next=${encodeURIComponent(currentPath)}`);
  }, [pdfUrl, router]);

  return (
    <div className="h-screen" style={{ background: 'var(--surface-0)' }}>
      <PDFViewer
        pdfUrl={decodedPdfUrl}
        isAuthenticated={!loading && !!user}
        onLoginClick={handleLoginClick}
      />
    </div>
  );
}
