"use strict";

var dbm;
var type;
var seed;

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */
exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function (db) {
  return db.createTable("users", {
    id: {
      type: "uuid",
      primaryKey: true,
      notNull: true,
      defaultValue: new String("gen_random_uuid()"),
    },
    name: {
      type: "string",
      notNull: true,
    },
    password: {
      type: "string",
      notNull: true,
    },
  });
};

exports.down = function (db) {
  return db.dropTable("users", { ifExists: true });
};

exports._meta = {
  version: 1,
};
