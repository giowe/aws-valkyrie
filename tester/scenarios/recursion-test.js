/* eslint-disable no-console */
module.exports = (engine, engineName) => {
  const app = new engine()

  app.get("/", (req, res) => res.send("recursion test"))

  for (let i = 0; i < 500; i++) {
    app.use("/recursion", (req, res, next) => {
      if (i === 0) {
        req.start = new Date().getTime()
      }
      res.set(`${i}`, "ok")
      next()
    })
  }

  app.get("/recursion", (req, res) => {
    res.send(`done in ${new Date().getTime() - req.start}`)
  })

  app.all("*", (req, res, next) => {
    console.log("catchall")
    res.status(404).send("not found!")
  })

  if (engineName === "Valkyrie") console.log(app.describe())

  return app
}
