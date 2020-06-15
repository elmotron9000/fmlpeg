# elmotron9000

Your mission: to define and interpret a scene schema to generate a single video file from a number of input  video, photo, and audio files.

Bonus points: generate SRT caption files as well.

## schema

The schema must allow for multiple scenes, consisting of video, audio, and photo files, to be passed to the tool. These must include enough information to generate videos from photo files, splice video files, and overlap with audio.

Bonus points: includes text from the audio clips.

```js
{
    scenes: [
        {
            photo: "./intro_slide.png",
            time: 12,
            audio: [
                {
                    clip: "introduction_clip.mp3",
                    content: "text",
                    timestamp: 0.5
                }
            ]
        },
        {
            video: "./scene_1.mp4",
            audio: [
                {
                    clip: "scene_1_clip_1.mp3",
                    content: {
                        text: "text",
                    },
                    timestamp: 4
                },
                {
                    clip: "scene_1_clip_2.mp3",
                    timestamp: 16
                }
            ]
        }
    ]
}
```

## how to

This is for the most part the first time I have done any of this, so, fingers crossed. Here's some info found in my research.

### overlapping audio clips on a video

[ffmpeg add multiple audio files to video at specific points](https://superuser.com/questions/762886/ffmpeg-add-multiple-audio-files-to-video-at-specific-points).
[ffmpeg add new audio in video (mixing 2 audio)](https://superuser.com/questions/713633/ffmpeg-add-new-audio-in-video-mixing-2-audio)

### combining video clips

[FFmpeg: Concatenate](https://trac.ffmpeg.org/wiki/Concatenate)

### create video from images

[how to create a video from images with ffmpeg](https://stackoverflow.com/questions/24961127/how-to-create-a-video-from-images-with-ffmpeg)

### generate videos with ffmpeg in a javascript project

https://github.com/fluent-ffmpeg/node-fluent-ffmpeg#readme

This supports important flags such as [complexFilter](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg#complexfilterfilters-map-set-complex-filtergraph), [mergeToFile](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg#mergetofilefilename-tmpdir-concatenate-multiple-inputs), and more.

### determine length of mp3 file

It's possible from the command line to determine the length of an MP3 file by calling

```sh
ffmpeg -i song.mp3 2>&1 | grep Duration
```

For `fluent-ffmpeg`, you can determine information on any given file by using their `Metadata` class. There's an untested example [here](https://stackoverflow.com/questions/12390402/use-fluent-ffmpeg-to-tell-if-a-file-is-a-video-or-audio).

### working with ogg files

[how to use ffmpeg to encode ogg audio files](https://superuser.com/questions/1121334/how-to-use-ffmpeg-to-encode-ogg-audio-files)
