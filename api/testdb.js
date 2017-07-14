var fs = require("fs");

function TestDB() {
    _self = this;
    _currentDirectoryState = {
        _currentDirectory: "",
        _currentDirectoryIndex: [],
        _tableStates: {}
    };
};

/**
 * @description Initialize the db.
 * 
 * @param {string} directory The directory where the db files should be installed.
 */
TestDB.prototype.initDB = function(directory) {
    if (!directory || directory === "" || directory === ".") {
        directory = __dirname;
    }
    if (fs.existsSync(directory + "/.testDB")) { return; }
    fs.mkdirSync(directory + "/.testDB");
    fs.mkdirSync(directory + "/.testDB/tables");
    fs.writeFileSync(directory + "/.testDB/testDBIndex.json", JSON.stringify([]));
};

TestDB.prototype.dbIndexFilePath = function() {
    return _currentDirectoryState._currentDirectory + "/.testDB/testDBIndex.json";
};

TestDB.prototype.loadDBIndex = function() {
    var data = fs.readFileSync(this.dbIndexFilePath(), "utf8", "r");
    _currentDirectoryState._currentDirectoryIndex = JSON.parse(data);
};

TestDB.prototype.useDB = function(directory) {
    if (!directory || directory === "" || directory === ".") {
        directory = __dirname;
    }
    _currentDirectoryState._currentDirectory = directory;
    this.loadDBIndex();
};

TestDB.prototype.fullTablePath = function(tableName) {
    if (tableName in _currentDirectoryState._currentDirectoryIndex) {
        return null;
    }
    return _currentDirectoryState._currentDirectory + "/.testDB/tables/" + tableName + ".json";
};

TestDB.prototype.tableNameExists = function(name) {
    return name in _currentDirectoryState._currentDirectoryIndex;
};

TestDB.prototype.commitDBIndex = function() {
    fs.writeFileSync(this.dbIndexFilePath(), JSON.stringify(_currentDirectoryState._currentDirectoryIndex), { flag: 'w' });
};

TestDB.prototype.defaultTableState = function(tableName) {
    var returnValue = {
        metaData: {
            "tableName": "",
            "primaryKey": "",
            "columns": {}
        }
    };
    if (tableName) { returnValue.metaData.tableName = tableName; }
    return returnValue;
};

TestDB.prototype.createTable = function(tableName) {
    var tableExists = false;
    for (var i in _currentDirectoryState._currentDirectoryIndex) {
        if (tableName === _currentDirectoryState._currentDirectoryIndex[i]) {
            tableExists = true;
            break;
        }
    }
    if (tableExists) { return; }
    var table = this.defaultTableState(tableName);
    table = JSON.stringify(table);
    table = table.slice(1, table.length - 1);


    var file = fs.createWriteStream(this.fullTablePath(tableName), { flags: 'w' });
    file.write(table);
    file.close();
    _currentDirectoryState._currentDirectoryIndex.push(tableName);
    this.commitDBIndex();
};

TestDB.prototype.nameIsValid = function(name) {
    var referenceString = "_0123456789abcdefghijklmnopqrstuvwxyz";
    var referenceObj = {};
    for (var i in referenceString) {
        referenceObj[referenceString[i]] = referenceString[i];
    }
    for (var i in name) {
        if (!(name[i] in referenceObj)) { return false; }
    }
    return true;
};

TestDB.prototype.loadTable = function(tableName) {
    if (_currentDirectoryState._tableStates[tableName]) { return false; }
    if (!this.nameIsValid(tableName) && !this.tableNameExists(tableName)) {
        return false;
    }
    var tableString = fs.readFileSync(this.fullTablePath(tableName), 'utf8');
    tableString = "{" + tableString + "}";
    _currentDirectoryState._tableStates[tableName] = JSON.parse(tableString);
    return true;
};

TestDB.prototype.defaultColAttribs = function() {
    return {
        name: "",
        valueType: {},
        defaultValue: null,
        isUnique: false,
        isNullable: true,
        isRequired: false,
        isPrimaryKey: false,
        isForeignKey: false,
        referencesTable: ""
    };
};

TestDB.prototype.fillAttribs = function(attribs) {
    var tempAttribs = this.defaultColAttribs();
    for (var key in attribs) {
        if (key in tempAttribs) {
            tempAttribs[key] = attribs[key];
        }
    }
    return tempAttribs;
};

/**
 * @description Find out if the given table is in the database.
 * 
 * @param {string} tableName The name to check for.
 * @returns true if it exists and false otherwise.
 */
TestDB.prototype.tableExists = function(tableName) {
    return fs.existsSync(fullTablePath(tableName));
};

TestDB.prototype.columnIsValid = function(tableName, colsPecs) {
    colsPecs = this.fillAttribs(colsPecs);
    if (colsPecs.name in Object.keys(_currentDirectoryState._tableStates[tableName].columns)) {
        return false;
    }
    if (colsPecs.isPrimaryKey) {
        colsPecs.isUnique = true;
        colsPecs.isNullable = false;
        colsPecs.isRequired = false;
    }
    if (colsPecs.isForeignKey) {
        if (!this.tableExists(_currentDirectoryState._tableStates[tableName].referencesTable)) {
            return false;
        }
    }
    return true;
};

TestDB.prototype.createColumn = function(tableName, colAttribs) {
    colAttribs = this.fillAttribs(colAttribs);
    if (!this.columnIsValid(colAttribs)) { return; }
    _currentDirectoryState._tableStates[tableName].columns[colAttribs.name] = colAttribs;
};

TestDB.prototype.unloadTable = function(tableName) {
    delete _currentDirectoryState._tableStates[tableName];
};

/**
 * @description Save the current database state to the file system.
 * 
 * @param {string} tableName 
 * @returns 
 */
TestDB.prototype.commitTable = function(tableName) {
    if (!_currentDirectoryState._tableStates[tableName] ||
        _currentDirectoryState._tableStates[tableName] === null) { return; }
    var tableString = JSON.stringify(_currentDirectoryState._tableStates[tableName]);
    tableString = tableString.slice(1, tableString.length - 1);
    fs.writeFileSync(this.fullTablePath(tableName), tableString, { flag: 'w' });
    this.commitDBIndex();
};

/**
 * @description Delete a given table.
 * 
 * @param {string} tableName The name of the table to delete.
 */
TestDB.prototype.dropTable = function(tableName) {
    for (i in _currentDirectoryState._currentDirectoryIndex) {
        if (_currentDirectoryState._currentDirectoryIndex[i] === tableName) {
            _currentDirectoryState._currentDirectoryIndex.splice(i, 1);
            break;
        }
    }
    this.commitDBIndex();
    fs.renameSync(this.fullTablePath(tableName), this.fullTablePath(".deleted"));
    this.unloadTable(tableName);
};

/**
 * @description Insert a new record into the current table.
 * 
 * @param {any} record The record you want to insert.
 */
TestDB.prototype.insertRecord = function(tableName, record) {
    this.loadTable(tableName);
    var primaryKey = _currentDirectoryState._tableStates[tableName].metaData.primaryKey;
    _currentDirectoryState._tableStates[tableName][record[primaryKey]] = record;
};

TestDB.prototype.insertRecordWithKey = function(tableName, record, key) {
    this.loadTable(tableName);
    _currentDirectoryState._tableStates[tableName][key] = record;
}

TestDB.prototype.deleteRecordWithKey = function(tableName, key) {
    delete _currentDirectoryState._tableStates[tableName][key];
};

TestDB.prototype.selectRecordWithKey = function(tableName, key) {
    this.loadTable(tableName);
    if (!_currentDirectoryState._tableStates[tableName][key]) { return null; }
    return _currentDirectoryState._tableStates[tableName][key];
};

TestDB.prototype.selectAllRecords = function(tableName) {
    this.loadTable(tableName);
    var records = _currentDirectoryState._tableStates[tableName];
    records = JSON.parse(JSON.stringify(records));
    delete records["metaData"];
    var returnValue = [];
    for (var key in records) {
        returnValue.push(records[key]);
    }
    return returnValue;
};

module.exports = TestDB;