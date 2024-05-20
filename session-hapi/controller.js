const Iron = require("@hapi/iron");
const uuid = require("uuid");

// Users data
const usersData = {
  sampath: "secret1",
  kumar: "secret2",
  ravi: "secret3",
};

const sessions = {};

async function encrypt(obj) {
  return await Iron.seal(obj, process.env.IRON_PASSWORD, Iron.defaults);
}

async function decrypt(sealed) {
  try {
    return await Iron.unseal(sealed, process.env.IRON_PASSWORD, Iron.defaults);
  } catch (err) {
    return null;
  }
}

function handleErrors(fn) {
  return async (req, h) => {
    try {
      return await fn(req, h);
    } catch (err) {
      console.log(err);
      return h.response({ error: "Oops! something went wrong" }).code(500);
    }
  };
}

const validateFunc = async (req, session) => {
  const sessionData = await decrypt(session);
  console.log(sessionData);
  if (!sessionData || !sessions[sessionData.id]) {
    return { isValid: false };
  }

  const userSession = sessions[sessionData.id];
  if (userSession.expiresAt < new Date()) {
    delete sessions[sessionData.id];
    return { isValid: false };
  }
  return { isValid: true, credentials: { user: userSession.name } };
};

const loginRoute = handleErrors(async (req, h) => {
  const { name, password } = req.payload;

  if (!name || !password) {
    return h.response({ error: "please provide all the details" }).code(401);
  }

  const expectedPass = usersData[name];
  if (!expectedPass || expectedPass !== password) {
    return h.response({ error: "Invalid credentials" }).code(401);
  }

  const sessionId = uuid.v4();
  const sessionData = {
    id: sessionId,
    name: name,
    expiresAt: new Date(Date.now() + 900000),
  };
  sessions[sessionId] = sessionData;

  const encrypted = await encrypt(sessionData);

  h.state("session", encrypted);
  return h.response({ msg: "user logged in successfully!!! :)" }).code(200);
});

const logoutRoute = handleErrors(async (req, h) => {
  const session = req.state.session;
  console.log(session);
  const sessionData = await decrypt(session);
  if (sessionData) {
    delete sessions[sessionData.id];
  }

  h.unstate("session");
  return h.response({ msg: "user logged out successfully!!! :)" }).code(200);
});

const mainRoute = handleErrors(async (req, h) => {
  const { user } = req.auth.credentials;
  return h.response(`Welcome back ${user}`).code(200);
});

module.exports = { validateFunc, loginRoute, logoutRoute, mainRoute };
