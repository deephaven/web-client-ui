#!/usr/bin/env bash
set -o errexit
set -o pipefail
set -o nounset

# Use nvm with the `--install` flag to install the correct version of node/npm based on the `.nvmrc`
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" --install

# Install and build the app
npm ci
VITE_CORE_API_URL=http://host.docker.internal:10000/jsapi npm run build

# Update the snapshots
# npx playwright test --update-snapshots --config=tests/update-ci-snapshots/ci-snapshots.config
npm run e2e:update-snapshots -- --config=playwright-ci.config.ts