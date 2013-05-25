	var path = require('path');
var fs = require('fs');

var request = require('request');
var _ = require('underscore');
var moment = require('moment');
// If you need other languages, uncomment the following line.
//    moment.lang('de');

var express = require('express');
var app = express();
var jade = require('jade');

var config = require('./config');

var JiraApi = require('jira').JiraApi;
var mysqlDriver = require('mysql');
var nodemailer = require("nodemailer");

var jira = new JiraApi(config.jira.protocol, config.jira.host, config.jira.port, config.jira.user, config.jira.password, '2', true);
var mysql = mysqlDriver.createConnection({host: config.mysql.host, user: config.mysql.user, password: config.mysql.password, database: config.mysql.database});
var smtpTransport = nodemailer.createTransport("SMTP",{service: "Gmail", auth: {user: config.gmail.user,pass: config.gmail.password}});

app.configure(function(){
  app.use(express.static(path.join(__dirname, "public"),{maxAge: 0}));
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(function(req, res, next){
    //res.locals.moment = moment;
    next();
  });
});

var issueTypes, issueStatus, issuePriorities, usersCount = 0;

initialize();

// Initialize all required ids, icons & images of issue types, status & priority
function initialize() {
  // http://jira.example.com/rest/api/2/issuetype
  // http://jira.example.com/rest/api/2/status
  // http://jira.example.com/rest/api/2/priority
  
  mysql.query('SELECT * FROM issuetype', function(err, rows, fields) {
    if (err) {throw err;}
    else {
      issueTypes = rows;
      getIssueTypes();
    }
  });

  function getIssueTypes() {
    mysql.query('SELECT * FROM issuestatus', function(err, rows, fields) {
      if (err) {throw err;}
      else {
        issueStatus = rows;
        getIssuePriorities();
      }
    });
  }

  function getIssuePriorities() {
    mysql.query('SELECT * FROM priority', function(err, rows, fields) {
      if (err) {throw err;}
      else {
        issuePriorities = rows;        
        queryUsers();
      }
    });
  }
}

function queryUsers() {
  mysql.query('SELECT lower_user_name FROM cwd_user WHERE active = 1', function(err, rows, fields) {
    if (err){ throw err;}
    else {
      processUsers(rows);
    }
  });
}

function processUsers(users) {
  users.forEach(function(usernameObject){
    processUser(_.values(usernameObject)[0]);
  });
}

// Load user entity from REST API that contains the avatars.
// TODO: This can be replaced with an SQL query. 
function processUser(username) {
  request.get({uri: 'http://jira.suitart.com/rest/api/2/user?username=' + username, 'auth': {'user': config.jira.user,'pass': config.jira.password,'sendImmediately': true}}, 
	function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var user = JSON.parse(body);
		var avatar = _.values(user.avatarUrls)[0].replace('s=16', '');
		user.avatarUrls = {tiny: avatar+'s=16', small: avatar+'s=64', medium: avatar+'s=128'};
        processIssues(user);
      }
      else {
        console.log('could not fetch user: ' + username);
        if (error) console.log(error);
        if (response) console.log(response);
        if (body) console.log(body);
      }
    });
}

function processIssues(user) {
  var allIssues = [], issues = {hasIssues: false, overdue: [], today: [], tomorrow: [], nextdays: [], unscheduled: []};
  user.summary = 'Issues: ';
  
  // Query all Issues of a user at once. issuestatus 6 equals closed - do not load these.
  // As we use Jira as Project Management, all other Issues should be listed.
  // When the mails are getting longer, we have to exclude issues without duedate
  mysql.query('SELECT * FROM jiraissue WHERE ASSIGNEE = "'+user.name+'" AND issuestatus != 6', function(err, rows, fields) {
    if (err) throw err;
    allIssues = populateIssueDetails(rows);
    filterIssues();
  });


  // Filter all Issues with Backbone. Group them by due date.
  function filterIssues(){
    
    if(allIssues.length) {
      user.summary = user.summary + 'Total:'+allIssues.length+', ';
      
      issues.hasIssues = true;
      usersCount = usersCount + 1;
      
  	  issues.overdue = _.filter(allIssues, function(issue) {
        // return true where date is older than the current day
        return issue.DUEDATE != null && moment().startOf('day').diff(moment(new Date(issue.DUEDATE))) > 0;  
      });
      user.summary = user.summary + 'Overdue: '+issues.overdue.length+', ';
      issues.overdue.forEach(function(issue){
        // return true where date is older than the current day
        issue.DUEDATE =  moment(new Date(issue.DUEDATE)).hours(18).from();
      });
    
    
      issues.today = _.filter(allIssues, function(issue) {
        // return true where condition is true for any issue
        return issue.DUEDATE != null && moment().startOf('day').diff(moment(new Date(issue.DUEDATE))) === 0;  
      });
      user.summary = user.summary + 'Today: '+issues.today.length+', ';
    
      issues.today.forEach(function(issue){
        issue.DUEDATE =  moment(new Date(issue.DUEDATE)).hours(18).from();
      });


      issues.tomorrow = _.filter(allIssues, function(issue) {
        // return true where condition is true for any issue
        return issue.DUEDATE != null && moment().startOf('day').add('days',1).diff(moment(new Date(issue.DUEDATE))) === 0;  
      });
      user.summary = user.summary + 'Tomorrow: '+issues.tomorrow.length+", ";
    
      issues.tomorrow.forEach(function(issue){
        issue.DUEDATE =  moment(new Date(issue.DUEDATE)).hours(18).from();
      });


      issues.nextdays = _.filter(allIssues, function(issue) {
        // return true where condition is true for any issue
        return issue.DUEDATE != null && moment().startOf('day').add('days',2).diff(moment(new Date(issue.DUEDATE))) <= 0;  
      });
      user.summary = user.summary + 'Upcoming: '+issues.nextdays.length+", ";
      issues.nextdays.forEach(function(issue){
        issue.DUEDATE =  moment(new Date(issue.DUEDATE)).hours(18).from();
      });


      issues.unscheduled = _.filter(allIssues, function(issue) {
        // return true where condition is true for any issue
        return issue.DUEDATE == null;  
      });

      user.summary = user.summary + 'Unscheduled: '+issues.unscheduled.length+". ---------- ";
      console.log("✔ " + user.name + " has issues");
      sendMail(user, issues);
    }
    else {
      console.log("x " + user.name + " has no issues");
    }

  };
}

// Send Mail with Jade Template as HTML Mail
// TODO: oops. a template should be loaded only once, not for each user
function sendMail(user, issues) {
  fs.readFile('./views/issues.jade', 'utf8', function (err, template) {
      if (err) throw err;
      var fn = jade.compile(template);
      var html = fn({user: user, issues: issues});

      // setup e-mail template with unicode symbols
      var mailOptions = {
        from: config.gmail.name+" <"+config.gmail.user+">", // sender address
        to: user.emailAddress,
        subject: "✔ Task Reminders",
        //text: "Only HTML Version ✔", // plaintext body
        html: html // html body
      }

      smtpTransport.sendMail(mailOptions, function(error, res){
        if(error){
          console.log(error);
        }else{
          console.log("sent: ✔ "+user.name+ " " + res.message);
        }
        
        // End process if all users and those issues are processed
        usersCount = usersCount - 1;
        if(usersCount === 0) {
          console.log('✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔');
          console.log('finished successful');
          mysql.end();
          smtpTransport.close();
          process.exit(0);
        }
      });

  });

  
}

// Function to map Ids of issue status, type & priority to the icons
function populateIssueDetails(issues){
  var output = [];
  issues.forEach(function(issue){
    issue.issuestatus = _.findWhere(issueStatus, {ID: issue.issuestatus.toString()});
    issue.issuetype = _.findWhere(issueTypes, {ID: issue.issuetype.toString()});
    issue.PRIORITY = _.findWhere(issuePriorities, {ID: issue.PRIORITY.toString()});

    output.push(issue);
  });
  return output;
}


// Set Timeout if jira fails
setTimeout(function(){
  
  var mailOptions = {
    from: config.gmail.name+" <"+config.gmail.user+">", // sender address
    to: config.gmail.user,
    subject: "x Task Reminders failed",
    text: "Failed to run jira-reminder",
  }
  
  
  smtpTransport.sendMail(mailOptions, function(error, res){
    if(error){
      console.log(error);
    }else{
      console.log("Message sent: " + res.message);
    }
    
    mysql.end();
    process.exit(0);
    smtpTransport.close();
  });
  
  // Timeout time is one hour
}, 3600000)


console.log(new Date() + ': run Jira Reminder');




process.on('uncaughtException', function(err) {
    // handle the error safely
    console.log(err);
});
