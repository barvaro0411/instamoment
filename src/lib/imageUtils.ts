// Utility to fix image orientation from EXIF data
export async function fixImageOrientation(file: File): Promise<string> {
    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    resolve(e.target?.result as string);
                    return;
                }

                // Set canvas size to image size
                canvas.width = img.width;
                canvas.height = img.height;

                // Draw image without any rotation
                // The browser should handle EXIF orientation automatically in modern browsers
                ctx.drawImage(img, 0, 0);

                // Convert to data URL
                resolve(canvas.toDataURL('image/jpeg', 0.95));
            };

            img.src = e.target?.result as string;
        };

        reader.readAsDataURL(file);
    });
}

// Alternative: Reset EXIF orientation
export function createImageBitmap(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const blob = await fetch(e.target?.result as string).then(r => r.blob());
                const imageBitmap = await window.createImageBitmap(blob, {
                    imageOrientation: 'from-image' // Respect EXIF but normalize
                });

                const canvas = document.createElement('canvas');
                canvas.width = imageBitmap.width;
                canvas.height = imageBitmap.height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('No canvas context'));
                    return;
                }

                ctx.drawImage(imageBitmap, 0, 0);
                resolve(canvas.toDataURL('image/jpeg', 0.95));
            } catch (error) {
                // Fallback to simple read
                resolve(e.target?.result as string);
            }
        };

        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
