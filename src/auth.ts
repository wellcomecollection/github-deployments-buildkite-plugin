import AWS from "aws-sdk";
import { createAppAuth, StrategyOptions } from "@octokit/auth-app";
import { Octokit } from "@octokit/core";
import { config } from "./properties";

const authConfigSecrets = {
  appId: "github/weco_app/id",
  privateKey: "github/weco_app/private_key",
};

const getSecretsManager = async (role?: string) => {
  if (role) {
    const sts = new AWS.STS();
    const result = await sts
      .assumeRole({
        RoleArn: role,
        RoleSessionName: "AssumeRoleSession1",
      })
      .promise();
    const credentials = result["Credentials"];
    return new AWS.SecretsManager({
      accessKeyId: credentials?.AccessKeyId,
      secretAccessKey: credentials?.SecretAccessKey,
      sessionToken: credentials?.SessionToken,
    });
  }
  return new AWS.SecretsManager();
};

const getAppAuthConfig = async () => {
  const authConfig = { ...authConfigSecrets };
  const secretsManager = await getSecretsManager(config.assumeRole);
  for (const [configKey, secretId] of Object.entries(authConfigSecrets)) {
    const result = await secretsManager
      .getSecretValue({ SecretId: secretId })
      .promise();
    authConfig[configKey as keyof typeof authConfig] = result["SecretString"]!;
  }
  return authConfig as StrategyOptions;
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
