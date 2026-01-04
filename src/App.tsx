import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { EventEntry } from './pages/EventEntry';
import { CameraPage } from './pages/CameraPage';
import { GalleryPage } from './pages/GalleryPage';
import './index.css';

// Wrapper to get nickname from session storage
const CameraPageWrapper = () => {
  const { eventId } = useParams<{ eventId: string }>();

  if (!eventId) {
    return <Navigate to="/" />;
  }

  const authorName = sessionStorage.getItem(`instamoment_${eventId}_name`) || 'Anónimo';

  return <CameraPage eventId={eventId} authorName={authorName} />;
};

// Home page - create or join event
const HomePage = () => {
  const [eventName, setEventName] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (eventName.trim()) {
      // Convert to URL-friendly format
      const eventId = eventName
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      navigate(`/event/${eventId}`);
    }
  };

  return (
    <div className="home-page">
      <div className="home-container">
        <h1 className="home-logo">InstaMoment</h1>
        <p className="home-tagline">La cámara vintage para tus momentos especiales</p>

        <div className="home-info">
          <div className="info-card">
            <span className="info-icon">📸</span>
            <h3>Cámara Vintage</h3>
            <p>Filtros estilo película para fotos únicas</p>
          </div>
          <div className="info-card">
            <span className="info-icon">☁️</span>
            <h3>Nube Instantánea</h3>
            <p>Todas las fotos se guardan automáticamente</p>
          </div>
          <div className="info-card">
            <span className="info-icon">👥</span>
            <h3>Galería Compartida</h3>
            <p>Todos ven las fotos en tiempo real</p>
          </div>
        </div>

        <form className="event-form" onSubmit={handleSubmit}>
          <h2>🎉 Crear o Unirse a un Evento</h2>
          <div className="form-group">
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Nombre del evento (ej: cumple-maria-2024)"
              className="event-input"
            />
            <button type="submit" className="event-button">
              Comenzar 📸
            </button>
          </div>
          <p className="form-hint">El nombre se convertirá en el link del evento</p>
        </form>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/event/:eventId" element={<EventEntry />} />
        <Route path="/camera/:eventId" element={<CameraPageWrapper />} />
        <Route path="/gallery/:eventId" element={<GalleryPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
