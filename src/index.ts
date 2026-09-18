import { createDeployment, createDeploymentStatus } from "./deployments";
import { config, environment, validateConfig } from "./properties";
import { getJobDeploymentId } from "./metadata";

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
  // Not reached through the hooks: in wrapper mode the command hook runs the
  // step's command instead of the binary. Here for a direct invocation.
  if (config.wrap) {
    console.log("Wrapping the step command, nothing to do in the command hook");
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
  // Only a recorded zero is success. An unset status means the command never
  // reported one, and a deployment left at in_progress is never resolved.
  const exitStatus = environment.commandExitStatus;
  if (exitStatus === "0") {
    return;
  }
  // With no status the job died before its command phase, so it may have made
  // no deployment at all. Failing the build's most recent one would report an
  // earlier step's successful deploy as broken.
  if (exitStatus === undefined && !getJobDeploymentId()) {
    console.log("This job created no deployment, so there is nothing to fail");
    return;
  }
  console.log(`Command exited with ${exitStatus ?? "no recorded status"}`);
  await createDeploymentStatus("failure", true);
};

const main = async () => {
  const hook = readHook();
  validateConfig();
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
