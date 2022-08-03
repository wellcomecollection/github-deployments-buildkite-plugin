const PLUGIN_NAME = "GITHUB_DEPLOYMENTS";

const envVar = (name: string) =>
  `BUILDKITE_PLUGIN_${PLUGIN_NAME}_${name.toUpperCase()}`;

export const environment = {
  commit: process.env.BUILDKITE_COMMIT!,
  repo: process.env.BUILDKITE_REPO!,
};

const environmentName = process.env[envVar("environment")] || "stage";

export const config = {
  environment: environmentName,
  ref: process.env[envVar("ref")] || environment.commit,
  assumeRole: process.env[envVar("assume_role")],
  task: process.env[envVar("task")] || "deploy:weco",
  description: `Deployment (${environmentName})`,
};
