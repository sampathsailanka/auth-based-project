require("dotenv").config();

const Hapi = require("@hapi/hapi");
const HapiCookie = require("@hapi/cookie");
const {
  validateFunc,
  loginRoute,
  logoutRoute,
  mainRoute,
} = require("./controller");

const init = async () => {
  const server = Hapi.server({
    port: 3000,
    host: "localhost",
  });

  await server.register(HapiCookie);

  server.auth.strategy("session", "cookie", {
    cookie: {
      name: "session",
      password: process.env.IRON_PASSWORD,
      isSecure: false,
      isHttpOnly: true,
      path: "/",
      ttl: 15 * 60 * 1000,
    },
    validate: validateFunc,
  });

  server.auth.default("session");

  server.route([
    {
      method: "GET",
      path: "/",
      handler: (req, h) => {
        return "Hello World!! :) from session-hapi";
      },
      options: {
        auth: false,
      },
    },
    {
      method: "GET",
      path: "/main",
      handler: mainRoute,
    },
    {
      method: "POST",
      path: "/login",
      handler: loginRoute,
      options: {
        auth: false,
      },
    },
    {
      method: "GET",
      path: "/logout",
      handler: logoutRoute,
    },
  ]);

  await server.start();
  console.log("server running on %s", server.info.uri);

  process.on("unhandledRejection", (err) => {
    console.log(err);
    process.exit(1);
  });
};

init();
