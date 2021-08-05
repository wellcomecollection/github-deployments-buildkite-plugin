# github-deployments-buildkite-plugin

A Buildkite plugin for managing GitHub deployments

## Example

Add the following to your `pipeline.yml` - this will create a deployment for the current commit in the `stage` environment:

```yml
steps:
  - plugins:
      - wellcomecollection/github-deployments#v0.2.4:
          ref: ${BUILDKITE_COMMIT}
          environment: stage
```

## Configuration

### `ref` (string, default is the value of `BUILDKITE_COMMIT`)

The ref to create the deployment for as per https://docs.github.com/en/rest/reference/repos#deployments

### `environment` (string, default `stage`)

The environment to create the deployment for as per https://docs.github.com/en/rest/reference/repos#deployments

### `assume_role` (string, optional)

The ARN of the role for the plugin to assume when fetching secrets

### `task` (string, default `deploy:weco`)

The name of the GitHub Deployment task - useful for distinguishing between different deploy types.

## Development

The plugin is written in Typescript and compiled into binaries with https://github.com/vercel/pkg - when you push a tag, a GitHub action will create a release for you.

## Secrets module

The terraform module in `secrets` can be used to create the secrets that the plugin requires (for storing GitHub App config), and provides an output of an IAM policy document for accessing those secrets.
