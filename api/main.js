var TestDB = require("./testdb");

var testdb = new TestDB();
testdb.initDB(__dirname);
testdb.useDB(__dirname);
var user = testdb.selectRecordWithKey("users", "3");
console.log(user);