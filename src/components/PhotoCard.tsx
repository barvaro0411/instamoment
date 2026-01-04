import { type Photo } from '../hooks/useFirebase';
import { getFilterById } from '../lib/filters';
import './PhotoCard.css';

interface PhotoCardProps {
    photo: Photo;
    onClick: () => void;
}

export const PhotoCard = ({ photo, onClick }: PhotoCardProps) => {
    const filter = getFilterById(photo.filter);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('es', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="photo-card" onClick={onClick}>
            <div className="photo-image-wrapper">
                <img
                    src={photo.imageUrl}
                    alt={`Foto de ${photo.author}`}
                    className="photo-image"
                    loading="lazy"
                />
                <div className="photo-overlay">
                    <span className="filter-badge">{filter.name}</span>
                </div>
            </div>
            <div className="photo-info">
                <span className="author">{photo.author}</span>
                <span className="time">{formatTime(photo.timestamp)}</span>
            </div>
        </div>
    );
};
