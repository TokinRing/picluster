$(document).ready(function() {
  // Get form and input references
  var register_form = $("form#register");
  var new_username = $("input#new-username");
  var new_password = $("input#new-password");

  // Validate username/password existence and execute query on submission
  register_form.on("submit", function(event) {
    // Prevent submit button default POST function
    event.preventDefault();

    var new_user_data = {
      username: new_username.val().trim(),
      password: new_password.val().trim()
    };

    if (!new_user_data.username || !new_user_data.password) {
      return;
    }

    console.log(new_user_data);

    // If username/password are present, pass to signUpUser function
    signUpUser(new_user_data.username, new_user_data.password);

    // Reset username/password fields
    new_username.val("");
    new_password.val("");
  });

  // POST to the register route. If succesful, redirect to admin page
  function signUpUser(new_username, new_password) {
    $.post("/register", {
      username: new_username,
      password: new_password
    }).then(function(data) {
      window.location.replace(data);
    }).catch(function(err) {
      console.log(err);
    });
  }
});
