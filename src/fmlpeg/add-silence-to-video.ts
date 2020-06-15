import ffmpeg from "fluent-ffmpeg";
import { join } from "path";
import { tracker } from "./tracker";
import { getLengthOfFile, mkTemp } from "../util";

export async function addSilenceToVideo(inputVideo: string): Promise<string> {
  const filename = mkTemp(".mp4");
  const duration = await getLengthOfFile(inputVideo);
  if (duration === null) {
    throw new Error(
      `Input video ${inputVideo} duration could not be determined`,
    );
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
