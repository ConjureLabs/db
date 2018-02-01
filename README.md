## Database classes, for Postgres

### Install

```sh
npm install --save db@ConjureLabs/db
```

### Usage

You'll first need to init the db connection, with your own config.

```js
require('db').init({
  user: process.env.PROJECT_DB_USERNAME,
  database: process.env.PROJECT_DB_DATABASE,
  password: process.env.PROJECT_DB_PASSWORD,
  host: process.env.PROJECT_DB_HOST,
  port: 5432,
  max: 10,
  idleTimeoutMillis: 30000
});
```

All queries will be paused until you pass this config.

Internally this repo uses [node-postgres](http://github.com/brianc/node-postgres), so check that out for more configuration options. Any config passed to `init()` is pushed directly into a `new Pool(...config)`.

If you want, you can pass a function that is triggered on every query. This can be used to set up reporting, or debug logs.

```js
const { init } = require('db');
init(...config, (sql, placeholderValues) => { });
```

If in production, `placeholderValues` will not be sent to this method.

You can directly query the db (as documented in [node-postgres](http://github.com/brianc/node-postgres)) if you wish.

```js
const { query } = require('db');

// this assumes you ran `init(...config)` already

const result = await query('SELECT * FROM users WHERE id = $1', userId);
```

See further docs, for accessing data:

- [Database Table](./table)
- [Database Row](./row)
