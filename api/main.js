var TestDB = require("./testdb");

var testdb = new TestDB();
testdb.initDB();
testdb.useDB();
testdb.createTable("questions");
testdb.createTable("answers");


testdb.commitTable("questions");
testdb.commitTable("answers");