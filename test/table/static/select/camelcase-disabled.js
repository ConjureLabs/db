const test = require('ava')

// first init db
require('../../../helpers/init/without-transform-camel-case')

const { DatabaseTable } = require('../../../../')

test('Should return a promise', t => {
  const result = DatabaseTable.select('account_rating')
  t.true(result instanceof Promise)
})

test('Should return rows', async t => {
  const rows = await DatabaseTable.select('account_rating', {
    id: 1
  })
  t.is(rows.length, 1)
  const row = rows[0]
  t.is(row.id, 1)
  t.is(row.account_id, 1)
  t.true(!row.accountId)
  t.is(row.movie_id, 1)
  t.true(!row.movieId)
  t.is(row.rating, 'terrible')
  t.is(row.review, 'this movie was just garbage')

  const rows2 = await DatabaseTable.select('account_rating', {
    id: 13
  })
  t.is(rows2.length, 1)
  const row2 = rows2[0]
  t.is(row2.id, 13)
  t.is(row2.account_id, 8)
  t.true(!row.accountId)
  t.is(row2.movie_id, 1)
  t.true(!row2.movieId)
  t.is(row2.rating, 'awesome')
  t.is(row2.review, null)

  const rows3 = await DatabaseTable.select('account_rating', {
    rating: 'terrible'
  })
  t.is(rows3.length, 5)
  const row3 = rows3[0]
  t.is(row3.rating, 'terrible')
})

test('Should not convert camel cased names', async t => {
  await t.throwsAsync(async () => {
    await DatabaseTable.select('accountRating')
  }, {
    instanceOf: Error,
    message: 'relation "accountrating" does not exist'
  })
})
