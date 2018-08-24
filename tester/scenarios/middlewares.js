/* eslint-disable no-console */
module.exports = (engine, engineName) => {
  const app = new engine()
  const router = engine.Router()
  const router2 = engine.Router()

  app.use((req, res, next) => {
    res.header("fist-middleware", "ok")
    next()
  })

  app.use("/te/:xxx", ({ params: { xxx } }, res, next) => {
    res.header("second-middleware", xxx)
    next()
  })

  app.use("/test", (req, res, next) => {
    res.header("fist-middleware", "ok")
    console.log(engineName, "test middleware")
    next()
  })
  app.get("/test/1", (req, res, next) => res.send("test1"))

  router.get("/", (req, res) => {
    res.send("router")
  })

  router2.get("/", (req, res, next) => {
    res.header("router2", "ok")
    next()
  }, (req, res) => {
    res.send("router2")
  })

  router.use("/2", router2)

  app.get("/", (req, res) => res.send("middlewares"))
  app.use("/router", (req, res, next) => {
    res.header("router", "ok")
    next()
  }, router)

  app.all("*", (req, res) => res.status(404).send("not found!"))

  if (engineName === "valkyrie") {
    console.log(app.describe())
  }

  return app
}
