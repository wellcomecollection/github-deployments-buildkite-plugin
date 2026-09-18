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
run_plugin() {
  local dir
  dir=$(mktemp -d)
  trap 'rm -rf "${dir}"' RETURN

  local url
  url=$(plugin_url)
  echo "${url}"
  curl -Lf -o "${dir}/${PLUGIN_EXECUTABLE}" "${url}"
  chmod +x "${dir}/${PLUGIN_EXECUTABLE}"

  "${dir}/${PLUGIN_EXECUTABLE}" "$1"
}

# Wrapper mode is opt in: without it the pre-command and pre-exit hooks stay out of the way.
wrapping_command() {
  [[ "${BUILDKITE_PLUGIN_GITHUB_DEPLOYMENTS_WRAP:-false}" == "true" ]]
}
