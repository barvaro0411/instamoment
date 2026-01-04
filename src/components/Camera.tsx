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

            // 1. Frame Logic (Polaroid matches user CSS: 35px 28px 70px 28px)
            let paddingX = 0;
            let paddingY = 0;
            const isPolaroid = selectedFilter.frameType === 'polaroid';

            if (isPolaroid) {
                // Scale padding based on image width to maintain proportions
                // Base: 500px width -> 28px padding side. Ratio approx 0.056
                const sidePad = img.width * 0.056;
                const topPad = img.width * 0.07; // 35px is slightly more than 28px
                const bottomPad = img.width * 0.14; // 70px is double top

                const newWidth = img.width + (sidePad * 2);
                const newHeight = img.height + topPad + bottomPad;

                canvas.width = newWidth;
                canvas.height = newHeight;

                // Fill Background (#f8f8f8)
                ctx.fillStyle = '#f8f8f8';
                ctx.fillRect(0, 0, newWidth, newHeight);

                paddingX = sidePad;
                paddingY = topPad;
            } else {
                canvas.width = img.width;
                canvas.height = img.height;
            }

            // 2. Draw Base Image with CSS Filter
            ctx.save();
            ctx.filter = selectedFilter.cssFilter;
            ctx.drawImage(img, paddingX, paddingY, img.width, img.height);
            ctx.restore();

            // 3. Color Overlay (Blending)
            if (selectedFilter.colorOverlay) {
                ctx.save();
                // Translate CSS blend modes to Canvas globalCompositeOperation
                // 'lighten' -> 'lighten', 'overlay' -> 'overlay'
                ctx.globalCompositeOperation = selectedFilter.colorOverlay.blendMode as GlobalCompositeOperation;
                ctx.globalAlpha = selectedFilter.colorOverlay.opacity;
                ctx.fillStyle = selectedFilter.colorOverlay.color;
                ctx.fillRect(paddingX, paddingY, img.width, img.height);
                ctx.restore();
            }

            // 4. Vignette Overlay
            if (selectedFilter.vignetteOverlay) {
                ctx.save();
                // EK80: Radial
                if (selectedFilter.id === 'ek80') {
                    // radial-gradient(ellipse at center, transparent 45%, rgba(40,30,20,0.25) 100%)
                    const gradient = ctx.createRadialGradient(
                        canvas.width / 2, canvas.height / 2, canvas.width * 0.3, // Start expanding at 30% to hit 45% visual transparency
                        canvas.width / 2, canvas.height / 2, canvas.width * 0.707
                    );
                    gradient.addColorStop(0.45, 'transparent');
                    gradient.addColorStop(1, 'rgba(40,30,20,0.25)');

                    ctx.fillStyle = gradient;
                    ctx.fillRect(0, 0, canvas.width, canvas.height); // Vignette covers whole canvas? Usually just photo. User CSS says "inset: 0" on relative container.
                    // If frameType is none, canvas=img. If polaroid, we usually only vignette the photo.
                    // But in user component, vignette is inside 'imageContent' div, so it covers image area.
                }
                // Aesthetic 400: Linear
                else if (selectedFilter.id === 'aesthetic400') {
                    // linear-gradient(180deg, rgba(255,255,250,0.05) 0%, transparent 100%)
                    const gradient = ctx.createLinearGradient(0, paddingY, 0, paddingY + img.height);
                    gradient.addColorStop(0, 'rgba(255,255,250,0.05)');
                    gradient.addColorStop(1, 'transparent');

                    ctx.fillStyle = gradient;
                    ctx.fillRect(paddingX, paddingY, img.width, img.height);
                }
                ctx.restore();
            }

            // 5. Film Grain (Noise)
            // User used SVG noise. We will stick to procedural noise but match opacity 0.08 & overlay
            ctx.save();
            ctx.globalCompositeOperation = 'overlay';
            ctx.globalAlpha = 0.08;

            // To emulate "fractalNoise", we can use slightly larger blocks or just dense noise
            // For performance on mobile, we can generate a smaller pattern and repeat, or draw raw.
            // Let's draw raw but skip pixels to be fast.
            const grainSize = Math.max(1, img.width * 0.002); // Small neat grain
            for (let i = 0; i < canvas.width; i += grainSize * 2) {
                for (let j = 0; j < canvas.height; j += grainSize * 2) {
                    if (Math.random() > 0.5) {
                        ctx.fillStyle = '#000'; // Dark grain for overlay
                        ctx.fillRect(i, j, grainSize, grainSize);
                    }
                }
            }
            ctx.restore();


            // 6. Date Stamp & Text
            if (selectedFilter.hasDateStamp) {
                const now = new Date();
                const yy = now.getFullYear().toString().slice(-2);
                const mm = (now.getMonth() + 1).toString().padStart(2, '0');
                const dd = now.getDate().toString().padStart(2, '0');

                // User format logic check. EK80: ' 24 07 14 (with quote). Polaroid: 24 07 14 (clean)

                ctx.save();

                if (selectedFilter.datePosition === 'top-center') {
                    // aesthetic400 / Polaroid
                    const dateText = `${yy} ${mm} ${dd}`;
                    // Font: Courier New, 13px (relative scaling needed)
                    // 13px on 500px width = 0.026 ratio
                    const fontSize = Math.max(12, img.width * 0.035); // Bumped slightly for readability

                    ctx.font = `600 ${fontSize}px "Courier New", monospace`;
                    ctx.fillStyle = selectedFilter.dateColor || '#1a1a1a';
                    ctx.textAlign = 'center';
                    // Letter spacing simulation
                    const dateX = canvas.width / 2;
                    // Top is '8px' in CSS. 8/500 = 0.016.
                    const dateY = paddingY * 0.6; // In the top whitespace

                    ctx.fillText(dateText, dateX, dateY);

                    // Caption "FIMO" (Using Caveat)
                    if (isPolaroid) {
                        // 22px on 500px = 0.044
                        const captionSize = Math.max(20, img.width * 0.05);
                        ctx.font = `${captionSize}px "Caveat", cursive`;
                        ctx.fillStyle = '#2a2a2a';
                        ctx.textAlign = 'center';
                        // Bottom 15px logic
                        ctx.fillText("FIMO", canvas.width / 2, canvas.height - (img.width * 0.04));
                    }

                } else if (selectedFilter.datePosition === 'bottom-left') {
                    // EK80
                    const dateText = `' ${yy} ${mm} ${dd}`;
                    // 11px on 500px = 0.022
                    const fontSize = Math.max(11, img.width * 0.035); // Keeping readable

                    ctx.font = `700 ${fontSize}px "Courier New", monospace`;
                    ctx.fillStyle = selectedFilter.dateColor || '#FF9500';

                    // Shadows: 1px 1px 2px rgba(0,0,0,0.5), 0 0 4px rgba(255,149,0,0.4)
                    // Canvas supports only one shadow usually via shadowColor/Blur. 
                    // We'll prioritize the glow.
                    ctx.shadowColor = 'rgba(0,0,0,0.5)';
                    ctx.shadowBlur = 2;
                    ctx.shadowOffsetX = 1;
                    ctx.shadowOffsetY = 1;

                    // Bottom 10px, Left 10px
                    const offset = img.width * 0.03; // Approx 15px on 500px

                    ctx.textAlign = 'left';
                    ctx.fillText(dateText, offset, canvas.height - offset);
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
                        style={{
                            filter: selectedFilter.cssFilter,
                            // Basic preview styling, full accumulation logic is in canvas
                        }}
                        className="preview-image"
                    />
                    {/* Color Overlay Preview */}
                    {selectedFilter.colorOverlay && (
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundColor: selectedFilter.colorOverlay.color,
                            mixBlendMode: selectedFilter.colorOverlay.blendMode as any,
                            opacity: selectedFilter.colorOverlay.opacity,
                            pointerEvents: 'none'
                        }} />
                    )}
                    {/* Vignette Preview */}
                    {selectedFilter.vignetteOverlay && (
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: selectedFilter.vignetteOverlay,
                            pointerEvents: 'none'
                        }} />
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
