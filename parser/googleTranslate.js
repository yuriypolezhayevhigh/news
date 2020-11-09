const cheerio = require('cheerio'),
  fs = require('fs'),
  path = require('path'),
  { validationService, fixHtmlText } = require('./helpers/helpers')

const puppeteer = require('puppeteer-extra')
// add stealth plugin and use defaults (all evasion techniques)
const pluginStealth = require('puppeteer-extra-plugin-stealth')
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
    this.totalRequest = {
      time: 0,
      requestGoogle: 0,
    }
    this.lang = lang
  }

  async init () {
    return new Promise(async (resolve, reject) => {
      await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true,
      }).then(async browser => {
        this.browser = browser
        try {
          const page = this.page = await browser.newPage()
          await page.setViewport({ width: 1280, height: 800 })
          // await page.goto(`https://translate.google.ru/#view=home&op=translate&sl=auto&tl=${ this.lang }&`, { waitUntil: 'networkidle0' })
          await page.goto(`https://translate.google.ru/#view=home&sl=auto&tl=${ this.lang }&op=translate`, { waitUntil: 'networkidle0' })
          await page.solveRecaptchas()
          resolve()
        } catch (e) {
          validationService(e)
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
      text = fixHtmlText(text)
      if (text.length > maxLength) {
        // console.log(text.length, 'MAX LENGTH')
        let ceil = Math.ceil(text.length / maxLength)
        let string = ''




        let step = 0
        while(text.length > step) {
          await this.page.waitForTimeout(500)
          let slice = text.slice(step, maxLength)
          let last_index = slice.lastIndexOf('.')
          last_index = last_index > 0 ? last_index : step + maxLength
          await new Promise((resolve, reject) => {
            this.translateString(text.slice( Math.ceil(step), Math.ceil(last_index)) ).then(data => {
              string += data
              resolve()
            }).catch(async (err) => {
              await this.page.waitForTimeout(20000)
              console.log('go to restart: BIG DATA ')
              step = last_index
              this.translateString(text.slice( Math.ceil(step), Math.ceil(last_index + maxLength)) ).then((data) => {
                string += data
                resolve()
              }).catch(async () => {
                await this.page.screenshot({ path: "./parser/photos/big" + Date.now() + ".png", fullPage: true })
                console.log('gg bro BIG')
              })
            })
          })
          step = last_index
        }
        result.push(string)
        // for (let index = 0; index < ceil; index++) {
        //   await this.page.waitFor(500)
        //   await new Promise((resolve, reject) => {
        //     this.translateString(text.slice(index * maxLength, index * maxLength + maxLength)).then((data) => {
        //       string += data
        //
        //     })
        //   })
        // }
      } else {
        await this.page.waitForTimeout(300)
        await this.translateString(text).then((res) => {
          result.push(res)
        }).catch(async (err) => {
          await this.page.waitForTimeout(20000)
          console.log('go to restart: Small DATA')
          await this.translateString(text).then((res) => {
            result.push(res)
          }).catch(async () => {
            console.log('gg bro SMALL go restart')
            await this.page.screenshot({ path: "./parser/photos/small" + Date.now() + ".png", fullPage: true })
          })
        })
      }
    }
    if (result.length <= 1) {
      return result[0]
    } else {
      return result
    }
  }

  async translateString (string) {
    if (!string) {
      return 'Infinitum.tech'
    }
    this.totalRequest.requestGoogle += 1
    return new Promise(async (resolve, reject) => {
      try {
        const page = this.page
        // await page.waitForNavigation({waitUntil: 'networkidle0'});
        await page.waitForTimeout(1300)
        let input = await page.$('#source')
        try {
          await page.evaluate((el) => el.value = '', input)
        } catch (e) {
          await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] })
          await page.evaluate((el) => el.value = '', input)
        }

        // await page.type('#source', string, { delay: 0 })
        await page.waitForTimeout(1500)
        await page.evaluate((el, string) => el.value = string, input, string)
        await page.waitForResponse(response => response.url().startsWith('https://translate.google.ru/translate_a/single'))
        await page.waitForSelector('.tlid-translation.translation', { visible: true })
        let element = await page.$('.tlid-translation.translation')
        await page.waitForTimeout(2200)
        let html = await page.evaluate(el => el.innerHTML, element)
        // console.log(html)
        resolve(html.replace(/<span\b[^<]*>(.*?)<\/span>/gm, '$1').replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''))
      } catch (e) {
        validationService(e)
        console.log('try to restart')
        reject(string)
      }
    })
  }

  async finish () {
    console.log(this.lang, ' Google Browser End ', this.totalRequest)
    await this.browser.close()
  }
}

module.exports = {
  googleTranslate,
}