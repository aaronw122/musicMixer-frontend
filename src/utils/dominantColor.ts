/** Default fallback color when extraction fails (dark navy) */
const DEFAULT_COLOR = '#1a1a2e';

/** Size of the offscreen canvas used for sampling (small for speed) */
const SAMPLE_SIZE = 50;

/**
 * Extract the dominant color from an image URL by averaging pixel values.
 *
 * Loads the image onto a small offscreen canvas and computes the average
 * RGB color across all non-transparent pixels. Returns a hex string.
 *
 * Handles CORS errors gracefully by returning the default color.
 *
 * @param imageUrl - URL of the image to sample
 * @returns Hex color string (e.g., "#7A3B2E")
 */
export function extractDominantColor(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = SAMPLE_SIZE;
        canvas.height = SAMPLE_SIZE;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(DEFAULT_COLOR);
          return;
        }

        ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

        let data: ImageData;
        try {
          data = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
        } catch {
          // Canvas tainted by CORS — return fallback
          resolve(DEFAULT_COLOR);
          return;
        }

        const pixels = data.data;
        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;

        for (let i = 0; i < pixels.length; i += 4) {
          const alpha = pixels[i + 3];
          // Skip fully transparent pixels
          if (alpha < 10) continue;

          r += pixels[i];
          g += pixels[i + 1];
          b += pixels[i + 2];
          count++;
        }

        if (count === 0) {
          resolve(DEFAULT_COLOR);
          return;
        }

        const avgR = Math.round(r / count);
        const avgG = Math.round(g / count);
        const avgB = Math.round(b / count);

        const hex =
          '#' +
          avgR.toString(16).padStart(2, '0') +
          avgG.toString(16).padStart(2, '0') +
          avgB.toString(16).padStart(2, '0');

        resolve(hex);
      } catch {
        resolve(DEFAULT_COLOR);
      }
    };

    img.onerror = () => {
      resolve(DEFAULT_COLOR);
    };

    img.src = imageUrl;
  });
}
