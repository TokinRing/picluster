$(document).ready(function() {
  // Get form and input references
  var signUpForm = $("form.signup");
  var usernameInput = $("input#username-input");
  var passwordInput = $("input#password-input");

  // When signup button is clicked, check the email/password are not blank
  signUpForm.on("submit", function(event) {
    event.preventDefault();
    var user_data = {
      username: usernameInput.val().trim(),
      password: passwordInput.val().trim()
    };

    if (!user_data.username || !user_data.password) {
      return;
    }

    // If email and password are present, pass to signUpUser function
    signUpUser(user_data.username, user_data.password);

    // Reset username/password fields
    usernameInput.val("");
    passwordInput.val("");
  });

  // POST to the signup route. If succesful, redirect to the members page
  function signUpUser(username, password) {
    $.post("/api/signup", {
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
