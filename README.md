# InstaMoment 📸

Cámara vintage para eventos - Captura y comparte momentos al instante.

## Características

- 📷 **Cámara Vintage**: 5 filtros estilo película (Polaroid, Film 35mm, Sepia, B&W, Atardecer)
- ☁️ **Nube Instantánea**: Las fotos se guardan automáticamente en Firebase
- 👥 **Galería Compartida**: Todos los invitados ven las fotos en tiempo real
- 📱 **PWA**: Funciona como app nativa en móviles

## Setup

### 1. Configurar Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto llamado "InstaMoment"
3. Habilita **Storage** y **Firestore**
4. En Storage > Rules, usa estas reglas para permitir uploads:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /photos/{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

5. En Firestore > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /events/{eventId}/photos/{photoId} {
      allow read, write: if true;
    }
  }
}
```

6. Ve a Project Settings > General > Your apps > Add web app
7. Copia las credenciales

### 2. Configurar Variables de Entorno

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de Firebase.

### 3. Instalar y Ejecutar

```bash
npm install
npm run dev
```

## Uso

1. **Crear un Evento**: Usa cualquier ID único, ej: `/event/cumple-maria-2024`
2. **Compartir Link**: Da el link a los invitados (o genera un QR)
3. **Tomar Fotos**: Los invitados acceden, eligen un filtro y disparan
4. **Ver Galería**: Todos pueden ver las fotos en tiempo real

## URLs

- `/event/{eventId}` - Página de entrada al evento
- `/camera/{eventId}` - Cámara para tomar fotos
- `/gallery/{eventId}` - Galería de fotos del evento

## Tech Stack

- React + TypeScript + Vite
- Firebase (Storage + Firestore)
- React Router
- CSS vanilla con diseño glassmorphism
