import { useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';

export const EventEntry = () => {
    const navigate = useNavigate();
    const { eventId } = useParams<{ eventId: string }>();
    const [nickname, setNickname] = useState('');

    const handleEnter = (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (eventId) {
            // Store nickname for this session
            sessionStorage.setItem(`instamoment_${eventId}_name`, nickname || 'Anónimo');
            navigate(`/camera/${eventId}`);
        }
    };

    return (
        <div className="home-page">
            <div className="home-container fade-in">
                <h1 className="brand-logo">InstaMoment</h1>
                <p className="brand-tagline">Te has unido a un evento</p>

                <div className="minimal-form">
                    <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
                            👋 ¡Bienvenido!
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                            ¿Cómo quieres aparecer en las fotos?
                        </p>
                    </div>

                    <form onSubmit={handleEnter} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div className="input-group">
                            <input
                                type="text"
                                placeholder="Tu nombre o apodo"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                className="minimal-input"
                                maxLength={20}
                                autoFocus
                            />
                        </div>

                        <button
                            type="submit"
                            className="action-btn"
                        >
                            ENTRAR A LA CÁMARA
                        </button>
                    </form>

                    <button
                        onClick={() => navigate(`/gallery/${eventId}`)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            marginTop: '1rem',
                            textDecoration: 'underline',
                            opacity: 0.7
                        }}
                    >
                        Solo ver la galería
                    </button>
                </div>
            </div>
        </div>
    );
};
