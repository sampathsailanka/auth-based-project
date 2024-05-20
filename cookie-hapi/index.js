const Hapi = require("@hapi/hapi");
const HapiCookie = require("@hapi/cookie");

const {
  loginRoute,
  mainRoute,
  logoutRoute,
  validateFunc,
} = require("./handler");

const ironPassword = "Fg%eKa>&:[nH;_Z+D^G-vt2~zh=fxRV'";

const init = async () => {
  const server = Hapi.server({
    port: 3000,
    host: "localhost",
  });

  await server.register(HapiCookie);

  server.auth.strategy("session", "cookie", {
    cookie: {
      name: "user",
      password: ironPassword,
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
        return "Hello World!!! from hapi";
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
