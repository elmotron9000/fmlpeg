import { SceneBuilder } from "../src/scene-builder";
import { join } from "path";
import { getLengthOfFile } from "../src/util/file-duration";
import { Scene } from "../src/types";

const videoDir = join(__dirname, "resources", "video");
const audioDir = join(__dirname, "resources", "audio");
const photoDir = join(__dirname, "resources", "photo");
const outputDir = join(__dirname, "resources", "output");

describe("Scene Builder", () => {
    it("should combine multiple video files from scene metadata", async () => {
        const scene: Scene = {
            type: "video", audio: [], filename: "",
        };

        const builder = new SceneBuilder([2, 4].map((i) => ({
            ...scene,
            filename: join(videoDir, `input-test-${i}.mp4`)
        })));

        const info = await builder.build({
            filename: join(outputDir, "what-a-meme.mp4"),
            subtitles: false
        });
        expect(info).toBeDefined();

        const length = await getLengthOfFile(info.filename)
        expect(length).not.toBeNull();
    });

    it("should add audio to a video file from scene metadata", async () => {
        const scene: Scene = {
            type: "video",
            audio: [
                {
                    filename: join(audioDir, "shooting-star.ogg"),
                    timestamp: 4,
                    text: "doo do doo",
                },
                {
                    filename: join(audioDir, "sample-tts.mp3"),
                    timestamp: 16,
                    text:  "You can do all kinds of interesting things, all you need to do is click a link",
                },
            ],
            filename: join(videoDir, "silent-shooting-star.mp4"),
        };

        const builder = new SceneBuilder([scene]);

        const info = await builder.build({
            filename: join(outputDir, "shooting-star-sample.mp4"),
            subtitles: false
        });
        expect(info).toBeDefined();

        const length = await getLengthOfFile(info.filename)
        expect(length).not.toBeNull();
    });

    it("should generate a video from a photo", async () => {
        const scene: Scene = {
            type: "photo",
            duration: 12,
            filename: join(photoDir, "smartscape.png"),
            audio: [],
        };

        const builder = new SceneBuilder([scene]);

        const info = await builder.build({
            filename: join(outputDir, "single-image-slideshow.mp4"),
            subtitles: false,
        });
        expect(info).toBeDefined();

        const length = await getLengthOfFile(info.filename);
        expect(length).not.toBeNull();
    });

    it("should generate subtitles", async () => {
        const scene: Scene = {
            type: "video",
            filename: join(videoDir, "silent-shooting-star.mp4"),
            audio: [
                {
                    filename: join(audioDir, "shooting-star.ogg"),
                    timestamp: 4,
                    text: "doo do doo doo do doo do doo doo doo do",
                },
                {
                    filename: join(audioDir, "sample-tts.mp3"),
                    timestamp: 16,
                    text:  "You can do all kinds of interesting things, all you need to do is click a link",
                },
            ]
        };

        const builder = new SceneBuilder([scene]);

        const info = await builder.build({
            filename: join(outputDir, "subtitle-test.mp4"),
            subtitles: true,
        });
        expect(info).toBeDefined();

        const length = await getLengthOfFile(info.filename);
        expect(length).not.toBeNull();
    });

    it("should create a more realistic example than this crap", async () => {
        const builder = new SceneBuilder([
            {
                filename: join(videoDir, "dans-test.mp4"),
                type: "video",
                audio: [
                {
                    filename: join(audioDir, "dans-test.ogg"),
                    timestamp: 0.234,
                    text: "first I will search for something"
                }
                ]
            },
            {
                filename: join(videoDir, "dynatrace-outro.mp4"),
                type: "video",
                audio: [],
            },
        ]);
        const info = await builder.build({
            filename: join(outputDir, "dans-test-final.mp4"),
            subtitles: false,
        });
        expect(info).toBeDefined();

        const length = await getLengthOfFile(info.filename);
        expect(length).not.toBeNull();
    });
});