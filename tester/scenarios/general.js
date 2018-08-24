/* eslint-disable no-console */
module.exports = (engine, engineName) => {
  const app = new engine()
  const router = engine.Router()

  app.use("/", (req, res, next) => {
    console.log("A middleware")
    next()
  }, (req, res, next) => {
    console.log("PATH >>>", req.path)
    next()
  })

  const r1 = engine.Router()
  r1.get("/", (req, res, next) => {
    console.log("r1")
    next()
  })
  r1.get("/", (req, res, next) => {
    console.log("r1 bis")
    next()
  })
  const r2 = engine.Router()
  r2.get("/", (req, res, next) => {
    console.log("r2")
    next()
  })

  app.use(r1, r2)

  const middle1 = (req, res, next) => {
    console.log("middle1")
    next()
    //res.send('this is middle 1');
  }

  const skipMiddle = (req, res, next) => {
    console.log("this middleware skip to next route")
    next("route")
  }

  app.get(["/multiple", "/path", ["/matching"]], (req, res) => {
    res.send("multiple path matching")
  })

  app.get("/explorer", (req, res) => {
    res.header("content-type", "text/html")
    res.send(app.describe({ format: "html" }))
  })

  app.use("/router/:user", (req, res, next) => {
    const { user } = req.params
    if (user !== "admin") res.status(403).send(`AUTH ERROR: ${user} not allowed.`)
    else next()
  }, router)

  app.use("/tests-next", middle1, middle1, middle1, skipMiddle, middle1, middle1, (req, res) => {
    res.send("you will not see this")
  })

  app.get("/tests-next", (req, res) => {
    res.send("this is the next tests route")
  })

  app.use(["/route", ["/route2", "/route3"]], (req, res, next) => {
    res.header("multi-url", true)
    next()
  })

  app.route("/route")
    .get((req, res) => {
      res.send("this is route in get")
    })
    .post((req, res) => {
      res.send("this is the same route in post")
    })
    .head((req, res) => {
      console.log("head request!")
      res.sendStatus(200)
    })

  app.route("/route")
    .put((req, res) => {
      res.sendStatus(201)
    })

  app.get("/send-status/:statusCode", (req, res) => {
    res.sendStatus(req.params.statusCode)
  })

  app.post("/post-tests", (req, res) => {
    req.body.test = "post-tests"
    res.json(req.body)
  })

  app.get("/log-request", (req, res) => {
    res.send(req)
  })

  app.get("/headers", (req, res) => {
    res.send(req.get("test"))
  })
  // router.use((req, res, next) => {
  //   res.append('custom-header-field', 'Valkyrie!');
  //   console.log('possible auth middleware');
  //   next();
  // });

  router.get("/say/:text", (req, res) => {
    console.log(`param text is equal to ${req.params.text}`)
    res.send(`I just want to say "${req.params.text}"`)
  })

  // router2.get('/hi', (req, res) => {
  //   res.send('hi, this is router2!');
  // });

  //router.use('/router2', router2);

  app.all("*", (req, res, next) => {
    console.log("catchall")
    res.status(404).send("not found!")
  })

  if (engineName === "Valkyrie") console.log(app.describe())

  return app
}
