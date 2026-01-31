"use client";

import { Annotation } from "@/app/types/annotation";

interface AnnotationSidebarProps {
  annotations: Annotation[];
  currentPage: number;
  activeAnnotationId: string | null;
  selectedText: string | null;
  onAnnotationClick: (annotationId: string) => void;
}

export default function AnnotationSidebar({
  annotations,
  currentPage,
  activeAnnotationId,
  selectedText,
  onAnnotationClick,
}: AnnotationSidebarProps) {
  // Sort annotations by their vertical position on the page (topmost first)
  const sortedAnnotations = [...annotations].sort((a, b) => {
    if (a.position.pageNumber !== b.position.pageNumber) {
      return a.position.pageNumber - b.position.pageNumber;
    }
    // Sort by the y-coordinate of the first rect (topmost first)
    const aY = a.position.rects[0]?.y ?? 0;
    const bY = b.position.rects[0]?.y ?? 0;
    return aY - bY;
  });

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
        <h2 className="text-sm font-semibold text-gray-900">Annotations</h2>
        <span className="px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-700">
          {annotations.length}
        </span>
      </div>

      {/* Annotation Creation Form Placeholder */}
      {selectedText && (
        <div className="p-4 bg-blue-50 border-b border-blue-100 shrink-0">
          <div className="text-xs font-semibold text-blue-900 mb-2">
            NEW ANNOTATION
          </div>
          <div className="p-3 bg-white border border-blue-200 rounded-md">
            <p className="text-xs text-gray-500 italic">
              &ldquo;{selectedText}&rdquo;
            </p>
            <p className="text-xs text-gray-400 mt-2">
              [Annotation creation form placeholder]
            </p>
          </div>
        </div>
      )}

      {/* Scrollable Annotation List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {sortedAnnotations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No annotations yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Select text in the PDF to create one
              </p>
            </div>
          ) : (
            sortedAnnotations.map((annotation) => (
              <div
                key={annotation.id}
                onClick={() => onAnnotationClick(annotation.id)}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  activeAnnotationId === annotation.id
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {/* Page indicator */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-gray-500">
                    Page {annotation.position.pageNumber}
                  </span>
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: annotation.color }}
                  />
                  <span className="text-xs text-gray-400 capitalize">
                    {annotation.priority}
                  </span>
                </div>

                {/* Selected text snippet */}
                <p className="text-xs text-gray-600 italic mb-2 line-clamp-2">
                  &ldquo;{annotation.selectedText}&rdquo;
                </p>

                {/* Comment */}
                <p className="text-sm text-gray-900 line-clamp-3">
                  {annotation.comment}
                </p>
                {/* Timestamp */}
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(annotation.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
