const users = [
  { name: "sampath", password: "secret1" },
  { name: "kumar", password: "secret2" },
  { name: "ravi", password: "secret3" },
];

function handleErrors(fn) {
  return function (req, res, next) {
    fn(req, res).catch(next);
  };
}

function isAuthenticated(req, res, next) {
  if (!req.cookies || !req.cookies["user"]) {
    return res.status(401).json({ error: "Unauthorized access" });
  }

  const user = users.find((u) => u.name === req.cookies["user"].name);

  if (!user) {
    return res.status(401).json({ error: "Unauthorized access" });
  }

  req.userName = req.cookies.user.name;

  next();
}

const loginRoute = handleErrors(async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(401).json({ error: "Please provide all the details" });
  }

  const user = users.find((u) => u.name === name && u.password === password);
  if (!user) {
    return res.status(401).json({ error: "invalid credentials" });
  }

  res.cookie("user", user, { httpOnly: true });
  res.status(200).json({ msg: "logged in successfully!!" });
});

const logoutRoute = handleErrors(async (req, res) => {
  res.clearCookie("user");
  res.status(200).json({ msg: "logged out successfully!!" });
});

const mainRoute = handleErrors(async (req, res) => {
  const { userName } = req;
  res.status(200).send(`Welcome back ${userName}`);
});

module.exports = { loginRoute, logoutRoute, mainRoute, isAuthenticated };
