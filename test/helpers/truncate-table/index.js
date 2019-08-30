import { exec } from 'child_process'

export default tableName => {
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
