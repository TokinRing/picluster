// Trigger backend API request to get necessary data
$(document).ready(function() {
  // GET request to figure out which user is logged in
  $.get("/api/user_data").then(function(data) {
    $(".username").text(data.username);
  });
});
