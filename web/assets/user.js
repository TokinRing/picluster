$(document).ready(function() {
  // GET request to figure out which user is logged in
  $.get("/api/user_data").then(function(data) {
    $(".username").text(data.email);
  });
});
