/* eslint-disable no-console */
module.exports = (engine, engineName) => {
  const app = new engine()
  const router = engine.Router()

  app.use((req, res, next) => {
    //res.header("middleware", "ok")
    console.log(engineName)
    //next()
    res.send("ciao")
  })

  router.get("/", (req, res) => {
    res.send("router")
  })

  app.get("/", (req, res) => res.send("middlewares"))
  app.use("/router", router)

  app.all("*", (req, res) => res.status(404).send("not found!"))

  if (engineName === "valkyrie") {
    console.log(app.describe())
  }

  return app
}
