/* eslint-disable no-console */
module.exports = (engine, engineName) => {
  const app = new engine()
  const router = engine.Router()

  app.use((req, res, next) => {
    res.header("middleware", "ok")
    console.log(engineName, "fist middleware")
    next()
    //res.send("ciao")
  })

  app.use("/te/:xxx", (req, res, next) => {
    console.log("middle", engineName, req.params.xxx)
    //console.log(engineName, "test middleware xxx")
    next()
  })

  app.use("/test", (req, res, next) => {
    //console.log(engineName, "test middleware")
    next()
  })
  app.get("/test/1", (req, res, next) => res.send("test1"))

  router.get("/", (req, res) => {
    res.send("router")
  })

  app.get("/", (req, res) => res.send("middlewares"))
  app.use("/router", (req, res, next) => {
    console.log(engineName)
    next()
  }, router)

  app.all("*", (req, res) => res.status(404).send("not found!"))

  if (engineName === "valkyrie") {
    console.log(app.describe())
  }

  return app
}
