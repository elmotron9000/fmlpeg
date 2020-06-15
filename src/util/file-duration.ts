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
        const duration = info.format.duration;
        if (typeof duration === "number") {
            return duration;
        }
    } catch (err) {}

    return null;
}