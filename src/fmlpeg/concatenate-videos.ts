import { tracker } from "./tracker";
import ffmpeg from "fluent-ffmpeg";
// import { ffprobe } from "../util/ffprobe";

export async function concatenateVideos(outputFile: string, filenames: string[]) {
    if (filenames.length === 0) {
        throw new Error("Cannot concatenate zero videos");
    }

    if (filenames.length === 1) {
        return transformOne(outputFile, filenames[0]);
    }

    // TODO: Validate video metadata prior to combining
    // const metadata = await Promise.all(filenames.map((f) => ffprobe(f)));
    // const sizeMetadata = metadata.map((m) => m.format.size);

    return simpleConcatenate(outputFile, filenames);
}

async function transformOne(outputFile: string, filename: string) {
    let [complete, resolve, reject] = tracker();
    const cmd = ffmpeg(filename)
    cmd.mergeToFile(outputFile)
        .videoCodec("libx264")
        .audioCodec("aac")
        .on("start", console.info.bind(console))
        .on("end", resolve.bind(resolve))
        .on("error", reject.bind(reject))

    await complete;
}

async function simpleConcatenate(outputFile: string, filenames: string[]) {
    let [complete, resolve, reject] = tracker();
    const cmd = ffmpeg()
    
    filenames.forEach((filename) => {
        cmd.addInput(filename)
    });

    cmd.mergeToFile(outputFile)
        .videoCodec("libx264")
        .audioCodec("aac")
        .on("start", console.info.bind(console))
        .on("end", resolve.bind(resolve))
        .on("error", reject.bind(reject))

    await complete;
}