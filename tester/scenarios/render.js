/* eslint-disable no-console */
module.exports = (engine, engineName) => {
  const app = new engine()

  app.set("view engine", "pug")

  app.set("views", __dirname)

  app.all("/render", (req, res) => {
    res.render("render", { title: "Hey", message: "Hello there!" })
  })

  app.all("*", (req, res) => res.status(404).send("not found!"))

  if (engineName === "Valkyrie") console.log(app.describe())

  return app
}
