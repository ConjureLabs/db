const { test } = require('ava')

// first init db
require('../../../helpers/init')

const { DatabaseTable, query } = require('../../../../')
const generateTableName = require('../../../helpers/generate-table')
const truncateTable = require('../../../helpers/truncate-table')

// setup tmp table
let tableName
test.before(async t => tableName = (await generateTableName()).tableName)

// wipe tmp table before each test
test.beforeEach(async t => {
  await truncateTable(tableName)
})

test('Should return a promise', t => {
  const result = DatabaseTable.insert(tableName, {
    name: 'whatever'
  })
  t.true(result instanceof Promise)
})

test('Should add a row', async t => {
  const rows = await DatabaseTable.select(tableName)
  t.is(rows.length, 0)

  await DatabaseTable.insert(tableName, {
    name: 'test name'
  })
  const rows2 = await DatabaseTable.select(tableName)
  t.is(rows2.length, 1)
})

test('Should return newly created rows', async t => {
  const rows = await DatabaseTable.insert(tableName, {
    name: 'wild'
  })
  t.true(Array.isArray(rows))
  t.true(typeof rows[0].id === 'number')
  t.is(rows[0].name, 'wild')

  const results = await query(`SELECT * FROM ${tableName} WHERE id = $1`, [ rows[0].id ])
  t.is(results.rows[0].id, rows[0].id)
  t.is(results.rows[0].name, rows[0].name)
})

test('Should add multiple', async t => {
  const initialRows = await DatabaseTable.select(tableName)
  t.is(initialRows.length, 0)

  const rows = await DatabaseTable.insert(tableName, {
    name: 'abc'
  }, {
    name: 'xyz'
  }, {
    name: '123'
  })
  t.true(Array.isArray(rows))
  t.is(rows.length, 3)

  const finalRows = await DatabaseTable.select(tableName)
  t.is(finalRows.length, 3)
})
