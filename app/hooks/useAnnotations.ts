"use client";

import { useState, useEffect, useCallback } from "react";
import { Annotation, AnnotationRect } from "@/app/types/annotation";

export interface CreateAnnotationData {
  documentId: string;
  selectedText: string;
  comment: string;
  positionData: {
    pageNumber: number;
    rects: AnnotationRect[];
  };
  isHighPriority: boolean;
}

export interface UpdateAnnotationData {
  comment?: string;
  isHighPriority?: boolean;
}

export function useAnnotations(documentId: string) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAnnotations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/annotations?documentId=${documentId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch annotations");
      }
      const data = await res.json();
      setAnnotations(data.annotations);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    fetchAnnotations();
  }, [fetchAnnotations]);

  return {
    annotations,
    isLoading,
    error,
    refetch: fetchAnnotations,
    setAnnotations,
  };
}

export function useCreateAnnotation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createAnnotation = useCallback(
    async (data: CreateAnnotationData): Promise<Annotation | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/annotations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          throw new Error("Failed to create annotation");
        }
        const result = await res.json();
        return result.annotation;
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { createAnnotation, isLoading, error };
}

export function useUpdateAnnotation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateAnnotation = useCallback(
    async (
      id: string,
      data: UpdateAnnotationData
    ): Promise<Annotation | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/annotations/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          throw new Error("Failed to update annotation");
        }
        const result = await res.json();
        return result.annotation;
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { updateAnnotation, isLoading, error };
}

export function useDeleteAnnotation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteAnnotation = useCallback(
    async (id: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/annotations/${id}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          throw new Error("Failed to delete annotation");
        }
        return true;
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { deleteAnnotation, isLoading, error };
}
