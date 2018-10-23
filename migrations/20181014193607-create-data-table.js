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
   return db.createTable('data', {
    uri         : { type : 'string', primaryKey : true  },
    title       : { type : 'text', notNull      : false },
    description : { type : 'text', notNull      : true  },
    startDate   : { type : 'datetime', notNull  : true  },
    endDate     : { type : 'datetime', notNull  : false },
    iso3166_2   : { type : 'string', notNull    : true  },
    motives     : { type : 'text', notNull      : false },
    contexts    : { type : 'text', notNull      : false },
    factums     : { type : 'text', notNull      : false },
    tags        : { type : 'text', notNull      : false },
    //Record creation datetime, not part of the schema
    createdDate: {type: 'datetime', notNull: true}
  })
};

exports.down = function(db) {
  return db.dropTable('data')
};

exports._meta = {
  "version": 1
};
