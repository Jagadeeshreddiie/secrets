require("dotenv").config();
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

//const encrypt=require('mongoose-encryption');
// const md5=require('md5');   // using hash function
// const bcrypt=require('bcrypt');
// const saltRounds=15;
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
    secret: 'This is our new session.',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb+srv://Jagadeesh:jagadeesh@cluster0.ddgzpxz.mongodb.net/secrets');

userSchema = new mongoose.Schema({
    mail: String,
    pass: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:['pass']});

const Register = new mongoose.model('register', userSchema);

passport.use(Register.createStrategy());

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    Register.findById(id, function (err, user) {
        done(err, user);
    });
});


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://localhost:3000/auth/google/secret",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    proxy: true
},
    function (accessToken, refreshToken, profile, cb) {
        console.log(profile);
        Register.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

app.get('/', function (req, res) {
    res.render('home');
});

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] }), function (err) {
        if (err) {
            console.log(err);
        }
    }
);

app.get('/auth/google/secret',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        if (err) {
            console.log(err);
        }
        // Successful authentication, redirect home.
        res.redirect('/secret');
    });

//register module

app.route('/register')
    .get(function (req, res) {
        res.render('register');
    })
    .post(function (req, res) {
        // var registermail = req.body.username;
        // // var registerpass = md5(req.body.password);
        // var registerpass = (req.body.password);
        // bcrypt.hash(registerpass,saltRounds,function(err,hash){
        //     Register.find({ mail: registermail }, function (err, result) {
        //         if (!err) {
        //             if (result.length <= 0) {
        //                 const user = new Register({
        //                     mail: registermail,
        //                     pass: hash
        //                 });
        //                 user.save(function (err) {
        //                     if (!err) {
        //                         res.redirect('/login');
        //                         console.log('Register successful');
        //                     }
        //                 });

        //             }
        //             else {
        //                 console.log('username already exists.')
        //                 res.redirect('/register');
        //             }
        //         }
        //     });
        // });
        Register.register({ username: req.body.username }, req.body.password, function (err, user) {
            if (err) {
                console.log(err);
                res.redirect('/register');
            }
            else {
                passport.authenticate('local')(req, res, function () {
                    res.redirect('/login');
                })
            }
        });
    });


//login module

app.route('/login')
    .get(function (req, res) {
        res.render('login');
    })
    .post(function (req, res) {
        // var registermail = req.body.username;
        // // var registerpass = md5(req.body.password);
        // var registerpass = (req.body.password);
        // Register.find(function (err, result) {
        //     result.forEach(function (item) {
        //         if (item.mail === registermail) {
        //             bcrypt.compare(registerpass,item.pass,function(err,result){
        //             if(result===true){
        //                 res.redirect('/secret');
        //                 console.log('Login Successful');
        //             }
        //             else {
        //                 res.redirect('/login');
        //                 console.log('password incorrect');
        //             }
        //         });
        //         }
        //         else {
        //             res.redirect('/register');
        //             console.log('no data found please register');
        //         }
        //     });
        // });
        const user = new Register({
            username: req.body.username,
            psasword: req.body.password
        });
        req.login(user, function (err) {
            if (err) {
                console.log(err);
                res.redirect('/login');
            }
            else {
                passport.authenticate('local')(req, res, function () {
                    res.redirect('/secret');
                })
            }
        });
    });

// secrets module

app.get('/secret', function (req, res) {
    Register.find({ 'secret': { $ne: null } }, function (err, foundusers) {
        if (foundusers) {
            res.render('secret', { foundedusers: foundusers });
        }
    });
});


// submit module

app.route('/submit')
    .get(function (req, res) {
        if (req.isAuthenticated()) {
            res.render('submit');
        }
        else {
            res.redirect('/login');
        }
    })
    .post(function (req, res) {
        var submitSecret = req.body.secret;
        console.log(req.user);
        Register.findById(req.user.id, function (err, founduser) {
            if (err) {
                console.log(err);
            }
            else if (founduser) {
                founduser.secret = submitSecret;
                founduser.save(function (err) {
                    if (!err) {
                        res.redirect('/secret');
                    }
                });
            }
        });
    });



app.get("/logout", function (req, res) {
    req.logout(function (err) {
        if (!err) {
            res.redirect('/');
        }
    });
});

app.listen(3000, function (req, res) {
    console.log('Server started ON 3000');
});