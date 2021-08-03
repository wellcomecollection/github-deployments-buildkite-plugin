const PLUGIN_NAME = "GITHUB_DEPLOYMENTS";

const envVar = (name: string) =>
  `BUILDKITE_PLUGIN_${PLUGIN_NAME}_${name.toUpperCase()}`;

export const environment = {
  commit: process.env.BUILDKITE_COMMIT!,
  repo: process.env.BUILDKITE_REPO!,
};

export const config = {
  environment: process.env[envVar("environment")] || "stage",
  ref: process.env[envVar("ref")] || environment.commit,
  assumeRole: process.env[envVar("assume_role")],
};
