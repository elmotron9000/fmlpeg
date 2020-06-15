import temp from "temp";
import { tracker } from "./tracker";
import ffmpeg from "fluent-ffmpeg";
import { join } from "path";

// NOTE: This file is garbage

export async function generateSilence(time: number): Promise<string> {
  const outputFile = temp.createWriteStream({ suffix: ".ogg" }).path.toString();
  const [promise, resolve, reject] = tracker();

  /**
   * Generates a silent clip to use for offsetting audio clips
   * within the scenes. Based on this answer for generating
   * silent clips with ffmpeg on StackOverflow:
   *
   * https://stackoverflow.com/questions/32017827/how-to-create-silent-ogg-audio-file
   * ffmpeg -ar 48000 -t 60 -f s16le -acodec pcm_s16le -ac 2 -i /dev/zero -acodec libmp3lame -aq 4 output.mp3
   */
  ffmpeg()
    .input("anullsrc")
    .addOption(["-f", "lavfi", "-t", `${time}`])
    .audioCodec("libvorbis")
    .output(outputFile)
    .on("start", console.info.bind(console))
    .on("end", resolve.bind(resolve))
    .on("error", reject.bind(reject))
    .run();

  await promise;
  return outputFile;
}

export function generateSilence2(time: number, sIndex = 1): string {
  return `aevalsrc=0:d=${time}[s${sIndex}]`;
}

export async function generateSilence3(time: number): Promise<string> {
  const outputFile = temp.createWriteStream({ suffix: ".ogg" }).path.toString();
  const [promise, resolve, reject] = tracker();

  /**
   * Uses an included silent ogg to generate a clip of $time length
   */
  ffmpeg()
    .output(outputFile)
    .input(join(__dirname, "..", "..", "assets", "silence.ogg"))
    .audioCodec("libvorbis")
    .addOption(["-loop", `${time}`])
    .on("start", console.info.bind(console))
    .on("end", resolve.bind(resolve))
    .on("error", reject.bind(reject))
    .run();

  await promise;
  return outputFile;
}
