import test from 'ava'

// first init db
import '../../../helpers/init'

import { DatabaseTable } from '../../../../'

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
  t.is(row.accountId, 1)
  t.is(row.movie_id, 1)
  t.is(row.movieId, 1)
  t.is(row.rating, 'terrible')
  t.is(row.review, 'this movie was just garbage')

  const rows2 = await AccountRating.select({
    id: 13
  })
  t.is(rows2.length, 1)
  const row2 = rows2[0]
  t.is(row2.id, 13)
  t.is(row2.account_id, 8)
  t.is(row2.accountId, 8)
  t.is(row2.movie_id, 1)
  t.is(row2.movieId, 1)
  t.is(row2.rating, 'awesome')
  t.is(row2.review, null)

  const rows3 = await AccountRating.select({
    rating: 'terrible'
  })
  t.is(rows3.length, 5)
  const row3 = rows3[0]
  t.is(row3.rating, 'terrible')
})
