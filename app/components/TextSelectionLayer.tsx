"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { AnnotationRect } from "@/app/types/annotation";

interface SelectionData {
  text: string;
  rects: AnnotationRect[];
  pageNumber: number;
}

interface PopupPosition {
  x: number;
  y: number;
}

interface TextSelectionLayerProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  scale: number;
  currentPage: number;
  onSelectionComplete?: (data: SelectionData) => void;
}

/**
 * Captures text selections from react-pdf's built-in text layer and shows a
 * floating "Annotate" button near the selection. On click, it logs the selected
 * text, its PDF-coordinate bounding rects (unscaled), and the page number.
 *
 * Browser selections across multiple <span> elements produce many fragmented
 * DOMRects. These are converted to PDF coordinates (divided by scale) and then
 * consolidated via `mergeRects` — which groups rects sharing a similar y-value
 * into one rect per visual line — so downstream highlight rendering gets clean,
 * per-line rectangles rather than dozens of tiny fragments.
 */
export default function TextSelectionLayer({
  containerRef,
  scale,
  currentPage,
  onSelectionComplete,
}: TextSelectionLayerProps) {
  const [popupPosition, setPopupPosition] = useState<PopupPosition | null>(null);
  const [selectionData, setSelectionData] = useState<SelectionData | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const clearSelection = useCallback(() => {
    setPopupPosition(null);
    setSelectionData(null);
  }, []);

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const textLayer = container.querySelector(".react-pdf__Page__textContent");
    if (!textLayer) return;

    const anchorNode = selection.anchorNode;
    const focusNode = selection.focusNode;
    if (
      !anchorNode ||
      !focusNode ||
      !textLayer.contains(anchorNode) ||
      !textLayer.contains(focusNode)
    ) {
      return;
    }

    const selectedText = selection.toString().trim();
    if (!selectedText) return;

    const range = selection.getRangeAt(0);
    const clientRects = range.getClientRects();
    const containerRect = container.getBoundingClientRect();

    const pdfRects: AnnotationRect[] = [];
    for (let i = 0; i < clientRects.length; i++) {
      const r = clientRects[i];
      pdfRects.push({
        x: (r.left - containerRect.left) / scale,
        y: (r.top - containerRect.top) / scale,
        width: r.width / scale,
        height: r.height / scale,
      });
    }

    const mergedRects = mergeRects(pdfRects);

    const data: SelectionData = {
      text: selectedText,
      rects: mergedRects,
      pageNumber: currentPage,
    };
    setSelectionData(data);

    const lastRect = clientRects[clientRects.length - 1];
    setPopupPosition({
      x: lastRect.right - containerRect.left + 4,
      y: lastRect.top - containerRect.top - 36,
    });
  }, [containerRef, scale, currentPage]);

  const handleAnnotateClick = useCallback(() => {
    if (!selectionData) return;

    console.log("Selected text:", selectionData.text);
    console.log("PDF coordinates:", selectionData.rects);
    console.log("Page:", selectionData.pageNumber);

    onSelectionComplete?.(selectionData);

    window.getSelection()?.removeAllRanges();
    clearSelection();
  }, [selectionData, onSelectionComplete, clearSelection]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("mouseup", handleMouseUp);
    return () => {
      container.removeEventListener("mouseup", handleMouseUp);
    };
  }, [containerRef, handleMouseUp]);

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        clearSelection();
      }
    }
    if (popupPosition) {
      document.addEventListener("mousedown", handleMouseDown);
      return () => document.removeEventListener("mousedown", handleMouseDown);
    }
  }, [popupPosition, clearSelection]);

  if (!popupPosition) return null;

  return (
    <div
      ref={popupRef}
      className="absolute z-20 animate-slide-up"
      style={{
        left: popupPosition.x,
        top: popupPosition.y,
      }}
    >
      <button
        onClick={handleAnnotateClick}
        className="cr-btn cr-btn-accent"
        style={{
          fontSize: '11px',
          boxShadow: 'var(--shadow-lg), var(--shadow-glow)',
          padding: '5px 12px',
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
        Annotate
      </button>
    </div>
  );
}

/** Merge rects that share similar y positions into single wider rects */
function mergeRects(rects: AnnotationRect[]): AnnotationRect[] {
  if (rects.length === 0) return [];

  const sorted = [...rects].sort((a, b) => a.y - b.y || a.x - b.x);
  const merged: AnnotationRect[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    if (Math.abs(current.y - last.y) < last.height * 0.5) {
      const minX = Math.min(last.x, current.x);
      const maxX = Math.max(last.x + last.width, current.x + current.width);
      last.x = minX;
      last.width = maxX - minX;
      last.height = Math.max(last.height, current.height);
    } else {
      merged.push({ ...current });
    }
  }

  return merged;
}
