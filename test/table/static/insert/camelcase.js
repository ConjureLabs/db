const { test } = require('ava')

// first init db
require('../../../helpers/init/with-transform-camel-case')

const { DatabaseTable, query } = require('../../../../')
const generateTableName = require('../../../helpers/generate-table')
const truncateTable = require('../../../helpers/truncate-table')

// setup tmp table
let tableName
let tableNameCamelCased
test.before(async () => {
  const names = await generateTableName()
  tableName = names.tableName
  tableNameCamelCased = names.tableNameCamelCased
})

// wipe tmp table before each test
test.beforeEach(async () => {
  await truncateTable(tableName)
})

test('Should return a promise', t => {
  const result = DatabaseTable.insert(tableNameCamelCased, {
    name: 'whatever',
    hasSomething: true
  })
  t.true(result instanceof Promise)
})

test('Should add a row', async t => {
  const rows = await DatabaseTable.select(tableNameCamelCased)
  t.is(rows.length, 0)

  await DatabaseTable.insert(tableNameCamelCased, {
    name: 'test name',
    hasSomething: true
  })
  const rows2 = await DatabaseTable.select(tableNameCamelCased)
  t.is(rows2.length, 1)
})

test('Should return newly created rows', async t => {
  const rows = await DatabaseTable.insert(tableNameCamelCased, {
    name: 'wild',
    hasSomething: true
  })
  t.true(Array.isArray(rows))
  t.true(typeof rows[0].id === 'number')
  t.is(rows[0].name, 'wild')
  t.is(rows[0].hasSomething, true)

  const results = await query(`SELECT * FROM ${tableName} WHERE id = $1`, [ rows[0].id ])
  t.is(results.rows[0].id, rows[0].id)
  t.is(results.rows[0].name, rows[0].name)
  t.is(results.rows[0].hasSomething, rows[0].hasSomething)
})

test('Should add multiple', async t => {
  const initialRows = await DatabaseTable.select(tableNameCamelCased)
  t.is(initialRows.length, 0)

  const rows = await DatabaseTable.insert(tableNameCamelCased, {
    name: 'abc',
    hasSomething: true
  }, {
    name: 'xyz',
    hasSomething: false
  }, {
    name: '123',
    hasSomething: true
  })
  t.true(Array.isArray(rows))
  t.is(rows.length, 3)

  const finalRows = await DatabaseTable.select(tableNameCamelCased)
  t.is(finalRows.length, 3)
})
