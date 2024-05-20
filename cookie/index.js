const express = require("express");
const app = express();
const PORT = 3000;

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const {
  loginRoute,
  logoutRoute,
  mainRoute,
  isAuthenticated,
} = require("./handler");

app.use(bodyParser.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello world");
});

app.get("/main", isAuthenticated, mainRoute);

app.post("/login", loginRoute);

app.get("/logout", isAuthenticated, logoutRoute);

app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).json({ error: "oops! something went wrong" });
});

app.listen(PORT, () => {
  console.log(`server listening on port ${PORT}`);
});
