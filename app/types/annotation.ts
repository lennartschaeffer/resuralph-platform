export interface AnnotationRect {
  x: number; // PDF coordinate (points)
  y: number; // PDF coordinate (points)
  width: number; // PDF coordinate (points)
  height: number; // PDF coordinate (points)
}

export interface AnnotationPosition {
  pageNumber: number; // 1-indexed page number
  rects: AnnotationRect[]; // Bounding rectangles (may be multiple for multi-line)
}

export interface Annotation {
  id: string;
  selectedText: string;
  comment: string;
  position: AnnotationPosition;
  isHighPriority: boolean;
  createdAt: Date;
  creatorId: string;
}
