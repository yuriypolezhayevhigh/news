const cheerio = require('cheerio'),
  fs = require('fs'),
  path = require('path')

const puppeteer = require('puppeteer-extra')
// add stealth plugin and use defaults (all evasion techniques)
const pluginStealth = require("puppeteer-extra-plugin-stealth")
// add recaptcha plugin and provide it your 2captcha token
// 2captcha is the builtin solution provider but others work as well.
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha') ///dist/index
const recaptchaPlugin = RecaptchaPlugin({
  provider: { id: '2captcha', token: 'XXXXXXX' },
  visualFeedback: true,
})
puppeteer.use(pluginStealth())
puppeteer.use(recaptchaPlugin)


class googleTranslate {
  constructor (lang = 'ru') {
    this.lang = lang
  }
  async init () {
    return new Promise(async (resolve, reject) => {
     this.browser = await puppeteer.launch({ args: ["--no-sandbox", '--disable-setuid-sandbox'], headless: true }).then(async browser => {
      try {
        const page = this.page = await browser.newPage()
        await page.setViewport({ width: 1280, height: 800 })
        await page.goto(`https://translate.google.ru/#view=home&op=translate&sl=auto&tl=${this.lang}&`, { waitUntil: 'networkidle0' })
        await page.solveRecaptchas()
        resolve()
      } catch (e) {
        
      }
    })
    })
  }
  async translate (...texts) {
    const maxLength = 4500

    // return text.reduce((prev, string) => prev.then(result => this.translateString(string))
    //   .then(stringTranslation => [...prev, stringTranslation]), Promise.resolve([]))
    let result = []
    for (let text of texts) {
      if (text.length > maxLength) {
        console.log(text.length, 'MAX LENGTH')
        let ceil = Math.ceil(text.length / maxLength )
        let string = ''
        for (let index = 0; index < ceil; index++) {
          await new Promise(  (resolve, reject) => {
            this.translateString( text.slice(index * maxLength, index * maxLength + maxLength) ).then((data) => {
              string += data
              resolve(data)
            })
          })
        }
        result.push(string)
      } else {
        result.push(await this.translateString(text))
      }
    }
    if (result.length <= 1) {
      return result[0]
    } else {
      return result
    }
  }
  async translateString (string) {
    return new Promise(async (resolve, reject) => {
    try {
      const page = this.page
      // await page.waitForNavigation({waitUntil: 'networkidle0'});
      let input = await page.$('#source')
      await page.evaluate( (el) => el.value = '', input)
      // await page.type('#source', string, { delay: 0 })
      await page.evaluate((el, string) => el.value = string, input, string)
      await page.waitForResponse(response => response.url().startsWith('https://translate.google.ru/translate_a/single'))
      await page.waitForSelector('.tlid-translation.translation', { visible: true })
      let element = await page.$(".tlid-translation.translation")
      await page.waitFor(500)
      let html = await page.evaluate(el => el.innerHTML, element)
      // console.log(html)
      resolve(html.replace(/<span\b[^<]*>(.*?)<\/span>/gm, '$1').replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''))
    } catch (e) {

    }
  })
  }
}

module.exports = {
  googleTranslate,
}