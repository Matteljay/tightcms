#!/bin/bash
set -e

[[ -d node_modules ]] || npm ci --only=production

export EXPRESS_PORT=80
export DB_HOST=localhost
#export DB_PORT=27017
#export DB_USER=
#export DB_PASS=
#export DB_NAME="tightcms_content"
export USER_PW_SALT="tightsalt"
export JWT_SECRET="tightsecret"
#export JWT_EXPIRE="125h"

exec node svr.js

# EOF
