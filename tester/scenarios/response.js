/* eslint-disable no-console */
module.exports = (engine, engineName) => {
  const app = new engine()

  app.get("/status/:code", (req, res) => res.sendStatus(req.params.code))
  app.get("/links", (req, res) => {
    res.links({
      next: "http://api.example.com/users?page=2",
      last: "http://api.example.com/users?page=5"
    })
    res.sendStatus(200)
  })

  app.get("/type/:type", (req, res) => {
    res.type(req.params.type)
    res.send(res.get("content-type"))
  })

  app.get("/attachment", (req, res) => {
    res.attachment("test.txt")
    res.sendStatus(200)
  })

  app.get("/append", (req, res) => {
    res.set("foo", "bar1")
    res.append("foo", "bar2")
    res.sendStatus(200)
  })

  app.get("/cookie", (req, res) => {
    req.secret = "super secret pass"
    res.cookie("foo", "bar", {
      maxAge: 100000,
      signed: true
    })
    res.cookie("foo2", "bar2")
    res.sendStatus(200)
  })

  app.get("/remove-header", (req, res) => {
    res.removeHeader("x-powered-by")
    res.sendStatus(200)
  })

  app.get("/clear-cookie", (req, res) => {
    res.clearCookie("foo")
    res.clearCookie("foo2")
    res.sendStatus(200)
  })

  app.get("/vary", (req, res) => {
    res.vary("prova").sendStatus(200)
  })

  app.get("/location", (req, res) => {
    res.location("https://google.it").sendStatus(200)
  })

  app.get("/redirect", (req, res) => {
    res.redirect("https://google.it")
  })

  app.get("/send", (req, res) => {
    res.send()
  })

  app.get("/json", (req, res) => {
    res.json({
      test: {
        foo: "bar"
      }
    })
  })

  app.get("/format", (req, res) => {
    res.format({

    })
  })

  app.all("*", (req, res) => res.status(404).send("not found!"))

  if (engineName === "Valkyrie") console.log(app.describe())

  return app
}
