"use client";

import { useState, useRef, useEffect } from "react";
import { AnnotationRect } from "@/app/types/annotation";

interface SelectionData {
  text: string;
  rects: AnnotationRect[];
  pageNumber: number;
}

interface AnnotationCreationFormProps {
  selectionData: SelectionData;
  onSubmit: (data: {
    selectedText: string;
    comment: string;
    isHighPriority: boolean;
    position: { pageNumber: number; rects: AnnotationRect[] };
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function AnnotationCreationForm({
  selectionData,
  onSubmit,
  onCancel,
  isLoading = false,
}: AnnotationCreationFormProps) {
  const [comment, setComment] = useState("");
  const [isHighPriority, setIsHighPriority] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = comment.trim();
    if (!trimmed) {
      setError("Comment is required.");
      return;
    }
    onSubmit({
      selectedText: selectionData.text,
      comment: trimmed,
      isHighPriority,
      position: {
        pageNumber: selectionData.pageNumber,
        rects: selectionData.rects,
      },
    });
    setComment("");
    setIsHighPriority(false);
    setError(null);
  }

  const displayText = selectionData.text;
  const shouldTruncate = displayText.length > 120;

  return (
    <div
      className="p-4 shrink-0 animate-slide-up"
      style={{
        background: 'var(--surface-2)',
        borderBottom: '1px solid var(--border-default)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="cr-status-dot animate-pulse-glow"
          style={{ background: 'var(--accent)' }}
        />
        <span
          className="cr-badge"
          style={{
            background: 'var(--accent-glow)',
            color: 'var(--accent-bright)',
            border: '1px solid var(--accent-dim)',
          }}
        >
          New Annotation
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Selected text preview */}
        <div
          className="p-2.5 rounded"
          style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <p className="text-[14px] italic" style={{ color: 'var(--text-tertiary)' }}>
            &ldquo;
            {shouldTruncate && !isTextExpanded
              ? displayText.slice(0, 120) + "..."
              : displayText}
            &rdquo;
          </p>
          {shouldTruncate && (
            <button
              type="button"
              onClick={() => setIsTextExpanded(!isTextExpanded)}
              className="text-[13px] mt-1 transition-colors duration-150"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent-bright)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              {isTextExpanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>

        {/* Comment */}
        <div>
          <textarea
            ref={textareaRef}
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Add your comment..."
            rows={3}
            className="cr-input w-full resize-none"
            style={{ fontSize: '14px', lineHeight: '1.5' }}
          />
          {error && (
            <p className="text-[13px] mt-1" style={{ color: 'var(--danger-text)' }}>
              {error}
            </p>
          )}
        </div>

        {/* Priority toggle */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isHighPriority}
            onChange={(e) => setIsHighPriority(e.target.checked)}
            className="w-4 h-4 rounded accent-red-500"
            style={{ accentColor: 'var(--danger)' }}
          />
          <span
            className="text-[14px] font-medium"
            style={{
              fontFamily: 'var(--font-mono)',
              color: isHighPriority ? 'var(--danger-text)' : 'var(--text-tertiary)',
              transition: 'color 0.15s ease',
            }}
          >
            High Priority
          </span>
        </label>

        {/* Actions */}
        <div className="flex items-center gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="cr-btn"
            style={{ fontSize: '13px', padding: '6px 12px' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="cr-btn cr-btn-accent"
            style={{ fontSize: '13px', padding: '6px 12px', opacity: isLoading ? 0.7 : 1 }}
          >
            {isLoading ? 'Saving...' : 'Add Annotation'}
          </button>
        </div>
      </form>
    </div>
  );
}
