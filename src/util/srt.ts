import { SubtitleClipInfo } from "../types";

export function generateSrtEntry(index: number, info: SubtitleClipInfo) {
  const startTime = info.timestamp;
  const endTime = startTime + info.duration;

  const start = getTimestampInfo(startTime);
  const end = getTimestampInfo(endTime);
  const content = collectTextIntoStringGroups(info.text);

  return `${index + 1}
${srtTimestamp(start)} --> ${srtTimestamp(end)}
${content.join("\n")}`;
}

function getTimestampInfo(time: number): TimeStamp {
  const hh = Math.floor(time / 3600);
  const mm = Math.floor(time / 60) % 60;
  const ss = Math.floor(time % 60);
  const ms = Math.floor(time * 1000) % 1000;
  return { hh, mm, ss, ms };
}

function srtTimestamp(t: TimeStamp): string {
  return `${t.hh}:${t.mm}:${t.ss},${t.ms}`;
}

function collectTextIntoStringGroups(inputText: string): string[] {
  const groups: string[] = [];
  const splitInput = inputText.split(" ");

  // let [i, charCount, charLimit, group] = [0, 0, 180, [] as string[]];
  // while (i++ < splitInput.length) {
  //     const text = splitInput[i];
  //     group.push(text);
  //     charCount += (text.length + 1);
  //     if (charCount > charLimit) {
  //         groups.push(group.join(" "));
  //         group = [];
  //         charCount = -1;
  //     }
  // }

  let [charCount, charLimit, group] = [0, 32, [] as string[]];
  for (const text of splitInput) {
    group.push(text);
    console.debug({ charCount });
    charCount += text.length + 1;
    if (charCount > charLimit) {
      groups.push(group.join(" "));
      group = [];
      charCount = -1;
    }
  }
  if (group.length > 0) {
    groups.push(group.join(" "));
    group = [];
    charCount = -1;
  }

  return groups;
}

interface TimeStamp {
  hh: number;
  mm: number;
  ss: number;
  ms: number;
}
