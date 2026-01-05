import { useState, useEffect } from 'react';
import { type Photo, useFirebase } from '../hooks/useFirebase';
import { PhotoCard } from './PhotoCard';
import './Gallery.css';

interface GalleryProps {
    eventId: string;
}

export const Gallery = ({ eventId }: GalleryProps) => {
    const { photos, subscribeToPhotos, deletePhoto } = useFirebase();
    const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
    const [newPhotoAnimation, setNewPhotoAnimation] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Touch/swipe state
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

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
        if (!selectedPhoto) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                navigatePrevious();
            } else if (e.key === 'ArrowRight') {
                navigateNext();
            } else if (e.key === 'Escape') {
                setSelectedPhoto(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedPhoto, photos]);

    const getCurrentPhotoIndex = () => {
        if (!selectedPhoto) return -1;
        return photos.findIndex(p => p.id === selectedPhoto.id);
    };

    const navigateNext = () => {
        const currentIndex = getCurrentPhotoIndex();
        if (currentIndex < photos.length - 1) {
            setSelectedPhoto(photos[currentIndex + 1]);
        }
    };

    const navigatePrevious = () => {
        const currentIndex = getCurrentPhotoIndex();
        if (currentIndex > 0) {
            setSelectedPhoto(photos[currentIndex - 1]);
        }
    };

    // Touch handlers
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            navigateNext();
        } else if (isRightSwipe) {
            navigatePrevious();
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
                const currentIndex = getCurrentPhotoIndex();
                if (photos.length > 1) {
                    if (currentIndex < photos.length - 1) {
                        setSelectedPhoto(photos[currentIndex + 1]);
                    } else if (currentIndex > 0) {
                        setSelectedPhoto(photos[currentIndex - 1]);
                    } else {
                        setSelectedPhoto(null);
                    }
                } else {
                    setSelectedPhoto(null);
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

    const currentIndex = getCurrentPhotoIndex();
    const hasPrevious = currentIndex > 0;
    const hasNext = currentIndex < photos.length - 1;

    return (
        <div className="gallery-container">
            <div className="gallery-header">
                <h2>Momentos del Evento</h2>
                <span className="photo-count">{photos.length} fotos</span>
            </div>

            <div className={`gallery-grid ${newPhotoAnimation ? 'new-photo' : ''}`}>
                {photos.map((photo) => (
                    <PhotoCard
                        key={photo.id}
                        photo={photo}
                        onClick={() => setSelectedPhoto(photo)}
                    />
                ))}
            </div>

            {/* Photo Modal */}
            {selectedPhoto && (
                <div className="photo-modal" onClick={() => setSelectedPhoto(null)}>
                    <div
                        className="modal-content"
                        onClick={e => e.stopPropagation()}
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                    >
                        <button className="close-btn" onClick={() => setSelectedPhoto(null)}>
                            ✕
                        </button>

                        {/* Navigation Arrows */}
                        {hasPrevious && (
                            <button
                                className="nav-arrow nav-arrow-left"
                                onClick={navigatePrevious}
                                aria-label="Foto anterior"
                            >
                                ‹
                            </button>
                        )}
                        {hasNext && (
                            <button
                                className="nav-arrow nav-arrow-right"
                                onClick={navigateNext}
                                aria-label="Siguiente foto"
                            >
                                ›
                            </button>
                        )}

                        <img
                            src={selectedPhoto.imageUrl}
                            alt={`Foto de ${selectedPhoto.author}`}
                            className="modal-image"
                        />

                        {/* Photo counter */}
                        <div className="photo-counter">
                            {currentIndex + 1} / {photos.length}
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
