function getContainerStatus() {
  setTimeout(function() {
    if (parent.token) {
      $.get("/nodes?token=" + parent.token, function(data) {
        var check_data = data;
        var total = check_data.total_containers;
        var running = 0;
        for (var i in check_data.data) {
          running = running + check_data.data[i].total_running_containers;
        }

        var calc = Math.floor((running / total * 100));
        var percent = 0;
        (!calc == 100) ? percent = percent = Math.ceil((calc + 1) / 100) * 10: percent = calc;

        document.getElementById("running_containers").textContent = percent + "%";
        document.getElementById("running-class").className = "c100 p" + percent + " small";
        getContainerStatus();
      });
    }
  }, 5000);
}
