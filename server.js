var express = require('express');
var querystring = require('querystring');
var crypto = require('crypto');
var helmet = require('helmet');
var request = require('request');

var app = express();

var secretState = crypto.randomBytes(48).toString('hex');
var quizletClient = process.env.QUIZLET_CLIENT;
var quizletSecret = process.env.QUIZLET_SECRET;
if (!quizletClient || !quizletSecret) {
  console.error('Missing Quizlet API env vars QUIZLET_CLIENT and QUIZLET_SECRET.');
  process.exit(1);
}
var quizletAuth = `https://quizlet.com/authorize?response_type=code&client_id=${quizletClient}&scope=read&state=${secretState}`;
var quizletToken = 'https://api.quizlet.com/oauth/token';
var callbackURL = 'http://localhost:3000/callback';

app.use(helmet());

app.get('/auth', function(req, res) {
  res.redirect(quizletAuth);
});

app.get('/callback', function(req, res) {
  if (req.query.state !== secretState ||
    req.query.error == 'access_denied' ||
    typeof req.query.code == "undefined" ||
    !req.query.code) {
    // flash state error
    return res.redirect('/login');
  }
  request.post({
    url: quizletToken,
    form: {
      grant_type: 'authorization_code',
      code: req.query.code,
      redirect_uri: callbackURL      
    },
    auth: {
      username: quizletClient,
      password: quizletSecret
    }
  }, function(err, resHeaders, resBody) {
    if (err) {
      // flash authorization error
      res.redirect('/login');
    }
    try {
      var body = JSON.parse(resBody);
    } catch (e) {
      res.redirect('/login');
    }
    if (body.error) {
      res.redirect('/login');
    }

    var token = body.access_token;
    var userID = body.user_id;
    if (!token || typeof token == "underfined") {
      // flash authoriation error
      res.redirect('/login');
    }
    var query = {
      userID: userID,
      token: token
    };
    var url = '/dashboard?' + querystring.stringify(query);
    res.redirect(url);
  });
});

app.use(express.static('dist'));

app.use(function(req, res){
  res.sendFile('dist/index.html', { root: __dirname });
});

app.listen(3333);
console.log('Listening on port 3333');