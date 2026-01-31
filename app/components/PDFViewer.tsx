"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface PDFViewerProps {
  pdfUrl: string;
}

export default function PDFViewer({ pdfUrl }: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale] = useState(1.5);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);

  // Load PDF document
  useEffect(() => {
    let cancelled = false;

    async function loadDocument() {
      setIsLoading(true);
      setError(null);

      try {
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const doc = await loadingTask.promise;

        if (cancelled) return;

        setPdfDocument(doc);
        setTotalPages(doc.numPages);
        setCurrentPage(1);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load PDF:", err);
        setError("Failed to load PDF document.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadDocument();

    return () => {
      cancelled = true;
    };
  }, [pdfUrl]);

  // Render the current page
  const renderPage = useCallback(
    async (pageNum: number) => {
      if (!pdfDocument || !canvasRef.current) return;

      // Cancel any in-progress render
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }

      try {
        const page = await pdfDocument.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderTask = page.render({
          canvas,
          viewport,
        });

        renderTaskRef.current = renderTask;
        await renderTask.promise;
        renderTaskRef.current = null;
      } catch (err) {
        if (err instanceof pdfjsLib.RenderingCancelledException) return;
        console.error("Failed to render page:", err);
      }
    },
    [pdfDocument, scale]
  );

  useEffect(() => {
    renderPage(currentPage);
  }, [currentPage, renderPage]);

  function goToPreviousPage() {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  }

  function goToNextPage() {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  }

  function handlePageInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= totalPages) {
      setCurrentPage(value);
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-500 text-lg font-medium">{error}</p>
          <p className="text-gray-500 mt-2 text-sm">
            Check the URL and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Viewer Controls */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousPage}
            disabled={currentPage <= 1 || isLoading}
            className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <button
            onClick={goToNextPage}
            disabled={currentPage >= totalPages || isLoading}
            className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Page</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={currentPage}
            onChange={handlePageInputChange}
            disabled={isLoading || totalPages === 0}
            className="w-12 px-1.5 py-1 text-center text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span>of {totalPages}</span>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 overflow-auto bg-gray-100 flex justify-center p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500 text-sm">Loading PDF...</div>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className="shadow-lg bg-white"
          />
        )}
      </div>
    </div>
  );
}
