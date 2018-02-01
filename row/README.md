### DatabaseRow

This class serves a single database row, never more.

```js
const DatabaseRow = require('db/row');

// row from the account table
const row = new DatabaseRow('account', {
  id: 1,
  name: 'Johnny Doe',
  // ...
});
```

#### Creating a new row

```js
// no .id in row content
const row = new DatabaseRow('account', {
  name: 'Johnny Doe'
});

await row.save();
```

#### Updating an existing row

```js
// has .id
const row = new DatabaseRow('account', {
  id: 1,
  email: 'johnny@doe.site'
});

await row.save();
```

#### Deleting a row

```js
// has .id
const row = new DatabaseRow('account', {
  id: 1
});

await row.delete();
```

After a deletion you cannot make any more modifying calls to the row (like .save).
If you want to re-save the row, you'd have to call `.copy` on it and then `.save` off the new copy.


#### Copy a row

This will return a new row instance, _without an id_ (making it a copy, not a clone).

```js
const accountRow = new DatabaseRow('account', {
  id: 1,
  name: 'Johnny Doe',
  email: 'johnny@doe.site'
});

const row2 = accountRow.copy();

/*
  row2 == {
    name: 'Johnny Doe',
    email: 'johnny@doe.site'
  }

  row2 !== accountRow
 */
```

#### Chain an update to a row instance

Nearly all the methods return the instance, making chaining easy.

There is a method `.set(data)` which allows you to easily modify attributes and then chain off a `.save()`.

```js
const accountRow = new DatabaseRow('account', {
  id: 1,
  name: 'Johnny Doe',
  email: 'johnny@doe.site'
});

// want to modify email and save
await accountRow
  .set({
    email: 'jdawg@doe.site'
  })
  .save();
```
