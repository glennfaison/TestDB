var fs = require("fs");

// testdb testdb constructor
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
    var data = fs.readFileSync(_self.dbIndexFilePath(), "utf8", "r");
    _currentDirectoryState._currentDirectoryIndex = JSON.parse(data);
};

TestDB.prototype.useDB = function(directory) {
    if (!directory || directory === "" || directory === ".") {
        directory = __dirname;
    }
    _currentDirectoryState._currentDirectory = directory;
    _self.loadDBIndex();
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
    fs.writeFileSync(_self.dbIndexFilePath(), JSON.stringify(_currentDirectoryState._currentDirectoryIndex), { flag: 'w' });
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
    var table = _self.defaultTableState(tableName);
    table = JSON.stringify(table);
    table = table.slice(1, table.length - 1);


    var file = fs.createWriteStream(_self.fullTablePath(tableName), { flags: 'w' });
    file.write(table);
    file.close();
    _currentDirectoryState._currentDirectoryIndex.push(tableName);
    _self.commitDBIndex();
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
    if (_currentDirectoryState._tableStates[tableName]) { return; }
    if (!_self.nameIsValid(tableName) && !_self.tableNameExists(tableName)) {
        return;
    }
    var tableString = fs.readFileSync(_self.fullTablePath(tableName), 'utf8');
    tableString = "{" + tableString + "}";
    _currentDirectoryState._tableStates[tableName] = JSON.parse(tableString);
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
    var tempAttribs = _self.defaultColAttribs();
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
    colsPecs = _self.fillAttribs(colsPecs);
    if (colsPecs.name in Object.keys(_currentDirectoryState._tableStates[tableName].columns)) {
        return false;
    }
    if (colsPecs.isPrimaryKey) {
        colsPecs.isUnique = true;
        colsPecs.isNullable = false;
        colsPecs.isRequired = false;
    }
    if (colsPecs.isForeignKey) {
        if (!_self.tableExists(_currentDirectoryState._tableStates[tableName].referencesTable)) {
            return false;
        }
    }
    return true;
};

TestDB.prototype.createColumn = function(tableName, colAttribs) {
    colAttribs = _self.fillAttribs(colAttribs);
    if (!_self.columnIsValid(colAttribs)) { return; }
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
    fs.writeFileSync(_self.fullTablePath(tableName), tableString, { flag: 'w' });
    _self.commitDBIndex();
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
    _self.commitDBIndex();
    fs.renameSync(_self.fullTablePath(tableName), _self.fullTablePath(".deleted"));
    _self.unloadTable(tableName);
};

/**
 * @description Insert a new record into the current table.
 * 
 * @param {any} record The record you want to insert.
 */
TestDB.prototype.insertRecord = function(tableName, record) {
    _self.loadTable(tableName);
    var primaryKey = _currentDirectoryState._tableStates[tableName].metaData.primaryKey;
    _currentDirectoryState._tableStates[tableName][record[primaryKey]] = record;
};

TestDB.prototype.insertRecordWithKey = function(tableName, record, key) {
    _self.loadTable(tableName);
    _currentDirectoryState._tableStates[tableName][key] = record;
}

TestDB.prototype.deleteRecordWithKey = function(tableName, key) {
    delete _currentDirectoryState._tableStates[tableName][key];
};

TestDB.prototype.selectRecordWithKey = function(tableName, key) {
    _self.loadTable(tableName);
    if (!_currentDirectoryState._tableStates[tableName][key]) { return null; }
    return _currentDirectoryState._tableStates[tableName][key];
};

TestDB.prototype.selectAllRecords = function(tableName) {
    _self.loadTable(tableName);
    var records = _currentDirectoryState._tableStates[tableName];
    records = JSON.parse(JSON.stringify(records));
    delete records["metaData"];
    console.log(records);
    var returnValue = [];
    for (var key in records) {
        returnValue.push(records[key]);
    }
    return returnValue;
};

module.exports = TestDB;