// Vintage filter definitions for the camera
export interface VintageFilter {
    id: string;
    name: string;
    cssFilter: string;
    warmOverlay?: {
        color: string;
        blendMode: string;
        opacity: number;
    };
    vignetteOverlay?: string;
    grainOpacity?: number;
    hasDateStamp?: boolean;
    datePosition?: 'bottom-left' | 'top-center';
    dateColor?: string;
    dateStyle?: {
        fontSize: string;
        fontWeight: number;
        letterSpacing: string;
        textShadow: string;
    };
    frameType?: 'none' | 'polaroid';
}

export const vintageFilters: VintageFilter[] = [
    {
        id: 'ek80',
        name: 'EK 80',
        // Valores ajustados para Kodak Gold look
        cssFilter: 'contrast(1.10) brightness(1.04) saturate(1.08)',
        // Overlay amarillo/dorado característico de Kodak
        warmOverlay: {
            color: '#FFD88A', // Amarillo cálido/dorado
            blendMode: 'soft-light',
            opacity: 0.22
        },
        // Viñeta oscura con tono cálido
        vignetteOverlay: 'radial-gradient(ellipse at center, transparent 35%, rgba(60, 40, 20, 0.35) 100%)',
        grainOpacity: 0.06,
        hasDateStamp: true,
        datePosition: 'bottom-left',
        dateColor: '#FF9500',
        dateStyle: {
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '1.2px',
            textShadow: '1px 1px 2px rgba(0,0,0,0.6), 0 0 5px rgba(255,149,0,0.5)'
        },
        frameType: 'none'
    },
    {
        id: 'aesthetic400',
        name: 'Aesthetic 400',
        cssFilter: 'contrast(0.94) brightness(1.10) saturate(0.85)',
        warmOverlay: {
            color: '#FFF5E6',
            blendMode: 'lighten',
            opacity: 0.15
        },
        vignetteOverlay: 'linear-gradient(180deg, rgba(255,252,245,0.08) 0%, transparent 100%)',
        grainOpacity: 0.05,
        hasDateStamp: true,
        datePosition: 'top-center',
        dateColor: '#1a1a1a',
        dateStyle: {
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '4.5px',
            textShadow: 'none'
        },
        frameType: 'polaroid'
    }
];

export const getFilterById = (id: string): VintageFilter => {
    return vintageFilters.find(f => f.id === id) || vintageFilters[0];
};
