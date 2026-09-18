const PLUGIN_NAME = "GITHUB_DEPLOYMENTS";

const envVar = (name: string) =>
  `BUILDKITE_PLUGIN_${PLUGIN_NAME}_${name.toUpperCase()}`;

export const environment = {
  commit: process.env.BUILDKITE_COMMIT!,
  repo: process.env.BUILDKITE_REPO!,
  buildUrl: process.env.BUILDKITE_BUILD_URL,
  commandExitStatus: process.env.BUILDKITE_COMMAND_EXIT_STATUS,
};

export const deploymentStates = ["in_progress", "success", "failure"] as const;

export type DeploymentState = typeof deploymentStates[number];

const readState = (): DeploymentState | undefined => {
  const state = process.env[envVar("status")];
  if (!state) {
    return undefined;
  }
  if (!deploymentStates.includes(state as DeploymentState)) {
    throw new Error(
      `Unknown status "${state}", expected one of: ${deploymentStates.join(
        ", "
      )}`
    );
  }
  return state as DeploymentState;
};

const environmentName = process.env[envVar("environment")] || "stage";

export const config = {
  environment: environmentName,
  ref: process.env[envVar("ref")] || environment.commit,
  assumeRole: process.env[envVar("assume_role")],
  task: process.env[envVar("task")] || "deploy:weco",
  wrap: process.env[envVar("wrap")] === "true",
  status: readState(),
  deploymentId: process.env[envVar("deployment_id")],
  environmentUrl: process.env[envVar("environment_url")],
  logUrl: process.env[envVar("log_url")] || environment.buildUrl,
  description:
    process.env[envVar("description")] || `Deployment (${environmentName})`,
};

// Called once at startup rather than at import, so the message reaches the log
// as an error rather than an uncaught stack trace.
export const validateConfig = () => {
  if (config.wrap && config.status) {
    throw new Error(
      `wrap and status cannot be combined: wrap posts in_progress and failure around the step's own command, so the "${config.status}" status would never be sent. Use one or the other.`
    );
  }
};
