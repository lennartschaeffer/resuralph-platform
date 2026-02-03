"use client";

import { useRef, useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import AnnotationOverlay from "./AnnotationOverlay";
import AnnotationSidebar from "./AnnotationSidebar";
import TextSelectionLayer from "./TextSelectionLayer";
import { AnnotationRect } from "@/app/types/annotation";
import { useUser } from "@/app/hooks/useUser";
import { useZoom, ZOOM_PRESETS } from "@/app/hooks/useZoom";
import {
  useAnnotations,
  useCreateAnnotation,
  useUpdateAnnotation,
  useDeleteAnnotation,
} from "@/app/hooks/useAnnotations";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

interface PDFViewerProps {
  pdfUrl: string;
  documentId: string;
  isAuthenticated?: boolean;
  onLoginClick: () => void;
}

export default function PDFViewer({
  pdfUrl,
  documentId,
  isAuthenticated = false,
  onLoginClick,
}: PDFViewerProps) {
  const { user } = useUser();
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name;
  const avatarUrl = user?.user_metadata?.avatar_url;

  const containerRef = useRef<HTMLDivElement>(null);
  const pageWrapperRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(
    null,
  );
  const [pendingSelection, setPendingSelection] = useState<{
    text: string;
    rects: AnnotationRect[];
    pageNumber: number;
  } | null>(null);

  const {
    annotations,
    setAnnotations,
    error: fetchAnnotationsError,
    isLoading: isFetchingAnnotations,
  } = useAnnotations(documentId);
  const {
    createAnnotation,
    error: createError,
    isLoading: isCreating,
  } = useCreateAnnotation();
  const {
    updateAnnotation,
    error: updateError,
    isLoading: isUpdating,
  } = useUpdateAnnotation();
  const {
    deleteAnnotation,
    error: deleteError,
    isLoading: isDeleting,
  } = useDeleteAnnotation();

  // Combine annotation operation errors for display
  const annotationError =
    fetchAnnotationsError || createError || updateError || deleteError;

  const {
    scale,
    fitMode,
    zoomPercentage,
    zoomIn,
    zoomOut,
    setZoomPreset,
    fitToWidth,
    fitToPage,
    setBaseViewport,
    canZoomIn,
    canZoomOut,
  } = useZoom({ containerRef });

  const handleDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setTotalPages(numPages);
      setCurrentPage(1);
      setIsLoading(false);
      setError(null);
    },
    [],
  );

  const handleDocumentLoadError = useCallback(() => {
    setError("Failed to load PDF document.");
    setIsLoading(false);
  }, []);

  const handlePageLoadSuccess = useCallback(
    (page: { originalWidth: number; originalHeight: number }) => {
      setBaseViewport(page.originalWidth, page.originalHeight);
    },
    [setBaseViewport],
  );

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

  const handleSelectionComplete = useCallback(
    (data: { text: string; rects: AnnotationRect[]; pageNumber: number }) => {
      setPendingSelection(data);
    },
    [],
  );

  const handleAnnotationCreate = useCallback(
    async (data: {
      selectedText: string;
      comment: string;
      isHighPriority: boolean;
      position: { pageNumber: number; rects: AnnotationRect[] };
    }) => {
      const annotation = await createAnnotation({
        documentId,
        selectedText: data.selectedText,
        comment: data.comment,
        positionData: {
          pageNumber: data.position.pageNumber,
          rects: data.position.rects,
        },
        isHighPriority: data.isHighPriority,
      });
      if (annotation) {
        setAnnotations((prev) => [...prev, annotation]);
        setPendingSelection(null);
      }
    },
    [documentId, createAnnotation, setAnnotations],
  );

  const handleAnnotationCancel = useCallback(() => {
    setPendingSelection(null);
  }, []);

  const handleAnnotationUpdate = useCallback(
    async (
      id: string,
      data: { comment?: string; isHighPriority?: boolean },
    ) => {
      const updated = await updateAnnotation(id, data);
      if (updated) {
        setAnnotations((prev) => prev.map((a) => (a.id === id ? updated : a)));
      }
    },
    [updateAnnotation, setAnnotations],
  );

  const handleAnnotationDelete = useCallback(
    async (id: string) => {
      const success = await deleteAnnotation(id);
      if (success) {
        setAnnotations((prev) => prev.filter((a) => a.id !== id));
        setActiveAnnotationId(null);
      }
    },
    [deleteAnnotation, setAnnotations],
  );

  if (error) {
    return (
      <div
        className="flex items-center justify-center h-full"
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
          <p
            className="text-xs mt-2"
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--text-tertiary)",
            }}
          >
            Check the URL and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col lg:flex-row h-full"
      style={{ background: "var(--surface-0)" }}
    >
      {/* PDF Viewer Section */}
      <div className="flex flex-col flex-1 h-full lg:h-auto">
        {/* ── Control Bar ── */}
        <div
          className="flex items-center justify-between px-4 py-2.5 shrink-0 animate-boot"
          style={{
            background: "var(--surface-1)",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          {/* Auth Status */}
          {!isAuthenticated && (
            <button
              onClick={onLoginClick}
              className="cr-btn cr-btn-accent"
              style={{ fontSize: "13px", padding: "6px 12px" }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z" />
              </svg>
              Sign In
            </button>
          )}

          {isAuthenticated && (
            <div className="flex items-center gap-1.5">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={userName || "User"}
                  className="rounded-full"
                  style={{
                    width: "26px",
                    height: "26px",
                    border: "1px solid var(--border-subtle)",
                  }}
                />
              ) : (
                <div
                  className="rounded-full flex items-center justify-center"
                  style={{
                    width: "26px",
                    height: "26px",
                    fontSize: "11px",
                    fontWeight: 600,
                    background: "var(--accent-glow)",
                    color: "var(--accent-bright)",
                    border: "1px solid var(--accent)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {userName
                    ? userName
                        .split(" ")
                        .map((w: string) => w[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : "?"}
                </div>
              )}
              <span
                className="text-[13px] tracking-wider uppercase"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-tertiary)",
                }}
              >
                {userName || "User"}
              </span>
            </div>
          )}

          {/* ── Navigation ── */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={goToPreviousPage}
              disabled={currentPage <= 1 || isLoading}
              className="cr-btn"
              style={{ padding: "6px 10px" }}
              title="Previous page"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <div
              className="flex items-center gap-1.5"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              <input
                type="number"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={handlePageInputChange}
                disabled={isLoading || totalPages === 0}
                className="cr-input text-center"
                style={{ width: "48px", padding: "5px 6px", fontSize: "14px" }}
              />
              <span
                className="text-[14px]"
                style={{ color: "var(--text-tertiary)" }}
              >
                / {totalPages}
              </span>
            </div>

            <button
              onClick={goToNextPage}
              disabled={currentPage >= totalPages || isLoading}
              className="cr-btn"
              style={{ padding: "6px 10px" }}
              title="Next page"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* ── Zoom Controls ── */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={zoomOut}
              disabled={!canZoomOut || isLoading}
              className="cr-btn"
              style={{ padding: "6px 10px" }}
              title="Zoom out"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>

            <select
              value={ZOOM_PRESETS.includes(scale) ? scale.toString() : "custom"}
              onChange={(e) => {
                const val = e.target.value;
                if (val !== "custom") setZoomPreset(parseFloat(val));
              }}
              className="cr-input"
              style={{
                padding: "5px 8px",
                fontSize: "14px",
                minWidth: "76px",
                cursor: "pointer",
              }}
            >
              {!ZOOM_PRESETS.includes(scale) && (
                <option value="custom">{zoomPercentage}%</option>
              )}
              {ZOOM_PRESETS.map((preset) => (
                <option key={preset} value={preset.toString()}>
                  {Math.round(preset * 100)}%
                </option>
              ))}
            </select>

            <button
              onClick={zoomIn}
              disabled={!canZoomIn || isLoading}
              className="cr-btn"
              style={{ padding: "6px 10px" }}
              title="Zoom in"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>

            <div className="cr-divider" />

            <button
              onClick={fitToWidth}
              disabled={isLoading}
              className="cr-btn"
              style={
                fitMode === "fit-width"
                  ? {
                      background: "var(--accent-glow)",
                      color: "var(--accent-bright)",
                      borderColor: "var(--accent)",
                    }
                  : {}
              }
              title="Fit to width"
            >
              Fit W
            </button>
            <button
              onClick={fitToPage}
              disabled={isLoading}
              className="cr-btn"
              style={
                fitMode === "fit-page"
                  ? {
                      background: "var(--accent-glow)",
                      color: "var(--accent-bright)",
                      borderColor: "var(--accent)",
                    }
                  : {}
              }
              title="Fit to page"
            >
              Fit P
            </button>
          </div>
        </div>

        {/* ── PDF Viewport ── */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto flex justify-center p-4"
          style={{ background: "var(--surface-3)" }}
        >
          <Document
            file={pdfUrl}
            onLoadSuccess={handleDocumentLoadSuccess}
            onLoadError={handleDocumentLoadError}
            loading={
              <div className="flex items-center justify-center h-full">
                <div className="flex items-center gap-2">
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
            }
          >
            <div ref={pageWrapperRef} className="relative">
              <Page
                pageNumber={currentPage}
                scale={scale}
                onLoadSuccess={handlePageLoadSuccess}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="shadow-lg rounded-sm"
              />
              <div className="absolute inset-0 z-10 pointer-events-none">
                <AnnotationOverlay
                  annotations={annotations}
                  currentPage={currentPage}
                  scale={scale}
                  activeAnnotationId={activeAnnotationId}
                  onAnnotationClick={(id) => {
                    setActiveAnnotationId((prev) => (prev === id ? null : id));
                  }}
                  pendingHighlight={
                    pendingSelection
                      ? {
                          rects: pendingSelection.rects,
                          pageNumber: pendingSelection.pageNumber,
                        }
                      : null
                  }
                />
              </div>
              <TextSelectionLayer
                containerRef={pageWrapperRef}
                scale={scale}
                currentPage={currentPage}
                onSelectionComplete={handleSelectionComplete}
              />
            </div>
          </Document>
        </div>
      </div>

      {/* Annotation Sidebar */}
      <div
        className="w-full lg:w-96 h-64 lg:h-full shrink-0 flex flex-col"
        style={{ borderLeft: "1px solid var(--border-subtle)" }}
      >
        {annotationError && (
          <div
            className="px-3 py-2 text-sm flex items-center gap-2"
            style={{
              background: "var(--danger-dim)",
              color: "var(--danger-text)",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{annotationError.message}</span>
          </div>
        )}
        <div className="flex-1 overflow-hidden">
          <AnnotationSidebar
            annotations={annotations}
            currentPage={currentPage}
            activeAnnotationId={activeAnnotationId}
            pendingSelection={pendingSelection}
            onAnnotationClick={(id) => {
              setActiveAnnotationId((prev) => (prev === id ? null : id));
            }}
            onAnnotationCreate={handleAnnotationCreate}
            onAnnotationCancel={handleAnnotationCancel}
            onAnnotationUpdate={handleAnnotationUpdate}
            onAnnotationDelete={handleAnnotationDelete}
            isAuthenticated={isAuthenticated}
            onLoginClick={onLoginClick}
            isFetchingAnnotations={isFetchingAnnotations}
            isCreating={isCreating}
            isUpdating={isUpdating}
            isDeleting={isDeleting}
          />
        </div>
      </div>
    </div>
  );
}
