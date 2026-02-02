"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import AnnotationOverlay from "./AnnotationOverlay";
import AnnotationSidebar from "./AnnotationSidebar";
import TextSelectionLayer from "./TextSelectionLayer";
import { Annotation, AnnotationRect } from "@/app/types/annotation";
import { useUser } from "@/app/hooks/useUser";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const MIN_SCALE = 0.25;
const MAX_SCALE = 5.0;
const ZOOM_STEP = 0.25;
const ZOOM_PRESETS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0];

type FitMode = "none" | "fit-width" | "fit-page";

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
  const [scale, setScale] = useState(1.5);
  const [fitMode, setFitMode] = useState<FitMode>("none");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(
    null,
  );
  const [pendingSelection, setPendingSelection] = useState<{
    text: string;
    rects: AnnotationRect[];
    pageNumber: number;
  } | null>(null);

  const baseViewportRef = useRef<{ width: number; height: number } | null>(
    null,
  );

  // Fetch annotations from API
  useEffect(() => {
    async function fetchAnnotations() {
      try {
        const res = await fetch(`/api/annotations?documentId=${documentId}`);
        if (res.ok) {
          const data = await res.json();
          setAnnotations(data.annotations);
        }
      } catch {
        // Annotations will remain empty on error
      }
    }
    fetchAnnotations();
  }, [documentId]);

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
      baseViewportRef.current = {
        width: page.originalWidth,
        height: page.originalHeight,
      };
    },
    [],
  );

  const calculateFitScale = useCallback((mode: FitMode) => {
    if (mode === "none" || !containerRef.current || !baseViewportRef.current) {
      return null;
    }
    const container = containerRef.current;
    const padding = 32;
    const availableWidth = container.clientWidth - padding;
    const availableHeight = container.clientHeight - padding;
    const { width: pageWidth, height: pageHeight } = baseViewportRef.current;

    if (mode === "fit-width") {
      return Math.min(availableWidth / pageWidth, MAX_SCALE);
    }
    const scaleX = availableWidth / pageWidth;
    const scaleY = availableHeight / pageHeight;
    return Math.min(scaleX, scaleY, MAX_SCALE);
  }, []);

  useEffect(() => {
    if (fitMode === "none") return;
    function handleResize() {
      const newScale = calculateFitScale(fitMode);
      if (newScale !== null) setScale(newScale);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [fitMode, calculateFitScale]);

  function zoomIn() {
    setFitMode("none");
    setScale((prev) => Math.min(prev + ZOOM_STEP, MAX_SCALE));
  }

  function zoomOut() {
    setFitMode("none");
    setScale((prev) => Math.max(prev - ZOOM_STEP, MIN_SCALE));
  }

  function setZoomPreset(value: number) {
    setFitMode("none");
    setScale(value);
  }

  function fitToWidth() {
    setFitMode("fit-width");
    const newScale = calculateFitScale("fit-width");
    if (newScale !== null) setScale(newScale);
  }

  function fitToPage() {
    setFitMode("fit-page");
    const newScale = calculateFitScale("fit-page");
    if (newScale !== null) setScale(newScale);
  }

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
      try {
        const res = await fetch("/api/annotations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentId,
            selectedText: data.selectedText,
            comment: data.comment,
            positionData: {
              pageNumber: data.position.pageNumber,
              rects: data.position.rects,
            },
            isHighPriority: data.isHighPriority,
          }),
        });

        if (res.ok) {
          const result = await res.json();
          setAnnotations((prev) => [...prev, result.annotation]);
          setPendingSelection(null);
        }
      } catch {
        // Failed to create annotation
      }
    },
    [documentId],
  );

  const handleAnnotationCancel = useCallback(() => {
    setPendingSelection(null);
  }, []);

  const handleAnnotationUpdate = useCallback(
    async (id: string, data: { comment?: string; isHighPriority?: boolean }) => {
      try {
        const res = await fetch(`/api/annotations/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (res.ok) {
          const result = await res.json();
          setAnnotations((prev) =>
            prev.map((a) => (a.id === id ? result.annotation : a)),
          );
        }
      } catch {
        // Failed to update annotation
      }
    },
    [],
  );

  const handleAnnotationDelete = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/annotations/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setAnnotations((prev) => prev.filter((a) => a.id !== id));
        setActiveAnnotationId(null);
      }
    } catch {
      // Failed to delete annotation
    }
  }, []);

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

  const zoomPercentage = Math.round(scale * 100);

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
              disabled={scale <= MIN_SCALE || isLoading}
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
              disabled={scale >= MAX_SCALE || isLoading}
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
        className="w-full lg:w-96 h-64 lg:h-full shrink-0"
        style={{ borderLeft: "1px solid var(--border-subtle)" }}
      >
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
        />
      </div>
    </div>
  );
}
