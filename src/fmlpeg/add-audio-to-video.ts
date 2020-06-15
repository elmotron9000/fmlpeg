import { AudioClip } from "../types";
import ffmpeg from "fluent-ffmpeg";
import { tracker } from "./tracker";
import { getLengthOfFile } from "../util/file-duration";
import { ffprobe } from "../util";
// import { generateSilence3 } from "./generate-silence";

export async function addAudioClipsToVideo(
    videoFile: string,
    outputFile: string,
    audioClips: AudioClip[] = []
): Promise<void> {
    // Get duration information on the source video
    const videoMeta = await ffprobe(videoFile);
    
    const duration = videoMeta.format.duration || null;
    if (duration === null) {
        throw new Error("Could not determine length of the input video file");
    }

    // Get duration metadata on the provided audio clips
    const enhancedClips = await Promise.all(audioClips.map(async (clip) => {
        const duration = await getLengthOfFile(clip.filename);

        return {
            ...clip,
            duration,
        } as EnhancedAudioClip
    }));

    // Validate the file duration metadata
    enhancedClips.forEach((clip) => {
        if (clip.duration === null) {
            throw new Error(`Audio file ${clip.filename} length could not be determined`);
        }
    })

    // Generate full audio range info for FFmpeg complex filter
    const audioInfo = buildAudioInfo(duration, enhancedClips);

    // Include video and all audio clips - include a silent audio clip if no audio in video
    const video = ffmpeg(videoFile);    
    audioClips.forEach((info) => {
        video.input(info.filename);
    });

    // Generate complex filter
    if (audioInfo.length > 0) {
        const filters: string[] = [];

        filters.push(...audioInfo.map((info, index) => audioInfoToComplexFilter(info, index + 1)));
        
        // if (videoHasAudio) {
        filters.push(joinAudioFilter(audioInfo.length))
        // }
        const complexFilters = filters.join("; ");

        video
            .complexFilter(complexFilters)
            // NOTE: Tried to use .map("0:v"), but it wrote it as `-map [0:v]`
            .addOption(["-map", "0:v"])
            .map("[aout]");

    }

    let [promise, resolve, reject] = tracker();
    console.log("Starting audio/video combination");

    // Add complex filters, video and audio maps, use original video
    video
        .videoCodec("copy") // ("libx264")
        .audioCodec("aac")
        // .fpsOutput(60)
        // .size("1920x1080")
        .output(outputFile)
        .on("start", console.log.bind(console))
        .on("end", resolve.bind(resolve))
        .on("error", reject.bind(reject))
        .run();

    await promise;
}

function buildAudioInfo(duration: number, clips: EnhancedAudioClip[]): AudioInfo[] {
    const infoList: AudioInfo[] = [];

    if (clips.length === 0) {
        return infoList;
    }
    
    let currentStart = 0;
    clips.forEach((clip, index) => {
        // Make sure we aren't overlapping any audio ranges
        if (clip.timestamp < currentStart) {
            throw new Error("Cannot overlap audio!");
        }

        // If there is a gap between the last audio clip and the current one, use audio from the video
        if (clip.timestamp > currentStart) {
            infoList.push({ index: 0, start: currentStart, end: clip.timestamp});
        }

        // Include audio clip in its range, running the range until the end if would surpass the length of video
        const info: AudioInfo = {
            index: index + 1,
            start: 0,
            end: clip.duration,
        }

        infoList.push(info);

        // Update start time tracker
        currentStart = clip.timestamp + clip.duration;
    });

    if (currentStart > duration) {
        const lastClip = clips[clips.length -1];
        console.log({ currentStart, duration, lastTimestamp: lastClip.timestamp, lastDuration: lastClip.duration });
        throw new Error("Audio surpassed the length of the video!");
    }

    if (currentStart < duration) {
        infoList.push({ index: 0, start: currentStart });
    }

    return infoList;
}

function audioInfoToComplexFilter(audioInfo: AudioInfo, overall: number): string {
    const device = `${audioInfo.index}:a`;
    return `[${device}]atrim=${getRange(audioInfo)},asetpts=PTS-STARTPTS[aud${overall}]`;
}

function getRange(audioInfo: AudioInfo): string {
    if (audioInfo.start === 0) {
        return `end=${audioInfo.end}`;
    }

    if (audioInfo.end === undefined) {
        return `start=${audioInfo.start}`;
    }

    return `${audioInfo.start}:${audioInfo.end}`;
}

function joinAudioFilter(total: number): string {
    const audioFeeds = range(total, +1).map((i) => `[aud${i}]`).join("");
    return `${audioFeeds}concat=n=${total}:v=0:a=1[aout]`;
}

function range(max: number, offset = 0): number[] {
    return [...Array(max).keys()].map(i => i + offset);
}

interface AudioInfo {
    index: number;
    start: number;
    end?: number;
}

interface EnhancedAudioClip extends AudioClip {
    duration: number;
}