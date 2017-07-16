var fs = require("fs");
var TestDB = require("../testdb");

/**
 * @description Create a new TestDBRepository
 * @param {any} RecordClass The class type which will be stored in this repository.
 * @param {string} dbPath The path to the database. If it doesn't exist, it will be created.
 * @param {string} dbName The name of the database table in which to store objects of {RecordClass} type.
 */
function TestDBDAO(RecordClass, dbPath, dbName) {
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
TestDBDAO.propertiesOf = function(instance) {
    var keys = Object.keys(instance.constructor.prototype);
    var properties = [];
    for (var i in keys) {
        if (keys[i].substr(0, 3) === "set") {
            properties.push(keys[i].substr(3));
        }
    }
    return properties;
};
TestDBDAO.classToJSONObject = function(instance) {
    var returnValue = {};
    var properties = TestDBDAO.propertiesOf(instance);
    for (var i in properties) {
        var propertyName = properties[i][0].toLowerCase() + properties[i].substr(1);
        var getter = "get" + properties[i];
        var tempValue = instance[getter]();
        if (JSON.stringify(tempValue) !== JSON.stringify({}) && tempValue !== null) {
            returnValue[propertyName] = tempValue;
            continue;
        }
        returnValue[propertyName] = TestDBDAO.classToJSONObject(tempValue);
    }
    return returnValue;
};
TestDBDAO.JSONObjectToClass = function(instance, InstanceClass) {
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
            var tempInstance = TestDBDAO.JSONObjectToClass(instance[key], TempClass);
            returnValue[setter](tempInstance);
            continue;
        }
        returnValue[setter](instance[key]);
    }
    return returnValue;
};
TestDBDAO.prototype.findById = function(id) {
    return _testdb.selectRecordWithKey(_dbName, "" + id);
};
TestDBDAO.prototype.findAll = function() {
    return _testdb.selectAllRecords(_dbName);
};
TestDBDAO.prototype.delete = function(id) {
    _testdb.deleteRecordWithKey(_dbName, "" + id);
    _testdb.commitTable(_dbName);
};
TestDBDAO.prototype.exists = function(id) {
    return _testdb.selectRecordWithKey(_dbName, "" + id) !== null;
};
TestDBDAO.prototype.save = function(instance) {
    instance = this.classToJSONObject(instance);
    _testdb.insertRecordWithKey(_dbName, instance, "" + instance.id);
    _testdb.commitTable(_dbName);
};

// Export the class
module.exports = TestDBDAO;