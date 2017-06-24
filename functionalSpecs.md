# TestDB Specs

* init(directory: string): 
    - create "{directory}/.testDB" directory
    - create "{directory}.testDB/db" directory inside .testDB
    - create "{directory}/.testDB/testDBIndex.json" file inside .testDB

* loadDBIndex(indexFileName: string):
    - return the index object in the file, _currentDirectory + "/testDBIndex.json"

* useDB(directory: string):
    - run testDB in given directory
    - set _currentDirectory field
    - read "{_currentDirectory}/testDBIndex.json" file contents and save to _currentDirectoryIndex field

* fullTablePath(dbName: string):
    - if dbName is not null and not empty, return _currentDirectory + "/" + dbName + ".json"
    - if dbName is null, return _currentDirectory + "/" + _currentDBName + ".json"

* createTable(dbName: string):
    - check _currentDirectoryIndex for existence of dbName
    - create {fullDBPath(dbName)} file.

* loadTable(dbName: string):
    - read the contents of {fullDBPath(dbName)} and save contents to _currentDBState

* useTable(dbName: string):
    - check _currentDirectoryIndex for existence of dbName
    - set _currentDBName field
    - read the db file and save to _currentDBState field

* nameIsValid(name: string):
    - check if name contains valid characters for testDB

* private columnIsValid(colSpecs: ColumnSpecification):
    - fit colSpecs variable into ColumnSpecification object
    - check if colSpecs.name is valid
    - check if colSpecs.name is not already in use
    - check if colSpecs.valueType is of same type as colSpecs.defaultValue.
    - if isUnique:
    - if isNullable:
    - if isPrimaryKey:
    - if isRequired:
    - if isForeignKey: check that _currentDBState.columns[colSpecs.referencesTable] exists.

* createColumn(colSpecs: ColumnSpecification):
    - if columnIsValid(colSpecs), returns false, fail.
    - add colSpecs to _currentDBState.columns

* unLoadTable():
    - _currentDBState = null;
    - _currentDBName = "";

* commitTable():
    - save _currentDBState to the appropriate file.

* commitIndex():
    - save _currentDirectoryIndex to {_currentDirectory + "/testDBIndex.json"} file.

* dropTable(dbName: string):
    - remove dbName from _currentDirectoryIndex.
    - commitIndex();
    - delete {fullDBPath()} file.
    - unLoadDB();

* insertRecord(obj: object):
    - create _currentDBState[obj.id] as obj

* deleteRecord(id: string):
    - delete _currentDBState[obj.id]