import Ffmpeg, { ffprobe as _ffprobe } from "fluent-ffmpeg";

export function hasAudioStream(metadata: Ffmpeg.FfprobeData): boolean {
  return metadata.streams.filter(s => s.codec_type === "audio").length > 0;
}
