"use client";

import { useState } from "react";
import { Annotation } from "@/app/types/annotation";

interface AnnotationOverlayProps {
  annotations: Annotation[];
  currentPage: number;
  scale: number;
  activeAnnotationId: string | null;
  onAnnotationClick: (annotationId: string) => void;
}

export default function AnnotationOverlay({
  annotations,
  currentPage,
  scale,
  activeAnnotationId,
  onAnnotationClick,
}: AnnotationOverlayProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const pageAnnotations = annotations.filter(
    (a) => a.position.pageNumber === currentPage,
  );

  if (pageAnnotations.length === 0) return null;

  return (
    <>
      {pageAnnotations.map((annotation) =>
        annotation.position.rects.map((rect, rectIndex) => {
          const isActive = annotation.id === activeAnnotationId;
          const isHovered = annotation.id === hoveredId;

          return (
            <div
              key={`${annotation.id}-${rectIndex}`}
              className="absolute cursor-pointer transition-opacity duration-150"
              style={{
                left: rect.x * scale,
                top: rect.y * scale,
                width: rect.width * scale,
                height: rect.height * scale,
                backgroundColor: annotation.color,
                opacity: isActive ? 0.5 : isHovered ? 0.4 : 0.25,
                border: isActive
                  ? `2px solid ${annotation.color}`
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
    </>
  );
}
