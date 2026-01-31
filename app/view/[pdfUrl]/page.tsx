"use client";

import dynamic from "next/dynamic";
import { use } from "react";

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

  // Decode from base64
  const decodedPdfUrl = Buffer.from(pdfUrl, "base64").toString("utf-8");

  return (
    <div className="h-screen">
      <PDFViewer pdfUrl={decodedPdfUrl} />
    </div>
  );
}
