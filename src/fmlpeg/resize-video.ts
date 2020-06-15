import ffmpeg from "fluent-ffmpeg";
import temp from "temp";
import { tracker } from "./tracker";

export async function resizeVideo(
  filename: string,
  resolution: string,
): Promise<string> {
  const newFile = temp.createWriteStream({ suffix: ".mp4" }).path.toString();
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
