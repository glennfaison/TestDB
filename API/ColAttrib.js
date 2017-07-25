function ColAttrib() {
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

module.exports = ColAttrib;