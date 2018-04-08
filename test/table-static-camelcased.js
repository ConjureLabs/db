const { test } = require('ava')

// first init db
require('./helpers/init/with-transform-camel-case')

const { DatabaseTable } = require('../')

test('Should return a promise', t => {
  const result = DatabaseTable.select('accountRating')
  t.true(result instanceof Promise)
})

test('Should return rows', async t => {
  const rows = await DatabaseTable.select('accountRating', {
    id: 1
  })
  t.is(rows.length, 1)
  const row = rows[0]
  t.is(row.id, 1)
  t.is(row.accountId, 1)
  t.is(row.movieId, 1)
  t.is(row.rating, 'terrible')
  t.is(row.review, 'this movie was just garbage')

  const rows2 = await DatabaseTable.select('accountRating', {
    id: 13
  })
  t.is(rows2.length, 1)
  const row2 = rows2[0]
  t.is(row2.id, 13)
  t.is(row2.accountId, 8)
  t.is(row2.movieId, 1)
  t.is(row2.rating, 'awesome')
  t.is(row2.review, null)
})

test('Should return rows', async t => {
  const rows = await DatabaseTable.select('accountRating', {
    rating: 'terrible'
  })
  t.is(rows.length, 5)
  const row = rows[0]
  t.is(row.rating, 'terrible')
})
