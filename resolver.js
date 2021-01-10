const WinningNum = require('./models/WinningNum')
const ResultSum = require('./models/ResultSum')
const WinData = require('./models/WinData')
//리졸버 graphql 스키마랑 맞춰서 작성해야 한다.
const resolvers = { 
    Query:{
        winningNum: (_,{_id}) => {
            return WinningNum.findById(_id)
        },
        roundSize:(_)=>{
            return WinningNum.countDocuments()
        },       
        resultSum:(_,{_id}) => { 
            return ResultSum.findById(_id) 
        },   
        winData:(_)=> { 
            return WinData.find()      
        } ,   
        winDataByRank:(_,{rank,page})=> {
            return WinData.find({rank : rank}).sort({"time" : -1}).skip(page).limit(10).then(res=> res.sort((a,b)=> b["time"]-a["time"]))
        }
 
    },   
    
    Mutation: { 
        addNum: async (_, args) => { //당첨번호 Insert
            let winningNum = new WinningNum({
                ...args
            })
            return winningNum.save();
        },
        deleteNum: async (_, {_id}) => {  //삭제 테스트
            return WinningNum.deleteOne({_id : _id}).then(res => { 
                return res.deletedCount
            })  
        }
    }
}  

module.exports = resolvers  