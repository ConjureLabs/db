#! /bin/bash

BASE="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )";

TABLE_NAME=$1

echo "TRUNCATE TABLE $TABLE_NAME" | psql conjure_db_test -w --username=conjure_db_user
