import { execFileSync } from "child_process";

// Meta-data is scoped to the build, so the environment goes in the key: one build can deploy stage and then prod.
export const deploymentIdKey = (environment: string) =>
  `github_deployment:${environment}:id`;

export const setDeploymentId = (environment: string, deploymentId: number) => {
  const key = deploymentIdKey(environment);
  console.log(`Setting build meta-data ${key} to ${deploymentId}`);
  execFileSync("buildkite-agent", [
    "meta-data",
    "set",
    key,
    String(deploymentId),
  ]);
};

export const getDeploymentId = (environment: string): string => {
  const key = deploymentIdKey(environment);
  console.log(`Reading deployment id from build meta-data ${key}`);
  try {
    return execFileSync("buildkite-agent", ["meta-data", "get", key], {
      encoding: "utf8",
    }).trim();
  } catch (error) {
    throw new Error(
      `Could not read build meta-data ${key}, so there is no deployment to post a status to. Either create the deployment earlier in this build or pass the deployment_id option.`
    );
  }
};
