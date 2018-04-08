#! /bin/bash

BASE="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )";
. $BASE/setup.cfg;

set -e;

(
  # first filling in db
  cd $PROJ_DIR/test/helpers/fixtures;
  psql postgres -w --file="init-db.sql";
  psql postgres -w --username=conjure_db_user --file="fill-db.sql";
);

ava test --serial;
