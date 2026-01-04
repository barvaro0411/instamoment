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
                <h1 className="brand-logo" style={{ fontSize: '2rem', margin: 0 }}>InstaMoment</h1>
                <button
                    onClick={() => navigate(`/gallery/${eventId}`)}
                    style={{
                        background: 'transparent',
                        border: '1px solid var(--text-secondary)',
                        color: 'var(--text-primary)',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '0.9rem',
                        cursor: 'pointer'
                    }}
                >
                    GALERÍA →
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
