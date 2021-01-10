const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// create schema

const WinningNumSchema = new Schema({
    _id:{
        type: Number,
        required:true
    },
    num1: {
        type: Number,
        required:true
    },
    num2: {
        type: Number,
        required:true
    },
    num3: {
        type: Number,
        required:true
    },
    num4: {
        type: Number,
        required:true
    },
    num5: {
        type: Number,
        required:true
    },
    num6: {
        type: Number,
        required:true
    },
    bonus: {
        type: Number,
        required:true
    }
},{
    versionKey : false
});

module.exports = mongoose.model('winningnums', WinningNumSchema);