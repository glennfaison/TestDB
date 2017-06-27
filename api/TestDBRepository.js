var fs = require("fs");
var TestDB = require("./testdb");

/**
 * @description Create a new TestDBRepository
 * @param {any} RecordClass The class type which will be stored in this repository.
 * @param {string} dbPath The path to the database. If it doesn't exist, it will be created.
 * @param {string} dbName The name of the database table in which to store objects of {RecordClass} type.
 */
function TestDBRepository(RecordClass, dbPath, dbName) {
    _self = this;
    _RecordClass = RecordClass
    _dbPath = dbPath;
    _dbName = dbName;
    _gettersAndSetters = null;

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
    _gettersAndSetters = _self.findGettersAndSetters();
    for (var i in _gettersAndSetters) {
        var propertyName = _gettersAndSetters[0].toLowerCase() + _gettersAndSetters[i].substr(1);
        var tempObj = _self["get" + _gettersAndSetters[i]]();
        if (typeof(tempObj) !== typeof({}) && tempObj !== null) {
            returnValue[propertyName] = tempObj;
            continue;
        }
        returnValue[propertyName] = _self.RecordClassToJSONObject(tempObj);
    }
    return returnValue;
};
TestDBRepository.prototype.RecordClassToJSONObject = function(instance) {
    var returnValue = {};
    var gettersAndSetters = _self.findGettersAndSetters(instance);
    for (var i in gettersAndSetters) {
        var propertyName = gettersAndSetters[0].toLowerCase() + gettersAndSetters[i].substr(1);
        var tempObj = _self["get" + gettersAndSetters[i]]();
        if (typeof(tempObj) !== typeof({}) && tempObj !== null) {
            returnValue[propertyName] = tempObj;
            continue;
        }
        returnValue[propertyName] = _self.RecordClassToJSONObject(tempObj);
    }
    return returnValue;
};
TestDBRepository.prototype.findGettersAndSetters = function() {
    var keys = Object.keys(_RecordClass.prototype);
    var gettersAndSetters = [];
    for (var i in keys) {
        if (keys[i].substr(0, 3) === "set") {
            gettersAndSetters.push(keys[i].substr(3));
        }
    }
    return gettersAndSetters;
};
TestDBRepository.prototype.findGettersAndSetters = function(instance) {
    var keys = Object.keys(instance.constructor.prototype);
    var gettersAndSetters = [];
    for (var i in keys) {
        if (keys[i].substr(0, 3) === "set") {
            gettersAndSetters.push(keys[i].substr(3));
            ""
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
TestDBRepository.prototype.save = function(instance) {
    instance = _self.RecordClassToJSONObject(instance);
    _testdb.insertRecordWithKey(_dbName, instance, "" + instance.id);
    _testdb.commitTable(_dbName);
};

// Export the class
module.exports = TestDBRepository;