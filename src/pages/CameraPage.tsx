import { Camera } from '../components/Camera';
import { useNavigate } from 'react-router-dom';
import './CameraPage.css';

interface CameraPageProps {
    eventId: string;
    authorName: string;
}

export const CameraPage = ({ eventId, authorName }: CameraPageProps) => {
    const navigate = useNavigate();

    return (
        <div className="camera-page">
            <header className="camera-header">
                <h1 className="logo">InstaMoment</h1>
                <button
                    className="gallery-link"
                    onClick={() => navigate(`/gallery/${eventId}`)}
                >
                    📷 Ver Galería
                </button>
            </header>

            <Camera
                eventId={eventId}
                authorName={authorName}
                onPhotoTaken={() => { }}
            />
        </div>
    );
};
