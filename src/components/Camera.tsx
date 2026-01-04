import { useState, useEffect } from 'react';
import { useCamera } from '../hooks/useCamera';
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
    const [selectedFilter, setSelectedFilter] = useState<VintageFilter>(vintageFilters[0]);
    const [showFlash, setShowFlash] = useState(false);
    const [photoCount, setPhotoCount] = useState(0);
    const [lastPhoto, setLastPhoto] = useState<string | null>(null);

    const {
        videoRef,
        canvasRef,
        isReady,
        error,
        startCamera,
        switchCamera,
        capturePhoto
    } = useCamera();

    const { uploadPhoto, isLoading } = useFirebase();

    useEffect(() => {
        startCamera();
    }, []);

    const handleCapture = async () => {
        if (!isReady || isLoading) return;

        // Flash effect
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 150);

        // Capture photo with filter
        const photoData = capturePhoto(selectedFilter.cssFilter);

        if (photoData) {
            setLastPhoto(photoData);

            // Upload to Firebase
            const success = await uploadPhoto(photoData, authorName, selectedFilter.id, eventId);

            if (success) {
                setPhotoCount(prev => prev + 1);
                onPhotoTaken?.();

                // Clear preview after short delay
                setTimeout(() => setLastPhoto(null), 2000);
            }
        }
    };

    const handleFilterChange = (filter: VintageFilter) => {
        setSelectedFilter(filter);
    };

    if (error) {
        return (
            <div className="camera-error">
                <div className="error-icon">📷</div>
                <p>{error}</p>
                <button onClick={startCamera} className="retry-btn">
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="camera-container">
            {/* Camera Viewfinder */}
            <div className="viewfinder">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="camera-video"
                    style={{ filter: selectedFilter.cssFilter }}
                />

                {/* Film grain overlay */}
                <div className="grain-overlay"></div>

                {/* Gradient overlay */}
                {selectedFilter.overlayGradient && (
                    <div
                        className="filter-overlay"
                        style={{ background: selectedFilter.overlayGradient }}
                    />
                )}

                {/* Flash effect */}
                {showFlash && <div className="flash-effect" />}

                {/* Last photo preview */}
                {lastPhoto && (
                    <div className="photo-preview">
                        <img src={lastPhoto} alt="Última foto" />
                        <span className="preview-label">✓ Subida</span>
                    </div>
                )}

                {/* Loading indicator */}
                {isLoading && (
                    <div className="loading-overlay">
                        <div className="loading-spinner"></div>
                        <span>Subiendo...</span>
                    </div>
                )}
            </div>

            {/* Hidden canvas for capture */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Filter selector */}
            <FilterSelector
                selectedFilter={selectedFilter.id}
                onFilterChange={handleFilterChange}
            />

            {/* Controls */}
            <div className="camera-controls">
                <button className="control-btn switch-btn" onClick={switchCamera}>
                    <span className="icon">🔄</span>
                </button>

                <button
                    className={`shutter-btn ${isLoading ? 'disabled' : ''}`}
                    onClick={handleCapture}
                    disabled={!isReady || isLoading}
                >
                    <div className="shutter-inner"></div>
                </button>

                <div className="photo-counter">
                    <span className="count">{photoCount}</span>
                    <span className="label">fotos</span>
                </div>
            </div>
        </div>
    );
};
