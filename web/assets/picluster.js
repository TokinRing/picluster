//TODO: Need reorganizing into logical/sensible sections

//[ ] TODO: refactor for efficiency and clarity
function getContainerStatus() {
  setTimeout(function() {
    if (parent.token) {
      // TODO: refactor reference to /nodes handle to use /api/host/info
      $.get("/nodes?token=" + parent.token, function(data) {
        var check_data = data;
        var total = check_data.total_containers;
        var running = 0;
        for (var i in check_data.data) {
          running = running + check_data.data[i].total_running_containers;
        }

        var calc = Math.floor((running / total * 100));
        var percent =   (!calc == 100) ? Math.ceil((calc + 1) / 100) * 10 : calc;

        // TODO: ugh... track back where these statically assigned elements live
        document.getElementById("running_containers").textContent = percent + "%";
        document.getElementById("running-class").className = "c100 p" + percent + " small";
        getContainerStatus();
      });
    }
  }, 5000);
}

//[X] TODO: refactor for efficiency and clarity
function capitalize_string(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

//[ ] TODO: refactor for efficiency and clarity
function generate_nav(anchor) {
  var html_slug = "";

  //TODO: Refactor into pure jquery function
  $.get("/api/links", function(links) {
    html_slug += "<nav><ul>"
    html_slug += "<li><a href='/' id=\"link_logo\"><img src=\"/images/sphere.png\" id=\"nav_logo_image\"></a>";

    for (var group in links) {
      html_slug += "<li><a href=\"/" + group + "\">" + capitalize_string(group) + "</a>";
      html_slug += "<ul class=\"dropdown\">";

      for (var link in links[group]) {
        html_slug += "<li><a href=\"/" + group + "/" + links[group][link] + "\" id=" + group + "-" + links[group][link] + ">" + capitalize_string(links[group][link]) + "</a></li>";
      }

      html_slug += "</ul></li>";
    }

    html_slug += "</ul></nav>";

    $(anchor).html(html_slug);
  });
}

// Render options from /api/hosts/list and populate selector anchor
function generate_host_selector(anchor) {
  $.get("/api/hosts/list", function(results) {
    // Default empty value
    $(anchor).append("<option selected></option>");

    // Roll through results array and append instance object hostname option to the anchor
    for (var i in results) {
      const host = results[i];
      $(anchor).append("<option value=\"" + host.hostname + "\">" + host.hostname + "</option>");
    }
  });
}

// Render options from /api/hosts/list and populate selector anchor
function generate_host_checkboxes(anchor) {
  $.get("/api/hosts/list", function(results) {
    // Start list with "*" to denote "all"
    $(anchor).append("<label for=\"failover_host\"><input type=\"checkbox\" name=\"failover_host\" value=\"*\"/>*</label>");

    // Roll through results array and create checkbox of instance object hostname option to the anchor
    for (var i in results) {
      const host = results[i];
      $(anchor).append("<label for=\"failover_host\"><input type=\"checkbox\" name=\"failover_host\" value=\""+ host.hostname +"\"/>"+ host.hostname +"</label>");
    }
  });
}

//[ ] TODO: refactor for efficiency and clarity
function generate_host_status(anchor) {
  var div = document.getElementById(anchor);
  div ? div.innerHTML = div.innerHTML +
    "<br><div id=\"host_searching\"><img heigth=\"200\" width=\"200\" src=\"/images/searching.jpg\"><br><p>Searching for hosts</p></div>" :
    div;

  $.get("/api/hosts/info", function(result) {
    div ? div.innerHTML = "" : div;

    // Iterate and render each object in received array
    for (var i in result) {
      result[i] = JSON.parse(result[i]);

      if (div) {
        var dist = (result[i].os_dist || "").toLowerCase();
        var div_logo = document.createElement("div");
        div_logo.className = "host_status_div";
        div_logo.innerHTML = distLogo(dist) + "<p class=\"div_logo_text\">" + result[i].hostname + '</p><br>';

        var host_network_tx = result[i].network_tx;
        var host_network_rx = result[i].network_rx;
        host_network_rx.className = "host_status_div";
        host_network_tx.className = "host_status_div";

        var host_network_tx_label = document.createElement("label");
        var host_network_rx_label = document.createElement("label");

        var network_image = document.createElement("IMG");
        network_image.className = "host_status_div";
        network_image.style.height = "30";
        network_image.style.width = "60";
        network_image.src = "/images/network.png";

        host_network_rx_label.innerHTML = "<br><b><font class=\"host_status_text\">Out:</b> " + host_network_rx + " KB/s&nbsp;&nbsp;";
        host_network_tx_label.innerHTML = "<b><font class=\"host_status_text\">In:</b> " + host_network_tx + " KB/s";

        var div_disk = document.createElement("div");
        div_disk.className = "host_status_div";

        var div_disk_clearfix = document.createElement("div");
        div_disk_clearfix.className = "clearfix";

        var div_disk_running = document.createElement("div");
        div_disk_running.className = "c100 p" + Math.round(result[i].disk_percentage) + " small";
        div_disk_running.innerHTML = "<span id=\"" + result[i] + "\">" + Math.round(result[i].disk_percentage) + "%</span>";

        var div_disk_slice = document.createElement("div");
        div_disk_slice.className = "slice";

        var div_disk_bar = document.createElement("div");
        div_disk_bar.className = "bar";

        var div_disk_fill = document.createElement("div");
        div_disk_fill.className = "fill";

        var div_cpu = document.createElement("div");
        div_cpu.className = "host_status_div";

        var div_cpu_clearfix = document.createElement("div");
        div_cpu_clearfix.className = "clearfix";

        var div_cpu_running = document.createElement("div");
        div_cpu_running.className = "c100 p" + Math.round(result[i].cpu_percent) + " small";
        div_cpu_running.innerHTML = "<span id=\"" + i + "\">" + Math.round(result[i].cpu_percent) + "%</span>";

        var div_cpu_slice = document.createElement("div");
        div_cpu_slice.className = "slice";

        var div_cpu_bar = document.createElement("div");
        div_cpu_bar.className = "bar";

        var div_cpu_fill = document.createElement("div");
        div_cpu_fill.className = "fill";

        var div_memory = document.createElement("div_memory");
        div_memory.className = "host_status_div";

        var div_memory_clearfix = document.createElement("div");
        div_memory_clearfix.className = "clearfix";

        var div_memory_running_class = document.createElement("div");
        div_memory_running_class.className = "c100 p" + result[i].memory_percentage + " small";
        div_memory_running_class.innerHTML = "<span id=\"" + i + "\">" + result[i].memory_percentage + "%</span>";

        var div_memory_slice = document.createElement("div");
        div_memory_slice.className = "slice";

        var div_memory_bar = document.createElement("div");
        div_memory_bar.className = "bar";

        var div_memory_fill = document.createElement("div");
        div_memory_fill.className = "fill";

        div_disk.appendChild(div_disk_clearfix);
        div_disk_clearfix.appendChild(div_disk_running);
        div_disk_running.appendChild(div_disk_slice);
        div_disk_slice.appendChild(div_disk_bar);
        div_disk_bar.appendChild(div_disk_fill);
        div_disk.innerHTML += "<font class=\"host_status_text\"><b>Disk Usage</b>";

        div_cpu.appendChild(div_cpu_clearfix);
        div_cpu_clearfix.appendChild(div_cpu_running);
        div_cpu_running.appendChild(div_cpu_slice);
        div_cpu_slice.appendChild(div_cpu_bar);
        div_cpu_bar.appendChild(div_cpu_fill);
        div_cpu.innerHTML += "<font class=\"host_status_text\"><b>CPU Usage</b>";

        div_memory.appendChild(div_memory_clearfix);
        div_memory_clearfix.appendChild(div_memory_running_class);
        div_memory_running_class.appendChild(div_memory_slice);
        div_memory_slice.appendChild(div_memory_bar);
        div_memory_bar.appendChild(div_memory_fill);
        div_memory.innerHTML += "<font class=\"host_status_text\"><b>Memory Usage</b>";

        var host_card = document.createElement("div");
        host_card.className = "host_card";

        host_card.appendChild(div_logo);
        host_card.appendChild(div_disk);
        host_card.appendChild(div_cpu);
        host_card.appendChild(div_memory);

        var hr = document.createElement("hr");
        div.appendChild(host_card);
        div.appendChild(network_image);
        div.appendChild(host_network_rx_label);
        div.appendChild(host_network_tx_label);
        div.appendChild(hr);
      }
    }

    // TODO: needs better implementation
    addFontLinux();
  });
}

//[ ] TODO: refactor for efficiency and clarity
function generate_host_manage(anchor) {
  var host_list = document.getElementById(anchor);
  var radio_host_add = $("input[id=radio_host_add]:checked").val();
  var radio_host_remove = $("input[id=radio_host_remove]:checked").val();

  var path = radio_host_add ? "/addhost" :
    radio_host_remove ? "/rmhost" :
    "";

  var host = radio_host_add ? $("#host").val() :
    radio_host_remove ? host_list.options[host_list.selectedIndex].value :
    "";

  $.post(path, {
    token: parent.token,
    host: host
  }, function(data) {
    var div = document.getElementById("hosts-manage-modal-body");
    div.innerHTML = "Sent request to the server. Please check the logs and running containers for updated information.<br>" + data;
  });
}

//[ ] TODO: refactor for efficiency and clarity
function generate_swarm_status(anchor) {
  var node_list = document.getElementById(anchor);
  var radio_swarm_create = $("input[id=radio_swarm_create]:checked").val();
  var radio_swarm_remove = $("input[id=radio_swarm_remove]:checked").val();
  var radio_swarm_network = $("input[id=radio_swarm_network]:checked").val();
  var network_name = $("input[id=network-name]").val();

  var path = radio_swarm_create ? "/hosts/swarm" :
    radio_swarm_remove ? "/swarm-remove" :
    radio_swarm_network ? "/swarm-network-create" :
    "";

  var node = radio_swarm_create ? $("#host").val() :
    radio_swarm_network ? $("#host").val() :
    radio_swarm_remove ? node_list.options[node_list.selectedIndex].value :
    "";

  $.post(path, {
    token: parent.token,
    host: node,
    network: network_name
  }, function(data) {
    var div = document.getElementById("nodes-manage-modal-body");
    div.innerHTML = "Sent request to the server. Please check the logs and running containers for updated information.<br>" + data;
  });
}

//[ ] TODO: refactor for efficiency and clarity
function generate_container_status(anchor) {
  // TODO: This mess needs refactoring; DOM -> jQuery
  var div = document.getElementById(anchor);

  div.innerHTML = (div) ? div.innerHTML +
    "<div class=\"container_searching\"><img heigth=\"200\" width=\"200\" src=\"/images/searching.jpg\"><br><font size=+3><label>Searching for containers</label></font></div>" :
    div;

    // TODO: refactor reference to /nodes handle to use /containerss/info
  $.get("/containers/info", function(result) {
    (div) ? div.innerHTML = "": div;
    var offline_containers = [];
    var running_containers = [];
    var configured_containers = result.container_list;

    for (var i in check_data.data) {
      if (div) {
        var dist = check_data.data[i].os_type.toLowerCase() || "";
        var container_layout = check_data.data[i].running_containers;
        running_containers.push(container_layout);
        //alert(running_containers);
        var container_uptime = check_data.data[i].container_uptime;
        var get_container_cpu = check_data.data[i].container_cpu_stats;
        var get_container_mem = check_data.data[i].container_mem_stats;
        var cpu_cores = check_data.data[i].cpu_cores;
        var total_containers = check_data.data[i].total_containers;

        div.innerHTML += "<div class=\"container_card\"><div class=\"container_card_logo\"><b>" + distLogo(dist) +
          check_data.data[i].hostname + "</b></div><div class=\"container_card_list\"><ul id =\"ul_" + i + ">\">";
        var container_layout_ul = document.getElementById("ul_" + i);

        for (var j in container_layout) {
          if (container_layout[j]) {

            var node_card = document.createElement("div");
            node_card.className = "node_card";

            var div_cpu = document.createElement("div");
            div_cpu.className = "node_status_div";

            var div_cpu_clearfix = document.createElement("div");
            div_cpu_clearfix.className = "clearfix";

            var div_cpu_running = document.createElement("div");

            div_cpu_running.className = "c100 p" + Math.round(get_container_cpu[j] / cpu_cores) + " small";
            div_cpu_running.innerHTML = "<span id=\"" + i + "\">" + Math.round(get_container_cpu[j] / cpu_cores) +
              "%</span>";

            var div_cpu_slice = document.createElement("div");
            div_cpu_slice.className = "slice";

            var div_cpu_bar = document.createElement("div");
            div_cpu_bar.className = "bar";

            var div_cpu_fill = document.createElement("div");
            div_cpu_fill.className = "fill";

            var div_memory = document.createElement("div_memory");
            div_memory.className = "node_status_div";

            var div_memory_clearfix = document.createElement("div");
            div_memory_clearfix.className = "clearfix";

            var div_memory_running_class = document.createElement("div");

            div_memory_running_class.className = "c100 p" + Math.round(get_container_mem[j]) + " small";
            div_memory_running_class.innerHTML = "<span id=\"" + i + "\">" + Math.round(get_container_mem[j]) + "%</span>";

            var div_memory_slice = document.createElement("div");
            div_memory_slice.className = "slice";

            var div_memory_bar = document.createElement("div");
            div_memory_bar.className = "bar";

            var div_memory_fill = document.createElement("div");
            div_memory_fill.className = "fill";

            div_cpu.appendChild(div_cpu_clearfix);
            div_cpu_clearfix.appendChild(div_cpu_running);
            div_cpu_running.appendChild(div_cpu_slice);
            div_cpu_slice.appendChild(div_cpu_bar);
            div_cpu_bar.appendChild(div_cpu_fill);
            div_cpu.innerHTML += "<font class=\"node_status_text\"><b>CPU Usage</b>";

            div_memory.appendChild(div_memory_clearfix);
            div_memory_clearfix.appendChild(div_memory_running_class);
            div_memory_running_class.appendChild(div_memory_slice);
            div_memory_slice.appendChild(div_memory_bar);
            div_memory_bar.appendChild(div_memory_fill);
            div_memory.innerHTML += "<font class=\"node_status_text\"><b>Memory Usage</b>";

            node_card.appendChild(div_cpu);
            node_card.appendChild(div_memory);

            container_layout_ul.innerHTML += "<br><br><li><a href=\"/containers-manage.html\" onclick=\"link_function('" +
              container_layout[j] + ")\">" + container_layout[j] + " - " + container_uptime[j] + "</a>";
            container_layout_ul.append(node_card);
          }
        }
        div.innerHTML += "</ul></div></div><hr>"
      }

      addFontLinux();
    }

    for (var k = 0; k != configured_containers.length; k++) { //Configured Containers
      var proceed = 1;
      for (var l = 0; l != running_containers.length; l++) { //Running Containers
        if (running_containers[l].indexOf(configured_containers[k]) > -1) {
          proceed = 0;
        }
      }

      if (proceed === 1) {
        offline_containers.push(configured_containers[k]);
      }
    }

    if (offline_containers.length > 0) {
      var header =
        "<hr><img src=\"/images/alert.png\" style=\"width:75px;height:75px;\"><br><b>Stopped/Missing Containers:</b>";
      var divbackup = div.innerHTML;
      var data = "";

      for (var z = 0; z != offline_containers.length; z++) {
        data += "<br><br><a href=\"/containers-manage.html\" onclick=\"link_function(" + offline_containers[z] + ")\">" +
          offline_containers[z] + "</a>";
      }

      div.innerHTML = header + data + "<hr>" + div.innerHTML;
      divbackup;
    }
  });
}

//[ ] TODO: refactor for efficiency and clarity
function generate_container_manage(anchor) {
  var node_list_add = document.getElementById("node_list_add");
  var node_list_modify = document.getElementById("node_list_modify");
  var container_list = document.getElementById("container_list");
  var node_add = node_list_add.options[node_list_add.selectedIndex].value;
  var node_modify = node_list_modify.options[node_list_modify.selectedIndex].value;
  var container_add = $("#container_name").val();
  var container_modify = container_list.options[container_list.selectedIndex].value;
  var container_add_args = $("#container_args").val() || $("#modify_arguments").val();
  var heartbeat_add_args = $("#heartbeat_args").val();
  var container_heartbeat_fieldset = document.getElementsByName("container_heartbeat_fieldset");
  var radio_container_add = $("input[id=radio_container_add]:checked").val();
  var radio_container_modify = $("input[id=radio_container_modify]:checked").val();
  var radio_container_arg_modify = $("input[id=radio_modify_args]:checked").val();
  var radio_start = $("input[id=radio_start]:checked").val();
  var radio_stop = $("input[id=radio_stop]:checked").val();
  var radio_restart = $("input[id=radio_restart]:checked").val();
  var radio_delete = $("input[id=radio_delete]:checked").val();
  var radio_create = $("input[id=radio_create]:checked").val();
  var radio_modify_constraints = $("input[id=radio_modify_constraints]:checked").val();
  var radio_container_log = $("input[id=radio_container_log]:checked").val();
  var radio_change_host = $("input[id=radio_change_host]:checked").val();
  var radio_remove_container_config = $("input[id=radio_remove_container_config]:checked").val();
  var command;
  var path;
  var failover_constraints = "none";
  var operation;

  if (radio_container_modify) {
    if (radio_container_modify.indexOf("on") > -1 && heartbeat_add_args.length === 0) {
      heartbeat_add_args = "delete";
    }
  }
  container_heartbeat_fieldset.forEach(function(node, i) {
    if (container_heartbeat_fieldset[i].checked) {
      failover_constraints += "," + node.value;
    }
  });

  if (failover_constraints.indexOf("none,") > -1) {
    failover_constraints = failover_constraints.replace("none,", "");
  }

  if (radio_start) {
    operation = "start";
  }
  if (radio_stop) {
    operation = "stop";
  }
  if (radio_restart) {
    operation = "restart";
  }
  if (radio_delete) {
    operation = "rm";
  }
  if (radio_container_log) {
    operation = "logs";
  }
  if (radio_create) {
    operation = "create";
  }

  path = radio_container_add && radio_container_add.indexOf("on") > -1 ? "/addcontainer" :
    radio_start && radio_start.indexOf("on") > -1 ? "/containers/manage" :
      radio_stop && radio_stop.indexOf("on") > -1 ? "/containers/manage" :
        radio_restart && radio_restart.indexOf("on") > -1 ? "/containers/manage" :
          radio_container_arg_modify && radio_container_arg_modify.indexOf("on") > -1 ? "/update-container" :
            radio_modify_constraints && radio_modify_constraints.indexOf("on") > -1 ? "/update-container" :
              radio_delete && radio_delete.indexOf("on") > -1 ? "/containers/manage" :
                radio_create && radio_create.indexOf("on") > -1 ? "/containers/manage" :
                  radio_container_log && radio_container_log.indexOf("on") > -1 ? "/containers/manage" :
                    radio_change_host && radio_change_host.indexOf("on") > -1 ? "/changehost" :
                      radio_remove_container_config && radio_remove_container_config.indexOf("on") > -1 ? "/removecontainerconfig" :
                        "";

  if (path) {
    if ((radio_change_host) && (container_modify.indexOf("*") > -1) || (radio_remove_container_config) && (container_modify.indexOf("*") > -1)) {
      alert("\nError: You cannot control all of these containers at once for chosen action.");
    } else if (radio_container_add) {
      $.post(path, {
        token: parent.token,
        container: container_add,
        host: node_add,
        container_args: container_add_args,
        heartbeat_args: heartbeat_add_args,
        failover_constraints: container_add + "," + failover_constraints
      }, function(data) {
        var div = document.getElementById(anchor);
        div.innerHTML = "<br>Sent request to server.<br><br>" + data;
      });
    } else if (radio_start || radio_stop || radio_restart || radio_delete || radio_create || radio_container_log || radio_remove_container_config || radio_change_host || radio_container_arg_modify || radio_modify_constraints) {
      $.post(path, {
        token: parent.token,
        operation,
        command: command,
        container_args: container_add_args,
        container: container_modify,
        heartbeat_args: heartbeat_add_args,
        failover_constraints: container_modify + "," + failover_constraints,
        newhost: node_modify
      }, function(data) {
        var div = document.getElementById(anchor);
        div.innerHTML = "<br>Sent request to server.<br><br>" + data.replace(/(?:\r\n|\r|\n)/g, "<br />");
      });
    } else {
      alert("Error, you did not select an operation.");
    }
  }
}

//[ ] TODO: refactor for efficiency and clarity
function generate_image_status(anchor) {
  var div = document.getElementById(anchor);
  div ? div.innerHTML +=
    "<div class=\"image_searching\"><img heigth=\"200\" width=\"200\" src=\"/images/searching.jpg\"><br><font size=+3><label>Searching for images</label></font></div>" :
    "";

  // TODO: refactor reference to /nodes handle to use /api/host/info
  $.get("/nodes?token=" + parent.token, function (data) {
    var check_data = data;
    div.innerHTML = div ? "" : false;

    for (var i in check_data.data) {
      if (div) {
        var dist = check_data.data[i].os_type.toLowerCase() || "";
        var image_list = check_data.data[i].images;

        div.innerHTML += "<div class=\"image_card\"><div class=\"image_card_logo\">" + distLogo(dist) + check_data.data[i].hostname +
          "</div><div class=\"image_card_list\"><ul id =\"ul_" + i + "\">";

        var image_list_ul = document.getElementById("ul_" + i);

        for (var j in image_list) {
          if (image_list[j]) {
            image_list_ul.innerHTML += "<li><a href=\"/images-manage.html\" onclick=\"link_image('" + image_list[j] +
              ")\">" + image_list[j] + "</a>";
          }
        }
      }

      div.innerHTML = div ? div.innerHTML + '</ul></div><hr>' : '';

      addFontLinux();
    }
  });
}

//[ ] TODO: refactor for efficiency and clarity
function generate_function_create() {
  var get_function = document.getElementById("function-name").value.length > 1 ? document.getElementById("function-name").value : "";
  var function_args = document.getElementById("function-args").value.length > 1 ? document.getElementById("function-args").value : "";

  if (get_function.length > 1) {
    $.get("/function?token=" + parent.token + "&function=" + get_function + "&container_args=" + function_args, function(create_data) {
      modal.style.display = "none";
      output_modal.style.display = "block";
    });
  } else {
    alert("Error, you did enter a function name.")
    modal.style.display = "block";
    output_modal.style.display = "none";
  }
}

//[ ] TODO: refactor for efficiency and clarity
function generate_function_clear(anchor) {
  $.get("/clear-functions?token=" + parent.token, function (data) {
    var div = document.getElementById(anchor);
    div.innerHTML = data.replace(/(?:\r\n|\r|\n)/g, "<br />");
  });
}

//[ ] TODO: refactor for efficiency and clarity
function generate_function_viewer() {
  var function_list = document.getElementById("function_list");
  var get_function = function_list.options[function_list.selectedIndex] ? function_list.options[function_list.selectedIndex].value: "";
  var command = "";

  document.getElementById("function_output").value = "Fetching.....";
  document.getElementById("function_url").value = "Fetching.....";

  if (get_function.length > 1) {
    // TODO: refactor reference to /nodes handle to use /api/host/info
    $.get("/nodes?token=" + parent.token, function(data) {
      for (var i in data.functions.name) {
        if (data.functions.name[i].name.indexOf(get_function) > -1) {
          if (data.functions.name[i].name && data.functions.name[i].output) {
            document.getElementById("function_output").value = data.functions.name[i].output;
            document.getElementById("function_url").value = "curl \"" + data.function_server + "?token=" + parent.token + "&uuid=" + data.functions.name[i].uuid + "\"";
          } else {
            document.getElementById("function_output").value = "No output or function already removed.";
            document.getElementById("function_url").value = "No output or function already removed.";
          }
        }
      }
    });
  } else {
    alert("Error, you did not select a function.");
    output_modal.style.display = "none";
    modal.style.display = "block";
  }
}

//[ ] TODO: refactor for efficiency and clarity
function get_container_info() {
  $.get("/getconfig?token=" + parent.token, function(data) {
    var check_data = JSON.parse(data);
    Object.keys(check_data.hb).forEach((get_node, i) => {
      Object.keys(check_data.hb[i]).forEach(key => {
        if (key.indexOf(document.getElementById("container_list").value) > -1) {
          $("#heartbeat_args").val(check_data.hb[i][document.getElementById("container_list").options[document.getElementById("container_list").selectedIndex].value]);
        }
      });
    });

    Object.keys(check_data.layout).forEach((get_node, i) => {
      Object.keys(check_data.layout[i]).forEach(key => {
        if (key.indexOf(document.getElementById("container_list").value) > -1) {
          $("#modify_arguments").val(check_data.layout[i][document.getElementById("container_list").options[document.getElementById("container_list").selectedIndex].value]);
        }
      });
    });

    var container_heartbeat_fieldset = document.getElementsByName("container_heartbeat_fieldset");

    Object.keys(check_data.container_host_constraints).forEach((get_node, i) => {
      Object.keys(check_data.container_host_constraints[i]).forEach(key => {
        const analyze = check_data.container_host_constraints[i][key].split(",");
        if (document.getElementById("container_list").value.indexOf(analyze[0]) > -1) {

          container_heartbeat_fieldset.forEach(function(node, z) {
            var current = container_heartbeat_fieldset[z].value;

            if (analyze.indexOf(current) > -1) {
              container_heartbeat_fieldset[z].click();
            }
          });
        }
      });
    });
  });

}

//[ ] TODO: refactor for efficiency and clarity
function get_functions() {
  if (parent.manage_function && parent.manage_function_uuid) {
    var option = '<option value="' + parent.manage_function_uuid + '">' + parent.manage_function + '</option>';
    $('#function_list').append(option);
    parent.manage_function = '';
    parent.manage_function_uuid = '';
  } else {
    // TODO: refactor reference to /nodes handle to use /api/host/info
    $.get("/nodes?token=" + parent.token, function(data) {
      for (var i in data.functions.name) {
        if (data.functions.name[i].name) {
          option += '<option value="' + data.functions.name[i].uuid + '">' + data.functions.name[i].name + '</option>';
        }
      }
      $('#function_list').append(option);
    });
  }
}

//[ ] TODO: refactor for efficiency and clarity
function generate_log_status(anchor) {
  $.get("/log?token=" + parent.token, function (data) {
    var output = data.replace(/(?:\r\n|\r|\n)/g, "<br />");
    $(anchor).val(data);
  });
}

//[ ] TODO: refactor for efficiency and clarity
function generate_op_clean(anchor) {
  $.get("/prune?token=" + parent.token, function (data) {
    var div = document.getElementById(anchor);
    div.innerHTML = data.replace(/(?:\r\n|\r|\n)/g, "<br />");
  });
}

//[ ] TODO: refactor for efficiency and clarity
function generate_op_elasticsearch(anchor) {
  var radio_add = $("input[id=radio_add]:checked").val();
  var radio_delete = $("input[id=radio_delete]:checked").val();
  var radio_kibana = $("input[id=radio_kibana]:checked").val();
  var elasticsearch_url = $("#es_url").val();
  var kibana_url = $("#kibana_url").val();
  var path = "/elasticsearch";
  if (path) {
    if (radio_add) {
      $.post(path, {
        token: parent.token,
        elasticsearch_url,
        "mode": "add"
      }, function(data) {
        var div = document.getElementById(anchor);
        div.innerHTML = "<label id=\"windowfont\"> Sent request to the server. Please check the logs for updated information.<br><br>\n" + data;
      });
    } else if (radio_kibana) {
      $.post(path, {
        token: parent.token,
        "elasticsearch_url": kibana_url,
        "mode": "kibana"
      }, function(data) {
        var div = document.getElementById(anchor);
        div.innerHTML = "<label id=\"windowfont\"> Sent request to the server. Please check the logs for updated information.<br><br>\n" + data;
      });
    } else if (radio_delete) {
      $.post(path, {
        token: parent.token,
        elasticsearch_url,
        "mode": "delete"
      }, function(data) {
        var div = document.getElementById(anchor);
        div.innerHTML = "Sent request to the server. Please check the logs for updated information.<br><br>\n" + data.replace(/(?:\r\n|\r|\n)/g, '<br />');
      });
    } else {
      alert("Error, you did not select an operation.")
      output_modal.style.display = "none";
      modal.style.display = "block";
    }
  }
}

//[ ] TODO: refactor for efficiency and clarity
function generate_op_exec() {
  var node_list = document.getElementById("node_list");
  var command_list = document.getElementById("command_list");
  var path = "/exec";
  var node = node_list.options[node_list.selectedIndex].value;
  var saved_command = command_list.options[command_list.selectedIndex].value;
  var command = "";

  // FIXME: refactor ternary into a variable assignment ternary
  (saved_command.indexOf("Choose") > -1) ? command = $("#command_entry").val() : command = saved_command;

  if (!command) {
    output_modal.style.display = "none";
    modal.style.display = "block";
  } else {
    $.post(path, {
      token: parent.token,
      command: command,
      node: node
    }, function(data) {
      $("#exec_output").val($("#exec_output").val() + "\n" + data + "\n");
    });
  }
}

//[ ] TODO: refactor for efficiency and clarity
function generate_op_heartbeat(anchor) {
  $.get("/heartbeat?token=" + parent.token, function (data) {
    var div = document.getElementById(anchor);
    div.innerHTML = "\nSent request to do a manual heartbeat. Check the logs for the latest information." + data;
  });
}

//[ ] TODO: refactor for efficiency and clarity
function generate_op_exec(command, callback) {
  var node;
  callback = !callback ? function () {} : callback;

  $.post('/exec', {
    token: parent.token,
    command: command,
    node: node
  }, callback);
}

//[ ] TODO: refactor for efficiency and clarity
function generate_op_exec_init() {
  var node_list = document.getElementById("node_list");
  node = node_list.options[node_list.selectedIndex].value;
  var term = $('#terminal').terminal(function (command) {
    var _this = this;
    command !== '' ? (
      generate_op_exec(command, function (output) {
        _this.echo(output);
      })
    ) : (
      this.echo('')
    );
  }, {
    greetings: '> Connecting to terminal on node ' + node +
      '. There will be a short delay when returning each command output.\n',
    prompt: 'λ ',
    wrap: true
  });

  generate_op_exec('uptime', function (output) {
    term.echo(output);
  });
}

//[ ] TODO: refactor for efficiency and clarity
function generate_op_rsyslog() {
  $.get("/rsyslog?token=" + parent.token, function(data) {
    //	var output = data.replace(/(?:\r\n|\r|\n)/g, '<br />');
    if ($('#query').val()) {
      var search_string = $('#query').val();
      var modified_data = data.split("\n");
      var search_output = "";

      for (i = 0; i != modified_data.length; i++) {
        if (modified_data[i].toLowerCase().indexOf(search_string.toLowerCase()) > -1) {
          search_output += "\n" + modified_data[i];
        }
      }

      $("#command_output").val(search_output);
    } else {
      $("#command_output").val(data);
    }
  });
}

//[ ] TODO: refactor for efficiency and clarity
function generate_op_syslog() {
  $.get("/syslog?token=" + parent.token, function(data) {
    //	var output = data.replace(/(?:\r\n|\r|\n)/g, '<br />');
    if ($('#query').val()) {
      var search_string = $('#query').val();
      var modified_data = data.split("\n");
      var search_output = "";

      for (i = 0; i != modified_data.length; i++) {
        if (modified_data[i].toLowerCase().indexOf(search_string.toLowerCase()) > -1) {
          search_output += "\n" + modified_data[i];
        }
      }

      $("#command_output").val(search_output);
    } else {
      $("#command_output").val(data);
    }
  });
}

//[ ] TODO: refactor for efficiency and clarity
function search(day, id) {
  var day_check = moment().format("D");
  var date = day_check.length > 1 ? moment().format("MMM D") : moment().format("MMM  D");

  day.indexOf("today") > -1 ? $("#query").val(date) : $("#query").val(day);
  generate_op_rsyslog();
  document.getElementById(id).checked = false;
};

//[ ] TODO: refactor for efficiency and clarity
function window_reloader(anchor, callback) {
  setTimeout(() => {
    callback(anchor);
    window_reloader(anchor, callback);
  }, 15000);
}

//[ ] TODO: refactor for efficiency and clarity
function link_image(image) {
  parent.manage_image = image;
}

//[ ] TODO: refactor for efficiency and clarity
function link_function(function_value, uuid) {
  parent.manage_function = function_value;
  parent.manage_function_uuid = uuid;
}

//[ ] TODO: refactor for efficiency and clarity
function clearAuth() {
  document.getElementById('imageauth-user').value = "";
  document.getElementById('imageauth-password').value = "";
}

//[ ] TODO: refactor for efficiency and clarity
function checkAll(checkbox) {
  var checked = checkbox.checked;
  var checkboxes = document.getElementsByName('node_list');

  checkboxes.forEach(function(e) {
    e.checked = checked;
  });
}

//[ ] TODO: refactor for efficiency and clarity
function config_placeholder(data) {
  var config = data[0];

  $("#dockerfile_path").attr("placeholder", config.dockerfile_path);
  $("#tls_enable").attr("placeholder", config.tls_enable);
  $("#tls_self_signed").attr("placeholder", config.tls_self_signed);
  $("#tls_key_path").attr("placeholder", config.tls_key_path);
  $("#tls_cert_path").attr("placeholder", config.tls_cert_path);
  $("#heartbeat_interval").attr("placeholder", config.heartbeat_interval);
  $("#conf_syslog").attr("placeholder", config.syslog);
  $("#theme").attr("placeholder", config.theme);
  $("#session_secret").text(config.session_secret);
}

/* TODO: Refactor into link generation engine
    function build_doc_links() {
      var output = '';

      $.get("/api/docs/list", function(doc_list) {
        for (var i in doc_list) {
          output += "$('#doc'" + i + ").click(function() { $('iframe_a').load('/docs.html?doc_id=doc'" + i + ") });";
        }
      });

      return output;
    }

    function build_docs_nav_menu() {
      var output = '';
      output += '<ul class="dropdown">';

      $.get("/api/docs/list", function(doc_list) {
        for (var i in doc_list) {
          var doc_id = "doc" + i;
          $("<li><a href='#' id='" + doc_id + "' onclick='stinky_linker(\"" + doc_id + "\")'>" + doc_list[i] + "</a></li>").appendTo("#nav_docs > ul");
        }
      });

      output += '</ul>';
      $('#nav_docs').append(output);
    }

    function stinky_linker(doc_id) {
      $('#content').load('/docs.html?doc_id=' + doc_id);
    }
*/
