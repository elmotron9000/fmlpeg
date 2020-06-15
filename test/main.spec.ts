describe("Importing modules from the project", () => {
    it("should expose an audio module", () => {
        const { audio } = require("../src");
        expect(audio).toBeDefined();
    });

    it("should expose a video module", () => {
        const { video } = require("../src");
        expect(video).toBeDefined();
    })
})