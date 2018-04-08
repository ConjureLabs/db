#! /bin/bash

BASE="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )";
. $BASE/setup.cfg;

set -e;

(
  # first filling in db
  cd $PROJ_DIR/test/fixtures;
  source ./init-db.sql;

  # test against db
  ava test --serial;
);
