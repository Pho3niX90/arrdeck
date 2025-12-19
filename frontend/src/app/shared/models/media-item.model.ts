export interface MediaBadge {
    text?: string;
    iconHtml?: string; // Raw SVG or icon name
    colorClass?: string; // e.g. 'bg-black/70 text-white'
    textColorClass?: string; // specific text color override if needed
}

export interface MediaOverlay {
    text?: string; // e.g. "Added 2d ago"
    subText?: string;
    location: 'bottom' | 'center'; // Center is for hover overlay usually
}

export interface MediaSourceIcon {
    html: string;
    title: string;
}

export interface MediaItem {
    id: string | number;
    title: string;
    subtitle?: string; // e.g. Year
    imageUrl: string;
    clickAction?: () => void;

    // Badges
    topRightBadge?: MediaBadge;
    topLeftBadge?: MediaBadge;

    // Overlays
    bottomOverlay?: MediaOverlay;

    // Styling
    accentColor?: string; // e.g. 'text-amber-400' for hover states

    // Recommendations
    sourceIcons?: MediaSourceIcon[]; // List of HTML strings (SVGs) + titles
    recommendationScore?: number; // Sorting score
}
