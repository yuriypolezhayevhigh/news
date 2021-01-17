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
          let input = await page.$('#source')
          if (input == null) {
            console.log('error')
            // await this.browser.close()
            // await this.init().then(data => {
            //   resolve()
            // })
            resolve()
          } else {
            resolve()
          }
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
          // await this.page.waitForTimeout(500)
          await this.page.waitFor(500)
          let slice = text.slice(step, maxLength)
          let last_index = slice.lastIndexOf('.')
          last_index = last_index > 0 ? last_index : step + maxLength
          await new Promise((resolve, reject) => {
            this.translateString(text.slice( Math.ceil(step), Math.ceil(last_index)) ).then(data => {
              string += data
              resolve()
            }).catch(async (err) => {
              // await this.page.waitForTimeout(20000)
              await this.page.waitFor(20000)
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
        await this.page.waitFor(300)
        // await this.page.waitForTimeout(300)
        await this.translateString(text).then((res) => {
          result.push(res)
        }).catch(async (err) => {
          await this.page.waitFor(20000)
          // await this.page.waitForTimeout(20000)
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
        await page.waitFor(1300)
        // await page.waitForTimeout(1300)
        let input = await page.$('#source'),
          html = ''
        if (input) {
          await page.evaluate((el) => el.value = '', input)
          // try {
          //   await page.evaluate((el) => el.value = '', input)
          // } catch (e) {
            // console.log('source ERROR')
            // await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] })
            // await page.evaluate((el) => el.value = '', input)
          // }
          // await page.type('#source', string, { delay: 0 })
          // await page.waitForTimeout(1500)
          await page.waitFor(1500)
          await page.evaluate((el, string) => el.value = string, input, string)
          await page.waitForResponse(response => response.url().startsWith('https://translate.google.ru/translate_a/single'))
          await page.waitForSelector('.tlid-translation.translation', { visible: true })
          let element = await page.$('.tlid-translation.translation')
          // await page.waitForTimeout(2200)
          await page.waitFor(2200)
          html = await page.evaluate(el => el.innerHTML, element)
        } else {
          input = await page.$('textarea')
          await page.evaluate((el) => el.value = '', input)
          await page.waitFor(1500)
          await page.evaluate((el, string) => el.value = string, input, string)
          await page.type('textarea', ' ', { delay: 10 })
          await page.waitForResponse(response => response.url().startsWith('https://translate.google.ru/_/TranslateWebserverUi/data/batchexecute'))
          await page.waitForSelector('.J0lOec', { visible: true })
          let elements = await page.$$('.JLqJ4b>span:first-child')
          await page.waitFor(2200)
          for (let element of elements) {
            var text = await page.evaluate(el => el.innerHTML, element)
            // console.log(text, 'MY SUPER TEXT')
            html += `${text} \n`
          }
          // await page.waitForTimeout(2200)
        }

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

// let google = new googleTranslate()
// google.init().then(() => {
//   google.translate(`I løpet av de siste to og en halv ukene har Israel angivelig gjennomført minst fire runder med luftangrep mot Iran-tilknyttede mål i Syria, inkludert et større bombardement i det østlige Syria natt til onsdag. Dette er en kraftig opptrapping fra det normale omfanget og hyppigheten av slike angrep, skriver Judah Ari Gross i en kommentar i Times of Israel.
//
// Onsdagens angrep var en stor operasjon i arbeidet med å forhindre Iran i å etablere seg militært i nabolandet, og et av de største luftangrepene Israel har gjennomført på mange år. Minst 15 mål ble angrepet i det østlige Syria, rundt 500 kilometer fra Israel. Dette er et område med stor iransk militær tilstedeværelse, som antas å bli brukt til å flytte våpen rundt i regionen.
//
// Bombingen var ikke bare mer intens enn normalt, den fant også sted mye lengre borte enn de fleste andre angrep Israel blir beskyldt for å stå bak.
//
// Det israelske forsvaret har ikke kommentert angrepet, som er i samsvar med deres politikk om verken å bekrefte eller avkrefte operasjoner i Syria.
//
// Økningen i hyppighet og omfanget av slike luftangrep er ikke tilfeldig. Det kommer av en vurdering fra det israelske forsvaret, som Times of Israel har fått tilgang på, om at Iran for øyeblikket neppe vil gjøre store gjengjeldelser.`)
// })


module.exports = {
  googleTranslate,
}