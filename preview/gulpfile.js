const fs = require('fs')
const { series } = require('gulp')
const request = require('request')
const toRegex = require('to-regex')
const yaml = require('yamljs')

function getPlaybook() {
  return request('https://raw.githubusercontent.com/AjuntamentdeBarcelona/ethical-digital-standards-site/master/site.yml')
    .pipe(fs.createWriteStream('site.yml'))
}

function patchPlaybook(cb) {
  let playbookContent = yaml.load('site.yml')
  let sourcesOld = playbookContent.content.sources
  let originUrl = process.env.REPOSITORY_URL
      .toString()
      .trimRight()
      .replace(/.*\//, '')
  let sourcesNew = sourcesOld.map(
    (value, _index, _object) => {
      if (value['url'] === '.') {
        value['url'] = 'https://github.com/AjuntamentdeBarcelona/ethical-digital-standards-site.git'
        value['branches'] = 'master'
      }
      if (value['url'].match(toRegex(originUrl, {contains: true, safe: true}))) {
        value['url'] = '..'
        value['branches'] = 'HEAD'
      }
      return value
    }
  )
  playbookContent.content.sources = sourcesNew
  playbookContent.output.dir = './build'
  fs.writeFileSync('site.patched.yml', yaml.stringify(playbookContent))
  cb()
}

exports.playbook = series(getPlaybook, patchPlaybook)
