const { init } = require('../../../')
const config = require('./config')

init(config, {
  transformCamelCase: false
})
