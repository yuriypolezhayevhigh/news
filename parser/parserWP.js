const needle = require('needle'),
  { googleTranslate } = require('./googleTranslate'),
  { performance } = require('perf_hooks'),
  { validationService, fixHtmlText } = require('./helpers/helpers')

const mysql    = require('mysql'),
  connection = mysql.createConnection({

    host     : 'mysql191993.mysql.sysedata.no',//MIFF DK
    database : 'mysql191993',
    user     : 'mysql191993',
    password : '&Jwh3;~rB6ZR',
  }),
  mainLang = 'da'
  // connection = mysql.createConnection({
  //   host     : 'mysql191993.mysql.sysedata.no',//MIFF NO
  //   database : 'mysql191993',
  //   user     : 'mysql191993',
  //   password : '&Jwh3;~rB6ZR',
  // }),
  // mainLang = 'nb'

class parserWP {
  constructor () {
    this.limit = 10
    this.offset = 391
    this.total = null
    this.languages = [
      'ru',
      'en',
      'uk',
    ]
    this.totalRequest = {
      time: 0,
      posts: 0,
    }
    this.totalRequest.time = performance.now()
    console.time("Posts Parser")
    this.init()
    this.insertUrl = 'https://news.infinitum.tech/wp-json/parse/v1/insert'
  }
  async init () {
    this.googleru = new googleTranslate()
    this.googleuk = new googleTranslate('uk')
    this.googleen = new googleTranslate('en')
   await Promise.all([
       this.googleru.init(),
       this.googleuk.init('uk'),
       this.googleen.init('en'),
    ])
    console.log('init google')

    connection.query(`SELECT count(*) as total FROM wp_posts WHERE post_type='post' AND post_status='publish'`, function (err, result) {
      console.log(result[0].total)
      this.total = result[0].total
    })
    this.loop()
  }
  async loop () {
    connection.query(`SELECT * FROM wp_posts LEFT JOIN wp_postmeta ON wp_postmeta.post_id = wp_posts.ID AND wp_postmeta.meta_key = '_thumbnail_id'
 WHERE wp_posts.post_type='post' AND wp_posts.post_status='publish' LIMIT ? OFFSET ?`,
      [this.limit, this.offset],
      async (error, results, fields) => {
        if (error) {
          console.log(error, 'mysql_save_error')
          validationService(error)
        }
        for (let item of results) {
          console.log('go parse ID: ', item.ID)
          await this.setPostLanguage(item)
            .catch(e => {
              console.log('go fail ID: ', item.ID, '  ERROR GO NEXT')
            })
          this.totalRequest.posts += 1
        }

        if (this.total <= this.offset + this.limit) {
          this.offset += this.limit
          console.log('Loop Done', this.totalRequest)
          console.log(this.offset, ' offset')
          this.loop()
        } else {
          this.totalRequest.time = performance.now() - this.totalRequest.time
          console.timeEnd("Posts Parser")
          console.log(this.totalRequest)
          console.log(this.offset, ' offset')
         console.log(this.googleru.finish())
         console.log(this.googleuk.finish())
         console.log(this.googleen.finish())
        }
      })
  }
  async setPostLanguage (item) {
    return await new Promise(  (resolve, reject) => {
      Promise.all([
        this.getPostMeta(item),
        this.getPostTerms(item),
      ]).then(async (data) => {
        // console.log(data[0])
        // console.log(data[1])
        // console.log({ ...data[0], ...data[1] })
        let originalPost = { ...data[0], ...data[1] }
        let translates = {
          [mainLang]: originalPost,
        }
        for (let lang of this.languages) {
            await this.translatePost(originalPost, lang).then((data) => { // просто не нуждна такая скорость
              translates[lang] = data
              if (Object.keys(translates).length === this.languages.length + 1) {
                // console.log(translates)

                needle.post(this.insertUrl, translates, { json:true }, (err, res) => {
                  if (err) {
                    console.log(err, 'error Request Save', this.insertUrl)
                    validationService(err)
                    return
                  }
                  if (res.body) {
                    resolve()
                    console.log(res.body)
                  }
                })
              }
            }).catch(err => {
              validationService(err)
              console.log('error post pars ID:', item.ID)
              reject('setPostLanguage')
            })
        }
      })
    })
  }
  async translatePost (originalPost, lang) {
    return await new Promise(  async (resolve, reject) => {
      try {
        let data = {
          post_title: await this['google' + lang].translate(originalPost.post_title),
          post_excerpt: await this['google' + lang].translate(originalPost.post_excerpt),
          post_content: await this['google' + lang].translate(originalPost.post_content),
          post_date_gmt: originalPost.post_date_gmt,
          image: originalPost.image,
          tags: await this['google' + lang].translate(...originalPost.tags),
          categories: await this['google' + lang].translate(...originalPost.categories),
        }
        resolve(data)
      } catch (e) {
        console.log('go miss post and try next, on translatePost')
        reject()
      }
    })
  }
  async getPostMeta (item) {
    return await new Promise(  (resolve, reject) => {
      connection.query(`SELECT * FROM wp_posts WHERE ID = ?`, [item.meta_value], async (mysql_error, results, fields) => {
        // console.log(results)
        if (mysql_error) {
          validationService(mysql_error)
        }
        let data = {
          post_title: fixHtmlText(item.post_title),
          post_excerpt: fixHtmlText(item.post_excerpt),
          post_content: fixHtmlText(item.post_content),
          post_date_gmt: item.post_date_gmt,
          image: {
            guid: results.length ? results[0].guid : '',
            post_title: results.length ? results[0].post_title : '',
          },
        }
        resolve(data)
      })
    })
  }
  async getPostTerms (item) {
    return await new Promise(  (resolve, reject) => {
      let tags = []
      let categories = []
      connection.query(`SELECT * FROM wp_term_relationships LEFT JOIN wp_term_taxonomy ON wp_term_taxonomy.term_taxonomy_id = wp_term_relationships.term_taxonomy_id LEFT JOIN wp_terms ON wp_term_taxonomy.term_id = wp_terms.term_id  WHERE object_id = ? `, [item.ID], async (mysql_error, results, fields) => {
        // console.log(results)
        if (mysql_error) {
          validationService(mysql_error)
        }
        results.forEach((term) => {
          switch (term.taxonomy) {
            case 'post_tag':
              tags.push(term.name)
              break
            case 'category':
              categories.push(term.name)
              break
          }
        })
        resolve({ tags, categories })
      })
    })
  }
}
new parserWP()