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
}

export default function AnnotationCreationForm({
  selectionData,
  onSubmit,
  onCancel,
}: AnnotationCreationFormProps) {
  const [comment, setComment] = useState("");
  const [isHighPriority, setIsHighPriority] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus the comment textarea when the form appears
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
    <div className="p-4 bg-blue-50 border-b border-blue-100 shrink-0 animate-in slide-in-from-top-2 fade-in duration-200">
      <div className="text-xs font-semibold text-blue-900 mb-2">
        NEW ANNOTATION
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Selected text preview */}
        <div className="p-2.5 bg-white border border-blue-200 rounded-md">
          <p className="text-xs text-gray-600 italic">
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
              className="text-xs text-blue-600 hover:text-blue-700 mt-1"
            >
              {isTextExpanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>

        {/* Comment textarea */}
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
            className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>

        {/* High priority toggle */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isHighPriority}
            onChange={(e) => setIsHighPriority(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-gray-300 text-red-600 focus:ring-red-500"
          />
          <span
            className={`text-xs font-medium ${isHighPriority ? "text-red-700" : "text-gray-600"}`}
          >
            High Priority
          </span>
        </label>

        {/* Action buttons */}
        <div className="flex items-center gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Annotation
          </button>
        </div>
      </form>
    </div>
  );
}
