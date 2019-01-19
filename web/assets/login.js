$(document).ready(function() {
  // Get form and input references
  var login_form = $("form#login");
  var username = $("input#username");
  var password = $("input#password");

  // Validate username/password existence on submission
  login_form.on("submit", function(event) {
    // Prevent submit button default POST function
    event.preventDefault();

    var user_data = {
      username: username.val().trim(),
      password: password.val().trim()
    };

    if (!user_data.username || !user_data.password) {
      return;
    }

    // If username/password exist, pass to loginUser function
    loginUser(user_data.username, user_data.password);

    // Clear the form
    username.val("");
    password.val("");
  });

  // POST to login route, if successful redirect to admin page
  function loginUser(username, password) {
    console.log(username, password);
    $.post("/login", {
      username: username,
      password: password
    }).then(function(data) {
      window.location.replace(data);
    }).catch(function(err) {
      console.log(err);
    });
  }
});
