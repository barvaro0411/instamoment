// Vintage filter definitions for the camera
export interface VintageFilter {
    id: string;
    name: string;
    cssFilter: string;
    overlayGradient?: string;
    hasDateStamp?: boolean;
}

export const vintageFilters: VintageFilter[] = [
    {
        id: 'film-r',
        name: 'Film R (Dazz Style)',
        cssFilter: 'contrast(1.2) brightness(1.1) saturate(1.2) sepia(0.2) hue-rotate(-5deg)',
        overlayGradient: 'radial-gradient(circle at center, transparent 0%, rgba(50,20,0,0.2) 100%)',
        hasDateStamp: true
    },
    {
        id: 'polaroid',
        name: 'Polaroid',
        cssFilter: 'contrast(1.1) brightness(1.1) saturate(1.2) sepia(0.15)',
        overlayGradient: 'linear-gradient(180deg, rgba(255,248,230,0.15) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)'
    },
    {
        id: 'film35mm',
        name: 'Film 35mm',
        cssFilter: 'contrast(1.2) brightness(0.95) saturate(0.9) hue-rotate(-5deg)',
        overlayGradient: 'radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.3) 100%)'
    },
    {
        id: 'sepia',
        name: 'Sepia Clásico',
        cssFilter: 'sepia(0.6) contrast(1.1) brightness(0.95)',
        overlayGradient: 'linear-gradient(45deg, rgba(120,80,40,0.1) 0%, transparent 100%)'
    },
    {
        id: 'bw-vintage',
        name: 'B&W Vintage',
        cssFilter: 'grayscale(1) contrast(1.3) brightness(0.9)',
        overlayGradient: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.4) 100%)'
    },
    {
        id: 'sunset',
        name: 'Atardecer',
        cssFilter: 'contrast(1.1) brightness(1.05) saturate(1.3) sepia(0.2) hue-rotate(-10deg)',
        overlayGradient: 'linear-gradient(180deg, rgba(255,180,100,0.15) 0%, transparent 100%)'
    }
];

export const getFilterById = (id: string): VintageFilter => {
    return vintageFilters.find(f => f.id === id) || vintageFilters[0];
};
