const test = require('ava')

// first init db
require('../../../helpers/init')

const { DatabaseTable } = require('../../../../')
const generateTableName = require('../../../helpers/generate-table')
const truncateTable = require('../../../helpers/truncate-table')

// setup tmp table
let tableName
test.before(async () => tableName = (await generateTableName()).tableName)

// wipe tmp table before each test
test.beforeEach(async () => {
  await truncateTable(tableName)
  await DatabaseTable.insert(tableName, {
    name: 'asdf',
    hasSomething: true
  }, {
    name: 'foo',
    has_something: true
  }, {
    name: 'bar',
    hasSomething: false
  }, {
    name: 'xyz',
    has_something: true
  })
})

test('Should return a promise', t => {
  const result = DatabaseTable.delete(tableName, {
    has_something: false
  })
  t.true(result instanceof Promise)
})

test('Should delete a row', async t => {
  const rows = await DatabaseTable.select(tableName, {
    has_something: false
  })
  t.is(rows.length, 1)

  await DatabaseTable.delete(tableName, {
    hasSomething: false
  })
  const rows2 = await DatabaseTable.select(tableName, {
    has_something: false
  })
  t.is(rows2.length, 0)
})

test('Should return deleted rows', async t => {
  const initialRows = await DatabaseTable.select(tableName, {
    has_something: false
  })
  t.is(initialRows.length, 1)

  const rows = await DatabaseTable.delete(tableName, {
    has_something: false
  })

  const finalRows = await DatabaseTable.select(tableName, {
    has_something: false
  })
  t.is(finalRows.length, 0)

  t.is(initialRows[0].id, rows[0].id)
  t.is(rows[0].has_something, false)
})

test('Should delete multiple', async t => {
  const initialRows = await DatabaseTable.select(tableName, {
    has_something: true
  })
  t.is(initialRows.length, 3)

  const rows = await DatabaseTable.delete(tableName, {
    hasSomething: true
  })
  t.true(Array.isArray(rows))
  t.is(rows.length, 3)

  const finalRows = await DatabaseTable.select(tableName, {
    hasSomething: true
  })
  t.is(finalRows.length, 0)
})
