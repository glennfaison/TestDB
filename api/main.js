var TestDB = require("./testdb");

var testdb = new TestDB();
testdb.initDB();
testdb.useDB();
var user = testdb.selectRecordWithKey("users", "3");
console.log(user);