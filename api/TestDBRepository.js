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

    _testdb = new TestDB();
    _testdb.initDB(_dbPath);
    _testdb.useDB(_dbPath);
    _testdb.createTable(_dbName);
    _testdb.commitTable(_dbName);
};
TestDBRepository.propertiesOf = function(instance) {
    var keys = Object.keys(instance.constructor.prototype);
    var properties = [];
    for (var i in keys) {
        if (keys[i].substr(0, 3) === "set") {
            properties.push(keys[i].substr(3));
        }
    }
    return properties;
};
TestDBRepository.classToJSONObject = function(instance) {
    var returnValue = {};
    var properties = TestDBRepository.propertiesOf(instance);
    for (var i in properties) {
        var propertyName = properties[i][0].toLowerCase() + properties[i].substr(1);
        var getter = "get" + properties[i];
        var tempValue = instance[getter]();
        if (JSON.stringify(tempValue) !== JSON.stringify({}) && tempValue !== null) {
            returnValue[propertyName] = tempValue;
            continue;
        }
        returnValue[propertyName] = TestDBRepository.classToJSONObject(tempValue);
    }
    return returnValue;
};
TestDBRepository.JSONObjectToClass = function(instance, InstanceClass) {
    if (!InstanceClass) {
        InstanceClass = _RecordClass;
    }
    var returnValue = new InstanceClass();
    for (var key in instance) {
        if (key === "__proto__") { continue; }
        var setter = "set" + key[0].toUpperCase() + key.substr(1);
        if (JSON.stringify(instance[key])[0] === "{") {
            var getter = "get" + key[0].toUpperCase() + key.substr(1);
            var TempClass = (returnValue[getter]()).constructor;
            var tempInstance = TestDBRepository.JSONObjectToClass(instance[key], TempClass);
            returnValue[setter](tempInstance);
            continue;
        }
        returnValue[setter](instance[key]);
    }
    return returnValue;
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
    instance = _self.classToJSONObject(instance);
    _testdb.insertRecordWithKey(_dbName, instance, "" + instance.id);
    _testdb.commitTable(_dbName);
};

// Export the class
module.exports = TestDBRepository;