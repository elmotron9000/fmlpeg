export enum Format {
    UNKNOWN,
    AUDIO,
    VIDEO,
}

export function getFormatType(format: string): Format {
    switch (format) {
        case "mp3":
        case "ogg":
            return Format.AUDIO;
        
        case "avi":
            return Format.VIDEO;
        
        default:    
            return Format.UNKNOWN;
    }
    
}