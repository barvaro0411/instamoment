import { useState, useRef } from 'react';
import { useFirebase } from '../hooks/useFirebase';
import { FilterSelector } from './FilterSelector';
import { type VintageFilter, vintageFilters } from '../lib/filters';
import { renderFIMOToCanvas } from '../lib/fimoEngine';
import { FIMOCanvasPreview } from './FIMOCanvasPreview';
import './Camera.css';

interface CameraProps {
    eventId: string;
    onUploadSuccess?: () => void;
}

export const Camera = ({ eventId, onUploadSuccess }: CameraProps) => {
    // Hooks
    // isLoading from hook covers the upload/save process
    const { uploadPhoto, isLoading: isUploadLoading } = useFirebase();

    // State
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [selectedFilter, setSelectedFilter] = useState<VintageFilter>(vintageFilters[0]);
    // Local processing state (rendering engine)
    const [isRendering, setIsRendering] = useState(false);

    // Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Auth context
    const authorName = localStorage.getItem('guestNickname') || 'Guest';

    const handleNativeCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsRendering(true);

        try {
            // Create an image from the file to get the correctly oriented version
            const url = URL.createObjectURL(file);
            const img = new Image();

            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = reject;
                img.src = url;
            });

            // Create canvas and draw the image
            // Modern browsers auto-correct EXIF orientation when drawing to canvas
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;

            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Draw the image - browser handles EXIF orientation
                ctx.drawImage(img, 0, 0);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
                setPreviewImage(dataUrl);
            }

            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Image load error:', error);
            // Fallback to direct FileReader
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        } finally {
            setIsRendering(false);
        }

        // Reset input
        e.target.value = '';
    };

    const handleRetake = () => {
        setPreviewImage(null);
        setIsRendering(false);
    };

    const handleSave = async () => {
        if (!previewImage || !canvasRef.current || isRendering || isUploadLoading) return;

        setIsRendering(true);
        const img = new Image();
        img.src = previewImage;
        img.crossOrigin = 'anonymous';

        img.onload = async () => {
            if (!canvasRef.current) return;
            const canvas = canvasRef.current;

            try {
                // Get timestamp format
                const now = new Date();
                const yy = now.getFullYear().toString().slice(-2);
                const mm = (now.getMonth() + 1).toString().padStart(2, '0');
                const dd = now.getDate().toString().padStart(2, '0');
                const timestamp = `${yy} ${mm} ${dd}`;

                // Determine caption
                const caption = selectedFilter.id === 'aesthetic400' ? 'FIMO' : undefined;

                // Render using the engine
                await renderFIMOToCanvas(
                    previewImage,
                    canvas,
                    {
                        filterId: selectedFilter.id as any, // Cast to FilterId
                        timestamp,
                        caption,
                        seed: Date.now(),
                        outputScale: 1
                    }
                );

                // Export as Data URL (useFirebase expects string)
                const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

                // Upload (this handles Firestore metadata too)
                const success = await uploadPhoto(dataUrl, authorName, selectedFilter.id, eventId);

                if (success) {
                    if (onUploadSuccess) onUploadSuccess();
                    setPreviewImage(null);
                } else {
                    alert("Error al guardar la foto.");
                }

            } catch (error) {
                console.error("Error saving photo:", error);
                alert("Error al guardar la foto. Intenta de nuevo.");
            } finally {
                setIsRendering(false);
            }
        };
    };

    const isBusy = isRendering || isUploadLoading;

    // --- RENDER ---

    // Prepare values for preview and save
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mm = (now.getMonth() + 1).toString().padStart(2, '0');
    const dd = now.getDate().toString().padStart(2, '0');
    const timestamp = `${yy} ${mm} ${dd}`;
    const caption = selectedFilter.id === 'aesthetic400' ? 'FIMO' : undefined;

    // VIEW 1: PREVIEW / EDIT MODE
    if (previewImage) {
        return (
            <div className="camera-container edit-mode">
                <div className="preview-container">
                    <FIMOCanvasPreview
                        src={previewImage}
                        filterId={selectedFilter.id as any}
                        timestamp={timestamp}
                        caption={caption}
                        className="preview-image"
                    />
                </div>

                {/* Filter Selector in Edit Mode */}
                <div className="edit-controls">
                    <FilterSelector
                        selectedFilter={selectedFilter.id}
                        onFilterChange={setSelectedFilter}
                    />

                    <div className="action-buttons">
                        <button className="retake-btn" onClick={handleRetake} disabled={isBusy}>
                            ❌ Descartar
                        </button>
                        <button className="save-btn" onClick={handleSave} disabled={isBusy}>
                            {isBusy ? 'Procesando...' : '✅ Guardar'}
                        </button>
                    </div>
                </div>

                {/* Hidden canvas for processing */}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
        );
    }

    // VIEW 2: CAPTURE MODE (Native Only)
    return (
        <div className="camera-container capture-mode">
            {/* Elegant Static Background */}
            <div className="static-background">
                <div className="brand-text">
                    <h2>InstaMoment</h2>
                    <p>Captura el momento</p>
                </div>
            </div>

            {/* Controls */}
            <div className="camera-controls native-first">
                {/* Secondary Left (Empty/Placeholder) */}
                <div className="secondary-controls left"></div>

                {/* Primary Native Shutter */}
                <div className="primary-shutter-container">
                    <label
                        htmlFor="native-camera-input"
                        className="native-shutter-btn"
                        title="Tomar Foto"
                    >
                        <div className="shutter-icon">📸</div>
                    </label>
                    <span className="shutter-label">TOCA PARA FOTO</span>
                </div>

                {/* Secondary Right (Placeholder) */}
                <div className="secondary-controls right">
                </div>
            </div>

            {/* Hidden Input */}
            <input
                id="native-camera-input"
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={handleNativeCapture}
            />

            {/* Loading Overlay */}
            {isBusy && (
                <div className="loading-overlay">
                    <div className="loading-spinner"></div>
                    <span>Procesando...</span>
                </div>
            )}
        </div>
    );
};
