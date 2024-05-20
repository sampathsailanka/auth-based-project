const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 3000;
const {
  loginRoute,
  mainRoute,
  logoutRoute,
  isAuthenticated,
} = require("./controllers");
const cookieParser = require("cookie-parser");

app.use(bodyParser.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/login", loginRoute);

app.get("/main", isAuthenticated, mainRoute);

app.get("/logout", isAuthenticated, logoutRoute);

app.use((err, req, res, next) => {
  console.log(err.stack);
  res.status(500).json({ error: "oops! something went wrong" });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
