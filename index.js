const { Pool } = require('pg');
const { ContentError } = require('err');

// these will be set upon connection
let pool;
let queryLogger;

// queue of resolve methods
const awaitingConfig = [];

// allow to wait for config, since config may be received after a query
function waitForConfig() {
  return new Promise(resolve => {
    awaitingConfig.push(resolve);
  });
}

function haveConfig() {
  // override `waitForConfig()` to immediately fire resolves
  waitForConfig = function() {
    return new Promise(resolve => {
      resolve();
    });
  };

  // flush queue
  while (awaitingConfig.length) {
    const resolve = awaitingConfig.shift();
    resolve();
  }
}

function init(config, logger = function() {}) {
  pool = new Pool(config);
  // if in production, prevent values from being logged
  queryLogger = process.env === 'production' ? sql => logger(sql) : logger;
  haveConfig(); // will flush queue of any pending promises
}

async function query(...args) {
  // pause until connection config is sent in
  await waitForConfig();

  // acquire a client from the pool
  const client = await pool.connect();

  // pass args for logging
  queryLogger(args[0] /* sql */, args[1] || [] /* placeholder values */);
  const result = await client.query(...args);

  client.release();

  return result;
}

module.exports.query = query;
