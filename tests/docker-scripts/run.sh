#!/bin/bash

# This script runs the docker-compose file with the given arguments
# Then shuts down the docker containers
# docker compose run starts dependent containers, but does not stop them

pushd "$(dirname "$0")" # Set pwd to this directory
docker compose run --service-ports --build --rm "$@" # Passes all arguments to the compose file
exit_code=$?
docker compose down
popd # Reset pwd
exit $exit_code