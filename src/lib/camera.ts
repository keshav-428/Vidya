// ─────────────────────────────────────────────────────────────
//  One way to get a photo into Vidya.
//
//  On a phone (Capacitor) this opens the real camera; in a browser it
//  falls back to a file picker, so `npm run dev` keeps working.
//
//  Every screen that sends images to a vision endpoint goes through
//  here, so they all produce the same shape and the same size limits.
// ─────────────────────────────────────────────────────────────
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export interface CapturedImage {
  /** Raw base64, no `data:` prefix — what the backend vision endpoints expect. */
  b64: string;
  /** The image's real mime type. Mislabelling HEIC/PNG as JPEG makes Gemini reject it. */
  mime: string;
  /** Full data URL, for <img> previews. */
  url: string;
}

// Homework pages are text, not photographs: downscaling costs nothing in
// readability but a lot less in upload time on mobile data — and in tokens,
// since every one of these images is billed through a Gemini vision call.
const MAX_WIDTH = 1600;
const QUALITY = 85;

/** True when running inside the Android/iOS shell rather than a browser tab. */
export const isNative = (): boolean => Capacitor.isNativePlatform();

/** Reads a browser File → the same shape the native camera returns. */
export function readImageFile(file: File): Promise<CapturedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      const mime = url.slice(5, url.indexOf(';')) || file.type || 'image/jpeg';
      resolve({ b64: url.split(',')[1] || '', mime, url });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Browser fallback: a throwaway <input type="file"> so screens don't each
// have to carry a hidden input and a ref.
function pickFiles(multiple: boolean): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.multiple = multiple;
    input.style.display = 'none';
    // Resolve empty on cancel so callers can treat "no photo" as a no-op
    // rather than an error.
    input.addEventListener('cancel', () => { input.remove(); resolve([]); });
    input.addEventListener('change', () => {
      const files = Array.from(input.files || []);
      input.remove();
      resolve(files);
    });
    document.body.appendChild(input);
    input.click();
  });
}

/**
 * Opens the camera (or picker) and returns the photos taken.
 *
 * Returns an empty array when the student backs out — cancelling is not an
 * error, and screens should stay exactly as they were.
 *
 * `multiple` only applies on the web; the native camera takes one photo per
 * call, so screens that accept several pages call this once per page.
 */
export async function capturePhotos({ multiple = false } = {}): Promise<CapturedImage[]> {
  if (isNative()) {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Base64,
        // Prompt lets the student either shoot the page now or pick a photo
        // they already took — both are real cases for homework.
        source: CameraSource.Prompt,
        quality: QUALITY,
        width: MAX_WIDTH,
        correctOrientation: true,
      });
      const b64 = photo.base64String || '';
      if (!b64) return [];
      const mime = `image/${photo.format || 'jpeg'}`;
      return [{ b64, mime, url: `data:${mime};base64,${b64}` }];
    } catch {
      // getPhoto throws on cancel as well as on failure; either way there is
      // no photo, and the screen should simply carry on.
      return [];
    }
  }

  const files = await pickFiles(multiple);
  return Promise.all(files.map(readImageFile));
}
