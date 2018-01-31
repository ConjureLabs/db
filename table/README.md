### Database Table

This classes serves as a proxy to database tables, making it easier to select, insert, etc.

```js
const DatabaseTable = require('db/table');
```

#### Select

<details>

##### Using Constructor

```js
const account = new DatabaseTable('account');

// SELECT * FROM account;
const rows1 = await account.select();

// SELECT * FROM account WHERE id = 1 AND name = 'Johnny Doe';
const rows2 = await account.select({
  id: 1,
  name: 'Johnny Doe'
});

// SELECT * FROM account WHERE (id = 1 AND name = 'Johnny Doe') OR (id = 2);
const rows3 = await account.select({
  id: 1,
  name: 'Johnny Doe'
}, {
  id: 2
});
```

##### Direct (static) call

```js
// SELECT * FROM account;
const rows1 = await DatabaseTable.select('account');

// SELECT * FROM account WHERE id = 1 AND name = 'Johnny Doe';
const rows2 = await DatabaseTable.select('account', {
  id: 1,
  name: 'Johnny Doe'
});
```
</details>

#### Update

<details>

##### Using Constructor

```js
const account = new DatabaseTable('account');

// UPDATE account SET activated = false;
const rows1 = await account.update({
  activated: false
});

// UPDATE account SET email = 'johnny@doe.site' WHERE id = 1 AND name = 'Johnny Doe';
const rows2 = await account.update({
  email: 'johnny@doe.site'
}, {
  id: 1,
  name: 'Johnny Doe'
});

// UPDATE account SET email = 'johnny@doe.site' WHERE (id = 1 AND name = 'Johnny Doe') OR (id = 2);
const rows3 = await account.update({
  email: 'johnny@doe.site'
}, {
  id: 1,
  name: 'Johnny Doe'
}, {
  id: 2
});
```

##### Direct (static) call

```js
// UPDATE account SET activated = false;
const rows1 = await DatabaseTable.update('account', {
  activated: false
});

// UPDATE account SET activated = false WHERE id = 1 AND name = 'Johnny Doe';
const rows2 = await DatabaseTable.update('account', {
  activated: false
}, {
  id: 1,
  name: 'Johnny Doe'
});
```
</details>

#### Insert

<details>

##### Using Constructor

```js
const account = new DatabaseTable('account');

// INSERT INTO account (name, email) VALUES ('Johnny Doe', 'johnny@doe.site');
const rows1 = await account.insert({
  name: 'Johnny Doe',
  email: 'johnny@doe.site'
});

// INSERT INTO account (name, email) VALUES ('Johnny Doe', 'johnny@doe.site'), ('Arnold Holt', NULL);
const rows2 = await account.insert({
  name: 'Johnny Doe',
  email: 'johnny@doe.site'
}, {
  name: 'Arnold Holt'
});
```

##### Direct (static) call

```js
// INSERT INTO account (name, email) VALUES ('Johnny Doe', 'johnny@doe.site');
const rows1 = await DatabaseTable.insert('account', {
  name: 'Johnny Doe',
  email: 'johnny@doe.site'
});

// INSERT INTO account (name, email) VALUES ('Johnny Doe', 'johnny@doe.site'), ('Arnold Holt', NULL);
const rows2 = await DatabaseTable.insert('account', {
  name: 'Johnny Doe',
  email: 'johnny@doe.site'
}, {
  name: 'Arnold Holt'
});
```
</details>

#### Delete

<details>

##### Using Constructor

```js
const account = new DatabaseTable('account');

// DELETE FROM account;
const rows1 = await account.delete();

// DELETE FROM account WHERE id = 1 AND name = 'Johnny Doe';
const rows2 = await account.delete({
  id: 1,
  name: 'Johnny Doe'
});

// DELETE FROM account WHERE (id = 1 AND name = 'Johnny Doe') OR (id = 2);
const rows3 = await account.delete({
  id: 1,
  name: 'Johnny Doe'
}, {
  id: 2
});
```

##### Direct (static) call

```js
// DELETE FROM account;
const rows1 = await DatabaseTable.delete('account');

// DELETE FROM account WHERE id = 1 AND name = 'Johnny Doe';
const rows2 = await DatabaseTable.delete('account', {
  id: 1,
  name: 'Johnny Doe'
});
```
</details>

#### Upsert

<details>

##### Using Constructor

```js
const account = new DatabaseTable('account');

// attempts:
// INSERT INTO account (name, email, added) VALUES ('Johnny Doe', 'johnny@doe.site', NOW());
//
// falls back to:
// UPDATE account SET name = 'Johnny Doe', updated = NOW() WHERE email = 'johnny@doe.site';
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
});
```

##### Direct (static) call

```js
// attempts:
// INSERT INTO account (name, email, added) VALUES ('Johnny Doe', 'johnny@doe.site', NOW());
//
// falls back to:
// UPDATE account SET name = 'Johnny Doe', updated = NOW() WHERE email = 'johnny@doe.site';
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
});
```
</details>

#### Literal strings

These are **not** escaped by the postgres module.
Use only when needed, and never with user-inputted values.

```js
// INSERT INTO account (name, added) VALUES ('Johnny Doe', NOW());
const rows = await DatabaseTable.insert('account', {
  name: 'Johnny Doe',
  added: DatabaseTable.literal('NOW()')
});
```
