#!/bin/bash
# Shared by the command, pre-command and pre-exit hooks.

# This is mostly copied from https://github.com/chronotc/monorepo-diff-buildkite-plugin/blob/master/hooks/command
download_plugin() {
  local plugin=${BUILDKITE_PLUGINS:-""}
  local version=$(echo $plugin | sed -e 's/.*github-deployments-buildkite-plugin//' -e 's/\".*//')
  local repo="https://github.com/wellcomecollection/github-deployments-buildkite-plugin"
  local url

  if [ -z ${version} ]; then
    url=${repo}/releases/latest/download/${PLUGIN_EXECUTABLE}
  else
    url=${repo}/releases/download/${version:1}/${PLUGIN_EXECUTABLE}
  fi

  echo ${url}
  curl -Lf -o ${PLUGIN_EXECUTABLE} $url && chmod +x ${PLUGIN_EXECUTABLE}
}

PLUGIN_EXECUTABLE="github-deployments-buildkite-plugin"

# The hook name tells the binary which of the three jobs to do.
run_plugin() {
  download_plugin
  ./${PLUGIN_EXECUTABLE} "$1"
}

# Wrapper mode is opt in: without it the pre-command and pre-exit hooks stay out of the way.
wrapping_command() {
  [[ "${BUILDKITE_PLUGIN_GITHUB_DEPLOYMENTS_WRAP:-false}" == "true" ]]
}
