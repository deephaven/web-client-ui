#!/bin/bash

# This script runs the docker-compose file with the given arguments
# The argument should contain the container name to run as the first argument (e.g. web-ui-tests)
# Once the container finishes its task, this script shuts down the docker containers
# because docker compose run starts dependent containers, but does not stop them
pushd "$(dirname "$0")" # Set pwd to this directory

if [[ -z "${CI}" ]]; then
  # Don't remove container in CI so we can access the logs if something fails.
  # This should get automatically cleaned up by the CI runner.
  docker compose run --service-ports --build "$@" # Passes all arguments to the compose file
else
# Locally, remove container after running
  docker compose run --service-ports --build --rm "$@" # Passes all arguments to the compose file
fi

exit_code=$?
docker compose down
popd # Reset pwd
exit $exit_code