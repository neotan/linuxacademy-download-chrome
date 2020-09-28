console.clear()

var postOptions = {
  "headers": {
    "accept": "*/*",
    "accept-language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7,ja;q=0.6,zh-TW;q=0.5,de;q=0.4",
    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    "sec-ch-ua": "\"\\\\Not;A\\\"Brand\";v=\"99\", \"Google Chrome\";v=\"85\", \"Chromium\";v=\"85\"",
    "sec-ch-ua-mobile": "?0",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "x-requested-with": "XMLHttpRequest"
  },
  "referrerPolicy": "strict-origin-when-cross-origin",
  "method": "POST",
  "mode": "cors",
  "credentials": "include"
}

function obj2String(obj){
  var result = []
  for(let [key, val] of Object.entries(obj)){
    result.push(`${key}=${val}`)
  }
  return result.join('&')
}

function getData(url){
    return fetch(url)
    .then(res=>res.text())
}

function postData(url, body){
  return fetch(url, {
      ...postOptions,
      body: obj2String(body),
    })
}

function fmt(str){
    return str.replace(/[:?*]/g, '_')
}

function genFileName({id, section, name, time}){
    return `${String(id).padStart(3,'0')} - ${section} - ${name} [${time}]`
}

function getTime(item){
    return item.querySelector('.time-required').innerText
}

function getName(item){
    return item.querySelector('.name>h6').innerText
}
function getUrl(item){
    return location.origin+item.getAttribute('href')
}

function withFfmpeg(item){
    var fileName = `"${genFileName(item)}.mp4"`
    var ffmpeg = `ffmpeg -y -i "${item.m3u8}" -codec copy ${fmt(fileName)}`
    return {...item, ffmpeg}
}

function withWget(item){
    var fileName = `"${genFileName(item)}.vtt"`
    var wget = `wget "${item.subtitle}" -O ${fmt(fileName)} --no-check-certificate`
    return {...item, wget}
}

function toVideoCmd(items){
    var cmd = items.reduce((acc, {ffmpeg})=>{
        return acc.concat(ffmpeg).concat(` && \\\n`)
    }, '')
    return cmd.slice(0, cmd.length - 3)
}

function toSubtitleCmd(items){
    return items.reduce((acc, {wget})=>{
        return acc.concat(wget).concat(' && \\\n')
      }, '')
    }

function mergeByIndex(items, data){
    return items.map((item, i)=>{
        return {...item, ...data[i]}
    })
}

function getHtml(url){
    return getData(url) 
}

function getM3u8(html){
    var matches = html.match(/https:\/\/video-cdn(.*).m3u8\?\d*/gm)
    return matches? matches[0]: ''
}

function getSubtitle(html){
    var matches = html.match(/(?<="file":")https:\/\/linuxacademy-video.*.captions.vtt.*(?=","label":"English")/gm)
    return matches? matches[0]: ''
}

function getLessonId(html){
    var matches = html.match(/(?<="lesson_id":).*(?=,"lesson_name)/gm)
    return matches? matches[0]: ''
}

function markCompleted(lessonId){
    return postData(
      'https://linuxacademy.com/api/v2/lesson/complete',
      {id: Number(lessonId)}
    )
}

function getAllItems(selector = ['.syllabus-item', '.syllabus-section-title']){
    var section = 'UNKNOWN_SECTION'
    return [...document.querySelectorAll(selector)]
            .map(n=>{
                if(n.classList.contains('syllabus-section-title')){
                    section = n.innerText
                    return 
                }
                return {
                          name: getName(n),
                          url: getUrl(n),
                          time: getTime(n),
                          section,
                       }
            })
            .filter(item=>{
                var excluded = ['/challenges/', '/hands-on-labs/']
                return item && item.url && !excluded.some(str => item.url.includes(str))
            })
            .map((item,i)=>{
                return {...item, id: i + 1}
            })
}

;(async function(){
  var items = getAllItems()
  var result = await Promise.all(items.map(async ({url})=>{
    var html = await getHtml(url)
    var m3u8 = getM3u8(html)
    var subtitle = getSubtitle(html)
    var lessonId = getLessonId(html)
    return {m3u8, subtitle, lessonId}
  }))
  items = mergeByIndex(items, result).map(withFfmpeg).map(withWget)

  console.log('\n --- Subtitles cmd --- \n', toSubtitleCmd(items))
  console.log('\n --- Videos cmd --- \n', toVideoCmd(items))

  Promise
    .all(items.map(({lessonId})=>markCompleted(lessonId)))
    .then(res=>console.log('\n --- Mark all lessons completed --- \n', res))
    .catch(console.error)
}())

