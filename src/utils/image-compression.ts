/**
 * Image Compression Utility
 * 
 * Resizes images to max 800px width/height and converts to JPEG (quality 0.7)
 * to keep sync payload small (under 500KB).
 */

export async function compressImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const MAX_WIDTH = 800;
        const QUALITY = 0.7;
        const MAX_SIZE_BYTES = 500 * 1024; // 500KB

        if (!file.type.match(/image.*/)) {
            reject(new Error('File is not an image'));
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Resize logic
                if (width > MAX_WIDTH) {
                    height = Math.round((height * MAX_WIDTH) / width);
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Could not get canvas context'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                // Compress to JPEG
                const dataUrl = canvas.toDataURL('image/jpeg', QUALITY);

                // Check size
                // standard base64 size calculation: (bytes * 4/3)
                // approximate check is fine
                if (dataUrl.length * 0.75 > MAX_SIZE_BYTES) {
                    // If still too big, try aggressive compression
                    const aggressiveUrl = canvas.toDataURL('image/jpeg', 0.5);
                    if (aggressiveUrl.length * 0.75 > MAX_SIZE_BYTES) {
                        reject(new Error('Image is too large even after compression'));
                        return;
                    }
                    resolve(aggressiveUrl);
                    return;
                }

                resolve(dataUrl);
            };

            img.onerror = (err) => reject(err);
        };

        reader.onerror = (err) => reject(err);
    });
}
