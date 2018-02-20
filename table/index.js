const { UnexpectedError, ContentError } = require('err');

const mapRowInstances = Symbol('maps query result rows to DatabaseRow instances');
const staticProxy = Symbol('static method, proxy to instance method');
const transformName = Symbol('transform a single sql resource name');
const transformObj = Symbol('transform column key value pairs');

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

const upperLettersMatch = /[A-Z]+/g;
function camelToSnakeCase(name) {
  return name
    .replace(upperLettersMatch, (match, indx, baseString) => {
      const replacement = match.length === 1 ? match :
        match.length + indx === baseString.length ? match :
        match.substr(0, match.length - 1) + '_' + match.substr(-1);

      return (
        (indx === 0 ? '' : '_') +
        replacement
      );
    })
    .toLowerCase();
}

const underscoreMatch = /_+[a-z]/g;
function snakeToCamelCase(name) {
  // expecting lower_snake_cased names form postgres
  return name.replace(underscoreMatch, match => {
    return match.substr(-1).toUpperCase();
  });
}

const tableOptions = {
  transformCamelCase: false
};

module.exports = class DatabaseTable {
  constructor(tableName) {
    this.tableName = this[transformName](tableName);
  }

  static get options() {
    return Object.assign({}, tableOptions);
  }

  static set options(newOpts) {
    for (let key in newOpts) {
      if (tableOptions[key] === undefined) {
        continue;
      }

      tableOptions[key] = newOpts[key];
    }
  }

  [mapRowInstances](queryResult) {
    const DatabaseRow = require('../row');
    return (queryResult.rows || []).map(row => {
      if (DatabaseTable.options.transformCamelCase) {
        row = this[transformObj](row, snakeToCamelCase);
      }
      return new DatabaseRow(this.tableName, row);
    });
  }

  [transformObj](pairs, transformerUsed = camelToSnakeCase) {
    if (!DatabaseTable.options.transformCamelCase) {
      return pairs;
    }

    const result = {};

    for (let key in pairs) {
      const newKey = this[transformName](key, transformerUsed);
      result[newKey] = pairs[key];
    }

    return result;
  }

  [transformName](name, transformerUsed = camelToSnakeCase) {
    if (!DatabaseTable.options.transformCamelCase) {
      return name;
    }

    return transformerUsed(name);
  }

  async select(...constraints) {
    // transformations
    const transformedConstraints = constraints.map(obj => this[transformObj](obj));

    const { query } = require('../');

    const { queryValues, whereClause } = generateWhereClause(transformedConstraints);

    const result = query(`SELECT * FROM ${this.tableName}${whereClause}`, queryValues);
    return this[mapRowInstances](await result);
  }

  static async select() {
    return await this[staticProxy]('select', arguments);
  }

  async update(updates, ...constraints) {
    // transformations
    const transformedUpdates = this[transformObj](updates);
    const transformedConstraints = constraints.map(obj => this[transformObj](obj));

    const { query } = require('../');

    const queryValues = [];
    const updatesSql = generateSqlKeyVals(', ', transformedUpdates, queryValues);
    const { whereClause } = generateWhereClause(transformedConstraints, queryValues);

    const result = query(`UPDATE ${this.tableName} SET ${updatesSql}${whereClause}`, queryValues);
    return this[mapRowInstances](await result);
  }

  static async update() {
    return await this[staticProxy]('update', arguments);
  }

  async delete(...constraints) {
    // transformations
    const transformedConstraints = constraints.map(obj => this[transformObj](obj));

    const { query } = require('../');

    const { queryValues, whereClause } = generateWhereClause(transformedConstraints);

    const result = query(`DELETE FROM ${this.tableName}${whereClause}`, queryValues);
    return this[mapRowInstances](await result);
  }

  static async delete() {
    return await this[staticProxy]('delete', arguments);
  }

  async insert(...newRows) {
    // transformations
    const transformedNewRows = newRows.map(row => this[transformObj](row));

    const { query } = require('../');

    if (!transformedNewRows.length) {
      throw new UnexpectedError('There were no rows to insert');
    }

    const columnNames = findAllColumnNames(transformedNewRows);

    if (columnNames.includes('id')) {
      throw new ContentError('Cannot insert a row that has .id');
    }

    const { queryValues, valuesFormatted } = generateInsertValues(transformedNewRows, columnNames);

    const result = query(`INSERT INTO ${this.tableName}(${columnNames.join(', ')}) VALUES ${valuesFormatted} RETURNING *`, queryValues);
    return this[mapRowInstances](await result);
  }

  static async insert() {
    return await this[staticProxy]('insert', arguments);
  }

  async upsert(insertContent, updateContent, updateConstraints) {
    // transformations
    const transformedInsertContent = this[transformObj](insertContent);

    let result;

    try {
      result = await this.insert(transformedInsertContent);
    } catch(err) {
      if (typeof err.message !== 'string' || err.message.substr(0, 13) !== 'duplicate key') {
        throw err;
      }

      // transformations
      const transformedUpdateContent = this[transformObj](updateContent);
      const transformedUpdateConstraints = this[transformObj](transformedUpdateConstraints);

      result = await this.update(transformedUpdateContent, transformedUpdateConstraints);
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
