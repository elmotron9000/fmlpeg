import temp from "temp";

export function mkTemp(suffix?: string) {
  return temp.createWriteStream({ suffix }).path.toString();
}
