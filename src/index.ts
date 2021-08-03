import { Octokit } from "@octokit/core";
import gitUrlParse from "git-url-parse";
import { getAppOctokit } from "./auth";
import { config, environment } from "./properties";

const main = async () => {
  console.log("Fetching app config...");
  const appOctokit = await getAppOctokit();
  if (!appOctokit) {
    throw new Error("Could not authenticate app");
  }

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
    factory: (opts: any) => new Octokit(opts),
  })) as Octokit;

  console.log("Creating deployment...");
  const res = await octokit.request("POST /repos/{owner}/{repo}/deployments", {
    ...octokitOptions,
    ref: config.ref,
    environment: config.environment,
    production_environment:
      config.environment === "prod" || config.environment === "production",
    task: "deploy:weco",
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
