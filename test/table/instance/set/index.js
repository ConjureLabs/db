const test = require('ava')

// first init db
require('../../../helpers/init')

const { DatabaseTable } = require('../../../../')

test('instance.set should change instance values', async t => {
  const Director = new DatabaseTable('director')
  const result = await Director.select({
    id: 1
  })
  const row = result[0]
  
  t.is(row.first_name, 'Con')
  t.is(row.last_name, 'Jure')
  t.is(row.film_count, 14)

  row.set({
    first_name: 'Octo',
    last_name: 'Cat'
  })

  t.is(row.first_name, 'Octo')
  t.is(row.last_name, 'Cat')
  t.is(row.film_count, 14)
})

test('instance.set should also chain and save', async t => {
  const Director = new DatabaseTable('director')
  const result = await Director.select({
    id: 1
  })
  const row = result[0]
  
  t.is(row.first_name, 'Con')
  t.is(row.last_name, 'Jure')
  t.is(row.film_count, 14)

  await row
    .set({
      first_name: 'Octo',
      last_name: 'Cat'
    })
    .save()

  t.is(row.first_name, 'Octo')
  t.is(row.last_name, 'Cat')
  t.is(row.film_count, 14)

  // double-check for save
  const result2 = await Director.select({
    id: 1
  })
  const row2 = result2[0]

  t.is(row2.first_name, 'Octo')
  t.is(row2.last_name, 'Cat')
  t.is(row2.film_count, 14)
})
