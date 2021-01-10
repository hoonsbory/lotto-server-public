const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// create schema

const WinData = new Schema({
    
    num1: {
        type: Array || Number,
        required:true
    },
    num2: {
        type: Array || Number,
        required:true
    },
    num3: {
        type: Array || Number,
        required:true
    },
    num4: {
        type: Array || Number,
        required:true
    },
    num5: {
        type: Array || Number,
        required:true
    },
    num6: {
        type: Array || Number,
        required:true
    },
    rank: {
        type: String,
        required : true
    },
    name: {
        type: String,
        required:false,
    },
    time:{
        type: String,
        required:false
    }   
},{
    versionKey : false, 
});

module.exports = mongoose.model('win-datas', WinData);