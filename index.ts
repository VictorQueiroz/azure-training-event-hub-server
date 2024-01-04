import Consumer from "./Consumer";
import { getArgument } from "cli-argument-helper";
import Producer from "./Producer";

(async () => {
  const args = process.argv.slice(2);

  if (getArgument(args, "--consumer") !== null) {
    const server = new Consumer();
    await server.configure();
  } else {
    new Producer();
  }

  console.log("Running!");
})().catch((reason) => {
  console.error("Fatal failure: %o", reason);
});
