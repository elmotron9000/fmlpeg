import { join } from "path";
import { getLengthOfFile } from "../src/util";

const audioDir = join(__dirname, "resources", "audio");

describe("Utility functions", () => {
    describe("Media file duration retrieval", () => {
        it("should get the length an audio file", async () => {
            const audioLength = await getLengthOfFile(join(audioDir, "test.mp3"));
            expect(audioLength).toBeTruthy();
        });
    
        it("should return null on a non-existent audio file", async () => {
            const audioLength = await getLengthOfFile(join(audioDir, "does-not-exist.mp3"));
            expect(audioLength).toBeNull();
        });
    });
});