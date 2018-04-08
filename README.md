## Database classes, for Postgres

### Install

```sh
npm install --save @conjurelabs/db
```

or

```sh
yarn add @conjurelabs/db
```

### Usage

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

- [Database Table](./table)
- [Database Row](./row)
