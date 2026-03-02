// Shared Track Layout definitions
export interface TrackLayout {
    id: string;
    name: string;
    imageUrl: string;
}

export const TRACK_LAYOUTS: Record<string, TrackLayout[]> = {
    'Interlagos': [
        { id: 'layout1', name: 'Original', imageUrl: '/layouts/interlagos/1.webp' },
        { id: 'layout2', name: 'Layout 2', imageUrl: '/layouts/interlagos/2.webp' },
        { id: 'layout3', name: 'Layout 3', imageUrl: '/layouts/interlagos/3.webp' },
        { id: 'layout4', name: 'Layout 4', imageUrl: '/layouts/interlagos/4.webp' },
        { id: 'layout5', name: 'Reverse', imageUrl: '/layouts/interlagos/5.webp' },
        { id: 'layout6', name: 'Layout 6', imageUrl: '/layouts/interlagos/6.webp' },
        { id: 'layout7', name: 'Layout 7', imageUrl: '/layouts/interlagos/7.webp' },
        { id: 'layout8', name: 'Layout 8', imageUrl: '/layouts/interlagos/8.webp' },
    ],
    'Speed Park (SP)': [
        { id: 'layout1', name: 'Layout 1', imageUrl: '/layouts/speedpark/layout1.svg' },
        { id: 'layout2', name: 'Layout 2', imageUrl: '/layouts/speedpark/layout2.svg' },
    ],
    'RBC Racing (MG)': [
        { id: 'layout1', name: 'Layout 1', imageUrl: '/layouts/rbc/layout1.svg' },
        { id: 'layout2', name: 'Layout 2', imageUrl: '/layouts/rbc/layout2.svg' },
    ],
};

// Helper to find the track layout image URL from the track string
export function getTrackLayoutImage(track: string): string | null {
    for (const [trackName, layouts] of Object.entries(TRACK_LAYOUTS)) {
        if (track.startsWith(trackName)) {
            const layoutName = track.substring(trackName.length).replace(/^ - /, '');
            const layout = layouts.find(l => l.name === layoutName);
            if (layout) return layout.imageUrl;
        }
    }
    return null;
}

export function getTrackLayoutName(track: string): string | null {
    for (const [trackName] of Object.entries(TRACK_LAYOUTS)) {
        if (track.startsWith(trackName)) {
            return track.substring(trackName.length).replace(/^ - /, '');
        }
    }
    return null;
}
