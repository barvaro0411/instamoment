import { Camera } from '../components/Camera';
import { useNavigate } from 'react-router-dom';
import './CameraPage.css';

interface CameraPageProps {
    eventId: string;
    authorName: string;
}

export const CameraPage = ({ eventId, authorName }: CameraPageProps) => {
    const navigate = useNavigate();

    const handleExit = () => {
        navigate('/', {
            state: {
                initialEventName: eventId,
                initialNickname: authorName
            }
        });
    };

    return (
        <div className="camera-page">
            <header className="camera-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={handleExit}
                        className="control-btn"
                        style={{ fontSize: '1.2rem', padding: 0, opacity: 0.8 }}
                        title="Salir / Editar nombre"
                    >
                        ←
                    </button>
                    <h1 className="brand-logo" style={{ fontSize: '1.8rem', margin: 0 }}>InstaMoment</h1>
                </div>
                <button
                    onClick={() => navigate(`/gallery/${eventId}`)}
                    style={{
                        background: 'transparent',
                        border: '1px solid var(--text-secondary)',
                        color: 'var(--text-primary)',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                    }}
                >
                    GALERÍA →
                </button>
            </header>

            <Camera
                eventId={eventId}
                onUploadSuccess={() => { }}
            />
        </div>
    );
};
