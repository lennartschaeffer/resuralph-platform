"use client";

import { useState, useCallback, useEffect, RefObject } from "react";

const MIN_SCALE = 0.25;
const MAX_SCALE = 5.0;
const ZOOM_STEP = 0.25;
export const ZOOM_PRESETS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0];

export type FitMode = "none" | "fit-width" | "fit-page";

interface UseZoomOptions {
  containerRef: RefObject<HTMLDivElement | null>;
  initialScale?: number;
}

interface UseZoomReturn {
  scale: number;
  fitMode: FitMode;
  zoomPercentage: number;
  zoomIn: () => void;
  zoomOut: () => void;
  setZoomPreset: (value: number) => void;
  fitToWidth: () => void;
  fitToPage: () => void;
  setBaseViewport: (width: number, height: number) => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
}

export function useZoom({
  containerRef,
  initialScale = 1.5,
}: UseZoomOptions): UseZoomReturn {
  const [scale, setScale] = useState(initialScale);
  const [fitMode, setFitMode] = useState<FitMode>("none");
  const [baseViewport, setBaseViewportState] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const setBaseViewport = useCallback((width: number, height: number) => {
    setBaseViewportState({ width, height });
  }, []);

  const calculateFitScale = useCallback(
    (mode: FitMode) => {
      if (mode === "none" || !containerRef.current || !baseViewport) {
        return null;
      }
      const container = containerRef.current;
      const padding = 32;
      const availableWidth = container.clientWidth - padding;
      const availableHeight = container.clientHeight - padding;
      const { width: pageWidth, height: pageHeight } = baseViewport;

      if (mode === "fit-width") {
        return Math.min(availableWidth / pageWidth, MAX_SCALE);
      }
      const scaleX = availableWidth / pageWidth;
      const scaleY = availableHeight / pageHeight;
      return Math.min(scaleX, scaleY, MAX_SCALE);
    },
    [containerRef, baseViewport]
  );

  useEffect(() => {
    if (fitMode === "none") return;
    function handleResize() {
      const newScale = calculateFitScale(fitMode);
      if (newScale !== null) setScale(newScale);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [fitMode, calculateFitScale]);

  const zoomIn = useCallback(() => {
    setFitMode("none");
    setScale((prev) => Math.min(prev + ZOOM_STEP, MAX_SCALE));
  }, []);

  const zoomOut = useCallback(() => {
    setFitMode("none");
    setScale((prev) => Math.max(prev - ZOOM_STEP, MIN_SCALE));
  }, []);

  const setZoomPreset = useCallback((value: number) => {
    setFitMode("none");
    setScale(value);
  }, []);

  const fitToWidth = useCallback(() => {
    setFitMode("fit-width");
    const newScale = calculateFitScale("fit-width");
    if (newScale !== null) setScale(newScale);
  }, [calculateFitScale]);

  const fitToPage = useCallback(() => {
    setFitMode("fit-page");
    const newScale = calculateFitScale("fit-page");
    if (newScale !== null) setScale(newScale);
  }, [calculateFitScale]);

  return {
    scale,
    fitMode,
    zoomPercentage: Math.round(scale * 100),
    zoomIn,
    zoomOut,
    setZoomPreset,
    fitToWidth,
    fitToPage,
    setBaseViewport,
    canZoomIn: scale < MAX_SCALE,
    canZoomOut: scale > MIN_SCALE,
  };
}
