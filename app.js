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

app.use(helmet());

app.get('/auth', function(req, res) {
  var url = 'https://quizlet.com/authorize?response_type=code&client_id=' + quizletClient + '&scope=read&state=' + secretState;
  res.redirect(url);
});

app.get('/callback', function(req, res) {
  if (req.query.state !== secretState) {
    // flash state error
    res.redirect('/login');
  } else if (req.query.error == 'access_denied' || !req.query.code || typeof req.query.code == "undefined") {
    // flash access denied error
    res.redirect('/login');
    return
  } else {
    request.post({
      url: 'https://api.quizlet.com/oauth/token',
      form: {
        grant_type: 'authorization_code',
        code: req.query.code,
        redirect_uri: 'http://localhost:3000/callback'      
      },
      auth: {
        username: quizletClient,
        password: quizletSecret
      },
      json: true
    }, function(err, resHeaders, body) {
      if (err) {
        // flash authorization error
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
  }
});

app.use(express.static('src'));

app.use(function(req, res){
  res.sendFile('src/index.html', { root: __dirname });
});

app.listen(3000);
console.log('Listening on port 3000');