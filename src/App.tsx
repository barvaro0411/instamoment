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
  const [nickname, setNickname] = useState('');
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

      // Store nickname if provided
      if (nickname.trim()) {
        sessionStorage.setItem(`instamoment_${eventId}_name`, nickname.trim());
        navigate(`/camera/${eventId}`);
      } else {
        navigate(`/event/${eventId}`);
      }
    }
  };

  return (
    <div className="home-page">
      <div className="home-container fade-in">
        <h1 className="brand-logo">InstaMoment</h1>
        <p className="brand-tagline">La cámara vintage para tus momentos</p>

        <form className="minimal-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Nombre del evento"
              className="minimal-input"
              required
            />
          </div>
          
          <div className="input-group">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Tu nombre (Opcional)"
              className="minimal-input"
            />
          </div>

          <button type="submit" className="action-btn">
            COMENZAR EXPERIENCIA
          </button>
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
