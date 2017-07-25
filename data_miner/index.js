const fs = require("fs");
const API = require("../API");

/**
 * @description Create a new DataMiner for a specified table.
 * @param {Object} RecordClass The class type which will be stored in this repository.
 * @param {String} dbPath The path to the database. If it doesn't exist, it will be created.
 * @param {String} dbName The name of the database table in which to store objects of {RecordClass} type.
 */
function DataMiner(RecordClass, dbPath, dbName) {
    this._RecordClass = RecordClass;
    this._dbPath = dbPath;
    this._dbName = dbName;

    this._testdb = new API();
    this._testdb.initDB(this._dbPath);
    this._testdb.useDB(this._dbPath);
    this._testdb.createTable(this._dbName);
    this._testdb.commitTable(this._dbName);
};

/**
 * @description Get the properties of a Model instance.
 * @param {Object} instance 
 * @returns {List} the properties of the instance.
 */
DataMiner.prototype.propertiesOf = function(instance) {
    var keys = Object.keys(instance.constructor.prototype);
    var properties = [];
    for (var i in keys) {
        if (keys[i].substr(0, 3) === "set") {
            properties.push(keys[i].substr(3));
        }
    }
    return properties;
};

/**
 * @description Convert a Model instance into JSON
 * @param {any} instance 
 * @returns JSON version of the Model instance.
 */
DataMiner.prototype.classToJSONObject = function(instance) {
    var returnValue = {};
    var properties = this.propertiesOf(instance);
    for (var i in properties) {
        var propertyName = properties[i][0].toLowerCase() + properties[i].substr(1);
        var getter = "get" + properties[i];
        var tempValue = instance[getter]();
        if (JSON.stringify(tempValue) !== JSON.stringify({}) && tempValue !== null) {
            returnValue[propertyName] = tempValue;
            continue;
        }
        returnValue[propertyName] = this.classToJSONObject(tempValue);
    }
    return returnValue;
};

/**
 * @description Convert a JSON object to the equivalent Model Class
 * @param {any} instance JSON instance
 * @param {Function} InstanceClass Constructor of class to convert to.
 * @returns Model instance
 */
DataMiner.prototype.JSONObjectToClass = function(instance, InstanceClass) {
    if (!InstanceClass) {
        InstanceClass = this._RecordClass;
    }
    var returnValue = new InstanceClass();
    for (var key in instance) {
        if (key === "__proto__") {
            continue;
        }
        var setter = "set" + key[0].toUpperCase() + key.substr(1);
        if (JSON.stringify(instance[key])[0] === "{") {
            var getter = "get" + key[0].toUpperCase() + key.substr(1);
            var TempClass = (returnValue[getter]()).constructor;
            var tempInstance = this.JSONObjectToClass(instance[key], TempClass);
            returnValue[setter](tempInstance);
            continue;
        }
        returnValue[setter](instance[key]);
    }
    return returnValue;
};

/**
 * @description Get a record by id
 * @param {String} id the name of the primary key column 
 * @returns {any} the record if it's found, and null otherwise.
 */
DataMiner.prototype.findById = function(id) {
    return this._testdb.selectRecordWithKey(this._dbName, "" + id);
};

/**
 * @description Return all records in the table.
 * @returns {List}
 */
DataMiner.prototype.findAll = function() {
    return this._testdb.selectAllRecords(this._dbName);
};

/**
 * @description Delete a record with the given id
 * @param {String} id 
 */
DataMiner.prototype.delete = function(id) {
    this._testdb.deleteRecordWithKey(this._dbName, "" + id);
    this._testdb.commitTable(this._dbName);
};

/**
 * @description Check if a record exists with the given id.
 * @param {String} id 
 * @returns {Boolean} true if found, false otherwise
 */
DataMiner.prototype.exists = function(id) {
    return this._testdb.selectRecordWithKey(this._dbName, "" + id) !== null;
};

/**
 * @description Persist a Model instance to the file system.
 * @param {Object} instance Model instance to be persisted.
 */
DataMiner.prototype.save = function(instance) {
    instance = this.classToJSONObject(instance);
    this._testdb.insertRecordWithKey(this._dbName, instance, "" + instance.id);
    this._testdb.commitTable(this._dbName);
};

// Export the class
module.exports = DataMiner;