// Vintage filter definitions for the camera
export interface VintageFilter {
    id: string;
    name: string;
    cssFilter: string;
    overlayGradient?: string;
    hasDateStamp?: boolean;
    datePosition?: 'bottom-right' | 'top-center';
    dateColor?: string;
    frameType?: 'none' | 'polaroid';
}

export const vintageFilters: VintageFilter[] = [
    {
        id: 'ek80',
        name: 'EK 80',
        cssFilter: 'contrast(1.1) brightness(1.05) saturate(0.9) hue-rotate(-5deg)',
        overlayGradient: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.2) 100%)',
        hasDateStamp: true,
        datePosition: 'bottom-right',
        dateColor: '#ff9500', // Iconic orange
        frameType: 'none'
    },
    {
        id: 'aesthetic400',
        name: 'Aesthetic 400',
        cssFilter: 'contrast(0.95) brightness(1.1) saturate(0.85) sepia(0.1)',
        hasDateStamp: true,
        datePosition: 'top-center',
        dateColor: '#000000', // Black for polaroid
        frameType: 'polaroid'
    }
];

export const getFilterById = (id: string): VintageFilter => {
    return vintageFilters.find(f => f.id === id) || vintageFilters[0];
};
