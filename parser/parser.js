const tress = require('tress'),
  needle = require('needle'),
  cheerio = require('cheerio'),
  // resolve = require('url').resolve,
  fs = require('fs'),
  { performance } = require('perf_hooks')


class Parser {
  constructor () {
    this.results = []
    this.threads = 5
    this.totalRequest = {
      time: 0,
    }


    let Page = new Promise((resolve, reject) => {
      console.time("Page Work")
      this.totalRequest.time = performance.now()
      this.pages = tress((data, callback) => {
        this.requestGetPage(data, callback)
        // this.requestGetJson(data, callback);
      }, this.threads)
      this.pages.drain = () => {
        console.timeEnd("Page Work")
        this.totalRequest.time = performance.now() - this.totalRequest.time

        resolve()
      }
    })
    this.pages.push({
      url: 'https://www.20minutos.es/noticia/4321968/0/elecciones-galicia-pais-vasco-continuidad-feijoo-ukullu/',
    })
  }
  requestGetPage (data, callback) {
    needle.get(data.url, {},(err, res) => { // { agent: myAgent },
      this.totalRequest.google += 1
      if (err) {
        console.log(err, 'error Request', data.url)
        if (callback) {
          callback()
        }
        return
      }
      console.log(res.body)
      this.parseHtml (res.body, data, callback)
    })
  }
  parseHtml (html, data, callback) {
    let $ = cheerio.load(html)
  }
}

new Parser()
// module.exports = {
//   Parser
// };