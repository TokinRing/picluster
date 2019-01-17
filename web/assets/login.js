$(document).ready(function() {
  // Get form and input references
  var login_form = $("form.login");
  var signup_btn = $(".signup-link-btn");
  var username_input = $("input#username-input");
  var password_input = $("input#password-input");

  // Validate username/password existence on submission
  login_form.on("submit", function(event) {
    event.preventDefault();
    var user_data = {
      username: username_input.val().trim(),
      password: password_input.val().trim()
    };

    if (!user_data.username || !user_data.password) {
      return;
    }

    // If username/password exist, pass to loginUser function
    loginUser(user_data.username, user_data.password);

    // Clear the form
    username_input.val("");
    password_input.val("");
  });

  // Validate username/password existence on submission
  signup_btn.click(function() {
    // Clear the form
    username_input.val("");
    password_input.val("");

    // Redirect to signup page
    window.location = "/signup";
    return false;
  });

  // POST to api/login route, if successful redirect to admin page
  function loginUser(username, password) {
    $.post("/api/login", {
      username: username,
      password: password
    }).then(function(data) {
      window.location.replace(data);
    }).catch(function(err) {
      console.log(err);
    });
  }

});
