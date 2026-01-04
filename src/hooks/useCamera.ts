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
    capturePhoto: (filter: string, isMirrored?: boolean) => string | null;
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

    const capturePhoto = useCallback((filterCss: string, isMirrored: boolean = false): string | null => {
        if (!videoRef.current || !canvasRef.current) return null;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (!ctx) return null;

        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Apply visual mirroring if requested
        ctx.save();
        if (isMirrored) {
            ctx.scale(-1, 1);
            ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        } else {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
        ctx.restore();

        // Apply filter
        // Note: Canvas filter API affects subsequent drawings. 
        // To apply filter to the already drawn image, we'd strictly need to draw again or use advanced techniques.
        // A simpler approximation for "vintage filter" in canvas often involves drawing an overlay or manipulating pixels.
        // However, standard `ctx.filter` works on `drawImage`. Since we already drew, let's redraw with filter if supported or stick to CSS parity.
        // For simplicity/compatibility in this hook, we usually apply the filter property BEFORE drawing.
        // Let's re-do the drawing logic safely to support both mirror AND filter.

        /* 
           Correct approach:
           1. Clear canvas
           2. Set filter
           3. Save context
           4. Apply mirror transform
           5. Draw image
           6. Restore context
        */

        // Reset and clear
        canvas.width = video.videoWidth; // Resets context

        if (ctx.filter) {
            ctx.filter = filterCss;
        }

        ctx.save();
        if (isMirrored) {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.restore();

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
