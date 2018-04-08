const { test } = require('ava')

// first init db
require('./helpers/init')

const { DatabaseTable } = require('../')

test('Should return a promise', t => {
  const Account = new DatabaseTable('account')
  const result = Account.select()
  t.true(result instanceof Promise)
})

test('Should return rows', async t => {
  const AccountRating = new DatabaseTable('account_rating')

  const rows = await AccountRating.select({
    id: 1
  })
  t.is(rows.length, 1)
  const row = rows[0]
  t.is(row.id, 1)
  t.is(row.account_id, 1)
  t.is(row.movie_id, 1)
  t.is(row.rating, 'terrible')
  t.is(row.review, 'this movie was just garbage')

  const rows2 = await AccountRating.select({
    id: 13
  })
  t.is(rows2.length, 1)
  const row2 = rows2[0]
  t.is(row2.id, 13)
  t.is(row2.account_id, 8)
  t.is(row2.movie_id, 1)
  t.is(row2.rating, 'awesome')
  t.is(row2.review, null)
})

test('Should return rows', async t => {
  const AccountRating = new DatabaseTable('account_rating')

  const rows = await AccountRating.select({
    rating: 'terrible'
  })
  t.is(rows.length, 5)
  const row = rows[0]
  t.is(row.rating, 'terrible')
})
