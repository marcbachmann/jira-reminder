var mysql = require('mysql');
var path = require('path');
var request = require('request');
var Step = require('step');
var express = require('express');
var _ = require('underscore');
var app = express();

var JiraApi = require('jira').JiraApi;

var jira = new JiraApi('http', JiraConfig.host, JiraConfig.port, JiraConfig.user, JiraConfig.password, '2', true);

app.configure(function(){
  app.use(express.static(path.join(__dirname, "public"),{maxAge: 0}));
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
});


MySQLConnection.connect();

MySQLConnection.query('SELECT u.lower_user_name as user, u.display_name as fullname, u.email_adress as email FROM cwd_user u', function(err, rows, fields) {
  if (err) throw err;
  
  console.log(rows);
});

MySQLConnection.end();
/*
request.get({uri: 'http://jira.suitart.com/rest/api/latest/user?username='+letter, 'auth': {'user': JiraConfig.user,'pass': JiraConfig.password,'sendImmediately': true}}
, function (error, response, body) {
  if (!error && response.statusCode == 200) {
    usersAlphabet[countRequests] = JSON.parse(body);
    countRequests = countRequests+1;
    if (countRequests === 25) {
      gotAllUsers(usersAlphabet);
    }
  }
  else {
    console.log('could not fetch users')
    if (error) console.log(error)
    else console.log(response)
  }
});*/


app.get('/', function(req, res) {
  jira.searchJira('status in (Open, "In Progress", Reopened) ORDER BY summary DESC', ["summary", "status", "issuetype", "priority", "duedate", "assignee"], function(error, result) {
    result.issues.forEach(function(issue) {
      console.log(issue);
    });
    res.render("issues.jade", result);
  });
});
  
app.listen(8000);

console.log('Listening on port 8000');