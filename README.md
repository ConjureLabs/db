# Database classes, for Postgres

## Install

```sh
npm install --save @conjurelabs/db
```

or

```sh
yarn add @conjurelabs/db
```

## Usage

You'll first need to init the db connection, with your own config.

```js
require('@conjurelabs/db').init({
  user: process.env.PROJECT_DB_USERNAME,
  database: process.env.PROJECT_DB_DATABASE,
  password: process.env.PROJECT_DB_PASSWORD,
  host: process.env.PROJECT_DB_HOST,
  port: 5432,
  max: 10,
  idleTimeoutMillis: 30000
})
```

All queries will be paused until you pass this config.

Internally this repo uses [node-postgres](http://github.com/brianc/node-postgres), so check that out for more configuration options. Any config passed to `init()` is pushed directly into a `new Pool(...config)`.

You can pass a second arg to `.init` which defines options, for `DatabaseTable`. See [`DatabaseTable`](./table) for more details on options.

```js
const { init } = require('@conjurelabs/db')
init(...config, { transformCamelCase: true })
```

If you want, you can pass a function that is triggered on every query. This can be used to set up reporting, or debug logs.

```js
const { init } = require('@conjurelabs/db')
init(...config, {}, (sql, placeholderValues) => {
  console.log(sql, placeholderValues)
})
```

If in production, `placeholderValues` will not be sent to this method.

You can directly query the db (as documented in [node-postgres](http://github.com/brianc/node-postgres)) if you wish.

```js
const { query } = require('@conjurelabs/db')

// this assumes you ran `init(...config)` already

const result = await query('SELECT * FROM users WHERE id = $1', userId)
```

If you use the `transformCamelCase` option, and fetch rows via `query`, it will transform the column names, but will set the row instances to a table name of `null`. You can then copy the row result into a new instance, with a given name, before saving changes.

```js
const result = await query('SELECT * FROM users WHERE id = $1', userId)

const firstRow = result.rows[0] // DatabaseRow instance, but with no table name set

firstRow.name = 'john'

// firstRow.save() would fail, since no talbe name is set

firstRow = new DatabaseRow('users', firstRow)
firstRow.save()
```

If you do not want any name manipulations on query (from set options) you can do:

```js
const { minimalQuery } = require('@conjurelabs/db')

// this assumes you ran `init(...config)` already

const result = await minimalQuery('SELECT * FROM users WHERE id = $1', userId)

// transformCamelCase will not be honored in results
// results will be simple objects, not instances
```

See further docs, for accessing data:

## DatabaseTable

### Select

#### Using Constructor

```js
const account = new DatabaseTable('account')

// SELECT * FROM account
const rows1 = await account.select()

// SELECT * FROM account WHERE id = 1 AND name = 'Johnny Doe'
const rows2 = await account.select({
  id: 1,
  name: 'Johnny Doe'
})

// SELECT * FROM account WHERE (id = 1 AND name = 'Johnny Doe') OR (id = 2)
const rows3 = await account.select({
  id: 1,
  name: 'Johnny Doe'
}, {
  id: 2
})
```

#### Direct (static) call

```js
// SELECT * FROM account
const rows1 = await DatabaseTable.select('account')

// SELECT * FROM account WHERE id = 1 AND name = 'Johnny Doe'
const rows2 = await DatabaseTable.select('account', {
  id: 1,
  name: 'Johnny Doe'
})
```

### Update

#### Using Constructor

```js
const account = new DatabaseTable('account')

// UPDATE account SET activated = false
const rows1 = await account.update({
  activated: false
})

// UPDATE account SET email = 'johnny@doe.site' WHERE id = 1 AND name = 'Johnny Doe'
const rows2 = await account.update({
  email: 'johnny@doe.site'
}, {
  id: 1,
  name: 'Johnny Doe'
})

// UPDATE account SET email = 'johnny@doe.site' WHERE (id = 1 AND name = 'Johnny Doe') OR (id = 2)
const rows3 = await account.update({
  email: 'johnny@doe.site'
}, {
  id: 1,
  name: 'Johnny Doe'
}, {
  id: 2
})
```

#### Direct (static) call

```js
// UPDATE account SET activated = false
const rows1 = await DatabaseTable.update('account', {
  activated: false
})

// UPDATE account SET activated = false WHERE id = 1 AND name = 'Johnny Doe'
const rows2 = await DatabaseTable.update('account', {
  activated: false
}, {
  id: 1,
  name: 'Johnny Doe'
})
```

### Insert

#### Using Constructor

```js
const account = new DatabaseTable('account')

// INSERT INTO account (name, email) VALUES ('Johnny Doe', 'johnny@doe.site')
const rows1 = await account.insert({
  name: 'Johnny Doe',
  email: 'johnny@doe.site'
})

// INSERT INTO account (name, email) VALUES ('Johnny Doe', 'johnny@doe.site'), ('Arnold Holt', NULL)
const rows2 = await account.insert({
  name: 'Johnny Doe',
  email: 'johnny@doe.site'
}, {
  name: 'Arnold Holt'
})
```

#### Direct (static) call

```js
// INSERT INTO account (name, email) VALUES ('Johnny Doe', 'johnny@doe.site')
const rows1 = await DatabaseTable.insert('account', {
  name: 'Johnny Doe',
  email: 'johnny@doe.site'
})

// INSERT INTO account (name, email) VALUES ('Johnny Doe', 'johnny@doe.site'), ('Arnold Holt', NULL)
const rows2 = await DatabaseTable.insert('account', {
  name: 'Johnny Doe',
  email: 'johnny@doe.site'
}, {
  name: 'Arnold Holt'
})
```

### Delete

#### Using Constructor

```js
const account = new DatabaseTable('account')

// DELETE FROM account
const rows1 = await account.delete()

// DELETE FROM account WHERE id = 1 AND name = 'Johnny Doe'
const rows2 = await account.delete({
  id: 1,
  name: 'Johnny Doe'
})

// DELETE FROM account WHERE (id = 1 AND name = 'Johnny Doe') OR (id = 2)
const rows3 = await account.delete({
  id: 1,
  name: 'Johnny Doe'
}, {
  id: 2
})
```

#### Direct (static) call

```js
// DELETE FROM account
const rows1 = await DatabaseTable.delete('account')

// DELETE FROM account WHERE id = 1 AND name = 'Johnny Doe'
const rows2 = await DatabaseTable.delete('account', {
  id: 1,
  name: 'Johnny Doe'
})
```

### Upsert

Upsert will `insert` _only if_ an `update` returns no rows.

#### Using Constructor

```js
const account = new DatabaseTable('account')

// attempts:
// INSERT INTO account (name, email, added) VALUES ('Johnny Doe', 'johnny@doe.site', NOW())
//
// falls back to:
// UPDATE account SET name = 'Johnny Doe', updated = NOW() WHERE email = 'johnny@doe.site'
const rows = await account.upsert({
  // insert
  name: 'Johnny Doe',
  email: 'johnny@doe.site',
  added: new Date()
}, {
  // update
  name: 'Johnny Doe',
  updated: new Date()
}, {
  // update conditions
  email: 'johnny@doe.site'
})
```

#### Direct (static) call

```js
// attempts:
// INSERT INTO account (name, email, added) VALUES ('Johnny Doe', 'johnny@doe.site', NOW())
//
// falls back to:
// UPDATE account SET name = 'Johnny Doe', updated = NOW() WHERE email = 'johnny@doe.site'
const rows = await DatabaseTable.upsert('account', {
  // insert
  name: 'Johnny Doe',
  email: 'johnny@doe.site',
  added: new Date()
}, {
  // update
  name: 'Johnny Doe',
  updated: new Date()
}, {
  // update conditions
  email: 'johnny@doe.site'
})
```

### Literal strings

These are **not** escaped by the postgres module.
Use only when needed, and never with user-inputted values.

```js
// INSERT INTO account (name, added) VALUES ('Johnny Doe', NOW())
const rows = await DatabaseTable.insert('account', {
  name: 'Johnny Doe',
  added: DatabaseTable.literal('NOW()')
})
```

### Table options (global)

There are some options baked directly into `DatabaseTable`. You can access options directly from the constructor.

```js
console.log(DatabaseTable.options) // { ... }
```

You can update options in a similar fashion.

```js
DatabaseTable.options = {
  transformCamelCase: true
}
```

Note that this will only alter the option attributes you supply (it does not replace the `{}` of options), and will affect _all_ instances of `DatabaseTable` (not just new ones). So, you should do this before any other usage.

#### Option: transform to camel case names

Postgres table and column names look like this: `account_emails_by_date`. If you're like me, you typically set a var equal to `accountEmailsByDate` when working off of a table, but then have to convert it back to snake-cased when passing it back in.

You can have this module auto-transform names for you, to make life easier.

```js
DatabaseTable.options = {
  transformCamelCase: true
}
```

Let's say you have the following table:

```
      Column        |           Type           |
--------------------+--------------------------|
 id                 | integer                  |
 account            | integer                  |
 email              | character varying(255)   |
 added_from_service | character varying(255)   |
 added              | timestamp with time zone |
```

And then you query it using this module:

```js
const accountEmails = new DatabaseTable('accountEmails')

// SELECT * FROM account_emails
const allRows = await accountEmails.select()
const row = allRows[0]

console.log(row.addedFromService) // value of `added_from_service`

row.addedFromService = 'Google'
row.save() // `added_from_service` is set to 'Google'
```

Note that a column name like `account_id` will be represented as `accountId`, not `accountID`.

Also, this _will not_ affect any direct queries to `{ query }`. It will only transform column names in `DatabaseTable` and `DatabaseRow`.

## DatabaseRow

This class serves a single database row, never more.

```js
const { DatabaseRow } = require('@conjurelabs/db')

// row from the account table
const row = new DatabaseRow('account', {
  id: 1,
  name: 'Johnny Doe',
  // ...
})
```

### Creating a new row

```js
// no .id in row content
const row = new DatabaseRow('account', {
  name: 'Johnny Doe'
})

await row.save()
```

### Updating an existing row

```js
// has .id
const row = new DatabaseRow('account', {
  id: 1,
  email: 'johnny@doe.site'
})

await row.save()
```

### Deleting a row

```js
// has .id
const row = new DatabaseRow('account', {
  id: 1
})

await row.delete()
```

After a deletion you cannot make any more modifying calls to the row (like .save).
If you want to re-save the row, you'd have to call `.copy` on it and then `.save` off the new copy.


### Copy a row

This will return a new row instance, _without an id_ (making it a copy, not a clone).

```js
const accountRow = new DatabaseRow('account', {
  id: 1,
  name: 'Johnny Doe',
  email: 'johnny@doe.site'
})

const row2 = accountRow.copy()

/*
  row2 == {
    name: 'Johnny Doe',
    email: 'johnny@doe.site'
  }

  row2 !== accountRow
 */
```

### Chain an update to a row instance

Nearly all the methods return the instance, making chaining easy.

There is a method `.set(data)` which allows you to easily modify attributes and then chain off a `.save()`.

```js
const accountRow = new DatabaseRow('account', {
  id: 1,
  name: 'Johnny Doe',
  email: 'johnny@doe.site'
})

// want to modify email and save
await accountRow
  .set({
    email: 'jdawg@doe.site'
  })
  .save()
```

