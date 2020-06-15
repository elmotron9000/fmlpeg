import { Tracker, Func } from "../types";

export function tracker(): Tracker {
  var resolve!: Func;
  var reject!: Func;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return [promise, resolve, reject];
}
