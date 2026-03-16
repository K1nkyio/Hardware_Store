import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageZoomProps {
  images: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  productName: string;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;
const SWIPE_THRESHOLD = 45;

const clampZoom = (value: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));

const ImageZoom = ({ images, initialIndex, isOpen, onClose, productName }: ImageZoomProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalImages = images.length;
  const currentImage = images[currentIndex] ?? images[0] ?? "";

  const canNavigate = totalImages > 1;

  const imageAlt = useMemo(
    () => `${productName} image ${currentIndex + 1} of ${Math.max(totalImages, 1)}`,
    [currentIndex, productName, totalImages]
  );

  const goToPrevious = () => {
    if (!canNavigate) return;
    setCurrentIndex((prev) => (prev - 1 + totalImages) % totalImages);
  };

  const goToNext = () => {
    if (!canNavigate) return;
    setCurrentIndex((prev) => (prev + 1) % totalImages);
  };

  const zoomIn = () => setZoom((prev) => clampZoom(prev + ZOOM_STEP));
  const zoomOut = () => setZoom((prev) => clampZoom(prev - ZOOM_STEP));
  const resetZoom = () => setZoom(1);

  useEffect(() => {
    if (!isOpen) return;
    setCurrentIndex(initialIndex);
    setZoom(1);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }

      if (event.key === "ArrowLeft") {
        goToPrevious();
      }

      if (event.key === "ArrowRight") {
        goToNext();
      }

      if (event.key === "+" || event.key === "=") {
        zoomIn();
      }

      if (event.key === "-" || event.key === "_") {
        zoomOut();
      }

      if (event.key === "0") {
        resetZoom();
      }
    };

    document.addEventListener("keydown", handleEscKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const preloadIndexes = [currentIndex + 1, currentIndex - 1]
      .map((idx) => (idx + totalImages) % totalImages)
      .filter((idx, i, arr) => arr.indexOf(idx) === i);

    preloadIndexes.forEach((idx) => {
      const src = images[idx];
      if (!src) return;
      const image = new Image();
      image.src = src;
      image.decoding = "async";
    });
  }, [currentIndex, images, isOpen, totalImages]);

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const delta = touchStartX - touchEndX;
    if (Math.abs(delta) >= SWIPE_THRESHOLD) {
      if (delta > 0) goToNext();
      if (delta < 0) goToPrevious();
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] bg-black" role="dialog" aria-modal="true">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-center justify-between px-4 py-3 md:px-6">
          <p className="text-xs uppercase tracking-[0.16em] text-white/70">Image detail view</p>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={zoomOut}
              className="h-8 w-8 rounded-none text-white hover:bg-white/10"
              aria-label="Zoom out"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={zoomIn}
              className="h-8 w-8 rounded-none text-white hover:bg-white/10"
              aria-label="Zoom in"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-none text-white hover:bg-white/10"
              aria-label="Close full screen image viewer"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="relative flex-1 px-2 pb-2 md:px-6 md:pb-4">
          {canNavigate && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={goToPrevious}
                className="absolute left-3 top-1/2 z-20 h-10 w-10 -translate-y-1/2 rounded-none bg-black/35 text-white hover:bg-black/55"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={goToNext}
                className="absolute right-3 top-1/2 z-20 h-10 w-10 -translate-y-1/2 rounded-none bg-black/35 text-white hover:bg-black/55"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}

          <div
            ref={containerRef}
            className="flex h-full w-full items-center justify-center overflow-auto"
            onTouchStart={(event) => setTouchStartX(event.touches[0].clientX)}
            onTouchMove={(event) => setTouchEndX(event.touches[0].clientX)}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={currentImage}
              alt={imageAlt}
              className="max-h-full max-w-full select-none object-contain transition-transform duration-200"
              style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
              loading="eager"
              fetchpriority="high"
              draggable={false}
            />
          </div>
        </div>

        {canNavigate && (
          <div className="border-t border-white/10 px-4 py-3 md:px-6">
            <div className="flex items-center gap-2 overflow-x-auto">
              {images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => {
                    setCurrentIndex(index);
                    setZoom(1);
                  }}
                  className={`h-14 w-14 shrink-0 overflow-hidden border ${
                    index === currentIndex ? "border-white" : "border-white/25"
                  }`}
                  aria-label={`Open image ${index + 1}`}
                >
                  <img
                    src={image}
                    alt={`${productName} thumbnail ${index + 1}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default ImageZoom;
