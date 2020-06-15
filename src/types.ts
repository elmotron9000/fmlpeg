/** Input Scene Types */
export type Scene = PhotoScene | VideoScene;

export interface File {
    filename: string;
}

export interface AudioClip extends File {
    content: AudioContent | string;
    timestamp: number;
}

// TODO: Support TTS types from Google Cloud
export type AudioContent = string;

export interface BaseScene extends File {
    audio: AudioClip[]
    type: "photo" | "video";
}

export interface PhotoScene extends BaseScene {
    type: "photo";
    duration: number;
}

export interface VideoScene extends BaseScene {
    type: "video";
}

/** Scene Builder Types */
export interface BuildOptions {
    subtitles: boolean;
    filename: string;
}

export interface BuildWithSubtitlesOptions extends BuildOptions {
    subtitles: true;
}

export interface BuildWithoutSubtitlesOptions extends BuildOptions {
    subtitles: false;
}

export interface Built extends File {
    subtitles?: string;
}

export type OptionalBuiltFields = Pick<Built, "subtitles">;

export interface BuiltWithSubtitles extends Built {
    subtitles: string;
}

export type BuiltWithoutSubtitles = File;

/** Miscellanious Types */
export type Tracker = [Promise<unknown>, Func, Func];
export type Func = (...args: any[]) => void;