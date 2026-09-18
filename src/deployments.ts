import { Octokit } from "@octokit/core";
import gitUrlParse from "git-url-parse";
import { createAppAuth } from "@octokit/auth-app";
import { getAppAuthConfig } from "./auth";
import { config, DeploymentState, environment } from "./properties";
import { getDeploymentId, setDeploymentId } from "./metadata";

type RepoOptions = { owner: string; repo: string };

const getClient = async (): Promise<[Octokit, RepoOptions]> => {
  console.log("Fetching app config...");
  const authOptions = await getAppAuthConfig();
  const appOctokit = new Octokit({
    authStrategy: createAppAuth,
    auth: authOptions,
  });

  const repo = gitUrlParse(environment.repo);
  const octokitOptions = { owner: repo.owner, repo: repo.name };

  console.log(`Finding app installation for repo: ${repo.name}`);
  const installation = await appOctokit.request(
    "GET /repos/{owner}/{repo}/installation",
    octokitOptions
  );
  const octokit = (await appOctokit.auth({
    type: "installation",
    installationId: installation.data.id,
    factory: (factoryOptions: any) =>
      new Octokit({
        authStrategy: createAppAuth,
        auth: factoryOptions,
      }),
  })) as Octokit;

  return [octokit, octokitOptions];
};

const isProductionEnvironment =
  config.environment === "prod" || config.environment === "production";

export const createDeployment = async () => {
  const [octokit, octokitOptions] = await getClient();

  console.log("Creating deployment...");
  const res = await octokit.request("POST /repos/{owner}/{repo}/deployments", {
    ...octokitOptions,
    ref: config.ref,
    environment: config.environment,
    production_environment: isProductionEnvironment,
    task: config.task,
    auto_merge: false,
    required_contexts: [],
    mediaType: {
      // See preview notice at https://docs.github.com/en/rest/reference/repos#deployments
      previews: ["ant-man-preview"],
    },
    description: config.description,
  });

  if (res.status !== 201) {
    throw new Error(
      `Failed to create deployment: ${res.status} ${res.data.message}`
    );
  }

  console.log(`Created deployment at ${res.data.url}`);
  setDeploymentId(config.environment, res.data.id);
  return res.data.id;
};

export const createDeploymentStatus = async (state: DeploymentState) => {
  // Read the id before authenticating so a missing deployment fails quickly.
  const deploymentId = Number(
    config.deploymentId || getDeploymentId(config.environment)
  );
  if (!Number.isInteger(deploymentId)) {
    throw new Error(`Deployment id is not a number: ${deploymentId}`);
  }

  const [octokit, octokitOptions] = await getClient();

  console.log(`Creating "${state}" status for deployment ${deploymentId}...`);
  const res = await octokit.request(
    "POST /repos/{owner}/{repo}/deployments/{deployment_id}/statuses",
    {
      ...octokitOptions,
      deployment_id: deploymentId,
      state,
      // GitHub takes the environment from the deployment being reported on.
      environment_url: config.environmentUrl,
      log_url: config.logUrl,
      description: config.description,
      mediaType: {
        // See preview notice at https://docs.github.com/en/rest/reference/repos#deployments
        previews: ["ant-man-preview", "flash-preview"],
      },
    }
  );

  if (res.status !== 201) {
    throw new Error(`Failed to create deployment status: ${res.status}`);
  }

  console.log(`Created deployment status at ${res.data.url}`);
};
