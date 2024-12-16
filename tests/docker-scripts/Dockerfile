# This is a workaround for copying all package.json files w/ directory structure
# without needing to list every file as a COPY command
# The copy --from=copy-packages command will be a cache hit if the package.json files didn't change
FROM alpine AS copy-packages
WORKDIR /work/
COPY . /tmp/web-client-ui
COPY package.json package-lock.json skip.js ./
# cd first so the cp doesn't include /tmp/web-client-ui in the paths
RUN cd /tmp/web-client-ui && cp --parents ./packages/*/package.json /work/

# syntax=docker/dockerfile:1
# Dockerfile for updating the snapshots.
# Expects to be run from the root of the web-client-ui repo
FROM mcr.microsoft.com/playwright:v1.49.0-noble AS playwright
WORKDIR /work/

# Update packages list and install some build tools
RUN set -eux; \
    apt-get update; \
    apt-get install build-essential --yes;

# print installed fonts for debugging
RUN fc-list : family;

# Copy just the .nvmrc first and install nvm/node/npm first as these will change the least often
# https://docs.docker.com/build/cache/
COPY .nvmrc .

# nvm needs to be run in a bash shell
SHELL ["/bin/bash", "--login", "-c"]  
# The default `.bashrc` bails on the first line if not in interactive shell. 
# We can just empty it so that the nvm install below will actually run when sourcing 
# `.bashrc`  
RUN echo "" > /root/.bashrc  
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
RUN source /root/.bashrc && nvm install


# Now clobber the default node installed by the playwright
# image so that the commands in docker compose entrypoint will 
# also use the correct version of node without running in bash
RUN ln -s $(which node) /usr/local/bin/nodejs
RUN ln -s $(which node) /usr/local/bin/node
RUN ln -s $(which npm) /usr/local/bin/npm


# Copy the package.json files
COPY --from=copy-packages /work/ .

# Confirm node version is correct for debugging
RUN node --version

# Disable the postinstall script, or npm ci will try and build and the files won't be there
# We don't need the postinstall since we're going to rebuild right after
RUN SKIP_POSTINSTALL=1 npm ci

# Copy the web-client-ui src folder to the docker image
# We do this last because the source files are the most likely to change
# This requires the Dockerfile to be built in the context of the root of the web-client-ui repository
# https://stackoverflow.com/a/34300129
COPY . .

# Now build the app with our playwright.css included
RUN VITE_PLAYWRIGHT_CSS=1 npm run build