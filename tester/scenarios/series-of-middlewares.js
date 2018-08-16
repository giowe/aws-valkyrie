/* eslint-disable no-console */
module.exports = (engine, engineName) => {
  const app = new engine()

  const r1 = engine.Router()
  r1.get("/", (req, res, next) => {
    res.header("r1", true)
    next()
  })

  const r2 = engine.Router()
  r2.get("/", (req, res, next) => {
    res.header("r2", true)
    next()
  })

  r2.get("/", (req, res) => {
    res.sendStatus(200)
  })

  app.use("/router", r1, r2)

  app.get("/", (req, res) => {
    res.send("middleware chain")
  })

  return app
}
