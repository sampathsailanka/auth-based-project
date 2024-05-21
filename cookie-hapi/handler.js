const Iron = require("@hapi/iron");
const pg = require("pg");
const { Pool } = pg;
const bcrypt = require("bcrypt");

const saltRounds = 10;

const pool = new Pool({
  user: process.env.USER,
  host: process.env.HOST,
  port: process.env.DB_PORT,
  ssl: false,
  database: process.env.DATABASE,
  connectionString: process.env.CONNECTION_STRING,
});

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

// VALIDATION FUNCTION
const validateFunc = async (req, session) => {
  const user = await decrypt(session);

  const { rows } = await pool.query("SELECT * from users WHERE id = $1", [
    user.id,
  ]);

  if (!user || rows.length < 1) {
    return { isValid: false };
  }

  return { isValid: true, credentials: { user: rows[0] } };
};

// HANDLE ERRORS
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

// LOGIN ROUTE
const loginRoute = handleErrors(async (req, h) => {
  const { name, password } = req.payload;

  if (!name || !password) {
    return h.response({ error: "please provide all the details" }).code(401);
  }

  const { rows } = await pool.query("SELECT * FROM users WHERE name = $1", [
    name,
  ]);

  if (rows.length === 0) {
    return h.response({ error: "Invalid Credentials" }).code(401);
  }

  const user = rows[0];

  const decryptPassword = await bcrypt.compare(password, user.password);

  if (!decryptPassword) {
    return h.response({ error: "Invalid Credentials" }).code(401);
  }

  const encrypted = await encrypt(user);

  h.state("user", encrypted);
  return h.response({ msg: "logged in successfully!! :)" }).code(200);
});

// REGISTER ROUTE
const registerRoute = handleErrors(async (req, h) => {
  const { name, password } = req.payload;

  if (!name || !password) {
    return h.response({ error: "Please provide all the details" }).code(401);
  }

  const hashedPasswords = await bcrypt.hash(password, saltRounds);

  await pool.query(
    "INSERT INTO users (id, name, password) VALUES (gen_random_uuid(), $1, $2)",
    [name, hashedPasswords]
  );

  return h.response({ msg: "user created!! :)" }).code(201);
});

// MAIN ROUTE
const mainRoute = handleErrors(async (req, h) => {
  const { user } = req.auth.credentials;
  return h.response(`Welcome back ${user.name}`).code(200);
});

// LOGOUT ROUTE
const logoutRoute = handleErrors(async (req, h) => {
  h.unstate("user");
  return h.response({ msg: "user logged out successfully!!" }).code(200);
});

module.exports = {
  loginRoute,
  mainRoute,
  logoutRoute,
  validateFunc,
  registerRoute,
};
