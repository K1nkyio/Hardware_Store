import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import ImageZoom from "./ImageZoom";
import ResponsiveImage from "@/components/common/ResponsiveImage";
import { placeholder } from "@/lib/homeImages";

interface ProductImageGalleryProps {
  imageUrl?: string;
  images?: string[];
  name: string;
}

const SWIPE_THRESHOLD = 45;

const ProductImageGallery = ({ imageUrl, images, name }: ProductImageGalleryProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const [loadedIndices, setLoadedIndices] = useState<Record<number, boolean>>({});
  const galleryRef = useRef<HTMLDivElement>(null);

  const productImages = useMemo(() => {
    const normalized = [...(images ?? []), imageUrl ?? ""]
      .map((value) => value.trim())
      .filter(Boolean);
    const unique = Array.from(new Set(normalized));
    return unique.length > 0 ? unique : [placeholder];
  }, [imageUrl, images]);

  const canNavigate = productImages.length > 1;

  useEffect(() => {
    setCurrentImageIndex(0);
    setLoadedIndices({});
  }, [productImages.join("|")]);

  useEffect(() => {
    const current = productImages[currentImageIndex];
    const next = productImages[(currentImageIndex + 1) % productImages.length];
    [current, next].forEach((src) => {
      if (!src) return;
      const image = new Image();
      image.src = src;
      image.decoding = "async";
    });
  }, [currentImageIndex, productImages]);

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  const nextImage = () => {
    if (!canNavigate) return;
    setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
  };

  const prevImage = () => {
    if (!canNavigate) return;
    setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const delta = touchStartX - touchEndX;
    if (Math.abs(delta) >= SWIPE_THRESHOLD) {
      if (delta > 0) nextImage();
      if (delta < 0) prevImage();
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  return (
    <div
      ref={galleryRef}
      className="w-full lg:sticky lg:top-6 lg:h-fit"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") prevImage();
        if (event.key === "ArrowRight") nextImage();
        if (event.key === "Enter") setIsZoomOpen(true);
      }}
      aria-label={`${name} image gallery`}
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[96px_1fr] lg:items-start">
        <div className="order-2 lg:order-1">
          <div className="flex gap-2 overflow-x-auto pb-1 lg:max-h-[640px] lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden">
            {productImages.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => goToImage(index)}
                className={`relative h-20 w-20 shrink-0 overflow-hidden border ${
                  index === currentImageIndex ? "border-foreground" : "border-border"
                }`}
                aria-label={`Select image ${index + 1}`}
              >
                <ResponsiveImage
                  src={image}
                  alt={`${name} thumbnail ${index + 1}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <div
            className="relative aspect-square overflow-hidden border border-border bg-muted/20"
            onTouchStart={(event) => setTouchStartX(event.touches[0].clientX)}
            onTouchMove={(event) => setTouchEndX(event.touches[0].clientX)}
            onTouchEnd={handleTouchEnd}
          >
            {!loadedIndices[currentImageIndex] && (
              <div className="absolute inset-0 animate-pulse bg-muted/35" />
            )}

            <button
              type="button"
              className="group h-full w-full cursor-zoom-in"
              onClick={() => setIsZoomOpen(true)}
              aria-label="Open full-screen image viewer"
            >
              <ResponsiveImage
                src={productImages[currentImageIndex]}
                alt={`${name} image ${currentImageIndex + 1} of ${productImages.length}`}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="eager"
                fetchPriority="high"
                sizes="(min-width: 1024px) 42vw, 100vw"
                onLoad={() => {
                  setLoadedIndices((prev) => ({ ...prev, [currentImageIndex]: true }));
                }}
              />
            </button>

            <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2">
              <span className="border border-border bg-background/90 px-2 py-1 text-[11px] uppercase tracking-[0.12em] text-foreground">
                Tap to zoom
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsZoomOpen(true)}
              className="absolute right-3 top-3 border border-border bg-background/90 p-2 text-foreground hover:bg-background"
              aria-label="Expand image"
            >
              <Expand className="h-4 w-4" />
            </button>

            {canNavigate && (
              <>
                <button
                  type="button"
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 z-10 -translate-y-1/2 border border-border bg-background/85 p-2 text-foreground hover:bg-background"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 z-10 -translate-y-1/2 border border-border bg-background/85 p-2 text-foreground hover:bg-background"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

          {canNavigate && (
            <div className="mt-3 flex items-center justify-center gap-2">
              {productImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToImage(index)}
                  className={`h-2.5 w-2.5 rounded-full transition-colors ${
                    index === currentImageIndex ? "bg-foreground" : "bg-muted"
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <ImageZoom
        images={productImages}
        initialIndex={currentImageIndex}
        isOpen={isZoomOpen}
        onClose={() => setIsZoomOpen(false)}
        productName={name}
      />
    </div>
  );
};

export default ProductImageGallery;
