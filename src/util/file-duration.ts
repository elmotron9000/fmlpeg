import { ffprobe } from "./ffprobe";
import { exists, lstat } from "./fs";

export async function getLengthOfFile(filename: string): Promise<number | null> {
    if (!await exists(filename)) {
        return null;
    }

    const stat = await lstat(filename);
    if (!stat.isFile()) {
        return null;
    }

    try {
        const info = await ffprobe(filename);
        // console.debug({ filename, info });
        // console.debug({ filename, format: info.format });
        const duration = info.format.duration;
        // console.debug({ filename, duration });
        if (typeof duration === "number") {
            return duration;
        }
    } catch (err) {}

    return null;
}