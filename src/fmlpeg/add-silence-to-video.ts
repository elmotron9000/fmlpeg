import temp from "temp";
import ffmpeg from "fluent-ffmpeg";
import { join } from "path";
import { tracker } from "./tracker";
import { getLengthOfFile } from "../util";

export async function addSilenceToVideo(inputVideo: string): Promise<string> {
    const filename = temp.createWriteStream({ suffix: ".mp4" }).path.toString();
    const duration = await getLengthOfFile(inputVideo);
    if (duration === null) {
        throw new Error(`Input video ${inputVideo} duration could not be determined`);
    }

    const [promise, resolve, reject] = tracker();

    ffmpeg()
        .input(inputVideo)
        // .addOption(["-stream_loop", `${Math.ceil(duration)}`, "-shortest"])
        .input(join(__dirname, "..", "..", "assets", "silence.ogg"))
        .complexFilter(" [1:0] apad ")
        .addOption(["-shortest"])
        // .videoCodec("copy")
        // .audioCodec("copy")
        .output(filename)
        .on("start", console.info.bind(console))
        .on("end", resolve.bind(resolve))
        .on("error", reject.bind(reject))
        .run();

    await promise;
    return filename;
}