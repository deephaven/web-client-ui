#!/usr/bin/env bash
# Checks that exactly one of the provided arguments is true
# Iterates through all environment variables with the prefix LABEL_, expecting only one to be true

set -o errexit
set -o pipefail
set -o nounset

COUNT_TRUE=0
ALL_LABELS=""

for label in ${!LABEL_*}; do
  ALL_LABELS+=" ${label#*_}"
  if [ "${!label}" == "true" ] ; then
    COUNT_TRUE=$((COUNT_TRUE + 1))
  fi
done

if [ $COUNT_TRUE -eq 1 ] ; then
  exit 0
fi

>&2 echo "Expected only one of the following labels, instead found ${COUNT_TRUE}:${ALL_LABELS}"
exit 1