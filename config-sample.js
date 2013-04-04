exports.jira = {
  host: "localhost",
  port: "80",
  user: "admin",
  password: "password"
};

exports.mysql = mysql.createConnection({
  host     : 'localhost',
  user     : 'jira',
  password : 'jira',
});