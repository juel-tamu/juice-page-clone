const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
// Basic body size limits //
const MAX_BODY_BYTES = 10 * 1024;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
};

const DEMO_USER = {
  email: "admin@juice-sh.op",
  password: "supersecretpassword",
};

function validateLogin(email, password) {
  const errors = {};

  if (typeof email !== "string" || email.trim() === "") {
    errors.email = "Please provide an email address.";
  } else if (!email.includes("@")) {
    errors.email = 'Email must contain "@".';
  }

  if (typeof password !== "string" || password === "") {
    errors.password = "Please provide a password.";
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  } else if (password.length > 24) {
    errors.password = "Password is too long.";
  }

  return errors;
}

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function handleLogin(req, res) {
  let body = "";
  let tooLarge = false;

  req.on("data", (chunk) => {
    body += chunk;
    if (body.length > MAX_BODY_BYTES) {
      tooLarge = true;
      req.destroy();
    }
  });

  req.on("end", () => {
    if (tooLarge) return;

    let data;
    try {
      data = JSON.parse(body);
    } catch {
      return sendJson(res, 400, { message: "Invalid JSON body." });
    }

    const { email, password } = data || {};
    const errors = validateLogin(email, password);

    if (Object.keys(errors).length > 0) {
      return sendJson(res, 400, {
        message: "Validation failed on the server.",
        errors,
      });
    }

    if (
      email.trim().toLowerCase() === DEMO_USER.email &&
      password === DEMO_USER.password
    ) {
      return sendJson(res, 200, {
        message: `Welcome, ${DEMO_USER.email}!`,
      });
    }

    return sendJson(res, 401, { message: "Invalid email or password." });
  });
}

function serveStatic(req, res) {
  const urlPath = req.url.split("?")[0];
  const requested = urlPath === "/" ? "/index.html" : urlPath;
  const filePath = path.normalize(path.join(PUBLIC_DIR, requested));

  // Block path traversal (e.g. /../server.js)
  if (!filePath.startsWith(PUBLIC_DIR + path.sep)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      return res.end("Not found");
    }
    res.writeHead(200, {
      "Content-Type":
        MIME_TYPES[path.extname(filePath)] || "application/octet-stream",
    });
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/api/login") {
    return handleLogin(req, res);
  }
  if (req.method === "GET") {
    return serveStatic(req, res);
  }
  res.writeHead(405);
  res.end("Method not allowed");
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Juice Shop login clone running at http://localhost:${PORT}`);
  });
}

module.exports = { validateLogin, server };
