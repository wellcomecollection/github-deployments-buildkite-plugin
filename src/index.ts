import { createDeployment, createDeploymentStatus } from "./deployments";
import { config, environment } from "./properties";

const hooks = ["command", "pre-command", "pre-exit"] as const;

type Hook = typeof hooks[number];

// Each hook script passes its own name, so one binary serves all three.
const readHook = (): Hook => {
  const hook = process.argv[2] || "command";
  if (!hooks.includes(hook as Hook)) {
    throw new Error(
      `Unknown hook "${hook}", expected one of: ${hooks.join(", ")}`
    );
  }
  return hook as Hook;
};

const runCommandHook = async () => {
  if (config.status) {
    return createDeploymentStatus(config.status);
  }
  if (config.wrap) {
    console.log("Wrapping the step command, the pre-command hook has run");
    return;
  }
  await createDeployment();
};

const runPreCommandHook = async () => {
  if (!config.wrap) {
    return;
  }
  await createDeployment();
  await createDeploymentStatus("in_progress");
};

const runPreExitHook = async () => {
  if (!config.wrap) {
    return;
  }
  const exitStatus = environment.commandExitStatus;
  if (!exitStatus || exitStatus === "0") {
    return;
  }
  console.log(`Command exited with ${exitStatus}`);
  await createDeploymentStatus("failure");
};

const main = async () => {
  const hook = readHook();
  switch (hook) {
    case "command":
      return runCommandHook();
    case "pre-command":
      return runPreCommandHook();
    case "pre-exit":
      return runPreExitHook();
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
