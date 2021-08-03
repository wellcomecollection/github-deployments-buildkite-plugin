import AWS from "aws-sdk";
import { createAppAuth, StrategyOptions } from "@octokit/auth-app";
import { Octokit } from "@octokit/core";

const authConfigSecrets = {
  appId: "github/weco_app/id",
  privateKey: "github/weco_app/private_key",
};

const getAppAuthConfig = async () => {
  const config = { ...authConfigSecrets };
  const secretsManager = new AWS.SecretsManager();
  for (const [configKey, secretId] of Object.entries(authConfigSecrets)) {
    const result = await secretsManager
      .getSecretValue({ SecretId: secretId })
      .promise();
    config[configKey as keyof typeof config] = result["SecretString"]!;
  }
  return config as StrategyOptions;
};

export const getAppOctokit = async () => {
  const config = await getAppAuthConfig();
  return (
    config &&
    new Octokit({
      authStrategy: createAppAuth,
      auth: config,
    })
  );
};
