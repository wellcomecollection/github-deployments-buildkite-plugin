import { Octokit } from "@octokit/core";
import gitUrlParse from "git-url-parse";
import { getAppAuthConfig } from "./auth";
import { config, environment } from "./properties";
import { createAppAuth } from "@octokit/auth-app";

const main = async () => {
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

  console.log("Creating deployment...");
  const res = await octokit.request("POST /repos/{owner}/{repo}/deployments", {
    ...octokitOptions,
    ref: config.ref,
    environment: config.environment,
    production_environment:
      config.environment === "prod" || config.environment === "production",
    task: config.task,
    auto_merge: false,
    required_contexts: [],
    mediaType: {
      // See preview notice at https://docs.github.com/en/rest/reference/repos#deployments
      previews: ["ant-man-preview"],
    },
  });

  if (res.status === 201) {
    console.log(`Created deployment at ${res.data.url}`);
  } else {
    throw new Error(
      `Failed to create deployment: ${res.status} ${res.data.message}`
    );
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
