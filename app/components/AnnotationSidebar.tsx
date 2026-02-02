"use client";

import { useState } from "react";
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
  onAnnotationUpdate: (
    id: string,
    data: { comment?: string; isHighPriority?: boolean },
  ) => void;
  onAnnotationDelete: (id: string) => void;
  isAuthenticated?: boolean;
  onLoginClick: () => void;
}

export default function AnnotationSidebar({
  annotations,
  currentPage,
  activeAnnotationId,
  pendingSelection,
  onAnnotationClick,
  onAnnotationCreate,
  onAnnotationCancel,
  onAnnotationUpdate,
  onAnnotationDelete,
  isAuthenticated = false,
  onLoginClick,
}: AnnotationSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editComment, setEditComment] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sortedAnnotations = [...annotations].sort((a, b) => {
    if (a.positionData.pageNumber !== b.positionData.pageNumber) {
      return a.positionData.pageNumber - b.positionData.pageNumber;
    }
    const aY = a.positionData.rects[0]?.y ?? 0;
    const bY = b.positionData.rects[0]?.y ?? 0;
    return aY - bY;
  });

  function startEditing(annotation: Annotation) {
    setEditingId(annotation.id);
    setEditComment(annotation.comment);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditComment("");
  }

  function submitEdit(id: string) {
    const trimmed = editComment.trim();
    if (!trimmed) return;
    onAnnotationUpdate(id, { comment: trimmed });
    setEditingId(null);
    setEditComment("");
  }

  function confirmDelete(id: string) {
    onAnnotationDelete(id);
    setDeletingId(null);
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: "var(--surface-1)" }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 py-2.5 shrink-0 animate-boot"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div className="flex items-center gap-2">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            style={{ color: "var(--text-tertiary)" }}
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span
            className="text-[11px] font-semibold tracking-wider uppercase"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--text-secondary)",
            }}
          >
            Annotations
          </span>
        </div>
        <span
          className="cr-badge"
          style={{
            background: "var(--surface-3)",
            color: "var(--text-tertiary)",
            border: "1px solid var(--border-default)",
          }}
        >
          {annotations.length}
        </span>
      </div>

      {/* ── Creation Form / Login Prompt ── */}
      {pendingSelection &&
        (isAuthenticated ? (
          <AnnotationCreationForm
            selectionData={pendingSelection}
            onSubmit={onAnnotationCreate}
            onCancel={onAnnotationCancel}
          />
        ) : (
          <div
            className="px-4 py-4 space-y-3"
            style={{
              borderBottom: "1px solid var(--border-subtle)",
              background: "var(--surface-2)",
            }}
          >
            <p
              className="text-xs font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Sign in to annotate
            </p>
            <p
              className="text-[11px]"
              style={{ color: "var(--text-tertiary)" }}
            >
              &ldquo;
              {pendingSelection.text.length > 80
                ? pendingSelection.text.slice(0, 80) + "..."
                : pendingSelection.text}
              &rdquo;
            </p>
            <div className="flex items-center justify-between">
              <button
                onClick={onLoginClick}
                className="cr-btn cr-btn-accent"
                style={{ fontSize: "10px" }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z" />
                </svg>
                Sign in with Discord
              </button>
              <button
                onClick={onAnnotationCancel}
                className="cr-btn"
                style={{ fontSize: "10px" }}
              >
                Cancel
              </button>
            </div>
          </div>
        ))}

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
                style={{ color: "var(--text-tertiary)", opacity: 0.5 }}
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <p
                className="text-xs"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-tertiary)",
                }}
              >
                No annotations
              </p>
              {isAuthenticated ? (
                <p
                  className="text-[10px] mt-1"
                  style={{ color: "var(--text-tertiary)", opacity: 0.6 }}
                >
                  Select text in the PDF to create one
                </p>
              ) : (
                <div className="mt-3">
                  <p
                    className="text-[10px] mb-2"
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: "var(--text-tertiary)",
                    }}
                  >
                    Sign in to create annotations
                  </p>
                  <button
                    onClick={onLoginClick}
                    className="cr-btn cr-btn-accent"
                    style={{ fontSize: "10px" }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z" />
                    </svg>
                    Sign in with Discord
                  </button>
                </div>
              )}
            </div>
          ) : (
            sortedAnnotations.map((annotation, index) => {
              const isActive = activeAnnotationId === annotation.id;
              const isOnCurrentPage =
                annotation.positionData.pageNumber === currentPage;
              const isEditing = editingId === annotation.id;
              const isDeleting = deletingId === annotation.id;

              return (
                <div
                  key={annotation.id}
                  onClick={() => onAnnotationClick(annotation.id)}
                  className="cursor-pointer transition-all duration-150 animate-slide-up"
                  style={{
                    animationDelay: `${index * 30}ms`,
                    background: isActive
                      ? "var(--surface-3)"
                      : "var(--surface-2)",
                    border: `1px solid ${isActive ? "var(--accent)" : "var(--border-subtle)"}`,
                    borderRadius: "var(--radius-md)",
                    padding: "10px 12px",
                    boxShadow: isActive ? "var(--shadow-glow)" : "none",
                    opacity: isOnCurrentPage ? 1 : 0.6,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor =
                        "var(--border-strong)";
                      e.currentTarget.style.background = "var(--surface-3)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor =
                        "var(--border-subtle)";
                      e.currentTarget.style.background = "var(--surface-2)";
                    }
                  }}
                >
                  {/* Top row: page + priority */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="cr-badge"
                      style={{
                        background: "var(--surface-4)",
                        color: "var(--text-tertiary)",
                      }}
                    >
                      P{annotation.positionData.pageNumber}
                    </span>
                    {annotation.isHighPriority && (
                      <span
                        className="cr-badge"
                        style={{
                          background: "var(--danger-dim)",
                          color: "var(--danger-text)",
                        }}
                      >
                        Priority
                      </span>
                    )}
                  </div>

                  {/* Selected text */}
                  <p
                    className="text-[11px] italic mb-1.5 line-clamp-2"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    &ldquo;{annotation.selectedText}&rdquo;
                  </p>

                  {/* Comment — editable or static */}
                  {isEditing ? (
                    <div
                      className="space-y-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <textarea
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        rows={3}
                        className="cr-input w-full resize-none"
                        style={{ fontSize: "12px", lineHeight: "1.5" }}
                        autoFocus
                      />
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={cancelEditing}
                          className="cr-btn"
                          style={{ fontSize: "10px" }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => submitEdit(annotation.id)}
                          className="cr-btn cr-btn-accent"
                          style={{ fontSize: "10px" }}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p
                      className="text-xs line-clamp-3 leading-relaxed"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {annotation.comment}
                    </p>
                  )}

                  {/* Delete confirmation */}
                  {isDeleting && (
                    <div
                      className="mt-2 p-2 rounded space-y-2"
                      style={{
                        background: "var(--danger-dim)",
                        border: "1px solid var(--danger)",
                        borderRadius: "var(--radius-sm)",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <p
                        className="text-[11px]"
                        style={{ color: "var(--danger-text)" }}
                      >
                        Delete this annotation?
                      </p>
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => setDeletingId(null)}
                          className="cr-btn"
                          style={{ fontSize: "10px" }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => confirmDelete(annotation.id)}
                          className="cr-btn"
                          style={{
                            fontSize: "10px",
                            background: "var(--danger)",
                            color: "#fff",
                            borderColor: "var(--danger)",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Timestamp + actions */}
                  <div className="flex items-center justify-between mt-2">
                    <p
                      className="text-[10px]"
                      style={{
                        fontFamily: "var(--font-mono)",
                        color: "var(--text-tertiary)",
                        opacity: 0.7,
                      }}
                    >
                      {new Date(annotation.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        },
                      )}
                    </p>

                    {/* Edit/Delete buttons — only for authenticated users */}
                    {isAuthenticated && !isEditing && !isDeleting && (
                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => startEditing(annotation)}
                          className="cr-btn"
                          style={{ padding: "2px 6px", fontSize: "10px" }}
                          title="Edit"
                        >
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeletingId(annotation.id)}
                          className="cr-btn"
                          style={{ padding: "2px 6px", fontSize: "10px" }}
                          title="Delete"
                        >
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
