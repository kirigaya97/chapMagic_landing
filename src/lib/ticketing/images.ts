import type { ImageMetadata } from "astro";

/**
 * Show image lookup, in one place.
 *
 * Pages that resolve images on their own drift apart: one matches by file name,
 * another by path suffix, and the day the folder layout changes one of them
 * silently stops finding posters. No error, no gap, just a card without image.
 */
const files = import.meta.glob<{ default: ImageMetadata }>(
  "../../assets/ticketing/**/*.{jpg,jpeg,png,webp}",
  { eager: true },
);

/** Finds an image by its path inside `src/assets/ticketing/` (or by suffix). */
export function showImage(path: string | undefined | null): ImageMetadata | undefined {
  if (!path) return undefined;
  const wanted = path.replace(/^\/+/, "");
  return Object.entries(files).find(([p]) => p.endsWith(`/${wanted}`))?.[1].default;
}

/**
 * Widths to generate, never above the original. Atrapalo photos are 880px and
 * posters 300px: asking Astro for more only makes files bigger and blurrier.
 */
export function widthsFor(img: ImageMetadata | undefined, wanted: number[]): number[] {
  if (!img) return wanted;
  return [...wanted.filter((w) => w < img.width), img.width];
}
