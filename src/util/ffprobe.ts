import Ffmpeg, { ffprobe as _ffprobe } from "fluent-ffmpeg";

export function ffprobe(filename: string): Promise<Ffmpeg.FfprobeData> {
  return new Promise((resolve, reject) =>
    _ffprobe(filename, (err, data) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(data);
      return;
    }),
  );
}
