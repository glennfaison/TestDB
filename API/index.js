const fs = require("fs");
const ColAttrib = require("./ColAttrib");


/**
 * @description Constructor for {TestDB}
 */
function API() {
    this._currentDirectoryState = {
        _currentDirectory: "",
        _currentDirectoryIndex: [],
        _tableStates: {}
    };
};

/**
 * @description Initialize the db.
 * 
 * @param {String} directory The directory where the db files should be installed.
 */
API.prototype.initDB = function(directory) {
    if (fs.existsSync(directory + "/.testDB")) { return; }
    fs.mkdirSync(directory + "/.testDB");
    fs.mkdirSync(directory + "/.testDB/tables");
    fs.writeFileSync(directory + "/.testDB/testDBIndex.json", JSON.stringify([]));
};

/**
 * @description Returns the file path to the database index.
 * @returns {String}
 */
API.prototype.dbIndexFilePath = function() {
    return this._currentDirectoryState._currentDirectory + "/.testDB/testDBIndex.json";
};

/**
 * @description Loads the database from files to memory.
 */
API.prototype.loadDBIndex = function() {
    var data = fs.readFileSync(this.dbIndexFilePath(), "utf8", "r");
    this._currentDirectoryState._currentDirectoryIndex = JSON.parse(data);
};

/**
 * @description Selects a database directory to work with.
 * @param {String} directory 
 */
API.prototype.useDB = function(directory) {
    this._currentDirectoryState._currentDirectory = directory;
    this.loadDBIndex();
};

/**
 * @description Returns the full path to a given database table. Returns null if the table doesn't exist.
 * @param {String} tableName 
 * @returns {String}
 */
API.prototype.fullTablePath = function(tableName) {
    if (tableName in this._currentDirectoryState._currentDirectoryIndex) {
        return null;
    }
    return this._currentDirectoryState._currentDirectory + "/.testDB/tables/" + tableName + ".json";
};

/**
 * @description Returns true if the given table exists, and false otherwise.
 * @param {String} name 
 * @returns {Boolean}
 */
API.prototype.tableNameExists = function(name) {
    return name in this._currentDirectoryState._currentDirectoryIndex;
};

/**
 * @description Saves the database state from memory to file.
 */
API.prototype.commitDBIndex = function() {
    fs.writeFileSync(this.dbIndexFilePath(), JSON.stringify(this._currentDirectoryState._currentDirectoryIndex), { flag: 'w' });
};

/**
 * @description Provides a template of what a TestDB table looks like by default.
 * If a table name is given, then give the default state for that table.
 * @param {String} tableName 
 * @returns {Object}
 */
API.prototype.defaultTableState = function(tableName) {
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

/**
 * @description Create a named database table with the default table state, 
 * and save to a file of corresponding name in the chosen working directory.
 * @param {String} tableName
 */
API.prototype.createTable = function(tableName) {
    var tableExists = false;
    for (var i in this._currentDirectoryState._currentDirectoryIndex) {
        if (tableName === this._currentDirectoryState._currentDirectoryIndex[i]) {
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
    this._currentDirectoryState._currentDirectoryIndex.push(tableName);
    this.commitDBIndex();
};

/**
 * @description Check whether any given name is valid as table name or variable name.
 * @param {String} name 
 * @returns {Boolean} true if the name is valid and false otherwise
 */
API.prototype.nameIsValid = function(name) {
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

/**
 * @description Load the database table file from disk to memory.
 * @param {String} tableName 
 * @returns {Boolean} true if the table exists and was loaded, and false otherwise.
 */
API.prototype.loadTable = function(tableName) {
    if (this._currentDirectoryState._tableStates[tableName]) { return false; }
    if (!this.nameIsValid(tableName) && !this.tableNameExists(tableName)) {
        return false;
    }
    var tableString = fs.readFileSync(this.fullTablePath(tableName), 'utf8');
    tableString = "{" + tableString + "}";
    this._currentDirectoryState._tableStates[tableName] = JSON.parse(tableString);
    return true;
};

/**
 * @description Appropriately fill all {ColAttrib} values after the caller has specified some.
 * @param {ColAttrib} attribs 
 * @returns the filled ColAttrib object.
 */
API.prototype.fillAttribs = function(attribs) {
    var tempAttribs = new ColAttrib();
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
 * @param {String} tableName The name to check for.
 * @returns true if it exists and false otherwise.
 */
API.prototype.tableExists = function(tableName) {
    return fs.existsSync(fullTablePath(tableName));
};

/**
 * @description Checks for validity of a ColAttrib object in the context of the specified table.
 * @param {String} tableName name of the table.
 * @param {ColAttrib} colAttribs the attributes for a column in the table 
 * @returns {Boolean} true if the ColAttrib object is valid, and false otherwise.
 */
API.prototype.columnIsValid = function(tableName, colAttribs) {
    colAttribs = this.fillAttribs(colAttribs);
    if (colAttribs.name in Object.keys(this._currentDirectoryState._tableStates[tableName].columns)) {
        return false;
    }
    if (colAttribs.isPrimaryKey) {
        colAttribs.isUnique = true;
        colAttribs.isNullable = false;
        colAttribs.isRequired = false;
    }
    if (colAttribs.isForeignKey) {
        if (!this.tableExists(this._currentDirectoryState._tableStates[tableName].referencesTable)) {
            return false;
        }
    }
    return true;
};

/**
 * @description Create a new column in the given table.
 * @param {String} tableName name of selected table. 
 * @param {ColAttrib} colsPecs attributes of the column to be created. 
 */
API.prototype.createColumn = function(tableName, colsPecs) {
    colAttribs = this.fillAttribs(colAttribs);
    if (!this.columnIsValid(colAttribs)) { return; }
    this._currentDirectoryState._tableStates[tableName].columns[colAttribs.name] = colAttribs;
};

/**
 * @description Unload database table state from memory, for the given table.
 * @param {String} tableName name of table to be unloaded.
 */
API.prototype.unloadTable = function(tableName) {
    delete this._currentDirectoryState._tableStates[tableName];
};

/**
 * @description Save the current database state to the file system.
 * @param {String} tableName name of table.
 */
API.prototype.commitTable = function(tableName) {
    if (!this._currentDirectoryState._tableStates[tableName] ||
        this._currentDirectoryState._tableStates[tableName] === null) { return; }
    var tableString = JSON.stringify(this._currentDirectoryState._tableStates[tableName]);
    tableString = tableString.slice(1, tableString.length - 1);
    fs.writeFileSync(this.fullTablePath(tableName), tableString, { flag: 'w' });
    this.commitDBIndex();
};

/**
 * @description Delete a given table.
 * 
 * @param {String} tableName The name of the table to delete.
 */
API.prototype.dropTable = function(tableName) {
    for (i in this._currentDirectoryState._currentDirectoryIndex) {
        if (this._currentDirectoryState._currentDirectoryIndex[i] === tableName) {
            this._currentDirectoryState._currentDirectoryIndex.splice(i, 1);
            break;
        }
    }
    this.commitDBIndex();
    fs.renameSync(this.fullTablePath(tableName), this.fullTablePath(".deleted"));
    this.unloadTable(tableName);
};

/**
 * @description Insert a new record into the given table. Automatically generate a value for the key.
 * @param {String} tablename the name of the table in which to insert.
 * @param {Object} record The record to insert.
 */
API.prototype.insertRecord = function(tableName, record) {
    this.loadTable(tableName);
    var primaryKey = this._currentDirectoryState._tableStates[tableName].metaData.primaryKey;
    this._currentDirectoryState._tableStates[tableName][record[primaryKey]] = record;
};

/**
 * @description Insert a record into the given table, and give it the specified key.
 * @param {String} tableName the name of the table to insert into
 * @param {any} record the record to insert
 * @param {String} key value of the key.
 */
API.prototype.insertRecordWithKey = function(tableName, record, key) {
    this.loadTable(tableName);
    this._currentDirectoryState._tableStates[tableName][key] = record;
}

/**
 * @description Delete the record with the specified key from the specified table.
 * @param {String} tableName name of table.
 * @param {String} key key of the record to be deleted.
 */
API.prototype.deleteRecordWithKey = function(tableName, key) {
    delete this._currentDirectoryState._tableStates[tableName][key];
};

/**
 * @description Select and return the record with the given key. Return null if no record exists with such a key.
 * @param {String} tableName name of table
 * @param {String} key key of record to be selected.
 * @returns the record with the specified key, or null if it doesn't exist.
 */
API.prototype.selectRecordWithKey = function(tableName, key) {
    this.loadTable(tableName);
    if (!this._currentDirectoryState._tableStates[tableName][key]) { return null; }
    return this._currentDirectoryState._tableStates[tableName][key];
};

/**
 * @description Select all records in the specified table. Return an Empty list if the table is empty.
 * @param {String} tableName name of table.
 * @returns A list of all records in the table. Empty list if there is no record.
 */
API.prototype.selectAllRecords = function(tableName) {
    this.loadTable(tableName);
    var records = this._currentDirectoryState._tableStates[tableName];
    records = JSON.parse(JSON.stringify(records));
    delete records["metaData"];
    var returnValue = [];
    for (var key in records) {
        returnValue.push(records[key]);
    }
    return returnValue;
};

module.exports = API;