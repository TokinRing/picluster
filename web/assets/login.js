$(document).ready(function() {
  // Get form and input references
  var loginForm = $("form.login");
  var usernameInput = $("input#username-input");
  var passwordInput = $("input#password-input");

  // Validate email and password exist on submission
  loginForm.on("submit", function(event) {
    event.preventDefault();
    var user_data = {
      username: usernameInput.val().trim(),
      password: passwordInput.val().trim()
    };

    if (!user_data.username || !user_data.password) {
      return;
    }

    // If username/password exist run loginUser function
    loginUser(user_data.username, user_data.password

    // Clear the form
    usernameInput.val("");
    passwordInput.val("");
  });

  // POST to api/login route, if successful redirect to admin page
  function loginUser(username, password) {
    $.post("/api/login", {
      username: username,
      password: password
    }).then(function(data) {
      window.location.replace(data);
      // Handles errors by throwing up an alert
    }).catch(function(err) {
      console.log(err);
    });
  }

});
