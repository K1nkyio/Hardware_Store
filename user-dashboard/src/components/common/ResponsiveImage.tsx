import type { ImgHTMLAttributes } from "react";
import { placeholder } from "@/lib/homeImages";

type ResponsiveImageProps = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  loading?: "lazy" | "eager";
  fetchPriority?: "auto" | "high" | "low";
  onLoad?: ImgHTMLAttributes<HTMLImageElement>["onLoad"];
  onError?: ImgHTMLAttributes<HTMLImageElement>["onError"];
};

const ResponsiveImage = ({
  src,
  alt,
  className,
  sizes,
  loading = "lazy",
  fetchPriority = "auto",
  onLoad,
  onError,
}: ResponsiveImageProps) => {
  const priorityProps = {
    fetchpriority: fetchPriority,
  } as ImgHTMLAttributes<HTMLImageElement> & { fetchpriority?: "auto" | "high" | "low" };

  if (!src) {
    return (
      <img
        src={placeholder}
        alt={alt}
        className={className}
        loading={loading}
        decoding="async"
        onLoad={onLoad}
        onError={onError}
        {...priorityProps}
      />
    );
  }

  return (
    <img
      src={src}
      sizes={sizes}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      onLoad={onLoad}
      {...priorityProps}
      onError={(event) => {
        const target = event.currentTarget;
        if (target.src.endsWith("/placeholder.svg")) {
          onError?.(event);
          return;
        }
        target.src = placeholder;
        onError?.(event);
      }}
    />
  );
};

export default ResponsiveImage;
