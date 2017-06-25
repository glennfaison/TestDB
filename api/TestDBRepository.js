var fs = require("fs");
var TestDB = require("./testdb");

function TestDBRepository(RecordClass, dbPath, dbName) {
    _self = this;
    _RecordClass = RecordClass
    _dbPath = dbPath;
    _dbName = dbName;
    _gettersAndSetters = findGettersAndSetters();

    _testdb = new TestDB();
    _testdb.initDB(_dbPath);
    _testdb.useDB(_dbPath);
    _testdb.createTable(_dbName);
    _testdb.commitTable(_dbName);
};
TestDBRepository.prototype.JSONObjectToRecordClass = function(instance) {
    var returnValue = new _RecordClass();
    for (var key in instance) {
        var setter = "set" + key[0].toUpperCase() + key.substr(1);
        returnValue[setter](instance[key]);
    }
    return returnValue;
};
TestDBRepository.prototype.RecordClassToJSONObject = function() {
    var returnValue = {};
    for (var i in _gettersAndSetters) {
        var propertyName = _gettersAndSetters[0].toLowerCase() + _gettersAndSetters[i].substr(1);
        returnValue[propertyName] = _self["get" + _gettersAndSetters[i]]();
    }
    return returnValue;
};
TestDBRepository.prototype.RecordClassToString = function() {
    return JSON.stringify(_self.RecordClassToJSONObject());
};
TestDBRepository.prototype.findGettersAndSetters = function() {
    var keys = Object.keys(_RecordClass.prototype);
    var gettersAndSetters = [];
    for (var i in keys) {
        if (keys[i].substr(0, 3) === "set") {
            gettersAndSetters.push(keys[i].substr(2));
        }
    }
    return gettersAndSetters;
};
TestDBRepository.prototype.findById = function(id) {
    return _testdb.selectRecordWithKey(_dbName, "" + id);
};
TestDBRepository.prototype.findAll = function() {
    return _testdb.selectAllRecords();
};
TestDBRepository.prototype.delete = function(id) {
    _testdb.deleteRecordWithKey(_dbName, "" + id);
    _testdb.commitTable(_dbName);
};
TestDBRepository.prototype.exists = function(id) {
    return _testdb.selectRecordWithKey(_dbName, "" + id) !== null;
};
TestDBRepository.prototype.save = function(user) {
    user = _self.RecordClassToJSONObject(user);
    _testdb.insertRecordWithKey(_dbName, user, "" + user.id);
    _testdb.commitTable(_dbName);
};

// Export the class
module.exports = TestDBRepository;