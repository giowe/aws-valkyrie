const { dirname, basename, extname, join, resolve } = require("path")
const { statSync } = require("fs")

class View {
  constructor(name, settings) {
    settings = this.settings = Object.assign({}, settings)
    this.defaultEngine = settings.defaultEngine
    this.root = settings.root
    this.ext = extname(name)
    this.name = name

    if (!this.ext && !this.defaultEngine) {
      throw new Error("No default engine was specified and no extension was provided.")
    }

    let fileName = name

    if (!this.ext) {
      // get extension from default engine name
      this.ext = this.defaultEngine[0] !== "." ? `.${this.defaultEngine}` : this.defaultEngine
      fileName += this.ext
    }

    if (!settings.engines[this.ext]) {
      // load engine
      const mod = this.ext.substr(1)

      // default engine export
      const fn = require(mod).__express

      if (typeof fn !== "function") {
        throw new Error("Module \"" + mod + "\" does not provide a view engine.")
      }

      settings.engines[this.ext] = fn
    }

    this.engine = settings.engines[this.ext]

    this.path = this.lookup(fileName)

    return this
  }

  resolve(dir, file) {
    const { ext } = this
    let path = join(dir, file)
    let stat = _tryStat(path)

    if (stat && stat.isFile()) {
      return path
    }

    path = join(dir, basename(file, ext), `index${ext}`)
    stat = _tryStat(path)

    if (stat && stat.isFile()) {
      return path
    }
  }

  lookup(name) {
    let path
    const roots = [].concat(this.root)

    for (var i = 0; i < roots.length && !path; i++) {
      const root = roots[i]

      // resolve the path
      const loc = resolve(root, name)
      const dir = dirname(loc)
      const file = basename(loc)

      // resolve the file
      path = this.resolve(dir, file)
    }

    return path
  }

  render(options, callback) {
    this.engine(this.path, options, callback)
  }
}

module.exports = View

function _tryStat(path) {
  try {
    return statSync(path)
  } catch (_) {}
}
