#!/bin/bash

# This script runs the docker-compose file with the given arguments
# The argument should contain the container name to run as the first argument (e.g. web-ui-tests)
# Once the container finishes its task, this script shuts down the docker containers
# because docker compose run starts dependent containers, but does not stop them
pushd "$(dirname "$0")" # Set pwd to this directory

if [[ "${CI}" == "1" || "${CI}" == "true" ]]; then
  # In CI, keep the container in case we need to dump logs in another
  # step of the GH action. It should be cleaned up automatically by the CI runner.
  docker compose run --service-ports --build -e CI=true "$@"
  exit_code=$?
  docker compose stop
else
  docker compose run --service-ports --rm --build "$@"
  exit_code=$?
  docker compose down
fi

popd # Reset pwd
exit $exit_code