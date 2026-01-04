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

            // 1. Frame & Dimensions Logic (Polaroid)
            let paddingX = 0;
            let paddingY = 0;

            const isPolaroid = selectedFilter.frameType === 'polaroid';

            if (isPolaroid) {
                // Polaroid Frame: white borders with extra space at bottom
                // Logic based on FIMO aspect ratio
                const borderSide = img.width * 0.08;
                const borderTop = img.width * 0.08;
                const borderBottom = img.width * 0.25;

                const newWidth = img.width + (borderSide * 2);
                const newHeight = img.height + borderTop + borderBottom;

                canvas.width = newWidth;
                canvas.height = newHeight;

                // Fill Polaroid Background (#fafafa per spec)
                ctx.fillStyle = '#fafafa';
                ctx.fillRect(0, 0, newWidth, newHeight);

                // Add subtle shadow to inner photo? Optional, but adds depth
                ctx.fillStyle = 'rgba(0,0,0,0.05)';
                ctx.fillRect(borderSide, borderTop, img.width, img.height);

                paddingX = borderSide;
                paddingY = borderTop;
            } else {
                canvas.width = img.width;
                canvas.height = img.height;
            }

            // 2. Draw Image with Filter
            // Save context to apply filter only to image area
            ctx.save();
            ctx.filter = selectedFilter.cssFilter;
            ctx.drawImage(img, paddingX, paddingY, img.width, img.height);
            ctx.restore();

            // 3. Effects (Grain & Light Leak)

            // A) Film Grain (Simulated with noise pattern)
            if (selectedFilter.hasGrain) {
                // Generate a simple noise pattern on the fly
                ctx.save();
                ctx.globalAlpha = 0.15; // Subtle grain
                ctx.globalCompositeOperation = 'overlay';

                // Draw random noise points
                for (let i = 0; i < canvas.width; i += 4) {
                    for (let j = 0; j < canvas.height; j += 4) {
                        if (Math.random() > 0.5) {
                            ctx.fillStyle = Math.random() > 0.5 ? '#000' : '#fff';
                            ctx.fillRect(i, j, 2, 2);
                        }
                    }
                }
                ctx.restore();
            }

            // B) Light Leak (Radial Gradient)
            if (selectedFilter.lightLeak) {
                ctx.save();
                ctx.globalCompositeOperation = 'screen';
                // Top Right Red/Orange Leak
                const gradient = ctx.createRadialGradient(
                    canvas.width, 0, 0,
                    canvas.width, 0, canvas.width * 0.6
                );
                gradient.addColorStop(0, 'rgba(255,180,100,0.4)');
                gradient.addColorStop(0.6, 'transparent');

                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.restore();
            }

            // C) Vignette (if in overlayGradient)
            // Just applying a standard vignette for EK80 if needed, or rely on CSS filter
            // But let's add the overlayGradient from definition if it exists
            if (selectedFilter.overlayGradient && !selectedFilter.overlayGradient.includes('linear')) {
                // Trying to parse complex CSS gradients is hard in Canvas. 
                // For EK80, let's add a manual Vignette:
                if (selectedFilter.id === 'ek80') {
                    ctx.save();
                    const vig = ctx.createRadialGradient(
                        canvas.width / 2, canvas.height / 2, canvas.width * 0.3,
                        canvas.width / 2, canvas.height / 2, canvas.width * 0.8
                    );
                    vig.addColorStop(0, 'transparent');
                    vig.addColorStop(1, 'rgba(20,10,0,0.3)');
                    ctx.fillStyle = vig;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.restore();
                }
            }

            // 4. Date Stamp & Text
            if (selectedFilter.hasDateStamp) {
                const now = new Date();
                const yy = now.getFullYear().toString().slice(-2);
                const mm = (now.getMonth() + 1).toString().padStart(2, '0');
                const dd = now.getDate().toString().padStart(2, '0');

                // Format: 'YY MM DD
                const dateText = `'${yy} ${mm} ${dd}`;

                let fontSize = Math.max(20, img.width * 0.035);

                ctx.save();

                if (selectedFilter.datePosition === 'top-center') {
                    // Aesthetic 400 (Polaroid Date)
                    ctx.font = `600 ${fontSize}px "Courier New", monospace`;
                    ctx.fillStyle = selectedFilter.dateColor || '#1a1a1a';
                    ctx.textAlign = 'center';
                    // Letter spacing simulation
                    // Canvas doesn't support letter-spacing natively well, simplified:
                    const dateX = canvas.width / 2;
                    const dateY = paddingY / 1.6;
                    ctx.fillText(dateText, dateX, dateY);

                    // Aesthetic 400 Caption "FIMO"
                    if (isPolaroid) {
                        // Fallback font since we might not have Caveat
                        ctx.font = `italic ${fontSize * 1.5}px "Brush Script MT", "Segoe UI", serif`;
                        ctx.fillStyle = '#2a2a2a';
                        ctx.globalAlpha = 0.7;
                        ctx.textAlign = 'center';
                        ctx.fillText("FIMO", canvas.width / 2, canvas.height - (img.height * 0.1));
                    }

                } else if (selectedFilter.datePosition === 'bottom-left') {
                    // EK 80 Style (Orange, Bottom Left)
                    ctx.font = `bold ${fontSize}px "Courier New", monospace`;
                    ctx.fillStyle = selectedFilter.dateColor || '#FF9500';
                    ctx.shadowColor = 'rgba(0,0,0,0.4)';
                    ctx.shadowBlur = 2;
                    ctx.shadowOffsetX = 1;
                    ctx.shadowOffsetY = 1;

                    const pad = img.width * 0.04;
                    ctx.textAlign = 'left';
                    ctx.fillText(dateText, pad, canvas.height - pad);
                } else {
                    // Default Bottom Right
                    ctx.font = `bold ${fontSize}px "Courier New", monospace`;
                    ctx.fillStyle = selectedFilter.dateColor || '#FF9500';
                    const pad = img.width * 0.05;
                    ctx.textAlign = 'right';
                    ctx.fillText(dateText, canvas.width - pad, canvas.height - pad);
                }
                ctx.restore();
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
