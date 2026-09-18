#!/bin/bash
# Shared by the command, pre-command and pre-exit hooks.

PLUGIN_EXECUTABLE="github-deployments-buildkite-plugin"

plugin_url() {
  local plugin=${BUILDKITE_PLUGINS:-""}
  local version
  version=$(echo "$plugin" | sed -e 's/.*github-deployments-buildkite-plugin//' -e 's/\".*//')
  local repo="https://github.com/wellcomecollection/github-deployments-buildkite-plugin"

  if [ -z "${version}" ]; then
    echo "${repo}/releases/latest/download/${PLUGIN_EXECUTABLE}"
  else
    echo "${repo}/releases/download/${version:1}/${PLUGIN_EXECUTABLE}"
  fi
}

# The hook name tells the binary which of the three jobs to do.
#
# Downloaded outside the checkout: in wrapper mode the step's own command runs
# in that directory afterwards, and a stray binary there changes what it sees.
#
# Cleaned up explicitly rather than with a RETURN trap. Buildkite sources hook
# scripts, and a RETURN trap fires again when the sourced script itself ends,
# by which time the directory name is out of scope and set -u kills the job.
run_plugin() {
  local dir status url
  dir=$(mktemp -d)
  url=$(plugin_url)
  echo "${url}"

  status=0
  if curl -Lf -o "${dir}/${PLUGIN_EXECUTABLE}" "${url}"; then
    chmod +x "${dir}/${PLUGIN_EXECUTABLE}"
    "${dir}/${PLUGIN_EXECUTABLE}" "$1" || status=$?
  else
    # Reported here so a 404 on the release asset does not surface as the 127
    # of trying to run a file the download never created.
    echo "Could not download ${url}" >&2
    status=1
  fi

  rm -rf "${dir}"
  return ${status}
}

# Checked in the shell because the pre-command and pre-exit hooks tolerate the
# binary failing, so this rejection raised inside it would only be a warning.
reject_invalid_config() {
  if wrapping_command && [ -n "${BUILDKITE_PLUGIN_GITHUB_DEPLOYMENTS_STATUS:-}" ]; then
    echo "wrap and status cannot be combined: wrapper mode posts in_progress and failure around the step's own command, so the requested status would never be sent" >&2
    exit 1
  fi
}

# Wrapper mode is opt in: without it the pre-command and pre-exit hooks stay out of the way.
wrapping_command() {
  [[ "${BUILDKITE_PLUGIN_GITHUB_DEPLOYMENTS_WRAP:-false}" == "true" ]]
}
