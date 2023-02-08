# syntax=docker/dockerfile:1
# Dockerfile for updating the snapshots.
# Expects to be run with `web-client-ui` root dir mounted in the `/work/` directory, and with the `--network host` flag
FROM mcr.microsoft.com/playwright:v1.30.0-focal
WORKDIR /work/

# Copy the web-client-ui src folder to the docker image
# This requires the Dockerfile to be built in the context of the root of the web-client-ui repository
# https://stackoverflow.com/a/34300129
ADD . /work

# Update packages list and install some build tools
RUN set -eux; \
    apt-get update; \
    apt-get install build-essential --yes;

# Download nvm so that we can install the correct version of node/npm
RUN set -eux; \
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.2/install.sh | bash;