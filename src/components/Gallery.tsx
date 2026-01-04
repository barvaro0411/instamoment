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
                setSelectedPhoto(null);
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
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setSelectedPhoto(null)}>
                            ✕
                        </button>
                        <img
                            src={selectedPhoto.imageUrl}
                            alt={`Foto de ${selectedPhoto.author}`}
                            className="modal-image"
                        />
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
