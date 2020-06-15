import ffmpeg from "fluent-ffmpeg";
import { tracker } from "./tracker";
import { mkTemp } from "../util";

export async function resizeVideo(
  filename: string,
  resolution: string,
): Promise<string> {
  const newFile = mkTemp(".mp4");
  const [promise, resolve, reject] = tracker();

  ffmpeg(filename)
    .addOption(["-s", resolution])
    .audioCodec("copy")
    .output(newFile)
    .on("start", console.info.bind(console))
    .on("end", resolve.bind(resolve))
    .on("error", reject.bind(reject))
    .run();

  await promise;
  return newFile;
}
