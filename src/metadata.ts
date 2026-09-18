import { execFileSync } from "child_process";

// Meta-data is scoped to the build, so the key has to tell apart every
// deployment one build can make: stage then prod, two tasks to one environment,
// and a step run under parallelism, where each job deploys separately.
export const deploymentIdKey = (environment: string, task: string) => {
  const parallelJob = process.env.BUILDKITE_PARALLEL_JOB;
  const job = parallelJob === undefined ? "" : `:${parallelJob}`;
  return `github_deployment:${environment}:${task}${job}:id`;
};

export const setDeploymentId = (
  environment: string,
  task: string,
  deploymentId: number
) => {
  const key = deploymentIdKey(environment, task);
  console.log(`Setting build meta-data ${key} to ${deploymentId}`);
  try {
    execFileSync("buildkite-agent", [
      "meta-data",
      "set",
      key,
      String(deploymentId),
    ]);
  } catch (error) {
    // Warned about rather than thrown: the deployment exists by this point, and
    // failing here would report a deploy as broken when only the record of it is.
    console.error(
      `Could not write build meta-data ${key}: ${error}. A later step will not find deployment ${deploymentId} unless it is passed the deployment_id option.`
    );
  }
};

export const getDeploymentId = (environment: string, task: string): string => {
  const key = deploymentIdKey(environment, task);
  console.log(`Reading deployment id from build meta-data ${key}`);
  try {
    return execFileSync("buildkite-agent", ["meta-data", "get", key], {
      encoding: "utf8",
    }).trim();
  } catch (error) {
    throw new Error(
      `Could not read build meta-data ${key}, so there is no deployment to post a status to. Either create the deployment earlier in this build or pass the deployment_id option. The underlying error was: ${error}`
    );
  }
};
