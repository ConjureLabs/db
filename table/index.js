const { UnexpectedError, ContentError } = require('err');

const mapRowInstances = Symbol('maps query result rows to DatabaseRow instances');
const staticProxy = Symbol('static method, proxy to instance method');
const mutateName = Symbol('mutate a single sql resource name');
const mutateHashKeys = Symbol('mutate column key value pairs');

// used to mark a string that should not be wrapped in an escaped string
class DatabaseQueryLiteral extends String {
  constructor(str) {
    super(str);
  }
}

class DatabaseQueryCast extends DatabaseQueryLiteral {
  constructor(str, castTo) {
    const prepareValue = require('pg/lib/utils').prepareValue;
    super(`'${prepareValue(str)}'::${prepareValue(castTo)}`);
  }
}

class DatabaseTable {
  constructor(tableName) {
    this.tableName = this[mutateName](tableName);
  }

  [mapRowInstances](queryResult) {
    const DatabaseRow = require('../row');
    return (queryResult.rows || []).map(row => {
      return new DatabaseRow(this.tableName, row);
    });
  }

  [mutateHashKeys](pairs) {
    const result = {};

    for (let key in pairs) {
      const newKey = this[mutateName](key);
      result[newKey] = pairs[key];
    }

    return result;
  }

  [mutateName](name) {
    return name;
  }

  async select(...constraints) {
    // mutations
    const mutatedConstraints = constraints.map(obj => this[mutateHashKeys](obj));

    const { query } = require('../');

    const { queryValues, whereClause } = generateWhereClause(mutatedConstraints);

    const result = query(`SELECT * FROM ${this.tableName}${whereClause}`, queryValues);
    return this[mapRowInstances](await result);
  }

  static async select() {
    return await this[staticProxy]('select', arguments);
  }

  async update(updates, ...constraints) {
    // mutations
    const mutatedUpdates = this[mutateHashKeys](updates);
    const mutatedConstraints = constraints.map(obj => this[mutateHashKeys](obj));

    const { query } = require('../');

    const queryValues = [];
    const updatesSql = generateSqlKeyVals(', ', mutatedUpdates, queryValues);
    const { whereClause } = generateWhereClause(mutatedConstraints, queryValues);

    const result = query(`UPDATE ${this.tableName} SET ${updatesSql}${whereClause}`, queryValues);
    return this[mapRowInstances](await result);
  }

  static async update() {
    return await this[staticProxy]('update', arguments);
  }

  async delete(...constraints) {
    // mutations
    const mutatedConstraints = constraints.map(obj => this[mutateHashKeys](obj));

    const { query } = require('../');

    const { queryValues, whereClause } = generateWhereClause(mutatedConstraints);

    const result = query(`DELETE FROM ${this.tableName}${whereClause}`, queryValues);
    return this[mapRowInstances](await result);
  }

  static async delete() {
    return await this[staticProxy]('delete', arguments);
  }

  async insert(...newRows) {
    // mutations
    const mutatedNewRows = newRows.map(row => this[mutateHashKeys](row));

    const { query } = require('../');

    if (!mutatedNewRows.length) {
      throw new UnexpectedError('There were no rows to insert');
    }

    const columnNames = findAllColumnNames(mutatedNewRows);

    if (columnNames.includes('id')) {
      throw new ContentError('Cannot insert a row that has .id');
    }

    const { queryValues, valuesFormatted } = generateInsertValues(mutatedNewRows, columnNames);

    const result = query(`INSERT INTO ${this.tableName}(${columnNames.join(', ')}) VALUES ${valuesFormatted} RETURNING *`, queryValues);
    return this[mapRowInstances](await result);
  }

  static async insert() {
    return await this[staticProxy]('insert', arguments);
  }

  async upsert(insertContent, updateContent, updateConstraints) {
    // mutations
    const mutatedInsertContent = this[mutateHashKeys](insertContent);

    let result;

    try {
      result = await this.insert(mutatedInsertContent);
    } catch(err) {
      if (typeof err.message !== 'string' || err.message.substr(0, 13) !== 'duplicate key') {
        throw err;
      }

      // mutations
      const mutatedUpdateContent = this[mutateHashKeys](updateContent);
      const mutatedUpdateConstraints = this[mutateHashKeys](mutatedUpdateConstraints);

      result = await this.update(mutatedUpdateContent, mutatedUpdateConstraints);
    }

    return this[mapRowInstances](result);
  }

  static async upsert() {
    return await this[staticProxy]('upsert', arguments);
  }

  static async [staticProxy](methodName, originalArgs /* = [ tableName, [constraints, ...,]] */) {
    const args = Array.prototype.slice.call(originalArgs);
    const tableName = args.shift();

    if (typeof tableName !== 'string') {
      throw new ContentError(`DatabaseTable.${methodName} requires the first argument to be a table name`);
    }

    const instance = new DatabaseTable(tableName);
    return await instance[methodName].apply(instance, args);
  }

  static literal(str) {
    return new DatabaseQueryLiteral(str);
  }

  static cast(str, castTo) {
    return new DatabaseQueryCast(str, castTo);
  }
}

function generateInsertValues(rows, columnNames, queryValues = []) {
  const insertAssignments = [];

  for (let i = 0; i < rows.length; i++) {
    const newRowAssignment = [];

    for (let j = 0; j < columnNames.length; j++) {
      const val = rows[i][ columnNames[j] ];

      if (val === undefined) {
        newRowAssignment.push('NULL');
        continue;
      }

      if (val instanceof DatabaseQueryLiteral) {
        newRowAssignment.push(val);
        continue;
      }

      queryValues.push(val);
      newRowAssignment.push(`$${queryValues.length}`);
    }

    insertAssignments.push(newRowAssignment);
  }

  const valuesFormatted = insertAssignments
    .map(assignmentArr => {
      return `(${assignmentArr.join(', ')})`;
    })
    .join(', ');

  return {
    queryValues,
    valuesFormatted
  };
}

function generateSqlKeyVals(separator, dict, valuesArray) {
  return Object.keys(dict)
    .map(key => {
      const val = dict[key];

      if (val instanceof DatabaseQueryLiteral) {
        return `${key} = ${val}`;
      }

      valuesArray.push(val);
      return `${key} = $${valuesArray.length}`;
    })
    .join(separator);
}

/*
  constraints should be an array of constraint {} objects
  e.g. [{ id: 1 }, { id: 2 }]
 */
function generateWhereClause(constraints, queryValues = []) {
  if (!constraints.length) {
    return {
      queryValues,
      whereClause: ''
    };
  }

  if (constraints.length === 1) {
    return {
      queryValues,
      whereClause: ' WHERE ' + generateSqlKeyVals(' AND ', constraints[0], queryValues)
    };
  }

  const whereClause = ' WHERE ' + constraints
    .map(constr => {
      return `(${generateSqlKeyVals(' AND ', constr, queryValues)})`;
    })
    .join(' OR ');

  return {
    queryValues,
    whereClause
  };
}

/*
  iterates over one to many row objects, which may have a different number of columns,
  and returns an unordered array of columns that covers all objects
 */
function findAllColumnNames(rows) {
  const columnNames = [];

  for (let i = 0; i < rows.length; i++) {
    for (let key in rows[i]) {
      if (columnNames.includes(key)) {
        continue;
      }

      columnNames.push(key);
    }
  }

  return columnNames;
}

module.exports = DatabaseTable;
