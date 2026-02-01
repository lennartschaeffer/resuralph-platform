"use client";

import { useState } from "react";
import { Annotation, AnnotationRect } from "@/app/types/annotation";

interface PendingHighlight {
  rects: AnnotationRect[];
  pageNumber: number;
}

interface AnnotationOverlayProps {
  annotations: Annotation[];
  currentPage: number;
  scale: number;
  activeAnnotationId: string | null;
  onAnnotationClick: (annotationId: string) => void;
  pendingHighlight: PendingHighlight | null;
}

export default function AnnotationOverlay({
  annotations,
  currentPage,
  scale,
  activeAnnotationId,
  onAnnotationClick,
  pendingHighlight,
}: AnnotationOverlayProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const pageAnnotations = annotations.filter(
    (a) => a.position.pageNumber === currentPage,
  );

  const showPending =
    pendingHighlight && pendingHighlight.pageNumber === currentPage;

  if (pageAnnotations.length === 0 && !showPending) return null;

  return (
    <>
      {pageAnnotations.map((annotation) =>
        annotation.position.rects.map((rect, rectIndex) => {
          const isActive = annotation.id === activeAnnotationId;
          const isHovered = annotation.id === hoveredId;

          const color = annotation.isHighPriority
            ? "var(--highlight-priority-solid)"
            : "var(--highlight-normal-solid)";
          const bgColor = annotation.isHighPriority
            ? "var(--highlight-priority)"
            : "var(--highlight-normal)";

          return (
            <div
              key={`${annotation.id}-${rectIndex}`}
              className="absolute cursor-pointer transition-all duration-150"
              style={{
                left: rect.x * scale,
                top: rect.y * scale,
                width: rect.width * scale,
                height: rect.height * scale,
                backgroundColor: bgColor,
                opacity: isActive ? 0.8 : isHovered ? 0.6 : 0.45,
                border: isActive
                  ? `2px solid ${color}`
                  : "1px solid transparent",
                borderRadius: 2,
                pointerEvents: "auto",
              }}
              onMouseEnter={() => setHoveredId(annotation.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={(e) => {
                e.stopPropagation();
                onAnnotationClick(annotation.id);
              }}
              title={`${annotation.selectedText}\n\n${annotation.comment}`}
            />
          );
        }),
      )}

      {/* Pending highlight */}
      {showPending &&
        pendingHighlight.rects.map((rect, i) => (
          <div
            key={`pending-${i}`}
            className="absolute transition-opacity duration-150 animate-pulse"
            style={{
              left: rect.x * scale,
              top: rect.y * scale,
              width: rect.width * scale,
              height: rect.height * scale,
              backgroundColor: "var(--highlight-pending)",
              opacity: 0.4,
              border: "2px solid var(--highlight-pending-solid)",
              borderRadius: 2,
              pointerEvents: "none",
            }}
          />
        ))}
    </>
  );
}
