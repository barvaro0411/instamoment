import { useState, useEffect, useRef } from 'react';
import { type Photo, useFirebase } from '../hooks/useFirebase';
import { PhotoCard } from './PhotoCard';
import './Gallery.css';

interface GalleryProps {
    eventId: string;
}

export const Gallery = ({ eventId }: GalleryProps) => {
    const { photos, subscribeToPhotos, deletePhoto } = useFirebase();
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
    const [newPhotoAnimation, setNewPhotoAnimation] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Swipe state for smooth animation
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartX = useRef(0);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unsubscribe = subscribeToPhotos(eventId);
        return () => unsubscribe();
    }, [eventId, subscribeToPhotos]);

    // Animate when new photo arrives
    useEffect(() => {
        if (photos.length > 0) {
            setNewPhotoAnimation(true);
            const timer = setTimeout(() => setNewPhotoAnimation(false), 500);
            return () => clearTimeout(timer);
        }
    }, [photos.length]);

    // Keyboard navigation
    useEffect(() => {
        if (selectedPhotoIndex === null) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                navigatePrevious();
            } else if (e.key === 'ArrowRight') {
                navigateNext();
            } else if (e.key === 'Escape') {
                closeModal();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedPhotoIndex, photos.length]);

    const selectedPhoto = selectedPhotoIndex !== null ? photos[selectedPhotoIndex] : null;

    const closeModal = () => {
        setSelectedPhotoIndex(null);
        setDragOffset(0);
    };

    const navigateNext = () => {
        if (selectedPhotoIndex !== null && selectedPhotoIndex < photos.length - 1) {
            setSelectedPhotoIndex(selectedPhotoIndex + 1);
        }
    };

    const navigatePrevious = () => {
        if (selectedPhotoIndex !== null && selectedPhotoIndex > 0) {
            setSelectedPhotoIndex(selectedPhotoIndex - 1);
        }
    };

    // Touch handlers for smooth drag
    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
        dragStartX.current = e.touches[0].clientX;
        setDragOffset(0);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        const currentX = e.touches[0].clientX;
        const diff = currentX - dragStartX.current;

        // Add resistance at edges
        const atStart = selectedPhotoIndex === 0 && diff > 0;
        const atEnd = selectedPhotoIndex === photos.length - 1 && diff < 0;

        if (atStart || atEnd) {
            setDragOffset(diff * 0.3); // Rubber band effect
        } else {
            setDragOffset(diff);
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        const threshold = 80; // Minimum distance to trigger navigation

        if (dragOffset > threshold) {
            navigatePrevious();
        } else if (dragOffset < -threshold) {
            navigateNext();
        }

        // Animate back to center
        setDragOffset(0);
    };

    // Mouse handlers for desktop
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        dragStartX.current = e.clientX;
        setDragOffset(0);
        e.preventDefault();
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        const currentX = e.clientX;
        const diff = currentX - dragStartX.current;

        const atStart = selectedPhotoIndex === 0 && diff > 0;
        const atEnd = selectedPhotoIndex === photos.length - 1 && diff < 0;

        if (atStart || atEnd) {
            setDragOffset(diff * 0.3);
        } else {
            setDragOffset(diff);
        }
    };

    const handleMouseUp = () => {
        if (!isDragging) return;
        handleTouchEnd();
    };

    const handleMouseLeave = () => {
        if (isDragging) {
            handleTouchEnd();
        }
    };

    const handleDownload = async (photo: Photo) => {
        try {
            const response = await fetch(photo.imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `instamoment_${photo.author}_${Date.now()}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download error:', error);
        }
    };

    const handleDelete = async (photo: Photo) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta foto?')) {
            setIsDeleting(true);
            const success = await deletePhoto(photo.id, eventId, photo.imageUrl);
            setIsDeleting(false);
            if (success) {
                // Navigate to next or previous photo if available
                if (photos.length > 1 && selectedPhotoIndex !== null) {
                    if (selectedPhotoIndex < photos.length - 1) {
                        // Stay at same index (next photo will slide in)
                    } else if (selectedPhotoIndex > 0) {
                        setSelectedPhotoIndex(selectedPhotoIndex - 1);
                    } else {
                        closeModal();
                    }
                } else {
                    closeModal();
                }
            } else {
                alert('Error al eliminar la foto');
            }
        }
    };

    if (photos.length === 0) {
        return (
            <div className="gallery-empty">
                <div className="empty-icon">📸</div>
                <h3>Aún no hay fotos</h3>
                <p>¡Sé el primero en capturar un momento!</p>
            </div>
        );
    }

    const hasPrevious = selectedPhotoIndex !== null && selectedPhotoIndex > 0;
    const hasNext = selectedPhotoIndex !== null && selectedPhotoIndex < photos.length - 1;

    return (
        <div className="gallery-container">
            <div className="gallery-header">
                <h2>Momentos del Evento</h2>
                <span className="photo-count">{photos.length} fotos</span>
            </div>

            <div className={`gallery-grid ${newPhotoAnimation ? 'new-photo' : ''}`}>
                {photos.map((photo, index) => (
                    <PhotoCard
                        key={photo.id}
                        photo={photo}
                        onClick={() => setSelectedPhotoIndex(index)}
                    />
                ))}
            </div>

            {/* Photo Modal with Slide Animation */}
            {selectedPhoto && selectedPhotoIndex !== null && (
                <div className="photo-modal" onClick={closeModal}>
                    <div
                        ref={containerRef}
                        className="modal-content"
                        onClick={e => e.stopPropagation()}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseLeave}
                    >
                        <button className="close-btn" onClick={closeModal}>
                            ✕
                        </button>

                        {/* Navigation Arrows */}
                        {hasPrevious && (
                            <button
                                className="nav-arrow nav-arrow-left"
                                onClick={(e) => { e.stopPropagation(); navigatePrevious(); }}
                                aria-label="Foto anterior"
                            >
                                ‹
                            </button>
                        )}
                        {hasNext && (
                            <button
                                className="nav-arrow nav-arrow-right"
                                onClick={(e) => { e.stopPropagation(); navigateNext(); }}
                                aria-label="Siguiente foto"
                            >
                                ›
                            </button>
                        )}

                        {/* Image Slider Container */}
                        <div className="image-slider">
                            <div
                                className="slider-track"
                                style={{
                                    transform: `translateX(calc(-${selectedPhotoIndex * 100}% + ${dragOffset}px))`,
                                    transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)'
                                }}
                            >
                                {photos.map((photo) => (
                                    <div key={photo.id} className="slide">
                                        <img
                                            src={photo.imageUrl}
                                            alt={`Foto de ${photo.author}`}
                                            className="modal-image"
                                            draggable={false}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Photo counter */}
                        <div className="photo-counter">
                            {selectedPhotoIndex + 1} / {photos.length}
                        </div>

                        <div className="modal-info">
                            <div className="modal-author">
                                <span className="label">Capturada por</span>
                                <span className="value">{selectedPhoto.author}</span>
                            </div>
                            <div className="modal-actions">
                                <button
                                    className="action-icon-btn delete-btn"
                                    onClick={() => handleDelete(selectedPhoto)}
                                    disabled={isDeleting}
                                    title="Eliminar"
                                >
                                    🗑️
                                </button>
                                <button
                                    className="download-btn"
                                    onClick={() => handleDownload(selectedPhoto)}
                                >
                                    ⬇️ DESCARGAR
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
