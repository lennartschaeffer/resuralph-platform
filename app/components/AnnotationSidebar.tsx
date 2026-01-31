"use client";

import { Annotation, AnnotationRect } from "@/app/types/annotation";
import AnnotationCreationForm from "./AnnotationCreationForm";

interface AnnotationSidebarProps {
  annotations: Annotation[];
  currentPage: number;
  activeAnnotationId: string | null;
  pendingSelection: {
    text: string;
    rects: AnnotationRect[];
    pageNumber: number;
  } | null;
  onAnnotationClick: (annotationId: string) => void;
  onAnnotationCreate: (data: {
    selectedText: string;
    comment: string;
    isHighPriority: boolean;
    position: { pageNumber: number; rects: AnnotationRect[] };
  }) => void;
  onAnnotationCancel: () => void;
  isAuthenticated?: boolean;
  onLoginClick?: () => void;
}

export default function AnnotationSidebar({
  annotations,
  currentPage,
  activeAnnotationId,
  pendingSelection,
  onAnnotationClick,
  onAnnotationCreate,
  onAnnotationCancel,
  isAuthenticated = false,
  onLoginClick,
}: AnnotationSidebarProps) {
  // Sort annotations by their vertical position on the page (topmost first)
  const sortedAnnotations = [...annotations].sort((a, b) => {
    if (a.position.pageNumber !== b.position.pageNumber) {
      return a.position.pageNumber - b.position.pageNumber;
    }
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

      {/* Annotation Creation Form */}
      {pendingSelection && (
        <AnnotationCreationForm
          selectionData={pendingSelection}
          onSubmit={onAnnotationCreate}
          onCancel={onAnnotationCancel}
        />
      )}

      {/* Scrollable Annotation List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {sortedAnnotations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No annotations yet</p>
              {isAuthenticated ? (
                <p className="text-xs text-gray-400 mt-1">
                  Select text in the PDF to create one
                </p>
              ) : (
                <div className="mt-2">
                  <p className="text-xs text-gray-400">
                    Sign in to create annotations
                  </p>
                  {onLoginClick && (
                    <button
                      onClick={onLoginClick}
                      className="mt-2 px-3 py-1.5 text-xs font-medium rounded-md bg-[#5865F2] text-white hover:bg-[#4752C4] transition-colors"
                    >
                      Sign in with Discord
                    </button>
                  )}
                </div>
              )}
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
                  {annotation.isHighPriority && (
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-red-100 text-red-700">
                      High Priority
                    </span>
                  )}
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
