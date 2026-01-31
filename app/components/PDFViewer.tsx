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

export default function PDFViewer({ pdfUrl, isAuthenticated = false, onLoginClick }: PDFViewerProps) {
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

  // Pending selection data from TextSelectionLayer (shown after clicking "Annotate")
  const [pendingSelection, setPendingSelection] = useState<{
    text: string;
    rects: AnnotationRect[];
    pageNumber: number;
  } | null>(null);

  // Store the base viewport (scale=1) for fit calculations
  const baseViewportRef = useRef<{ width: number; height: number } | null>(
    null,
  );

  // --- Document & Page callbacks ---
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

  // Calculate fit scale based on container dimensions and page dimensions
  const calculateFitScale = useCallback((mode: FitMode) => {
    if (mode === "none" || !containerRef.current || !baseViewportRef.current) {
      return null;
    }

    const container = containerRef.current;
    const padding = 32; // 16px padding on each side
    const availableWidth = container.clientWidth - padding;
    const availableHeight = container.clientHeight - padding;
    const { width: pageWidth, height: pageHeight } = baseViewportRef.current;

    if (mode === "fit-width") {
      return Math.min(availableWidth / pageWidth, MAX_SCALE);
    }

    // fit-page: fit both dimensions
    const scaleX = availableWidth / pageWidth;
    const scaleY = availableHeight / pageHeight;
    return Math.min(scaleX, scaleY, MAX_SCALE);
  }, []);

  // Recalculate fit scale on window resize
  useEffect(() => {
    if (fitMode === "none") return;

    function handleResize() {
      const newScale = calculateFitScale(fitMode);
      if (newScale !== null) {
        setScale(newScale);
      }
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [fitMode, calculateFitScale]);

  // --- Zoom handlers ---
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
    if (newScale !== null) {
      setScale(newScale);
    }
  }

  function fitToPage() {
    setFitMode("fit-page");
    const newScale = calculateFitScale("fit-page");
    if (newScale !== null) {
      setScale(newScale);
    }
  }

  // --- Page navigation ---
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

  // Called when user clicks "Annotate" button after selecting text
  const handleSelectionComplete = useCallback(
    (data: { text: string; rects: AnnotationRect[]; pageNumber: number }) => {
      setPendingSelection(data);
    },
    [],
  );

  // Called when user submits the annotation creation form
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

  // Called when user cancels the annotation creation form
  const handleAnnotationCancel = useCallback(() => {
    setPendingSelection(null);
  }, []);

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

  const zoomPercentage = Math.round(scale * 100);

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* PDF Viewer Section */}
      <div className="flex flex-col flex-1 h-full lg:h-auto">
        {/* Viewer Controls */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50 shrink-0">
        {/* Auth Controls */}
        {!isAuthenticated && onLoginClick && (
          <div className="flex items-center">
            <button
              onClick={onLoginClick}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-[#5865F2] text-white hover:bg-[#4752C4] transition-colors"
            >
              Sign in to annotate
            </button>
          </div>
        )}
        {/* Navigation Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousPage}
            disabled={currentPage <= 1 || isLoading}
            className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-gray-900 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <button
            onClick={goToNextPage}
            disabled={currentPage >= totalPages || isLoading}
            className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-gray-900 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
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

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={zoomOut}
            disabled={scale <= MIN_SCALE || isLoading}
            className="w-8 h-8 flex items-center justify-center text-sm font-medium rounded-md border border-gray-300 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Zoom out (-)"
          >
            &minus;
          </button>

          <select
            value={ZOOM_PRESETS.includes(scale) ? scale.toString() : "custom"}
            onChange={(e) => {
              const val = e.target.value;
              if (val !== "custom") {
                setZoomPreset(parseFloat(val));
              }
            }}
            className="h-8 px-1.5 text-sm border border-gray-300 rounded-md bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-8 h-8 flex items-center justify-center text-sm font-medium rounded-md border border-gray-300 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Zoom in (+)"
          >
            +
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <button
            onClick={fitToWidth}
            disabled={isLoading}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors ${
              fitMode === "fit-width"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-300 bg-white hover:bg-gray-100 text-gray-700"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
            title="Fit to width"
          >
            Fit Width
          </button>
          <button
            onClick={fitToPage}
            disabled={isLoading}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors ${
              fitMode === "fit-page"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-300 bg-white hover:bg-gray-100 text-gray-700"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
            title="Fit to page"
          >
            Fit Page
          </button>
        </div>
      </div>

      {/* PDF Viewer Area */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-auto bg-gray-100 flex justify-center p-4 `}
      >
        <Document
          file={pdfUrl}
          onLoadSuccess={handleDocumentLoadSuccess}
          onLoadError={handleDocumentLoadError}
          loading={
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500 text-sm">Loading PDF...</div>
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
              className="shadow-lg"
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
      <div className="w-full lg:w-96 h-64 lg:h-full shrink-0">
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
