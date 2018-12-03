#!/bin/bash

# Deploy script
#
# Usage: ./gitlabci.sh -u my_ischool_username -d dir
#

rsync -av index.html public/index.html
rsync -av Data/ public/Data/
rsync -av js/ public/js/
rsync -av css/ public/css/