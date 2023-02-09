# syntax=docker/dockerfile:1
# Dockerfile for updating the snapshots.
# Expects to be run with `web-client-ui` root dir mounted in the `/work/` directory, and with the `--network host` flag
FROM mcr.microsoft.com/playwright:v1.30.0-focal
WORKDIR /work/

# Update packages list and install some build tools
RUN set -eux; \
    apt-get update; \
    apt-get install build-essential --yes;

# Install nvm
# RUN export NVM_DIR="$HOME/.nvm";

# Copy the web-client-ui src folder to the docker image
# This requires the Dockerfile to be built in the context of the root of the web-client-ui repository
# https://stackoverflow.com/a/34300129
COPY . /work

# Download nvm so that we can install the correct version of node/npm
# Need to set +e here, because nvm exits with code 3
# https://github.com/nvm-sh/nvm/issues/1985#issuecomment-466895605
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.2/install.sh | bash; \
    set +e; \
    [ -s "$HOME/.nvm/nvm.sh" ] && \. "$HOME/.nvm/nvm.sh" --install; \
    set -e; \
    npm ci; \
    VITE_CORE_API_URL=http://host.docker.internal:10000/jsapi npm run build;
# # RUN nvm install

# # Install and build the app
# RUN npm ci; \
#     VITE_CORE_API_URL=http://host.docker.internal:10000/jsapi npm run build;