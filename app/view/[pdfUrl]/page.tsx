"use client";

import dynamic from "next/dynamic";
import { use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/hooks/useUser";

const PDFViewer = dynamic(() => import("@/app/components/PDFViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <span className="text-gray-500 text-sm">Loading viewer...</span>
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
    <div className="h-screen">
      <PDFViewer
        pdfUrl={decodedPdfUrl}
        isAuthenticated={!loading && !!user}
        onLoginClick={handleLoginClick}
      />
    </div>
  );
}
