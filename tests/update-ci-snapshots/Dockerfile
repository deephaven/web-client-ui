# syntax=docker/dockerfile:1
# Dockerfile for updating the snapshots.
# Expects to be run with `web-client-ui` root dir mounted in the `/work/` directory, and with the `--network host` flag
FROM mcr.microsoft.com/playwright:v1.30.0-focal
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

# Next copy just the package.json and package-lock.json files over so we can install dependencies and cache at this layer
# Doesn't seem to be an easy way to copy it with a glob and retain the directory structure.
# Will need to add new packages here when they are created.
# https://stackoverflow.com/questions/49939960/docker-copy-files-using-glob-pattern#comment106088784_49940132
COPY package.json package-lock.json skip.js .
COPY packages/babel-preset/package.json packages/babel-preset/
COPY packages/chart/package.json packages/chart/
COPY packages/embed-chart/package.json packages/embed-chart/
COPY packages/embed-grid/package.json packages/embed-grid/
COPY packages/filters/package.json packages/filters/
COPY packages/golden-layout/package.json packages/golden-layout/
COPY packages/mocks/package.json packages/mocks/
COPY packages/prettier-config/package.json packages/prettier-config/
COPY packages/react-hooks/package.json packages/react-hooks/
COPY packages/tsconfig/package.json packages/tsconfig/
COPY packages/utils/package.json packages/utils/
COPY packages/storage/package.json packages/storage/
COPY packages/dashboard/package.json packages/dashboard/
COPY packages/stylelint-config/package.json packages/stylelint-config/
COPY packages/components/package.json packages/components/
COPY packages/dashboard-core-plugins/package.json packages/dashboard-core-plugins/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY packages/jsapi-shim/package.json packages/jsapi-shim/
COPY packages/iris-grid/package.json packages/iris-grid/
COPY packages/icons/package.json packages/icons/
COPY packages/log/package.json packages/log/
COPY packages/pouch-storage/package.json packages/pouch-storage/
COPY packages/file-explorer/package.json packages/file-explorer/
COPY packages/redux/package.json packages/redux/
COPY packages/jsapi-components/package.json packages/jsapi-components/
COPY packages/code-studio/package.json packages/code-studio/
COPY packages/jsapi-utils/package.json packages/jsapi-utils/
COPY packages/console/package.json packages/console/
COPY packages/grid/package.json packages/grid/

# Disable the postinstall script, or npm ci will try and build and the files won't be there
# We don't need the postinstall since we're going to rebuild right after
# RUN npm pkg set scripts.postinstall="echo no-postinstall"
RUN SKIP_POSTINSTALL=1 npm ci

# Copy the web-client-ui src folder to the docker image
# We do this last because the source files are the most likely to change
# This requires the Dockerfile to be built in the context of the root of the web-client-ui repository
# https://stackoverflow.com/a/34300129
COPY . .

# Now build the app. We only need the code-studio built for e2e tests.
RUN VITE_CORE_API_URL=http://host.docker.internal:10000/jsapi npm run build:app