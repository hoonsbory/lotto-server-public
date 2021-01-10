const { GraphQLServer } = require('graphql-yoga');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
const resolvers = require('./resolver')
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require('cors')
const cron = require('node-cron')
const moment = require('moment')
require('moment-timezone')
moment.tz.setDefault('Asia/Seoul')
// server 옵션 포트 및 cors 설정  
const opts = {
    port: process.env.PORT || 7000
};
const getHtml = async (num) => {
    try {
        return await axios.get(`https://dhlottery.co.kr/gameResult.do?method=byWin`);
    } catch (error) {
        console.error(error);
    }
}
// graphql 서버 설정
const server = new GraphQLServer({
    typeDefs: "graphql/schema.graphql",
    resolvers,
});
server.express.use(cors({
    origin : ["https://lottozip.site",  "http://192.168.35.117:5000", "http://localhost:5000"]
}))
server.express.use(bodyParser.json())

//내 몽고디비 URI
const db = require('./db').mongoURI;

//로또 회차 업데이트. 타임존 때문에 9시간 일찍 설정해줘야함.
cron.schedule("0 12 * * 6", () => {
    Crawl()
})

//DB 연결
mongoose
    .connect(db, ({ useNewUrlParser: true })) 
    .then(() => console.log("몽고 DB가 연결되었습니다."))
    .catch(err => console.log(err));

const WinngingNum = require('./models/WinningNum'); //회차별 당첨번호 테이블
const ResultSum = require('./models/ResultSum'); //가상로또 등수별 합계 테이블
const WinData = require('./models/WinData'); //가상로또 3등이상 당첨번호 테이블
        
//특정회차까지의 당첨번호 조회 - 2차 배열 형태로 리턴 [당첨번호][누적당첨회수]
server.express.post('/winGraph', async (req, res) => {
    var list = []
    // for(var i=1; i<46; i++){

    //             await WinngingNum.find().limit(10).and().or([{num1 : i} , {num2 : i},  {num3 : i}, {num4 : i}, {num5 : i}, {num6 : i}, {bonus : i}]).then(async (num) => {
    //             list["num"+i] = num.length
    //         })
    //     }
    //쿼리를 통해서 n회차부터 n회차 까지의 정보 중에 or 연산을 하려고했지만, or연산으로 먼저 데이터를 나눈 후에 limit를 통해 수를 제한한다... limit를 먼저 실행해도 결과는 같았따 ㅜ
    //그래서 그냥 limit로 가져온 리스트를 직접 개수를 카운트한 다음에 배열로 만들어줌.
    var data = await WinngingNum.find().skip(req.body.skip).limit(req.body.limit)
    data.forEach(num => {
        if (req.body.bonus) {
            var bonusIdx = num["bonus"]
            list[bonusIdx] = list[bonusIdx] ? [bonusIdx, parseInt(list[bonusIdx][1]) + 1] : [bonusIdx, 1]
        }
        else {
            for (var j = 1; j < 7; j++) {
                var numIdx = num["num"+j]
                list[numIdx] = list[numIdx] ? [numIdx, parseInt(list[numIdx][1]) + 1] : [numIdx, 1]
            }
        }
    })
    if(!req.body.sort) res.send(list.sort((a, b) => parseInt(b[1] - parseInt(a[1]))).filter(i => i !== 0))
    else res.send(list.sort((a, b) => parseInt(a[1] - parseInt(b[1]))).filter(i => i !== 0))
});

//가상로또 3등이상 당첨번호 통계 조회 - 2차 배열 형태로 리턴 [당첨번호][누적당첨회수]
server.express.get('/userWinNum', async (req, res) => {
    var list = []
    
    await WinData.find().limit(0).then(response => {
        response.forEach(num=>{
            for(var j=1; j<7; j++){
                var numIdx = num["num"+j]
                if(numIdx.length===2) 
                list[numIdx[0]] = list[numIdx[0]] ? [numIdx[0], parseInt(list[numIdx[0]][1]) + 1] : [numIdx[0], 1]
            }
        })
    })
   
    res.send(list.sort((a, b) => parseInt(b[1] - parseInt(a[1]))).filter(i => i !== 0))
});

//가상로또 데이터 insert. 1등부터 꽝까지 기존 sum 데이터와 합산해서 저장. 3등이상부터의 당첨번호 데이터는 스키마 객체 만들어서 반복문을 통해 저장.
server.express.post('/winData', async (req,res) => {

    var resultSum = await ResultSum.findById("id")
    for(var key in req.body.sumResult){
        resultSum[key] += req.body.sumResult[key]
    }
    await ResultSum.updateOne({_id : "id"}, resultSum) 

    var winData = req.body.resultNums

    
   
    for(var key in winData){
        if(key.indexOf("win")>-1) break;
        winData[key].forEach(async (i)=> {
            var obj = {
                num1 : i[0],
                num2 : i[1],
                num3 : i[2],
                num4 : i[3],
                num5 : i[4],
                num6 : i[5],
                rank : key.split("Nums")[0],
                name : winData["winnerName"] || '4등',
                time : moment().format("YYYYMMDDHHmmss")
            }
        var newData = new WinData(obj)
        
        newData.save()
        })
    }
    res.end()
})

//매주 당첨번호 크롤링
async function Crawl(){
        var list = []
        var size = 0
        await getHtml()
            .then(async (html) => {
                const $ = cheerio.load(html.data)
                const $bodyList = $("span.ball_645")
                size = await WinngingNum.countDocuments()
                $bodyList.each((i, elem) => {
                        list.push(elem.children[0].data)
                })
            })
        var result = new WinngingNum({_id : size+1, num1 : list[0], num2 : list[1], num3 : list[2], num4 : list[3], num5 : list[4], num6 : list[5], bonus : list[6]})
        result.save()
}


// server.express.get('/Crawl', async (req, res) => {
//     for (var i = 1; i < 944; i++) {
//         var list = []
//         await getHtml(i)
//             .then(html => {
//                 const $ = cheerio.load(html.data)
//                 const $bodyList = $("div.num_box span")
//                 $bodyList.each((i, elem) => {
//                     if (elem.children[0].data !== "보너스번호")
//                         list.push(elem.children[0].data)
//                 })
//             })
//         await axios.post('http://localhost:7000', {
//             query: `
//         mutation {
//             addNum(_id : ${i}, num1 :${list[0]} , num2 :${list[1]} , num3 : ${list[2]}, num4 :${list[3]} , num5 :${list[4]},num6 : ${list[5]} bonus :${list[6]}){
//               num1
//             }
//           }
//         `}).then(res => {
//                 console.log(res.data)
//             })
//     }

//     res.end()
// })
// start server
server.start(opts, () =>
    console.log(`Server is running on http://localhost:${opts.port}`),
);