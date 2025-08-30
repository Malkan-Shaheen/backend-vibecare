const mongoose = require('mongoose');

const UserDetailSchema = mongoose.Schema({
    Name:String,
    Username:String,    
    Email:{type:String,unique:true},
    Password:String,
    otp: String, 
    resetToken: String, // To store the reset token
    resetTokenExpiration: Date,

    },{
        collection:"Userinfo"
});

mongoose.model('Userinfo',UserDetailSchema);