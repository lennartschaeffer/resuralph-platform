"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import AnnotationOverlay from "./AnnotationOverlay";
import AnnotationSidebar from "./AnnotationSidebar";
import TextSelectionLayer from "./TextSelectionLayer";
import { Annotation, AnnotationRect } from "@/app/types/annotation";
import { mockAnnotations } from "@/app/data/mockAnnotations";

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
  isAuthenticated?: boolean;
  onLoginClick?: () => void;
}

export default function PDFViewer({
  pdfUrl,
  isAuthenticated = false,
  onLoginClick,
}: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageWrapperRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [fitMode, setFitMode] = useState<FitMode>("none");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>(mockAnnotations);
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
    (data: {
      selectedText: string;
      comment: string;
      isHighPriority: boolean;
      position: { pageNumber: number; rects: AnnotationRect[] };
    }) => {
      const newAnnotation: Annotation = {
        id: crypto.randomUUID(),
        selectedText: data.selectedText,
        comment: data.comment,
        position: data.position,
        isHighPriority: data.isHighPriority,
        createdAt: new Date(),
        creatorId: "local-user",
      };
      setAnnotations((prev) => [...prev, newAnnotation]);
      setPendingSelection(null);
    },
    [],
  );

  const handleAnnotationCancel = useCallback(() => {
    setPendingSelection(null);
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
          className="flex items-center justify-between px-3 py-1.5 shrink-0 animate-boot"
          style={{
            background: "var(--surface-1)",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          {/* Auth Status */}
          {!isAuthenticated && onLoginClick && (
            <button
              onClick={onLoginClick}
              className="cr-btn cr-btn-accent"
              style={{ fontSize: "10px" }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              Sign In
            </button>
          )}

          {isAuthenticated && (
            <div className="flex items-center gap-1.5">
              <div
                className="cr-status-dot"
                style={{ background: "var(--success)" }}
              />
              <span
                className="text-[10px] tracking-wider uppercase"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-tertiary)",
                }}
              >
                Write Access
              </span>
            </div>
          )}

          {/* ── Navigation ── */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={goToPreviousPage}
              disabled={currentPage <= 1 || isLoading}
              className="cr-btn"
              style={{ padding: "4px 8px" }}
              title="Previous page"
            >
              <svg
                width="14"
                height="14"
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
                style={{ width: "40px", padding: "3px 4px", fontSize: "11px" }}
              />
              <span
                className="text-[11px]"
                style={{ color: "var(--text-tertiary)" }}
              >
                / {totalPages}
              </span>
            </div>

            <button
              onClick={goToNextPage}
              disabled={currentPage >= totalPages || isLoading}
              className="cr-btn"
              style={{ padding: "4px 8px" }}
              title="Next page"
            >
              <svg
                width="14"
                height="14"
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
              style={{ padding: "4px 8px" }}
              title="Zoom out"
            >
              <svg
                width="14"
                height="14"
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
                padding: "3px 6px",
                fontSize: "11px",
                minWidth: "64px",
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
              style={{ padding: "4px 8px" }}
              title="Zoom in"
            >
              <svg
                width="14"
                height="14"
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
              {isAuthenticated && (
                <TextSelectionLayer
                  containerRef={pageWrapperRef}
                  scale={scale}
                  currentPage={currentPage}
                  onSelectionComplete={handleSelectionComplete}
                />
              )}
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
          pendingSelection={isAuthenticated ? pendingSelection : null}
          onAnnotationClick={(id) => {
            setActiveAnnotationId((prev) => (prev === id ? null : id));
          }}
          onAnnotationCreate={handleAnnotationCreate}
          onAnnotationCancel={handleAnnotationCancel}
          isAuthenticated={isAuthenticated}
          onLoginClick={onLoginClick}
        />
      </div>
    </div>
  );
}
