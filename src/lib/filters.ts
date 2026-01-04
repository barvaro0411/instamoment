// Vintage filter definitions for the camera
export interface VintageFilter {
    id: string;
    name: string;
    cssFilter: string;
    overlayGradient?: string;
    hasDateStamp?: boolean;
    datePosition?: 'bottom-left' | 'bottom-right' | 'top-center';
    dateColor?: string;
    frameType?: 'none' | 'polaroid';
    hasGrain?: boolean;
    lightLeak?: boolean;
}

export const vintageFilters: VintageFilter[] = [
    {
        id: 'ek80',
        name: 'EK 80',
        // Kodak warmth: tonos cálidos/naranjas, contraste medio-alto
        cssFilter: 'contrast(1.12) brightness(1.06) saturate(0.92) sepia(0.08) hue-rotate(-6deg)',
        // Viñeta característica de Kodak
        overlayGradient: 'radial-gradient(ellipse at center, transparent 40%, rgba(20,10,0,0.18) 100%)',
        hasDateStamp: true,
        datePosition: 'bottom-left',
        dateColor: '#FF9500', // Naranja iconic de los timestamps Kodak
        frameType: 'none',
        hasGrain: true,
        lightLeak: false
    },
    {
        id: 'aesthetic400',
        name: 'Aesthetic 400',
        // Look Polaroid: cremoso, sobreexpuesto, baja saturación
        cssFilter: 'contrast(0.90) brightness(1.12) saturate(0.80) sepia(0.18) hue-rotate(-3deg)',
        overlayGradient: 'linear-gradient(to bottom, rgba(255,255,245,0.03) 0%, transparent 50%)',
        hasDateStamp: true,
        datePosition: 'top-center',
        dateColor: '#1a1a1a',
        frameType: 'polaroid',
        hasGrain: true,
        lightLeak: true
    }
];

export const getFilterById = (id: string): VintageFilter => {
    return vintageFilters.find(f => f.id === id) || vintageFilters[0];
};
