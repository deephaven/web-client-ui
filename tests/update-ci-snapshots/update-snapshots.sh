#!/usr/bin/env bash
set -o errexit
set -o pipefail
set -o nounset

# Need to go to a different directory to source nvm.sh, otherwise it exits with code 3
# https://github.com/nvm-sh/nvm/issues/1985#issuecomment-456022013
# pushd /;

echo "MJB update-snapshots.sh!";

pwd;

# # echo "ls -la $(ls -la $HOME/.nvm)"

# # export NVM_DIR="$HOME/.nvm"; \
# #     [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh";
# # Start up nvm, and do a `--install` because we're running in the directory with .nvmrc so it uses the correct version right away
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" --install # This loads nvm

echo "MJB nvm $(nvm --version)";
# # popd;
# pwd;

# # pushd /work/;

# # nvm install;

echo "MJB post nvm install $(npm --version) and $(node --version)";

# # Clear node_modules so we don't conflict 
# # rm -rf node_modules;
npm ci
VITE_CORE_API_URL=http://host.docker.internal:10000/jsapi npm run build

npm run e2e:update-snapshots
# # popd;