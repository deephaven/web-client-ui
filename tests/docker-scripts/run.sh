#!/bin/bash

# This script runs the docker-compose file with the given arguments
# The argument should contain the container name to run as the first argument (e.g. web-ui-tests)
# Once the container finishes its task, this script shuts down the docker containers
# because docker compose run starts dependent containers, but does not stop them
pushd "$(dirname "$0")" # Set pwd to this directory

args=("$@")

# If we are not in CI, remove the container after running. In CI we want to keep
# the container around in case we need to dump the logs in another step of the
# GH action. It should be cleaned up automatically by the CI runner.
if [[ -z "${CI}" ]]; then
  args=(--rm "${args[@]}")
fi

echo docker compose run --service-ports --build "${args[@]}"
docker compose run --service-ports --build "${args[@]}" # Passes all arguments to the compose file

exit_code=$?
docker compose down
popd # Reset pwd
exit $exit_code