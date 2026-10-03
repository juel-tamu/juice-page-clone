function validateLogin(email, password) {
  const errors = {};

  if (email.trim() === "") {
    errors.email = "Please provide an email address.";
  } else if (!email.includes("@")) {
    errors.email = 'Email must contain "@".';
  }

  if (password === "") {
    errors.password = "Please provide a password.";
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  } else if (password.length > 24) {
    errors.password = "Password is too long.";
  }

  return errors;
}

const form = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const message = document.getElementById("form-message");
const button = document.getElementById("login-button");

function showFieldError(input, text) {
  document.getElementById(input.id + "-error").textContent = text || "";
  input.classList.toggle("invalid", Boolean(text)); // actual errors will evaluate to True based on how Boolean() works
}

function showMessage(text, kind) {
  message.textContent = text;
  message.className =
    "message " + (kind === "success" ? "success-msg" : "error-msg");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = emailInput.value;
  const password = passwordInput.value;
  const errors = validateLogin(email, password);

  showFieldError(emailInput, errors.email);
  showFieldError(passwordInput, errors.password);
  showMessage("", "");

  if (Object.keys(errors).length > 0) {
    return;
  }

  // Validation succeeded
  button.disabled = true;
  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();

    if (response.ok) {
      showMessage(data.message, "success");
    } else {
      if (data.errors) {
        showFieldError(emailInput, data.errors.email);
        showFieldError(passwordInput, data.errors.password);
      }
      showMessage(data.message || "Login failed.", "error");
    }
  } finally {
    button.disabled = false;
  }
});
