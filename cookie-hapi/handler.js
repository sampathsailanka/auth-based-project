const Iron = require("@hapi/iron");

const users = [
  { name: "sampath", password: "secret1" },
  { name: "kumar", password: "secret2" },
  { name: "ravi", password: "secret3" },
];

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

const validateFunc = async (req, session) => {
  const user = await decrypt(session);
  console.log(user);
  if (!user || !users.find((u) => u.name === user.name)) {
    return { isValid: false };
  }
  return { isValid: true, credentials: { user } };
};

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

const loginRoute = handleErrors(async (req, h) => {
  const { name, password } = req.payload;

  if (!name || !password) {
    return h.response({ error: "please provide all the details" }).code(401);
  }

  const user = users.find((u) => u.name === name && u.password === password);
  if (!user) {
    return h.response({ error: "invalid credentials" }).code(401);
  }

  const encrypted = await encrypt(user);

  h.state("user", encrypted);
  return h.response({ msg: "logged in successfully!! :)" }).code(200);
});

const mainRoute = handleErrors(async (req, h) => {
  const { user } = req.auth.credentials;
  return h.response(`Welcome back ${user.name}`).code(200);
});

const logoutRoute = handleErrors(async (req, h) => {
  h.unstate("user");
  return h.response({ msg: "user logged out successfully!!" }).code(200);
});

module.exports = { loginRoute, mainRoute, logoutRoute, validateFunc };
