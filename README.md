# github-deployments-buildkite-plugin

A Buildkite plugin for managing GitHub deployments

## Example

Add the following to your `pipeline.yml`:

```yml
steps:
  - plugins:
      - wellcomecollection/github-deployments#v0.1.2:
          ref: ${BUILDKITE_COMMIT}
          environment: stage
```

## Configuration

### `ref` (string, default is the value of `BUILDKITE_COMMIT`)

The ref to create the deployment for as per https://docs.github.com/en/rest/reference/repos#deployments

### `environment` (string, default `stage`)

The environment to create the deployment for as per https://docs.github.com/en/rest/reference/repos#deployments

## Development

The plugin is written in Typescript and compiled into binaries with https://github.com/vercel/pkg - when you push a tag, a GitHub action will create a release for you.
