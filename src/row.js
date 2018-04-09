const { UnexpectedError } = require('@conjurelabs/err')

const rowTableName = Symbol(`instance row's table name`)
const rowDeleted = Symbol('indicator that row was deleted')

module.exports = class DatabaseRow {
  constructor(tableName, rowData = {}) {
    this[rowTableName] = tableName
    this[rowDeleted] = false

    for (let key in rowData) {
      this[key] = rowData[key]
    }
  }

  /*
    .save is an upsert
    it will either
      A) update an existing record based on it's .id (assumes all tables have .id pk)
      B) inserts a new record if no .id is present
   */
  async save() {
    if (this[rowDeleted] === true) {
      throw new UnexpectedError('This row was previously deleted')
    }

    const DatabaseTable = require('../table')

    // no .id, assuming it's a new row to insert
    if (this.id === undefined) {
      const rows = await DatabaseTable.insert(this[rowTableName], this)

      if (!rows.length) {
        throw new UnexpectedError('Expected DatabaseTable.insert to return new table row')
      }

      if (rows.length > 1) {
        throw new UnexpectedError('Expected DatabaseTable.insert to return a single new table row')
      }

      for (let key in rows[0]) {
        this[key] = rows[0][key]
      }

      return this
    }

    // have a .id, must do an update
    const rowContentWithoutId = Object.assign({}, this)
    delete rowContentWithoutId.id

    await DatabaseTable.update(this[rowTableName], rowContentWithoutId, {
      id: this.id
    })

    return this
  }

  async delete() {
    if (this[rowDeleted] === true) {
      throw new UnexpectedError('This row was previously deleted')
    }

    if (this.id === undefined) {
      throw new UnexpectedError('Exepected row .id to exist, for deletion')
    }

    const DatabaseTable = require('../table')
    await DatabaseTable.delete(this[rowTableName], {
      id: this.id
    })

    this[rowDeleted] = true
    return this
  }

  // new row object, copies values, but without id
  copy() {
    return new DatabaseRow(this[rowTableName], Object.assign({}, this, {
      id: null
    }))
  }

  // useful for chaining
  set(data) {
    for (let key in data) {
      this[key] = data[key]
    }

    return this
  }
}
