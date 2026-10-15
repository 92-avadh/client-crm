/**
 * Image helpers for team avatars.
 *
 * Validates type/size and downscales to a max dimension before returning a
 * data URL, so uploads stay small enough to store on the user record.
 */

const MAX_DIMENSION = 400;
const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

export interface ProcessResult {
  ok: boolean;
  error?: string;
  dataUrl?: string;
}

export function processImageFile(file: File): Promise<ProcessResult> {
  return new Promise((resolve) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ACCEPTED_TYPES.includes(file.type) && !ACCEPTED_EXTENSIONS.includes(ext)) {
      resolve({ ok: false, error: 'Please select a valid image file (JPG, PNG or WebP)' });
      return;
    }
    if (file.size > MAX_BYTES) {
      resolve({ ok: false, error: `Photo size must be less than ${Math.round(MAX_BYTES / 1024 / 1024)}MB` });
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => resolve({ ok: false, error: 'Could not read that file. Please try another.' });
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => resolve({ ok: false, error: 'That image could not be opened.' });
      img.onload = () => {
        let w = img.width;
        let h = img.height;

        if (w > h) {
          if (w > MAX_DIMENSION) {
            h = Math.round((h * MAX_DIMENSION) / w);
            w = MAX_DIMENSION;
          }
        } else if (h > MAX_DIMENSION) {
          w = Math.round((w * MAX_DIMENSION) / h);
          h = MAX_DIMENSION;
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ ok: false, error: 'Image processing is not supported in this browser.' });
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve({ ok: true, dataUrl: canvas.toDataURL('image/jpeg', 0.88) });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/** Random password for new team members. */
export function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
