const { UnexpectedError, ContentError } = require('err');

const mapRowInstances = Symbol('maps query result rows to DatabaseRow instances');
const staticProxy = Symbol('static method, proxy to instance method');

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

module.exports = class DatabaseTable {
  constructor(tableName) {
    this.tableName = tableName;
  }

  [mapRowInstances](queryResult) {
    const DatabaseRow = require('../row');
    return (queryResult.rows || []).map(row => {
      return new DatabaseRow(this.tableName, row);
    });
  }

  async select(...constraints) {
    const { query } = require('../');

    const { queryValues, whereClause } = generateWhereClause(constraints);

    const result = query(`SELECT * FROM ${this.tableName}${whereClause}`, queryValues);
    return this[mapRowInstances](await result);
  }

  static async select() {
    return await this[staticProxy]('select', arguments);
  }

  async update(updates, ...constraints) {
    const { query } = require('../');

    const queryValues = [];
    const updatesSql = generateSqlKeyVals(', ', updates, queryValues);
    const { whereClause } = generateWhereClause(constraints, queryValues);

    const result = query(`UPDATE ${this.tableName} SET ${updatesSql}${whereClause}`, queryValues);
    return this[mapRowInstances](await result);
  }

  static async update() {
    return await this[staticProxy]('update', arguments);
  }

  async delete(...constraints) {
    const { query } = require('../');

    const { queryValues, whereClause } = generateWhereClause(constraints);

    const result = query(`DELETE FROM ${this.tableName}${whereClause}`, queryValues);
    return this[mapRowInstances](await result);
  }

  static async delete() {
    return await this[staticProxy]('delete', arguments);
  }

  async insert(...newRows) {
    const { query } = require('../');

    if (!newRows.length) {
      throw new UnexpectedError('There were no rows to insert');
    }

    const columnNames = findAllColumnNames(newRows);

    if (columnNames.includes('id')) {
      throw new ContentError('Cannot insert a row that has .id');
    }

    const { queryValues, valuesFormatted } = generateInsertValues(newRows, columnNames);

    const result = query(`INSERT INTO ${this.tableName}(${columnNames.join(', ')}) VALUES ${valuesFormatted} RETURNING *`, queryValues);
    return this[mapRowInstances](await result);
  }

  static async insert() {
    return await this[staticProxy]('insert', arguments);
  }

  async upsert(insertContent, updateContent, updateConstraints) {
    let result;

    try {
      result = await this.insert(insertContent);
    } catch(err) {
      if (typeof err.message !== 'string' || err.message.substr(0, 13) !== 'duplicate key') {
        throw err;
      }

      result = await this.update(updateContent, updateConstraints);
    }

    return this[mapRowInstances](result);
  }

  static async upsert() {
    return await this[staticProxy]('upsert', arguments);
  }

  static async [staticProxy](methodName, originalArgs /* = [ tableName, [constraints, ...,]] */) {
    const args = Array.prototype.slice.call(originalArgs);
    const tableName = args.shift();
    const instance = new DatabaseTable(tableName);
    return await instance[methodName].apply(instance, args);
  }

  static literal(str) {
    return new DatabaseQueryLiteral(str);
  }

  static cast(str, castTo) {
    return new DatabaseQueryCast(str, castTo);
  }
};

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
