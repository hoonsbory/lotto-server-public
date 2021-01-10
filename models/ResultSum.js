const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// create schema

const resultSumSchema = new Schema({
    _id : {
        type: String,
        required:true
    },
    last: {
        type: Number,
        required:true
    },
    fifth: {
        type: Number,
        required:true
    },
    fourth: {
        type: Number,
        required:true
    },
    third: {
        type: Number,
        required:true
    },
    second: {
        type: Number,
        required:true
    },
    first: {
        type: Number,
        required:true
    },
},{
    versionKey : false
});

module.exports = mongoose.model('result-sums', resultSumSchema);