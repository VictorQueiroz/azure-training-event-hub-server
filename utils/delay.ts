import timers from "timers";

export function delay(ms: number) {
  return new Promise<void>((resolve) => {
    timers.setTimeout(resolve, ms);
  });
}
