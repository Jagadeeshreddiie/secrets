require("dotenv").config(); 
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const encrypt=require('mongoose-encryption');
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
mongoose.connect('mongodb+srv://Jagadeesh:jagadeesh@cluster0.ddgzpxz.mongodb.net/secrets');

userSchema = new mongoose.Schema({
    mail: String,
    pass:String
});

secretSchema = {
    name: String
};
userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:['pass']});

const Register = mongoose.model('register', userSchema);
const Secret = mongoose.model('secret', secretSchema);

app.get('/', function (req, res) {
    res.render('home');
    // Register.find(function(err,result){
    //     result.forEach(function(item){
    //         console.log(item.mail+"\n"+item.pass);
    //     })
    // });
});

//login module

app.route('/login')
.get(function (req, res) {
    res.render('login');
})
.post(function (req, res) {
    var registermail = req.body.username;
    var registerpass = req.body.password;
    Register.find(function (err, result) {
        result.forEach(function (item) {
            if (item.mail === registermail) {
                if (item.pass === registerpass) {
                    res.redirect('/secret');
                    console.log('Login Successful');
                }
                else {
                    res.redirect('/login');
                    console.log('password incorrect');
                }
            }
            else {
                res.redirect('/register');
                console.log('no data found please register');
            }
        });
    });
});

//register module
app.route('/register')
    .get(function (req, res) {
        res.render('register');
    })
    .post(function (req, res) {
        var registermail = req.body.username;
        var registerpass = req.body.password;
        Register.find({ mail: registermail }, function (err, result) {
            if (!err) {
                if (result.length <= 0) {
                    const user = new Register({
                        mail: registermail,
                        pass: registerpass
                    });
                    user.save(function (err) {
                        if (!err) {
                            res.redirect('/login');
                            console.log('Register successful');
                        }
                    });

                }
                else {
                    console.log('username already exists.')
                    res.redirect('/register');
                }
            }
        });
    });

// submit module

app.route('/submit')
.get(function (req, res) {
    res.render('submit');
})
.post(function(req,res){
    var secret=req.body.secret;
    const secretInput=new Secret({
        name:secret
    });
    secretInput.save(function(err){
        if(!err){
            res.redirect('/secret');
        }
    });
});

app.get('/secret', function (req, res) {
    res.render('secret');
});

app.get('/logout',function (req, res) {
    res.redirect('/');
});

app.listen(3000, function (req, res) {
    console.log('Server has been started on port 3000');
});