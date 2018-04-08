#! /bin/bash

BASE="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )";

TABLE_NAME=$1

echo "\
  CREATE TABLE $TABLE_NAME (\
    id SERIAL PRIMARY KEY,\
    name VARCHAR(255),\
    has_something BOOLEAN DEFAULT FALSE\
  )\
" | psql conjure_db_test -w --username=conjure_db_user
