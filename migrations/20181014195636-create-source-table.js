'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  return db.createTable('source', {
    id            : { type : 'int', primaryKey   : true, autoIncrement : true },
    reportURI     : { type : 'string', notNull   : true  },
    name          : { type : 'string', notNull   : true },
    publishedDate : { type : 'datetime', notNull : false},
    url           : { type : 'string', notNull   : false},
    //Record creation datetime, not part of the schema
    createdDate: {type: 'datetime', notNull: true}
  })

  //return db.addIndex('source', 'report_sources', ['reportURI'])
};

exports.down = function(db) {
  return db.dropTable('source')
};

exports._meta = {
  "version": 1
};
