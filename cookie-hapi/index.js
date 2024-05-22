require("dotenv").config();

const Hapi = require("@hapi/hapi");
const HapiCookie = require("@hapi/cookie");
const DBMigrate = require("db-migrate");
const { Pool } = require("pg");
const CRDB = require("crdb-pg");

const {
  loginRoute,
  mainRoute,
  logoutRoute,
  validateFunc,
  registerRoute,
} = require("./handler");

const dbm = DBMigrate.getInstance(true, { throwUncatched: true });

const server = Hapi.server({
  port: 3000,
  host: "localhost",
});

async function start() {
  try {
    await server.start();
    console.log("server running on %s", server.info.uri);
  } catch (err) {
    console.error(`Error while starting the server: ${err.message}`);
  }
}

async function register() {
  try {
    await server.register(HapiCookie);

    server.auth.strategy("session", "cookie", {
      cookie: {
        name: "user",
        password: process.env.IRON_PASSWORD,
        isSecure: false,
        isHttpOnly: true,
        path: "/",
        ttl: 15 * 60 * 1000,
      },
      validate: validateFunc,
    });

    server.auth.default("session");

    await dbm.up();

    const dbConfig = dbm.config.getCurrent().settings;

    // const _tempPGPlugin = {
    //   register: async (server, options) => {
    //     const pool = new Pool(options.config);
    //     server.expose("pool", pool);
    //   },
    //   name: "pg",
    // };

    const _tempPGPlugin = {
      register: (request, options) => {
        const crdb = new CRDB(options.config);
        const pool = crdb.pool();
        request.expose("pool", pool);
      },
      name: "pg",
    };

    await server.register({
      plugin: _tempPGPlugin,
      options: { config: dbConfig, connectionCount: 8 },
    });

    server.route([
      {
        method: "GET",
        path: "/",
        handler: (req, h) => "Hello World!!! from hapi",
        options: { auth: false },
      },
      { method: "GET", path: "/main", handler: mainRoute },
      {
        method: "POST",
        path: "/register",
        handler: registerRoute,
        options: { auth: false },
      },
      {
        method: "POST",
        path: "/login",
        handler: loginRoute,
        options: { auth: false },
      },
      { method: "GET", path: "/logout", handler: logoutRoute },
    ]);

    return true;
  } catch (err) {
    console.error(`Error during registration: ${err.message}`);
    return false;
  }
}

(async () => {
  if (await register()) {
    start();
  }
})();
