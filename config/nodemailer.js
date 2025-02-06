const nodmailer=require('nodemailer')
const dotenv = require('dotenv');
dotenv.config()
const transporter=nodmailer.createTransport({
    service:'Gmail',
    auth:{
        user:process.env.EMAIL_USER,
        pass:process.env.EMAIL_PASSWORD
    }
})
module.exports=transporter;