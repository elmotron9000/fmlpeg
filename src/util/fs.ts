import * as fs from "fs";
import { promisify } from "util";

export const lstat = promisify(fs.lstat);
export const exists = promisify(fs.exists);
export const writeFile = promisify(fs.writeFile);