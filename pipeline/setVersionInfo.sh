#!/usr/bin/env bash

FILENAME="$1"

sed -i -e "s|\###date###|$(date -u +%F' %T.%3N UTC')|g" ${FILENAME}
sed -i -e "s|\###GITHUB_REF_NAME###|$GITHUB_REF_NAME|g" ${FILENAME}
sed -i -e "s|\###GITHUB_RUN_NUMBER###|$GITHUB_RUN_NUMBER|g" ${FILENAME}
sed -i -e "s|\###GITHUB_SHA###|$GITHUB_SHA|g" ${FILENAME}