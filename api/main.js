var TestDB = require("./testdb");

var testdb = new TestDB();
testdb.initDB();
testdb.useDB();
var users = testdb.selectAllRecords("users");
console.log(users);