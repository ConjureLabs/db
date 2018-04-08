const { exec } = require('child_process')

module.exports = tableName => {
  return new Promise((resolve, reject) => {
    exec(`bash ./truncate-table.sh ${tableName}`, {
      cwd: __dirname
    }, err => {
      if (err) {
        return reject(err)
      }

      resolve()
    })
  })
}
