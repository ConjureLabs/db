const { exec } = require('child_process')

let i = 0

module.exports = () => {
  return new Promise((resolve, reject) => {
    const tableName = `tmp_table_number${++i}`
    const tableNameCamelCased = `tmpTableNumber${i}`

    exec(`bash ./create-table.sh ${tableName}`, {
      cwd: __dirname
    }, err => {
      if (err) {
        return reject(err)
      }

      resolve({
        tableName,
        tableNameCamelCased
      })
    })
  })
}
