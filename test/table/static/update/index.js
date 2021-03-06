import test from 'ava'

// first init db
import '../../../helpers/init'

import { DatabaseTable } from '../../../../'
import generateTableName from '../../../helpers/generate-table'
import truncateTable from '../../../helpers/truncate-table'

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
    hasSomething: false
  }, {
    name: 'xyz',
    hasSomething: true
  })
})

test('Should return a promise', t => {
  const result = DatabaseTable.update(tableName, {
    has_something: true
  }, {
    hasSomething: false
  })
  t.true(result instanceof Promise)
})

test('Should update a row', async t => {
  const rows = await DatabaseTable.select(tableName, {
    hasSomething: false
  })
  t.is(rows.length, 1)

  await DatabaseTable.update(tableName, {
    hasSomething: true
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
    hasSomething: false
  })
  t.is(initialRows.length, 1)

  const rows = await DatabaseTable.update(tableName, {
    has_something: true
  }, {
    has_something: false
  })

  const finalRows = await DatabaseTable.select(tableName, {
    hasSomething: false
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

  const rows = await DatabaseTable.update(tableName, {
    hasSomething: false
  }, {
    hasSomething: true
  })
  t.true(Array.isArray(rows))
  t.is(rows.length, 3)

  const finalRows = await DatabaseTable.select(tableName, {
    has_something: true
  })
  t.is(finalRows.length, 0)
})
