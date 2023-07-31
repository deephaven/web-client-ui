# syntax=docker/dockerfile:1
# Dockerfile for updating the snapshots.
# Expects to be run from the root of the web-client-ui repo
FROM mcr.microsoft.com/playwright:v1.30.0-jammy AS playwright
WORKDIR /work/

# Update packages list and install some build tools
RUN set -eux; \
    apt-get update; \
    apt-get install build-essential --yes;

# Copy just the .nvmrc first and install nvm/node/npm first as these will change the least often
# https://docs.docker.com/build/cache/
COPY .nvmrc .

# Set the default shell so the correct node/npm is used after install
# https://stackoverflow.com/a/60137919
SHELL ["/bin/bash", "--login", "-i", "-c"]
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
RUN source /root/.bashrc && nvm install
SHELL ["/bin/bash", "--login", "-c"]

# This is a workaround for copying all package.json files w/ directory structure
# without needing to list every file as a COPY command
# The copy --from=copy-packages command will be a cache hit if the package.json files didn't change
FROM alpine as copy-packages
WORKDIR /work/
COPY . /tmp/web-client-ui
COPY package.json package-lock.json skip.js .
# cd first so the cp doesn't include /tmp/web-client-ui in the paths
RUN cd /tmp/web-client-ui && cp --parents ./packages/*/package.json /work/

FROM playwright as build
WORKDIR /work/
COPY --from=copy-packages /work/ .

# Next copy just the package.json and package-lock.json files over so we can install dependencies and cache at this layer
# Doesn't seem to be an easy way to copy it with a glob and retain the directory structure.
# Will need to add new packages here when they are created.
# https://stackoverflow.com/questions/49939960/docker-copy-files-using-glob-pattern#comment106088784_49940132

# Disable the postinstall script, or npm ci will try and build and the files won't be there
# We don't need the postinstall since we're going to rebuild right after
RUN SKIP_POSTINSTALL=1 npm ci

# Copy the web-client-ui src folder to the docker image
# We do this last because the source files are the most likely to change
# This requires the Dockerfile to be built in the context of the root of the web-client-ui repository
# https://stackoverflow.com/a/34300129
COPY . .

# Now build the app. We only need the code-studio built for e2e tests.
RUN npm run build:app