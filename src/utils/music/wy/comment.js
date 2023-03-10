import { httpFetch } from '../../request'
import { weapi } from './utils/crypto'
import { dateFormat2 } from '../../index'

const emojis = [
  ['ε€§η¬', 'π'],
  ['ε―η±', 'π'],
  ['ζ¨η¬', 'βΊοΈ'],
  ['θ²', 'π'],
  ['δΊ²δΊ²', 'π'],
  ['ζζ', 'π±'],
  ['ζ΅ζ³ͺ', 'π­'],
  ['δΊ²', 'π'],
  ['ε', 'π³'],
  ['εδΌ€', 'π'],
  ['ε²η', 'π'],
  ['εθ', 'π'],
  ['ζε΄', 'π'],
  ['ζ', 'π‘'],
  ['ε₯Έη¬', 'π'],
  ['ζ±', 'π'],
  ['ηθ¦', 'π'],
  ['ζΆζ', 'π°'],
  ['ηη', 'π¨'],
  ['ε£η½©', 'π·'],
  ['ε€§ε­', 'π'],
  ['ζ', 'π΅'],
  ['εζ', 'πΏ'],
  ['εΌεΏ', 'π'],
  ['ι¬ΌθΈ', 'π'],
  ['η±η', 'π'],
  ['ζ΅ζ', 'π’'],
  ['η±εΏ', 'β€οΈ'],
  ['εΏη’', 'π'],
  ['ιζ', 'π'],
  ['ζζ', 'β­οΈ'],
  ['ηζ°', 'π’'],
  ['δΎΏδΎΏ', 'π©'],
  ['εΌΊ', 'π'],
  ['εΌ±', 'π'],
  ['ζ', 'π'],
  ['η΅ζ', 'π«'],
  ['θ·³θ', 'π―ββοΈ'],
  ['η¦ζ­’', 'πββοΈ'],
  ['θΏθΎΉ', 'πββοΈ'],
  ['η±ζ', 'π'],
  ['η€Ίη±', 'π©ββ€οΈβπ¨'],
  ['ε΄ε', 'π'],
  ['η', 'πΆ'],
  ['η«', 'π±'],
  ['ηͺ', 'π·'],
  ['εε­', 'π°'],
  ['ε°ιΈ‘', 'π€'],
  ['ε¬ιΈ‘', 'π'],
  ['εΉ½η΅', 'π»'],
  ['ε£θ―', 'π'],
  ['ε€ζ', 'π½'],
  ['ι»η³', 'π'],
  ['η€Όη©', 'π'],
  ['η·ε­©', 'π¦'],
  ['ε₯³ε­©', 'π§'],
  ['θη³', 'π'],
  ['18', 'π'],
  ['ε', 'β­'],
  ['ε', 'β'],
]

const applyEmoji = text => {
  for (const e of emojis) text = text.replaceAll(`[${e[0]}]`, e[1])
  return text
}

let cursorTools = {
  cache: {},
  getCursor(id, page, limit) {
    let cacheData = this.cache[id]
    if (!cacheData) cacheData = this.cache[id] = {}
    let orderType
    let cursor
    let offset
    if (page == 1) {
      cacheData.page = 1
      cursor = cacheData.cursor = cacheData.prevCursor = Date.now()
      orderType = 1
      offset = 0
    } else if (cacheData.page) {
      cursor = cacheData.cursor
      if (page > cacheData.page) {
        orderType = 1
        offset = (page - cacheData.page - 1) * limit
      } else if (page < cacheData.page) {
        orderType = 0
        offset = (cacheData.page - page - 1) * limit
      } else {
        cursor = cacheData.cursor = cacheData.prevCursor
        offset = cacheData.offset
        orderType = cacheData.orderType
      }
    }
    return {
      orderType,
      cursor,
      offset,
    }
  },
  setCursor(id, cursor, orderType, offset, page) {
    let cacheData = this.cache[id]
    if (!cacheData) cacheData = this.cache[id] = {}
    cacheData.prevCursor = cacheData.cursor
    cacheData.cursor = cursor
    cacheData.orderType = orderType
    cacheData.offset = offset
    cacheData.page = page
  },
}

export default {
  _requestObj: null,
  _requestObj2: null,
  async getComment({ songmid }, page = 1, limit = 20) {
    if (this._requestObj) this._requestObj.cancelHttp()

    const id = 'R_SO_4_' + songmid

    const cursorInfo = cursorTools.getCursor(songmid, page, limit)

    const _requestObj = httpFetch('https://music.163.com/weapi/comment/resource/comments/get', {
      method: 'post',
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
        origin: 'https://music.163.com',
        Refere: 'http://music.163.com/',
      },
      form: weapi({
        cursor: cursorInfo.cursor,
        offset: cursorInfo.offset,
        orderType: cursorInfo.orderType,
        pageNo: page,
        pageSize: limit,
        rid: id,
        threadId: id,
      }),
    })
    const { body, statusCode } = await _requestObj.promise
    // console.log(body)
    if (statusCode != 200 || body.code !== 200) throw new Error('θ·εθ―θ?Ίε€±θ΄₯')
    cursorTools.setCursor(songmid, body.data.cursor, cursorInfo.orderType, cursorInfo.offset, page)
    return { source: 'wy', comments: this.filterComment(body.data.comments), total: body.data.totalCount, page, limit, maxPage: Math.ceil(body.data.totalCount / limit) || 1 }
  },
  async getHotComment({ songmid }, page = 1, limit = 100) {
    if (this._requestObj2) this._requestObj2.cancelHttp()

    const id = 'R_SO_4_' + songmid

    const _requestObj2 = httpFetch('https://music.163.com/weapi/comment/resource/comments/get', {
      method: 'post',
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
        origin: 'https://music.163.com',
        Refere: 'http://music.163.com/',
      },
      form: weapi({
        cursor: Date.now().toString(),
        offset: 0,
        orderType: 1,
        pageNo: page,
        pageSize: limit,
        rid: id,
        threadId: id,
      }),
    })
    const { body, statusCode } = await _requestObj2.promise
    if (statusCode != 200 || body.code !== 200) throw new Error('θ·εη­ι¨θ―θ?Ίε€±θ΄₯')
    // console.log(body)
    const total = body.data.hotComments?.length ?? 0
    return { source: 'wy', comments: this.filterComment(body.data.hotComments), total, page, limit, maxPage: 1 }
  },
  filterComment(rawList) {
    return rawList.map(item => {
      let data = {
        id: item.commentId,
        text: item.content ? applyEmoji(item.content).split('\n') : '',
        time: item.time ? item.time : '',
        timeStr: item.time ? dateFormat2(item.time) : '',
        userName: item.user.nickname,
        avatar: item.user.avatarUrl,
        userId: item.user.userId,
        likedCount: item.likedCount,
        reply: [],
      }

      let replyData = item.beReplied && item.beReplied[0]
      return replyData
        ? {
            id: item.commentId,
            rootId: replyData.beRepliedCommentId,
            text: replyData.content ? applyEmoji(replyData.content).split('\n') : '',
            time: item.time,
            timeStr: null,
            userName: replyData.user.nickname,
            avatar: replyData.user.avatarUrl,
            userId: replyData.user.userId,
            likedCount: null,
            reply: [data],
          }
        : data
    })
  },
}
