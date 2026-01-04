import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './EventEntry.css';

export const EventEntry = () => {
    const navigate = useNavigate();
    const { eventId } = useParams<{ eventId: string }>();
    const [nickname, setNickname] = useState('');

    const handleEnter = () => {
        if (eventId) {
            // Store nickname for this session
            sessionStorage.setItem(`instamoment_${eventId}_name`, nickname || 'Anónimo');
            navigate(`/camera/${eventId}`);
        }
    };

    return (
        <div className="event-entry">
            <div className="entry-container">
                <div className="entry-header">
                    <h1 className="logo">InstaMoment</h1>
                    <p className="tagline">Captura momentos vintage ✨</p>
                </div>

                <div className="entry-card">
                    <div className="camera-preview">
                        <div className="lens"></div>
                        <div className="flash"></div>
                    </div>

                    <h2>¡Bienvenido al evento!</h2>
                    <p>Ingresa tu nombre para que todos sepan quién capturó cada momento</p>

                    <input
                        type="text"
                        placeholder="Tu nombre o apodo"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="name-input"
                        maxLength={20}
                    />

                    <button
                        className="enter-btn"
                        onClick={handleEnter}
                    >
                        🎉 Entrar al Evento
                    </button>

                    <button
                        className="gallery-only-btn"
                        onClick={() => navigate(`/gallery/${eventId}`)}
                    >
                        Solo ver galería
                    </button>
                </div>

                <p className="powered-by">
                    Todas las fotos se guardan en la nube al instante
                </p>
            </div>
        </div>
    );
};
