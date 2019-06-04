'use strict'

const subDays = require('date-fns/sub_days')
const format = require('date-fns/format')
const axios = require('axios')
const Parser = require('rss-parser')
const parser = new Parser()

const RE_NUM = /[0-9]+([.]{1}[0-9]+){0,1}/g
const metroData = [
  {
    url: 'https://sinchangrss.herokuapp.com/rss/1742987497',
    id: 1742987497,
    db: 'sh',
    cityName: '上海',
    keyword: '地铁网络客流'
  },
  {
    url: 'https://sinchangrss.herokuapp.com/rss/2778292197',
    id: 2778292197,
    db: 'bj',
    cityName: '北京',
    keyword: '昨日客流'
  },
  {
    url: 'https://sinchangrss.herokuapp.com/rss/2612249974',
    id: 2612249974,
    db: 'gz',
    cityName: '广州',
    keyword: '悠悠报客流：昨日回顾'
  }
]

function zeroPad(num) {
  return num.toString().padStart(2, '0')
}

;(async () => {
  for (const item of metroData) {
    try {
      const feed = await parser.parseURL(item.url)
      for (const element of feed.items) {
        if (element.contentSnippet.indexOf(item.keyword) > -1) {
          const arr = element.contentSnippet.match(RE_NUM)
          const date = format(subDays(new Date(), 1), 'YYYY-MM-DD')
          const num = item.id === 2778292197 ? arr[3] : arr[2]

          if (date.substr(5) === `${zeroPad(arr[0])}-${zeroPad(arr[1])}`) {
            await axios.post(`http://metro.sinchang.me/api/flows?`, {
              date,
              num: Number(num),
              key: process.env.API_KEY,
              city: item.db
            })

            await axios.post(process.env.NETLIFY_API_URL, {
              city: item.db
            })
          }
          break
        }
      }
    } catch (e) {
      console.log(e)
    }
  }
})()
