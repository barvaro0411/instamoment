// Vintage filter definitions for the camera
export interface VintageFilter {
    id: string;
    name: string;
    cssFilter: string;
    colorOverlay?: {
        color: string;
        blendMode: string;
        opacity: number;
    };
    vignetteOverlay?: string; // CSS Gradient string
    hasDateStamp?: boolean;
    datePosition?: 'bottom-left' | 'top-center';
    dateColor?: string;
    frameType?: 'none' | 'polaroid';
}

export const vintageFilters: VintageFilter[] = [
    {
        id: 'ek80',
        name: 'EK 80',
        // Menos agresivo, más natural
        cssFilter: 'contrast(1.08) brightness(1.02) saturate(1.05)',
        // Overlay cálido/amarillo para el tono Kodak
        colorOverlay: {
            color: 'rgb(255, 200, 130)',
            blendMode: 'overlay',
            opacity: 0.15
        },
        vignetteOverlay: 'radial-gradient(ellipse at center, transparent 45%, rgba(40,30,20,0.25) 100%)',
        hasDateStamp: true,
        datePosition: 'bottom-left',
        dateColor: '#FF9500',
        frameType: 'none'
    },
    {
        id: 'aesthetic400',
        name: 'Aesthetic 400',
        cssFilter: 'contrast(0.95) brightness(1.08) saturate(0.88)',
        colorOverlay: {
            color: 'rgb(255, 245, 230)',
            blendMode: 'lighten',
            opacity: 0.12
        },
        vignetteOverlay: 'linear-gradient(180deg, rgba(255,255,250,0.05) 0%, transparent 100%)',
        hasDateStamp: true,
        datePosition: 'top-center',
        dateColor: '#1a1a1a',
        frameType: 'polaroid'
    }
];

export const getFilterById = (id: string): VintageFilter => {
    return vintageFilters.find(f => f.id === id) || vintageFilters[0];
};
