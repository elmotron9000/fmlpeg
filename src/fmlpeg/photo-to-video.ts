import ffmpeg from "fluent-ffmpeg";
import { tracker } from "./tracker";

const DEFAULT_FRAMERATE = 30;

export async function photoToVideo(
    outputFile: string,
    photo: string,
    duration: number,
    framerate = DEFAULT_FRAMERATE
) {
    const [promise, resolve, reject] = tracker();
    ffmpeg()
        .output(outputFile)
        .input(photo)
        .inputFPS(1)
        .outputFPS(framerate)
        .loop(duration)
        // .addOption(["-r", "1/5"])
        .videoCodec("libx264")
        .noAudio()
        // .addOption(["-t", `${duration}`])
        .addOption(["-pix_fmt", "yuv420p"])
        .on("start", console.info.bind(console))
        .on("end", resolve.bind(reject))
        .on("error", reject.bind(resolve))
        .run();

    await promise;
    return;
}