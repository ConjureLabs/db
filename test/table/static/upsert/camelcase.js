const { test } = require('ava')

// first init db
require('../../../helpers/init/with-transform-camel-case')

const { DatabaseTable, query } = require('../../../../')
const generateTableName = require('../../../helpers/generate-table')
const truncateTable = require('../../../helpers/truncate-table')

// setup tmp table
let tableName
let tableNameCamelCased
test.before(async t => {
  const names = await generateTableName()
  tableName = names.tableName
  tableNameCamelCased = names.tableNameCamelCased
})

// wipe tmp table before each test
test.beforeEach(async t => {
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
  const result = DatabaseTable.upsert(tableNameCamelCased, {
    hasSomething: true
  }, {
    hasSomething: true
  }, {
    hasSomething: false
  })
  t.true(result instanceof Promise)
})

test('Should update a row', async t => {
  const rows = await DatabaseTable.select(tableNameCamelCased, {
    hasSomething: false
  })
  t.is(rows.length, 1)

  await DatabaseTable.upsert(tableNameCamelCased, {
    hasSomething: true
  }, {
    hasSomething: true
  }, {
    hasSomething: false
  })
  const rows2 = await DatabaseTable.select(tableNameCamelCased, {
    hasSomething: false
  })
  t.is(rows2.length, 0)
})

test('Should return newly updated rows', async t => {
  const initialRows = await DatabaseTable.select(tableNameCamelCased, {
    hasSomething: false
  })
  t.is(initialRows.length, 1)

  const rows = await DatabaseTable.upsert(tableNameCamelCased, {
    hasSomething: true
  }, {
    hasSomething: true
  }, {
    hasSomething: false
  })

  const finalRows = await DatabaseTable.select(tableNameCamelCased, {
    hasSomething: false
  })
  t.is(finalRows.length, 0)

  t.is(initialRows[0].id, rows[0].id)
  t.is(rows[0].hasSomething, true)
})

test('Should update multiple', async t => {
  const initialRows = await DatabaseTable.select(tableNameCamelCased, {
    hasSomething: true
  })
  t.is(initialRows.length, 3)

  const rows = await DatabaseTable.upsert(tableNameCamelCased, {
    hasSomething: false
  }, {
    hasSomething: false
  }, {
    hasSomething: true
  })
  t.true(Array.isArray(rows))
  t.is(rows.length, 3)

  const finalRows = await DatabaseTable.select(tableNameCamelCased, {
    hasSomething: true
  })
  t.is(finalRows.length, 0)
})

test('Should insert if no rows are updated', async t => {
  const initialRows = await DatabaseTable.select(tableNameCamelCased, {
    name: 'qqq',
    hasSomething: true
  })
  t.is(initialRows.length, 0)

  const rows = await DatabaseTable.upsert(tableNameCamelCased, {
    name: 'qqq',
    hasSomething: true
  }, {
    hasSomething: true
  }, {
    name: 'qqq',
    hasSomething: false
  })
  t.is(rows.length, 1)

  const finalRows = await DatabaseTable.select(tableNameCamelCased, {
    name: 'qqq',
    hasSomething: true
  })
  t.is(finalRows.length, 1)
})
