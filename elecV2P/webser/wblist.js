const fs = require('fs')
const path = require('path')

const { logger, CONFIG_FEED, list } = require('../utils')
const clog = new logger({ head: 'wblist' })

const { CONFIG_RULE } = require('../script')

module.exports = app => {
  const LISTPATH = path.join(__dirname, '../script', 'Lists')

  app.get("/filter", (req, res)=>{
    res.end(list.get('filter.list'))
  })
  
  app.post("/rewritelists", (req, res)=>{
    clog.info((req.headers['x-forwarded-for'] || req.connection.remoteAddress) 
      , "保存 rewrite 规则列表")
    if (req.body.subrule || req.body.rewritelists) {
      CONFIG_RULE.subrules = req.body.subrule
      CONFIG_RULE.rewritelists = req.body.rewritelists
      let file = fs.createWriteStream(path.join(LISTPATH, 'rewrite.list'))
      file.on('error', (err)=>clog.err(err))

      file.write('[sub]\n')
      req.body.subrule.forEach(surl=>{
        file.write("sub " + surl + "\n")
      })
      file.write('\n[elecV2P rewrite.list]\n')
      req.body.rewritelists.forEach(v=>{
        file.write(v.join(' ') + '\n')
      })

      file.end()
      res.end(`rewrite 规则列表更新成功`)
    } else {
      res.end("非法请求")
    }
  })

  app.post("/filterlist", (req, res)=>{
    clog.info((req.headers['x-forwarded-for'] || req.connection.remoteAddress) 
      + " 保存最新 filter.list")
    if (req.body.filterlist) {
      let file = fs.createWriteStream(path.join(LISTPATH, 'filter.list'))
      file.on('error', (err)=>clog.error(err))
      file.write("[elecV2P filter.list]\n")
      req.body.filterlist.forEach(fr=>{
        if (fr[1] && /^(DOMAIN(-SUFFIX)?|IP-CIDR)$/.test(fr[0])) {
          file.write(fr[0] + "," + fr[1] + ",elecV2P\n")
        }
      })
      file.end()
      res.end(`filter.list 更新成功`)
    } else {
      res.end("非法请求")
    }
  })
}