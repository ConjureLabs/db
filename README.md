## Database classes, for Postgres

### Install

```sh
npm install db@ConjureLabs/db
```

### Usage

You'll first need to init the db connection, with your own config.

```js
const connection = require('db/connection');
connection.init({
  user: process.env.PROJECT_DB_USERNAME,
  database: process.env.PROJECT_DB_DATABASE,
  password: process.env.PROJECT_DB_PASSWORD,
  host: process.env.PROJECT_DB_HOST,
  port: 5432,
  max: 10,
  idleTimeoutMillis: 30000
});
```

Internally this repo uses [node-postgres / pg](http://github.com/brianc/node-postgres), so check that out for more configuration options. Any config passed to `connection.init` is pushed directly into a `new Pool(...config)`.

If you want, you can pass a function that is triggered on every query. This can be used to set up reporting, or debug logs.

```js
const connection = require('db/connection');
connection.init(...config, (sql, placeholderValues) => { });
```

**Do not log `placeholderValues` in production**.

See further docs, for accessing data:

- [Database Table](./table)
- [Database Row](./row)
