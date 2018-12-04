'use strict'

const subDays = require('date-fns/sub_days')
const format = require('date-fns/format')
const axios = require('axios')
const { asyncWrap } = require('fc-helper')
const Parser = require('rss-parser')
const parser = new Parser()

const RE_NUM = /[0-9]+([.]{1}[0-9]+){0,1}/g
const metroData = {
  sh: {
    url: 'https://rsshub.app/weibo/user/1742987497',
    id: 1742987497,
    db: 'sh',
    cityName: '上海',
    keyword: '地铁网络客流'
  },
  bj: {
    url: 'https://rsshub.app/weibo/user/2778292197',
    id: 2778292197,
    db: 'bj',
    cityName: '北京',
    keyword: '昨日客流'
  },
  gz: {
    url: 'https://rsshub.app/weibo/user/2612249974',
    id: 2612249974,
    db: 'gz',
    cityName: '广州',
    keyword: '悠悠报客流：昨日回顾'
  }
}

function zeroPad(num) {
  return num.toString().padStart(2, '0')
}

exports.handler = asyncWrap(async event => {
  const evt = JSON.parse(event)
  const city = evt['payload']
  const item = metroData[city]

  try {
    const feed = await parser.parseURL(item.url)

    for (let i = 0; i < feed.items.length; i++) {
      const element = feed.items[i]
      if (element.contentSnippet.indexOf(item.keyword) > -1) {
        const arr = element.contentSnippet.match(RE_NUM)
        const date = format(subDays(new Date(), 1), 'YYYY-MM-DD')
        const num = item.id === 2778292197 ? arr[3] : arr[2]

        if (date.substr(5) === `${zeroPad(arr[0])}-${zeroPad(arr[1])}`) {
          await axios.post(`http://metro.sinchang.me/api/flows?`, {
            date,
            num: Number(num),
            key: process.env.API_KEY,
            city
          })

          await axios.get(`${process.env.API_URL}?city=${city}`)
        }

        break
      }
    }
  } catch (e) {
    console.log(e)
  }
})
