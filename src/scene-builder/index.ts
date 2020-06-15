import {
  Scene,
  VideoScene,
  PhotoScene,
  Tracker,
  BuildWithSubtitlesOptions,
  BuiltWithSubtitles,
  BuildWithoutSubtitlesOptions,
  BuiltWithoutSubtitles,
  BuildOptions,
  Built,
  OptionalBuiltFields,
  SubtitleClipInfo,
} from "../types";
import temp from "temp";
import {
  concatenateVideos,
  addAudioClipsToVideo,
  tracker,
  addSilenceToVideo,
  photoToVideo,
} from "../fmlpeg";
import { getLengthOfFile, writeFile, ffprobe, mkTemp } from "../util";
import { generateSrtEntry } from "../util/srt";
import { hasAudioStream } from "../util/has-audio-streams";

export class SceneBuilder {
  private static get defaultBuildOptions() {
    return { subtitles: false, filename: "output.mp4" };
  }

  private readonly buildTempFiles: string[] = [];
  private readonly buildTracker: Tracker[] = [];

  public constructor(private readonly scenes: Scene[] = []) {
    temp.track();
  }

  /**
   * Uses the internal scenes to build out a video with ffmpeg,
   * with additional options, such as subtitle inclusion
   */
  public async build(
    options: BuildWithSubtitlesOptions,
  ): Promise<BuiltWithSubtitles>;
  public async build(
    options: BuildWithoutSubtitlesOptions,
  ): Promise<BuiltWithoutSubtitles>;
  public async build(options?: BuildOptions): Promise<BuiltWithoutSubtitles>;
  public async build(): Promise<BuiltWithoutSubtitles>;
  public async build(
    options: BuildOptions = SceneBuilder.defaultBuildOptions,
  ): Promise<Built> {
    try {
      console.log("Starting build");
      const filename = options.filename;
      this.scenes.forEach(this.buildScene.bind(this));

      const additionalFields: OptionalBuiltFields = {};
      if (options.subtitles) {
        const subPromise = this.buildSubtitles(filename).then(subtitles => {
          additionalFields.subtitles = subtitles;
        });
        this.addToBuildTracker(subPromise);
      }

      await Promise.all(this.buildTracker.map(t => t[0]));
      const subtitleFile = additionalFields.subtitles
        ? additionalFields.subtitles
        : null;
      await this.joinVideos(filename, this.buildTempFiles, subtitleFile);

      return { filename, ...additionalFields };
    } catch (err) {
      throw err;
    } finally {
      console.log("Cleaning up temp files");
      temp.cleanupSync();
    }
  }

  public addScene(scene: Scene): this {
    this.scenes.push(scene);
    return this;
  }

  private async joinVideos(
    outputFile: string,
    filenames: string[],
    subtitleFile: string | null,
  ): Promise<void> {
    console.log(`Concatenating ${filenames.length} video(s)`);
    if (subtitleFile) {
      console.info("Joining videos with subtitles");
    }
    await concatenateVideos(outputFile, filenames, subtitleFile);
    console.log("Completed concatenation");
  }

  private async buildScene(scene: Scene, i: number): Promise<string> {
    console.log("Starting buildScene");
    this.setupTempFile(i);
    this.setTracker(i);

    // TODO: Build scene
    switch (scene.type) {
      // NOTE: Builds a video first, then falls through to the VideoScene builder
      case "photo":
        console.log(`Started photo scene ${i} with file ${scene.filename}`);
        const filename = await this.buildPhotoScene(scene, i);
        scene = {
          ...scene,
          filename,
          type: "video",
        };
        console.log(`Finished photo scene ${i}`);

      case "video":
        // If there is no audio in the video, create a new video with audio
        const metadata = await ffprobe(scene.filename);
        if (!hasAudioStream(metadata)) {
          const newFile = await addSilenceToVideo(scene.filename);
          scene.filename = newFile;
        }

        console.log(`Started video scene ${i} with file ${scene.filename}`);
        const completeFile = await this.buildVideoScene(scene, i);

        // resolve this scene build promise
        this.buildTracker[i][1]();

        console.log(`Completed scene ${i}`);
        return completeFile;

      default:
        const err = new Error("Hit default case of buildScene");
        this.buildTracker[i][2](err);
        throw err;
    }
  }

  /**
   * A video scene should simply generate a video with the overlayed audio clips
   */
  private async buildVideoScene(scene: VideoScene, i: number): Promise<string> {
    const filename = this.buildTempFiles[i];
    await addAudioClipsToVideo(scene.filename, filename, scene.audio);
    return filename;
  }

  /**
   * A photo scene should generate a video based on the provided image file for
   * the specified duration with the overlayed audio clips
   */
  private async buildPhotoScene(scene: PhotoScene, i: number): Promise<string> {
    const photoVideoFile = mkTemp(".mp4");
    await photoToVideo(photoVideoFile, scene.filename, scene.duration);
    return photoVideoFile;
  }

  private setupTempFile(i: number): void {
    this.buildTempFiles[i] = mkTemp(".mp4");
  }

  private setTracker(i: number): void {
    this.buildTracker[i] = tracker();
  }

  private addToBuildTracker(p: Promise<any>): void {
    this.buildTracker.push([p, () => {}, () => {}]);
  }

  /**
   * Generates an SRT file and returns the path, using the filename for the output
   * video as an indicator to where to place the SRT file
   */
  private async buildSubtitles(filename?: string): Promise<string> {
    let srtFile;
    if (filename) {
      const split = filename.split(".");
      split.pop();
      srtFile = [...split, "srt"].join(".");
    } else {
      srtFile = mkTemp(".srt");
    }

    const startTimes = await this.getAccumulativeStartTime();

    const collectiveAudioInfo = await Promise.all(
      this.scenes
        .map((scene, sceneIndex) => {
          return scene.audio.map(
            async (audio): Promise<SubtitleClipInfo> => {
              const duration = await getLengthOfFile(audio.filename);
              if (duration === null) {
                throw new Error(
                  "Could not retrieve duration of " + scene.filename,
                );
              }
              return {
                ...audio,
                timestamp: audio.timestamp + startTimes[sceneIndex],
                duration,
              };
            },
          );
        })
        .reduce((list, audio) => [...list, ...audio], []),
    );

    console.debug({ collectiveAudioInfo });

    const content = collectiveAudioInfo
      .map((info, index) => {
        return generateSrtEntry(index, info);
      })
      .join("\n\n");

    console.info(`Writing subtitles to file ${srtFile}`);
    await writeFile(srtFile, content);

    return srtFile;
  }

  /**
   * Generates a list of duration offsets for all audio clips
   */
  private async getAccumulativeStartTime(): Promise<number[]> {
    const startTimesUnchecked = await Promise.all(
      this.scenes.map(scene => getLengthOfFile(scene.filename)),
    );
    startTimesUnchecked.some(value => {
      if (value === null) {
        throw new Error("Invalid file used to build subtitles");
      }
    });

    const startTimes = [...(startTimesUnchecked as number[])];
    startTimes.forEach((value, index) => {
      if (index === 0) {
        return;
      }

      startTimes[index] = value! + startTimes[index - 1]!;
    });

    startTimes.unshift(0);
    startTimes.pop();

    console.debug({ startTimes });

    return startTimes;
  }
}
