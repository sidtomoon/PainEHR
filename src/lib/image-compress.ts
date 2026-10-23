/**
 * Fast client-side image compression using HTML5 Canvas.
 * Resizes large smartphone camera photos (5-15MB) to max 1600px dimension
 * and ~80% JPEG quality, dropping file size to ~150-280KB in <100ms.
 * This prevents Vercel serverless payload limits (4.5MB) and speeds up AI upload 20-40x.
 */

export interface CompressedImage {
  base64: string;
  dataUrl: string;
  mediaType: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  isPdf?: boolean;
}

export async function compressImage(
  file: File,
  maxDimension = 1600,
  quality = 0.82
): Promise<CompressedImage> {
  const isPdf =
    file.type === 'application/pdf' ||
    file.name?.toLowerCase().endsWith('.pdf');

  if (isPdf) {
    if (typeof window === 'undefined') {
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      return {
        base64,
        dataUrl: `data:application/pdf;base64,${base64}`,
        mediaType: 'application/pdf',
        originalSize: file.size,
        compressedSize: file.size,
        width: 0,
        height: 0,
        isPdf: true,
      };
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read PDF file'));
      reader.onload = (e) => {
        const src = e.target?.result as string;
        const base64 = src.includes(',') ? src.split(',')[1] : src;
        resolve({
          base64,
          dataUrl: src,
          mediaType: 'application/pdf',
          originalSize: file.size,
          compressedSize: file.size,
          width: 0,
          height: 0,
          isPdf: true,
        });
      };
      reader.readAsDataURL(file);
    });
  }

  // If not in a browser environment, return basic fallback
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mediaType = file.type || 'image/jpeg';
    return {
      base64,
      dataUrl: `data:${mediaType};base64,${base64}`,
      mediaType,
      originalSize: file.size,
      compressedSize: file.size,
      width: 0,
      height: 0,
    };
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onerror = () => {
        // Fallback: return raw dataUrl if decoding fails
        const base64 = src.includes(',') ? src.split(',')[1] : src;
        resolve({
          base64,
          dataUrl: src,
          mediaType: file.type || 'image/jpeg',
          originalSize: file.size,
          compressedSize: file.size,
          width: 0,
          height: 0,
        });
      };

      img.onload = () => {
        try {
          let { width, height } = img;

          // Resize while preserving aspect ratio
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Canvas 2D context unavailable');
          }

          // Draw image
          ctx.drawImage(img, 0, 0, width, height);

          // Export as compressed JPEG
          const outputMediaType = 'image/jpeg';
          const dataUrl = canvas.toDataURL(outputMediaType, quality);
          const base64 = dataUrl.split(',')[1];
          const compressedSize = Math.round((base64.length * 3) / 4);

          resolve({
            base64,
            dataUrl,
            mediaType: outputMediaType,
            originalSize: file.size,
            compressedSize,
            width,
            height,
          });
        } catch (err) {
          // Fallback to raw if canvas fails
          const base64 = src.includes(',') ? src.split(',')[1] : src;
          resolve({
            base64,
            dataUrl: src,
            mediaType: file.type || 'image/jpeg',
            originalSize: file.size,
            compressedSize: file.size,
            width: img.width || 0,
            height: img.height || 0,
          });
        }
      };

      img.src = src;
    };

    reader.readAsDataURL(file);
  });
}
