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
  const sortedAnnotations = [...annotations].sort((a, b) => {
    if (a.position.pageNumber !== b.position.pageNumber) {
      return a.position.pageNumber - b.position.pageNumber;
    }
    const aY = a.position.rects[0]?.y ?? 0;
    const bY = b.position.rects[0]?.y ?? 0;
    return aY - bY;
  });

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: 'var(--surface-1)' }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 py-2.5 shrink-0 animate-boot"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span
            className="text-[11px] font-semibold tracking-wider uppercase"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}
          >
            Annotations
          </span>
        </div>
        <span
          className="cr-badge"
          style={{
            background: 'var(--surface-3)',
            color: 'var(--text-tertiary)',
            border: '1px solid var(--border-default)',
          }}
        >
          {annotations.length}
        </span>
      </div>

      {/* ── Creation Form ── */}
      {pendingSelection && (
        <AnnotationCreationForm
          selectionData={pendingSelection}
          onSubmit={onAnnotationCreate}
          onCancel={onAnnotationCancel}
        />
      )}

      {/* ── Annotation List ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-2">
          {sortedAnnotations.length === 0 ? (
            <div className="text-center py-12">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="mx-auto mb-3"
                style={{ color: 'var(--text-tertiary)', opacity: 0.5 }}
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <p
                className="text-xs"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}
              >
                No annotations
              </p>
              {isAuthenticated ? (
                <p
                  className="text-[10px] mt-1"
                  style={{ color: 'var(--text-tertiary)', opacity: 0.6 }}
                >
                  Select text in the PDF to create one
                </p>
              ) : (
                <div className="mt-3">
                  <p
                    className="text-[10px] mb-2"
                    style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}
                  >
                    Sign in to create annotations
                  </p>
                  {onLoginClick && (
                    <button onClick={onLoginClick} className="cr-btn cr-btn-accent" style={{ fontSize: '10px' }}>
                      Sign in with Discord
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            sortedAnnotations.map((annotation, index) => {
              const isActive = activeAnnotationId === annotation.id;
              const isOnCurrentPage = annotation.position.pageNumber === currentPage;

              return (
                <div
                  key={annotation.id}
                  onClick={() => onAnnotationClick(annotation.id)}
                  className="cursor-pointer transition-all duration-150 animate-slide-up"
                  style={{
                    animationDelay: `${index * 30}ms`,
                    background: isActive ? 'var(--surface-3)' : 'var(--surface-2)',
                    border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                    boxShadow: isActive ? 'var(--shadow-glow)' : 'none',
                    opacity: isOnCurrentPage ? 1 : 0.6,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = 'var(--border-strong)';
                      e.currentTarget.style.background = 'var(--surface-3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                      e.currentTarget.style.background = 'var(--surface-2)';
                    }
                  }}
                >
                  {/* Top row: page + priority */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="cr-badge"
                      style={{
                        background: 'var(--surface-4)',
                        color: 'var(--text-tertiary)',
                      }}
                    >
                      P{annotation.position.pageNumber}
                    </span>
                    {annotation.isHighPriority && (
                      <span
                        className="cr-badge"
                        style={{
                          background: 'var(--danger-dim)',
                          color: 'var(--danger-text)',
                        }}
                      >
                        Priority
                      </span>
                    )}
                  </div>

                  {/* Selected text */}
                  <p
                    className="text-[11px] italic mb-1.5 line-clamp-2"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    &ldquo;{annotation.selectedText}&rdquo;
                  </p>

                  {/* Comment */}
                  <p
                    className="text-xs line-clamp-3 leading-relaxed"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {annotation.comment}
                  </p>

                  {/* Timestamp */}
                  <p
                    className="text-[10px] mt-2"
                    style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', opacity: 0.7 }}
                  >
                    {new Date(annotation.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
