#!/usr/bin/env bash
set -o errexit
set -o pipefail
set -o nounset

cd /work/

npm ci
VITE_CORE_API_URL=http://host.docker.internal:10000/jsapi npm run build

npm run e2e:update-snapshots