// Vintage filter definitions for the camera
// NOTE: This file is now primarily for UI (FilterSelector display)
// Actual rendering is handled by fimoEngine.ts
export interface VintageFilter {
    id: string;
    name: string;
    cssFilter: string; // Used for FilterSelector preview thumbnails only
}

export const vintageFilters: VintageFilter[] = [
    {
        id: 'ek80',
        name: 'EK 80',
        cssFilter: 'contrast(1.10) brightness(1.04) saturate(1.08)',
    },
    {
        id: 'aesthetic400',
        name: 'Aesthetic 400',
        cssFilter: 'contrast(0.94) brightness(1.10) saturate(0.85)',
    }
];

export const getFilterById = (id: string): VintageFilter => {
    return vintageFilters.find(f => f.id === id) || vintageFilters[0];
};
