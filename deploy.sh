#!/bin/bash

# Deploy script
#
# Usage: ./submit.sh -u my_ischool_username -d dir
#

ISCHOOL_USERNAME="${USER}"
DIRECTORY="prj"

while getopts "u:d" opt; do
  case $opt in
    u)
      ISCHOOL_USERNAME="${OPTARG}"
      ;;
    d)
      DIRECTORY="${OPTARG}"
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      ;;
  esac
done

set -e

echo "=== Deploying to ${ISCHOOL_USERNAME}@ischool.berkeley.edu:~/public_html/${DIRECTORY} ==="
rsync -av -e ssh --exclude='deploy.sh' --exclude='.git' * ${ISCHOOL_USERNAME}@ischool.berkeley.edu:~/public_html/${DIRECTORY}
echo "=== Done ==="