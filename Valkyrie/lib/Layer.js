class Layer {
  constructor(route, methods, fn) {
    this.router = route.router
    this.route = route
    this.layerIndex = route.layersCount
    this.methods = methods
    this._fn = fn

    if (this.containsRouter) this._fn.containerLayer = this
  }

  get containsRouter() {
    return this._fn.isRouter === true
  }

  get isErrorHandlingMiddleware() {
    return !this.containsRouter && this._fn.length === 4
  }

  handleRequest(req, res, paths, err = null) {
    const { route, layerIndex } = this

    if (!_matchMethod(this, req)) {
      return route.handleRequest(req, res, paths, layerIndex + 1, err)
    }

    const { _fn, router, isErrorHandlingMiddleware } = this

    if (this.containsRouter) {
      return _fn.handleRequest(req, res, paths, 0, err)
    }

    if ((err && !isErrorHandlingMiddleware) || (!err && isErrorHandlingMiddleware)) {
      return route.handleRequest(req, res, paths, layerIndex + 1, err)
    }

    try {
      const next = req.next = (err) => {
        if (err && err !== "route") {
          route.handleRequest(req, res, paths, layerIndex + 1, err)
        } else if (err === "route") {
          router.handleRequest(req, res, paths, route.routeIndex + 1)
        } else {
          route.handleRequest(req, res, paths, layerIndex + 1)
        }
      }

      if (isErrorHandlingMiddleware) {
        _fn(err, req, res, next)
      } else {
        _fn(req, res, next)
      }
    } catch (err) {
      route.handleRequest(req, res, paths, layerIndex + 1, err)
    }
  }

  describe(paths = this.route.paths, level = 0) {
    const prefix = `${" ".repeat(2 + (level * 2))}`
    const keys = Object.keys(this.methods).join(", ")
    if (this.containsRouter) {
      return `${prefix}Router Layer: ${keys}\n${this._fn.describe(paths, level + 1)}`
    } else {
      return `${prefix}Layer: ${keys}`
    }
  }
}

function _matchMethod(self, req) {
  const { methods, route } = self

  if (methods.use || methods.all) {
    return true
  }

  let { method } = req
  if (method === "head" && !methods.head && !route.methods.head)  {
    method = "get"
  }

  return methods[method]
}

module.exports = Layer
