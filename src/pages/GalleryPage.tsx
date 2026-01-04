import { Gallery } from '../components/Gallery';
import { useNavigate, useParams } from 'react-router-dom';
import './GalleryPage.css';

export const GalleryPage = () => {
    const navigate = useNavigate();
    const { eventId } = useParams<{ eventId: string }>();

    if (!eventId) {
        return <div>Evento no encontrado</div>;
    }

    return (
        <div className="gallery-page">
            <header className="gallery-header">
                <div className="header-left">
                    <button
                        className="back-btn"
                        onClick={() => navigate(-1)}
                    >
                        ←
                    </button>
                    <h1 className="logo">InstaMoment</h1>
                </div>
                <button
                    className="camera-link"
                    onClick={() => navigate(`/camera/${eventId}`)}
                >
                    📸 Tomar Foto
                </button>
            </header>

            <Gallery eventId={eventId} />
        </div>
    );
};
