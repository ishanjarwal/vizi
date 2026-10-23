"use client";

import { useEffect, useState } from "react";

export function useImageLoader(src: string): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!src) return;

    let isCancelled = false;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = src;

    const handleLoad = () => {
      if (!isCancelled) {
        setImage(img);
      }
    };

    img.addEventListener("load", handleLoad);
    return () => {
      isCancelled = true;
      img.removeEventListener("load", handleLoad);
    };
  }, [src]);

  return src ? image : null;
}
