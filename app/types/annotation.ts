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
  documentId: string;
  selectedText: string;
  comment: string;
  positionData: AnnotationPosition;
  isHighPriority: boolean;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
}
