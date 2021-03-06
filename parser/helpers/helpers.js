function validationService (res) {
  console.log('Error Makes :', res)
}
function fixHtmlText (text) {
  return text.replace(/<a\b[^>]*>(.*?)<\/a>/gm, '$1')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\[caption\b[^<]*(?:(?!<\/caption])<[^<]*)*\[\/caption]/gi, '')
    .replace(/&nbsp;/g, '')
    .replace(/&amp;/g, '')
    .replace(/&lt;/g, '')
    .replace(/&gt;/g, '')
    .replace(/&#039;/g, '')
    .replace(/&amp;nbsp;/g, "")
    .replace(/<a\b[^<]*>(.*?)<\/a>/gm, '$1')
    .replace(/<span\b[^<]*>(.*?)<\/span>/gm, '$1')
    .replace(/MIFF Denmark/ig, 'Infinitum News')
    .replace(/(\s|^)miff(\s|$)/ig, ' Infinitum News ')
}
function filterFileNameText (text) {
  // /[^0-9a-z-]/g
  return text.replace(/[^_\-@.()+*/'a-zA-Z0-9]/g, '')
}

module.exports = {
  validationService,
  fixHtmlText,
}