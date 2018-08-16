/* eslint-disable no-console */

module.exports = engineName => {
  return {
    log: (...data) => {
      console.log(`${engineName}:`, ...data)
    }
  }
}
