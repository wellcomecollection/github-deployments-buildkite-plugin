# github-deployments-buildkite-plugin

A Buildkite plugin for managing GitHub deployments

## Example

Add the following to your `pipeline.yml`, which will create a deployment for the current commit in the `stage` environment:

```yml
steps:
  - plugins:
      - wellcomecollection/github-deployments#v0.4.0:
          ref: ${BUILDKITE_COMMIT}
          environment: stage
```

The id of the deployment is written to build meta-data under `github_deployment:<environment>:id`, so later steps in the same build can post statuses against it without being told which deployment they are reporting on.

## Posting deployment statuses

A step with a `status` option posts that status to an existing deployment rather than creating a new one. It uses the deployment id from build meta-data unless you pass `deployment_id`.

```yml
steps:
  - label: Deploy to stage
    command: ./deploy.sh stage
    plugins:
      - wellcomecollection/github-deployments#v0.4.0:
          environment: stage
          wrap: true

  - wait

  - label: Smoke test stage
    command: ./smoke-tests.sh stage

  - label: Report the stage deploy
    plugins:
      - wellcomecollection/github-deployments#v0.4.0:
          environment: stage
          status: success
          environment_url: https://api-stage.wellcomecollection.org
```

The first step above is in wrapper mode. With `wrap: true` the plugin creates the deployment and posts `in_progress` before the step's own command runs, then posts `failure` if that command exits non-zero. It does not post `success`, because a deploy command exiting zero usually means the rollout has started rather than finished. Post `success` from a later step once you are satisfied the deploy has landed, as the last step above does.

Wrapper mode only makes sense on a step that has a command of its own. Without `wrap: true` the `pre-command` and `pre-exit` hooks do nothing, so a step that only creates a deployment behaves as it always has.

A plugin's `command` hook replaces the step's command, so in wrapper mode this plugin runs the step's command itself, in a fresh `bash -e -c` matching the agent's own default. Buildkite runs only the first `command` hook it finds, and nothing here checks for a second one, so putting wrapper mode on the same step as another plugin that provides one, such as `docker` or `docker-compose`, gives you whichever comes first in the step's plugin list and drops the other. Plugins that only contribute an environment, such as `aws-assume-role`, are fine on the same step.

`wrap` and `status` are rejected together. Wrapper mode posts `in_progress` and `failure` around the command, so a `status` on the same step would never be sent.

Under `parallelism` each job wraps its own command and gets its own deployment, since the meta-data key includes the parallel job index.

## Configuration

### `ref`

The ref to create the deployment for as per https://docs.github.com/en/rest/reference/repos#deployments. A string, defaulting to the value of `BUILDKITE_COMMIT`.

### `environment`

The environment to create the deployment for as per https://docs.github.com/en/rest/reference/repos#deployments. A string, defaulting to `stage`. An environment named `prod` or `production` is marked as a production environment on GitHub.

### `assume_role`

The ARN of the role for the plugin to assume when fetching secrets. A string, optional.

### `task`

The name of the GitHub Deployment task, useful for distinguishing between different deploy types. A string, defaulting to `deploy:weco`.

### `status`

The status to post against an existing deployment, one of `in_progress`, `success` or `failure`. A string, optional. When it is set the plugin posts a status instead of creating a deployment.

### `deployment_id`

The id of the deployment to post a status to. A string or integer, optional. When it is not set the plugin reads the id from build meta-data under `github_deployment:<environment>:<task>:id`, which is where it wrote the id when it created the deployment. Under `parallelism` the key gains a `:<index>` before `:id`, so parallel jobs do not overwrite each other.

### `environment_url`

The URL where the deployed environment can be reached, shown alongside the deployment on GitHub. A string, optional.

### `log_url`

The URL of the logs for this deploy. A string, defaulting to the value of `BUILDKITE_BUILD_URL`.

### `description`

The description recorded against the deployment or the status. A string, defaulting to `Deployment (<environment>)`.

### `wrap`

Whether to create a deployment and report on the step's own command. A boolean, defaulting to `false`. See the section on posting deployment statuses above.

## Development

The plugin is written in TypeScript and compiled into binaries with https://github.com/vercel/pkg. When you push a tag, a GitHub Action will create a release for you.

The three hooks share the version detection and download logic in `lib/plugin.bash`, and each passes its own name to the binary so that one entry point can serve all of them.

## Secrets module

The terraform module in `secrets` can be used to create the secrets that the plugin requires (for storing GitHub App config), and provides an output of an IAM policy document for accessing those secrets.
