/* eslint-disable no-console */
module.exports = (engine, engineName) => {
  const app = new engine()

  app.all("/accepts/:type", (req, res) => {
    res.send(req.accepts(req.params.type))
  })

  app.all("*", (req, res) => res.status(404).send("not found!"))

  if (engineName === "Valkyrie") console.log(app.describe())

  return app
}
