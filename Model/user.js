const mongoose = require('mongoose')
const bcrypt = require('bcrypt')


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please Enter your name"]
    },
    email: {
        type: String,
        required: [true, "Please enter your Email"]
    },
    password: {
        type: String,
        required: [true, "Please provide password"],
        minLength: [6, "Password should be more than 6 characters"]
    },
    pdf:
        [{
            title: {
                type: String,
                

            },
            PDFdata: {
                type: String,
            }
        }
        
        ],

    createdAt: {
        type: Date,
        default: Date.now(),
    },
    resetPasswordToken: String,
    resetPasswordTime: Date,

})


module.exports = mongoose.model("user", userSchema)