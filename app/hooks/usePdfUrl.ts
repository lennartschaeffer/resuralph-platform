import { useEffect, useState } from "react";

interface UsePdfUrlResult {
  pdfUrl: string | null;
  error: string | null;
  loading: boolean;
}

export function usePdfUrl(documentId: string): UsePdfUrlResult {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPdfUrl() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/documents/${documentId}/pdf`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to load document");
          return;
        }
        const data = await res.json();
        setPdfUrl(data.url);
      } catch {
        setError("Failed to load document");
      } finally {
        setLoading(false);
      }
    }
    fetchPdfUrl();
  }, [documentId]);

  return { pdfUrl, error, loading };
}
