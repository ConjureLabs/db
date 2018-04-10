const { Pool } = require('pg')

const DatabaseTable = require('./DatabaseTable')
const DatabaseRow = require('./DatabaseRow')

// these will be set upon connection
let pool
let queryLogger

// queue of resolve methods
const awaitingConfig = []

// allow to wait for config, since config may be received after a query
function waitForConfig() {
  return new Promise(resolve => {
    awaitingConfig.push(resolve)
  })
}

function haveConfig() {
  // override `waitForConfig()` to immediately fire resolves
  waitForConfig = function() {
    return new Promise(resolve => {
      resolve()
    })
  }

  // flush queue
  while (awaitingConfig.length) {
    const resolve = awaitingConfig.shift()
    resolve()
  }
}

function init(config, options, logger = function() {}) {
  // if in production, prevent values from being logged
  queryLogger = process.env === 'production' ? sql => logger(sql) : logger
  // pass any options to DatabaseTable
  DatabaseTable.options = options || {}

  pool = new Pool(config)
  haveConfig() // will flush queue of any pending promises
}
module.exports.init = init

async function minimalQuery(...args) {
  // pause until connection config is sent in
  await waitForConfig()

  // acquire a client from the pool
  const client = await pool.connect()

  // pass args for logging
  queryLogger(args[0] /* sql */, args[1] || [] /* placeholder values */)
  const result = await client.query(...args)

  client.release()

  return result
}
module.exports.minimalQuery = minimalQuery

async function query(...args) {
  const result = await minimalQuery(...args)
  const noTable = new DatabaseTable() // no table name defined
  result.rows = noTable.mapRowInstances(result)
  return result
}
module.exports.query = query

async function queryRaw(...args) {
  return await minimalQuery(...args)
}
module.exports.queryRaw = queryRaw

module.exports.DatabaseTable = DatabaseTable
module.exports.DatabaseRow = DatabaseRow
