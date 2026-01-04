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
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '1.5rem', cursor: 'pointer' }}
                    >
                        ←
                    </button>
                    <h1 className="brand-logo" style={{ fontSize: '1.5rem', margin: 0 }}>InstaMoment</h1>
                </div>
                <button
                    onClick={() => navigate(`/camera/${eventId}`)}
                    style={{
                        background: 'var(--text-primary)',
                        border: 'none',
                        color: 'var(--bg-primary)',
                        padding: '8px 16px',
                        borderRadius: '2px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        letterSpacing: '0.05em'
                    }}
                >
                    TOMAR FOTO
                </button>
            </header>

            <Gallery eventId={eventId} />
        </div>
    );
};
