function GetCSVFile(path, CallBack, data) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
        CreateArray(xhr.responseText);
    };

    // Be sure to get for IE
    xhr.open("post", path, true);
    xhr.send(null);

    function CreateArray(csvData) {
        var tempArray = csvData.split("\n");
        var csvArray = [];
        for (var i = 0; i < tempArray.length; i++) {
            csvArray[i] = tempArray[i].split(",");
            if (csvArray[i].length == 0) {
                csvArray[i] = [tempArray[i]];
            }
        }

        CallBack(csvArray, data);
    }
}

function UpdatePropertyOfClot(clot) {
    var div = d3.select("#property");
    div.selectAll("p")
        .remove();

    if (clot != null) {
        div.append("p")
            .text("Label : " + clot[0].property.label);

        var time = [];
        time[0] = d3.min(clot, function (d) { return d.time[0]; });
        time[1] = d3.max(clot, function (d) { return d.time[1]; });

        div.append("p")
            .text("Extent Time Cost : " + (time[1] - time[0]).toFixed(3) + " [sec]");
    }
}

function UpdatePropertyOfEvent(event) {
    var div = d3.select("#property");
    div.selectAll("p")
        .remove();

    if (event != null) {
        div.append("p")
            .text("Label : " + event.property.label);

        div.append("p")
            .text("Rank : " + event.rank);

        div.append("p")
            .text("Time Cost : " + (event.time[1] - event.time[0]).toFixed(3) + " [sec]");

        div.append("p")
            .text(event.property.counter.name + " : " + d3.format(".3s")(event.value) + " " + event.property.counter.unit);
    }
}

var g_counters = GetDefaltCounter();
function GetEvents(csvArray) {
    var propertys = [];
    var events = [];

    var state = 0;
    for (var i = 0; i < csvArray.length; i++) {
        var csv = csvArray[i]
        if (csv[0] == "") continue;
        if (csv[0].search(/<head>/) != -1) {
            state = 1;
            continue;
        } else if (csv[0].search(/<DefFunction>/) != -1) {
            state = 2;
            continue;
        } else if (csv[0].search(/<DefCounter>/) != -1) {
            state = 3;
            continue;
        } else if (csv[0].search(/<Event>/) != -1) {
            state = 4;
            continue;
        }

        if (state == 1) {
            SetFileSummary(Number(csv[2]) - Number(csv[1]), Number(csv[3]), Number(csv[0]))
        } else if (state == 2) {
            var id = Number(csv[2]);
            if (g_counters[id] == null) {
                g_counters[id] = new Counter(id, "undefine", "undefine");
            }
            propertys[Number(csv[0])] = new Property(csv[1], csv[3], g_counters[id]);
        } else if (state == 3) {
            var id = Number(csv[0]);
            if (0 <= id && id <= 5) {
                g_counters[id].Set(id, csv[1], csv[2]);
            } else {
                g_counters[id] = new Counter(id, "undefine", "undefine");
            }
        } else if (state == 4) {
            events.push(new Event(propertys[Number(csv[0])], csv));
        }
    }

    // event sort by rank and time
    if (events.length == 0) return events;
    events.sort(function (a, b) {
        if (a.rank < b.rank) return -1;
        if (a.rank > b.rank) return 1;
        if (a.time[0] < b.time[0]) return -1;
        if (a.time[0] > b.time[0]) return 1;
        return 0;
    });
    return events;
}

function GetDefaltCounter() {
    var counters = [];
    counters[0] = new Counter(0, "Communication", "[Byte/sec]");
    counters[1] = new Counter(1, "Calculation", "[Flops]");
    counters[2] = new Counter(2, "HWPC BANDWIDTH", "[Byte/sec]");
    counters[3] = new Counter(3, "HWPC FLOPS", "[Flops]");
    counters[4] = new Counter(4, "HWPC VECTOR", "[SIMD rate]");
    counters[5] = new Counter(5, "HWPC CACHE", "[Hit rate]");
    return counters;
}


function SetDataBySession(share) {
    share.file_name = session.file_name;
    if (session.range_active.length == 2) {
        share.range_active = session.range_active;
    }
    if (session.range_select.length == 2) {
        share.range_select = session.range_select;
    }
    if (session.label_select != null) {
        share.label_select = session.label_select;
    }
    if (session.time_select != null) {
        share.time_select = session.time_select;
    }
    if (session.rank_select != null) {
        share.rank_select = session.rank_select;
    }
    share.show_line = session.show_line;
}

function SetRange(events, share) {
    share.range_limit = new Array(2);
    share.range_limit[0] = d3.min(events, function (d) { return d.time[0]; });
    share.range_limit[1] = d3.max(events, function (d) { return d.time[1]; });

    if (share.range_active.length == 0) {
        share.range_active = [share.range_limit[0], share.range_limit[1]];
    }

    if (share.range_select.length == 0) {
        share.range_select = [share.range_active[0], share.range_active[1]];
    }
    TrimRange(share);
}

function TrimRange(share) {
    if (share.range_limit[1] < share.range_limit[0]) {
        var temp = share.range_active[0];
        share.range_limit[0] = share.range_limit[1];
        share.range_limit[1] = temp;
    }
    if (share.range_active[1] < share.range_active[0]) {
        var temp = share.range_active[0];
        share.range_active[0] = share.range_active[1];
        share.range_active[1] = temp;
    }
    if (share.range_select[1] < share.range_select[0]) {
        var temp = share.range_select[0];
        share.range_select[0] = share.range_select[1];
        share.range_select[1] = temp;
    }
    share.range_active[0] = Math.max(share.range_active[0], share.range_limit[0]);
    share.range_active[1] = Math.min(share.range_active[1], share.range_limit[1]);
    share.range_select[0] = Math.max(share.range_select[0], share.range_active[0]);
    share.range_select[1] = Math.min(share.range_select[1], share.range_active[1]);
}

function PostData(share, path) {
    path = path || "";

    var form = document.createElement("form");
    form.setAttribute("method", "post");
    form.setAttribute("action", path);

    var hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", "share_str");
    hiddenField.setAttribute("value", JSON.stringify(share));

    form.appendChild(hiddenField);

    document.body.appendChild(form);
    form.submit();
}

function SetFileSummary(time, num_event, num_rank)
{
    var div = d3.select("#file_summary");
    div.append("p")
        .text("File Summary");

    // Create table
    var table = div.append("table").attr("border", "1");
    var trows = table
        .selectAll("tr")
        .data([null, null, null])
        .enter()
        .append("tr");

    trows.data(["Total Time", "Number of Section", "Number of Rank"])
        .append("th")
        .style("text-align", "right")
        .text(function (d) { return d });

    var RATE_TIME = 20000000
    inputs = trows.data([time / RATE_TIME, num_event, num_rank])
        .append("td")
        .text(function (d) {
            return d;
        });
}
