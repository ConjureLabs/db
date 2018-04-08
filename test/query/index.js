const { test } = require('ava')

// first init db
require('../helpers/init')

const { query } = require('../../')

test('Should return a promise', t => {
  const result = query('SELECT * FROM account LIMIT 1')
  t.true(result instanceof Promise)
})

test('Should return rows', async t => {
  const result = await query('SELECT * FROM account_rating ORDER BY id ASC LIMIT 1')
  t.truthy(result && result.rows)
  t.is(result.rows.length, 1)
  const row = result.rows[0]
  t.is(row.id, 1)
  t.is(row.account_id, 1)
  t.is(row.movie_id, 1)
  t.is(row.rating, 'terrible')
  t.is(row.review, 'this movie was just garbage')

  const result2 = await query('SELECT * FROM account_rating WHERE id = 13')
  t.truthy(result2 && result2.rows)
  t.is(result2.rows.length, 1)
  const row2 = result2.rows[0]
  t.is(row2.id, 13)
  t.is(row2.account_id, 8)
  t.is(row2.movie_id, 1)
  t.is(row2.rating, 'awesome')
  t.is(row2.review, null)
})

test('should take in args', async t => {
  const result = await query(`
    SELECT ar.*, a.*, m.*
    FROM account_rating ar
    LEFT JOIN account a
      ON ar.account_id = a.id
    LEFT JOIN movie m
      ON ar.movie_id = m.id
    WHERE a.id = $1
    AND m.id = $2
  `, [1, 4])

  t.truthy(result && result.rows)
  t.is(result.rows.length, 1)
  const row = result.rows[0]
  t.is(row.rating, 'terrible')
  t.is(row.account_id, 1)
  t.is(row.movie_id, 4)
  t.is(row.director, 'Rod Amateau')
  t.is(row.review, 'pure nightmares')
})
