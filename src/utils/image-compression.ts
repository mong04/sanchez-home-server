
/**
 * Compresses an image file to a Base64 string under a specific size limit (default 100KB).
 * Resizes to max 300x300px and converts to WebP/JPEG with quality adjustment.
 */
export async function compressImage(file: File, maxSizeKB = 100): Promise<string> {
    const MAX_WIDTH = 300;
    const MAX_HEIGHT = 300;

    // Helper to read file as data URL
    const readFileAsDataURL = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    // Helper to load image
    const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    };

    const originalDataUrl = await readFileAsDataURL(file);
    const img = await loadImage(originalDataUrl);

    // Calculate new dimensions
    let width = img.width;
    let height = img.height;

    if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('Could not get canvas context');

    ctx.drawImage(img, 0, 0, width, height);

    // Iterative compression
    let quality = 0.9;
    let result = canvas.toDataURL('image/webp', quality);

    // Fallback to jpeg if webp is not supported or larger (though webp usually smaller)
    if (result.length > maxSizeKB * 1024 * 1.33) { // Base64 is ~33% larger than binary
        result = canvas.toDataURL('image/jpeg', quality);
    }

    while (result.length > maxSizeKB * 1024 * 1.33 && quality > 0.1) {
        quality -= 0.1;
        result = canvas.toDataURL('image/webp', quality);
    }

    return result;
}
