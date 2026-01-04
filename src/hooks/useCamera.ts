import { useState, useRef, useCallback, useEffect } from 'react';

interface UseCameraReturn {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    isReady: boolean;
    error: string | null;
    facingMode: 'user' | 'environment';
    startCamera: () => Promise<void>;
    stopCamera: () => void;
    switchCamera: () => void;
    capturePhoto: (filter: string) => string | null;
}

export const useCamera = (): UseCameraReturn => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

    const startCamera = useCallback(async () => {
        try {
            setError(null);

            // Stop any existing stream
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }

            const constraints: MediaStreamConstraints = {
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setIsReady(true);
            }
        } catch (err) {
            console.error('Camera error:', err);
            if (err instanceof Error) {
                if (err.name === 'NotAllowedError') {
                    setError('Permiso de cámara denegado. Por favor, permite el acceso a la cámara.');
                } else if (err.name === 'NotFoundError') {
                    setError('No se encontró ninguna cámara en este dispositivo.');
                } else {
                    setError(`Error al acceder a la cámara: ${err.message}`);
                }
            }
            setIsReady(false);
        }
    }, [facingMode]);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsReady(false);
    }, []);

    const switchCamera = useCallback(() => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    }, []);

    // Restart camera when facing mode changes
    useEffect(() => {
        if (isReady) {
            startCamera();
        }
    }, [facingMode]);

    const capturePhoto = useCallback((filterCss: string): string | null => {
        if (!videoRef.current || !canvasRef.current) return null;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (!ctx) return null;

        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Apply filter and draw
        ctx.filter = filterCss;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Add film grain overlay
        ctx.filter = 'none';
        const grainIntensity = 15;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * grainIntensity;
            data[i] += noise;     // R
            data[i + 1] += noise; // G
            data[i + 2] += noise; // B
        }

        ctx.putImageData(imageData, 0, 0);

        // Add vignette effect
        const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, canvas.width * 0.3,
            canvas.width / 2, canvas.height / 2, canvas.width * 0.7
        );
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Return as data URL
        return canvas.toDataURL('image/jpeg', 0.85);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);

    return {
        videoRef,
        canvasRef,
        isReady,
        error,
        facingMode,
        startCamera,
        stopCamera,
        switchCamera,
        capturePhoto
    };
};
