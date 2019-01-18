$(document).ready(function() {
  // Get form and input references
  var signup_form = $("form.signup");
  var login_btn = $(".login-link-btn");
  var username_input = $("input#new-username-input");
  var password_input = $("input#new-password-input");

  // Validate username/password existence and execute query on submission
  signup_form.on("submit", function(event) {
    // Prevent submit button default POST function
    event.preventDefault();

    var user_data = {
      username: username_input.val().trim(),
      password: password_input.val().trim()
    };

    if (!user_data.username || !user_data.password) {
      return;
    }

    console.log(user_data);

    // If username/password are present, pass to signUpUser function
    signUpUser(user_data.username, user_data.password);

    // Reset username/password fields
    username_input.val("");
    password_input.val("");
  });

  // Validate username/password existence on submission
  login_btn.click(function() {
    // Clear the form
    username_input.val("");
    password_input.val("");

    // Redirect to login page
    window.location = "/login";
    return false;
  });

  // POST to the signup route. If succesful, redirect to admin page
  function signUpUser(username, password) {
    $.post("/api/signup", {
      username: username,
      password: password
    }).then(function(data) {
      window.location.replace(data);
    }).catch(function(err) {
      console.log(err);
    });
  }
});
