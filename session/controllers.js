const uuid = require("uuid");

// Users data
const usersData = {
  sampath: "secret1",
  kumar: "secret2",
  ravi: "secret3",
};

// Session store
const sessions = {};

// Middleware to handle errors gracefully
function handleErrors(fn) {
  return function (req, res, next) {
    fn(req, res).catch(next);
  };
}

// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
  const sessionToken = req.cookies["session_token"];
  if (!sessionToken || !sessions[sessionToken]) {
    return res.status(401).json({ error: "Unauthorized access" });
  }
  const userSession = sessions[sessionToken];
  if (userSession.expiresAt < new Date()) {
    delete sessions[sessionToken];
    return res.status(401).json({ error: "Session expired" });
  }
  req.userSession = userSession;
  req.sessionToken = sessionToken;
  next();
}

// Login route
const loginRoute = handleErrors(async (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) {
    return res.status(401).json({ error: "Please provide all the details" });
  }

  const expectedPass = usersData[name];
  if (!expectedPass || expectedPass !== password) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const sessionId = uuid.v4();
  sessions[sessionId] = {
    name: name,
    expiresAt: new Date(Date.now() + 900000), // 15 minutes
  };

  res.cookie("session_token", sessionId, {
    expires: new Date(Date.now() + 900000),
  });
  res.status(201).json({ success: "You have successfully logged in" });
});

// Logout route
const logoutRoute = handleErrors(async (req, res) => {
  const { sessionToken } = req;
  delete sessions[sessionToken];
  res.cookie("session_token", "", { expires: new Date() });
  res.status(200).json({ msg: "User logged out" });
});

// Main route
const mainRoute = handleErrors(async (req, res) => {
  const { userSession } = req;
  res.send(`Welcome back ${userSession.name}`);
});

module.exports = {
  loginRoute,
  refreshRoute,
  logoutRoute,
  mainRoute,
  isAuthenticated,
};
