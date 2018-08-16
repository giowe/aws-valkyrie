/* eslint-disable no-console */
module.exports = (engine, engineName, { log }) => {
  const app = new engine()

  ;[
    "baseUrl",
    "body",
    "cookies",
    "fresh",
    "hostname",
    "ip",
    "ips",
    "originalUrl",
    "path",
    "protocol",
    "query",
    "route",
    "secure",
    "signedCookies",
    "stale",
    "subdomanins",
    "xhr"
  ].forEach(key => app.all(`/${key}`, (req, res) => {
    res.send(req[key])
  }))

  app.all("/send", (req, res) => {
    res.send(Buffer.from("fhqwhgads", "utf16le"))
  })

  app.all("/params/:param1/:param2", (req, res) => {
    res.send(req.params)
  })

  app.all("/accepts/:type", (req, res) => {
    res.send(req.accepts(req.params.type))
  })

  app.all("*", (req, res) => res.status(404).send("not found!"))

  if (engineName === "Valkyrie") console.log(app.describe())

  return app
}
