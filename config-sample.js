exports.jira = {
  protocol: 'http',
  host: "localhost",
  port: "80",
  user: "admin",
  password: "password"
};

exports.mysql = mysql.createConnection({
  host     : 'localhost',
  user     : 'jira',
  password : 'jira',
  database : 'jira'
});

// Nodemailer Gmail settings - working with Google Mail and Google Apps Mail
exports.gmail = {
  name     : 'Jira Reminder',
  user     : 'admin@example.com',
  password : 'yourpassword',
};


