import { useState, useRef } from 'react';
import { useFirebase } from '../hooks/useFirebase';
import { FilterSelector } from './FilterSelector';
import { vintageFilters, type VintageFilter } from '../lib/filters';
import './Camera.css';

interface CameraProps {
    eventId: string;
    authorName: string;
    onPhotoTaken?: () => void;
}

export const Camera = ({ eventId, authorName, onPhotoTaken }: CameraProps) => {
    // State
    const [selectedFilter, setSelectedFilter] = useState<VintageFilter>(vintageFilters[0]);
    const [previewImage, setPreviewImage] = useState<string | null>(null); // Raw image from camera
    const [photoCount, setPhotoCount] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    // Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Hooks
    const { uploadPhoto, isLoading } = useFirebase();

    // 1. Handle Native Capture (Input Change)
    const handleNativeCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);

        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                // Set preview to show Edit Mode
                setPreviewImage(event.target.result as string);
                setIsProcessing(false);
            }
        };
        reader.readAsDataURL(file);

        // Reset input to allow retaking same photo
        e.target.value = '';
    };

    // 2. Handle Save & Upload (Apply Filter)
    const handleSave = async () => {
        if (!previewImage || !canvasRef.current) return;

        setIsProcessing(true);

        const img = new Image();
        img.onload = async () => {
            if (!canvasRef.current) return;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // 1. Frame & Dimensions Logic
            let renderWidth = img.width;
            let renderHeight = img.height;
            let paddingX = 0;
            let paddingY = 0;

            const isPolaroid = selectedFilter.frameType === 'polaroid';

            if (isPolaroid) {
                // Add white border (approx 10% side, 15% top/bottom)
                const borderRatio = 0.1;
                const bottomRatio = 0.25; // More space at bottom for text

                const newWidth = img.width * (1 + borderRatio * 2);
                const newHeight = img.height + (img.height * borderRatio) + (img.height * bottomRatio);

                canvas.width = newWidth;
                canvas.height = newHeight;

                // Fill white background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, newWidth, newHeight);

                // Calculate position to center image
                paddingX = img.width * borderRatio;
                paddingY = img.height * borderRatio;
            } else {
                canvas.width = img.width;
                canvas.height = img.height;
            }

            // 2. Draw Image (with Filter)
            ctx.filter = selectedFilter.cssFilter;
            ctx.drawImage(img, paddingX, paddingY, renderWidth, renderHeight);
            ctx.filter = 'none';

            // 3. Draw Date Stamp
            if (selectedFilter.hasDateStamp) {
                const now = new Date();
                const yy = now.getFullYear().toString().slice(-2);
                const mm = (now.getMonth() + 1).toString().padStart(2, '0');
                const dd = now.getDate().toString().padStart(2, '0');

                // Dazz uses strict monospace grouping: 'YY MM DD
                const dateText = `'${yy} ${mm} ${dd}`;

                // Positioning logic
                let fontSize = Math.max(24, img.width * 0.035);
                let x = 0;
                let y = 0;

                ctx.font = `bold ${fontSize}px "Courier New", monospace`;
                ctx.fillStyle = selectedFilter.dateColor || '#ff9500';

                if (selectedFilter.datePosition === 'top-center') {
                    // Aesthetic 400 style (on the white frame top)
                    ctx.fillStyle = '#000'; // Always black for this style
                    ctx.shadowBlur = 0;
                    x = (canvas.width - ctx.measureText(dateText).width) / 2;
                    y = paddingY / 1.5; // Centered in top border
                } else {
                    // EK 80 style (Bottom Right, glowing)
                    ctx.shadowColor = 'rgba(0,0,0,0.5)';
                    ctx.shadowBlur = 4;
                    const sidePad = img.width * 0.05;
                    const botPad = img.width * 0.05;
                    x = canvas.width - ctx.measureText(dateText).width - sidePad;
                    y = canvas.height - botPad;
                }

                ctx.fillText(dateText, x, y);

                // Extra Text for Aesthetic 400 (Handwritten "AES 400")
                if (isPolaroid) {
                    ctx.font = `italic ${fontSize * 0.8}px "Segoe UI", sans-serif`; // Placeholder for handwriting
                    ctx.fillStyle = '#555';
                    ctx.shadowBlur = 0;
                    ctx.fillText("AES 400", paddingX, canvas.height - (img.height * 0.1));
                }
            }

            // Get Data URL
            const finalPhotoData = canvas.toDataURL('image/jpeg', 0.85);

            // Upload
            const success = await uploadPhoto(finalPhotoData, authorName, selectedFilter.id, eventId);

            if (success) {
                setPhotoCount(prev => prev + 1);
                onPhotoTaken?.();
                setPreviewImage(null); // Return to capture mode
            }
            setIsProcessing(false);
        };
        img.src = previewImage;
    };

    // 3. Handle Cancel/Retake
    const handleRetake = () => {
        setPreviewImage(null);
        setIsProcessing(false);
    };

    // --- RENDER ---

    // VIEW 1: PREVIEW / EDIT MODE
    if (previewImage) {
        return (
            <div className="camera-container edit-mode">
                <div className="preview-container">
                    <img
                        src={previewImage}
                        alt="Vista previa"
                        style={{ filter: selectedFilter.cssFilter }}
                        className="preview-image"
                    />
                    {/* Gradient Overlay Preview */}
                    {selectedFilter.overlayGradient && (
                        <div
                            className="filter-overlay"
                            style={{ background: selectedFilter.overlayGradient }}
                        />
                    )}
                </div>

                {/* Filter Selector in Edit Mode */}
                <div className="edit-controls">
                    <FilterSelector
                        selectedFilter={selectedFilter.id}
                        onFilterChange={setSelectedFilter}
                    />

                    <div className="action-buttons">
                        <button className="retake-btn" onClick={handleRetake} disabled={isLoading || isProcessing}>
                            ❌ Descartar
                        </button>
                        <button className="save-btn" onClick={handleSave} disabled={isLoading || isProcessing}>
                            {isLoading || isProcessing ? 'Subiendo...' : '✅ Guardar'}
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

                {/* Secondary Right (Count) */}
                <div className="secondary-controls right">
                    <div className="photo-counter">
                        <span className="count">{photoCount}</span>
                        <span className="label">fotos</span>
                    </div>
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
            {isProcessing && (
                <div className="loading-overlay">
                    <div className="loading-spinner"></div>
                    <span>Procesando...</span>
                </div>
            )}
        </div>
    );
};
