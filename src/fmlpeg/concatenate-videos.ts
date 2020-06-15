import { tracker } from "./tracker";
import ffmpeg from "fluent-ffmpeg";
import { ffprobe } from "../util";
import Ffmpeg from "fluent-ffmpeg";
import { resizeVideo } from "./resize-video";
// import { ffprobe } from "../util/ffprobe";

export async function concatenateVideos(
  outputFile: string,
  filenames: string[],
) {
  if (filenames.length === 0) {
    throw new Error("Cannot concatenate zero videos");
  }

  if (filenames.length === 1) {
    console.log("Transforming a single video");
    return await encodeOne(outputFile, filenames[0]);
  }

  // TODO: Validate video metadata prior to combining
  // const metadata = await Promise.all(filenames.map((f) => ffprobe(f)));
  // const sizeMetadata = metadata.map((m) => m.format.size);

  return await complexConcatenate(outputFile, filenames);
}

async function encodeOne(outputFile: string, filename: string) {
  let [complete, resolve, reject] = tracker();
  ffmpeg(filename)
    .output(outputFile)
    .videoCodec("libx264")
    .audioCodec("aac")
    .on("start", console.info.bind(console))
    .on("end", resolve.bind(resolve))
    .on("error", reject.bind(reject))
    .run();

  await complete;
}

async function simpleConcatenate(outputFile: string, filenames: string[]) {
  let [complete, resolve, reject] = tracker();
  const cmd = ffmpeg();

  filenames.forEach(filename => {
    cmd.addInput(filename);
  });

  cmd
    .mergeToFile(outputFile)
    .videoCodec("libx264")
    .audioCodec("aac")
    .on("start", console.info.bind(console))
    .on("end", resolve.bind(resolve))
    .on("error", reject.bind(reject));

  await complete;
}

async function complexConcatenate(outputFile: string, filenames: string[]) {
  const filesMetadata = await Promise.all(filenames.map(f => ffprobe(f)));
  console.log({ formats: filesMetadata.map(m => m.format) });

  const videos = filesMetadata
    .map(f => f.streams)
    .map(streams => streams.find(s => s.codec_type === "video"))
    .filter(videoStream => !!videoStream);

  if (videos.length <= 1) {
    throw new Error("Multiple videos passed but only one found");
  }

  const v1 = videos[0]!;
  const res = getResolution(v1);
  console.debug(`Resolution ${0}: ${res}`);
  let allMatch = true;
  videos.slice(1).forEach((video, i) => {
    const _res = getResolution(video!);
    console.debug(`Resolution ${i + 1}: ${_res}`);
    if (_res !== res) {
      allMatch = false;
    }
  });

  if (allMatch) {
    return simpleConcatenate(outputFile, filenames);
  }

  console.info("Resolutions do not all match, resizing videos!");
  if (filenames.length !== videos.length) {
    throw new Error("Metadata matchup failure");
  }

  const resizedFiles: string[] = [];
  const resolution = "1920x1080";
  resizedFiles.push(
    ...(await Promise.all(
      filenames.map((f, i): string | Promise<string> => {
        if (getResolution(videos[i]!) === resolution) {
          return f;
        }

        return resizeVideo(f, resolution);
      }),
    )),
  );

  return simpleConcatenate(outputFile, resizedFiles);
}

function getResolution(video: Ffmpeg.FfprobeStream): string {
  return `${video.width}x${video.height}`;
}
