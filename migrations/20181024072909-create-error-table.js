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
  return db.createTable('error', {
    reportURI     : { type : 'string', notNull : true, primaryKey : true },
    cause         : { type : 'text', notNull   : true },
    pageURL       : { type : 'string', notNull : true}, //URL of the page
    createdDate   : { type : 'datetime', notNull: true}
  })

};

exports.down = function(db) {
  return db.dropTable('error')
};

exports._meta = {
  "version": 1
};
