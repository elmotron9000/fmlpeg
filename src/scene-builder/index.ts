import { Scene, VideoScene, PhotoScene, Tracker, BuildWithSubtitlesOptions, BuiltWithSubtitles, BuildWithoutSubtitlesOptions, BuiltWithoutSubtitles, BuildOptions, Built, OptionalBuiltFields } from "../types";
import temp from "temp";
import { concatenateVideos, addAudioClipsToVideo, tracker } from "../fmlpeg";
import { photoToVideo } from "../fmlpeg/photo-to-video";

export class SceneBuilder {
    private static get defaultBuildOptions() {
        return { subtitles: false, filename: "output.mp4" };
    } 

    private readonly buildTempFiles: string[] = [];
    private readonly buildTracker: Tracker[] = [];

    public constructor(private readonly scenes: Scene[]) {
        temp.track();
    }

    /**
     * Uses the internal scenes to build out a video with ffmpeg,
     * with additional options, such as subtitle inclusion
     */
    public async build(options: BuildWithSubtitlesOptions): Promise<BuiltWithSubtitles>;
    public async build(options: BuildWithoutSubtitlesOptions): Promise<BuiltWithoutSubtitles>;
    public async build(options?: BuildOptions): Promise<BuiltWithoutSubtitles>;
    public async build(): Promise<BuiltWithoutSubtitles>;
    public async build(options: BuildOptions = SceneBuilder.defaultBuildOptions): Promise<Built> {
        try {
            const filename = options.filename;
            this.scenes.forEach(this.buildScene.bind(this))
            
            const additionalFields: OptionalBuiltFields = {};
            if (options.subtitles) {
                const subtitles = this.buildSubtitles();
                additionalFields.subtitles = subtitles;
            }
    
            await Promise.all(this.buildTracker.map(t => t[0]));

            await this.joinVideos(filename, this.buildTempFiles);

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

    private async joinVideos(outputFile: string, filenames: string[]): Promise<void> {
        console.log(`Concatenating ${filenames.length} video(s)`);
        await concatenateVideos(outputFile, filenames);
        console.log("Completed concatenation");
    }

    private async buildScene(scene: Scene, i: number): Promise<string> {
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
        const photoVideoFile = this.createTempVideoFile().path.toString();
        await photoToVideo(photoVideoFile, scene.filename, scene.duration)
        return photoVideoFile;
    }

    private setupTempFile(i: number): void {
        const tmpFile = this.createTempVideoFile();
        this.buildTempFiles[i] = tmpFile.path.toString();
    }

    private createTempVideoFile() {
        return temp.createWriteStream({ suffix: ".avi" });
    }

    private setTracker(i: number): void {
        this.buildTracker[i] = tracker();
    }

    private buildSubtitles(): string {
        return "Unimplemented";
    }
}
