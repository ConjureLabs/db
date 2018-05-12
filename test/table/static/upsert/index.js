const { test } = require('ava')

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
    has_something: true
  }, {
    name: 'foo',
    has_something: true
  }, {
    name: 'bar',
    has_something: false
  }, {
    name: 'xyz',
    has_something: true
  })
})

test('Should return a promise', t => {
  const result = DatabaseTable.upsert(tableName, {
    has_something: true
  }, {
    has_something: true
  }, {
    has_something: false
  })
  t.true(result instanceof Promise)
})

test('Should update a row', async t => {
  const rows = await DatabaseTable.select(tableName, {
    has_something: false
  })
  t.is(rows.length, 1)

  await DatabaseTable.upsert(tableName, {
    has_something: true
  }, {
    has_something: true
  }, {
    has_something: false
  })
  const rows2 = await DatabaseTable.select(tableName, {
    has_something: false
  })
  t.is(rows2.length, 0)
})

test('Should return newly updated rows', async t => {
  const initialRows = await DatabaseTable.select(tableName, {
    has_something: false
  })
  t.is(initialRows.length, 1)

  const rows = await DatabaseTable.upsert(tableName, {
    has_something: true
  }, {
    has_something: true
  }, {
    has_something: false
  })

  const finalRows = await DatabaseTable.select(tableName, {
    has_something: false
  })
  t.is(finalRows.length, 0)

  t.is(initialRows[0].id, rows[0].id)
  t.is(rows[0].has_something, true)
})

test('Should update multiple', async t => {
  const initialRows = await DatabaseTable.select(tableName, {
    has_something: true
  })
  t.is(initialRows.length, 3)

  const rows = await DatabaseTable.upsert(tableName, {
    has_something: false
  }, {
    has_something: false
  }, {
    has_something: true
  })
  t.true(Array.isArray(rows))
  t.is(rows.length, 3)

  const finalRows = await DatabaseTable.select(tableName, {
    has_something: true
  })
  t.is(finalRows.length, 0)
})

test('Should insert if no rows are updated', async t => {
  const initialRows = await DatabaseTable.select(tableName, {
    name: 'qqq',
    has_something: true
  })
  t.is(initialRows.length, 0)

  const rows = await DatabaseTable.upsert(tableName, {
    name: 'qqq',
    has_something: true
  }, {
    has_something: true
  }, {
    name: 'qqq',
    has_something: false
  })
  t.is(rows.length, 1)

  const finalRows = await DatabaseTable.select(tableName, {
    name: 'qqq',
    has_something: true
  })
  t.is(finalRows.length, 1)
})
