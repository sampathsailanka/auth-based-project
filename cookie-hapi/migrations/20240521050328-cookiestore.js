"use strict";

exports.migrate = async (db, opt) => {
  const type = opt.dbm.dataType;
  await db.createTable("users", {
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

exports._meta = {
  version: 2,
};
