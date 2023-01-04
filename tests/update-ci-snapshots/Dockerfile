# syntax=docker/dockerfile:1
# Dockerfile for updating the snapshots.
# Expects to be run with `web-client-ui` root dir mounted in the `/work/` directory, and with the `--network host` flag
FROM mcr.microsoft.com/playwright:v1.28.1-focal
WORKDIR /work/

# Update packages list and install some build tools
RUN set -eux; \
    apt-get update; \
    apt-get install build-essential --yes;

# Use nvm to install and use the correct version of node
RUN set -eux; \
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.2/install.sh | bash;

# Running this exits with code 3 even though it succeeds...
RUN export NVM_DIR="$HOME/.nvm"; \
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh";

# # Install npm depdendencies and build the production app, pointing to an API server running on your machine
# RUN set -eux; \
#     npm run clean; \
#     npm ci; \
#     VITE_CORE_API_URL=http://host.docker.internal:10000/jsapi npm run build;

# # Run the tests and update the snapshots
# RUN set -eux; \
#     npm run e2e:update-snapshots;

# # Clean up after ourselves so we don't leave `node_modules` in a state not suitable for the host platform
# RUN set -eux; \
#     npm run clean;