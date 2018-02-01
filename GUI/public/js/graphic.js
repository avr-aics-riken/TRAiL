var PlotPage = 1; // 0 : PageStatistic, 1 : PageGraphic
function InitPage() {
    SetPathCSV();
    document.getElementById("file_csv").onchange = function () {
        document.getElementById("form_file").submit();
    }
}

function PlotPageGraphic(csvArray) {
    var events = GetEvents(csvArray);
    if (events.length == 0) return;
    var clots = GetClots(events);

    let rankMax = d3.max(events, event => { return event.rank; });
    setProcessCount(rankMax + 1);
    setDefaultProcessSettingList();

    var share = new ShareData();
    SetDataBySession(share);
    SetRange(events, share);

    var controller = new BarController(events, share);
    var graph_bar = new BarGraph(events, clots, share);

    controller.Plot();
    graph_bar.Show(true, 1000, 300);

    const NUM_GRAPH_LINE = 6;
    var graph_line = new Array();
    for (var i = 0; i < NUM_GRAPH_LINE; i++) {
        graph_line.push(new LineGraph(events, i, share));
        if (g_counters[i].unuse) {
            share.show_line[i] = false;
        }
        graph_line[i].Show(share.show_line[i], 1000, 200);
    }

    var id_buttom = ["button_comm", "button_calc", "button_hwpc0", "button_hwpc1", "button_hwpc2", "button_hwpc3"];
    for (var i = 0; i < NUM_GRAPH_LINE; i++) {
        // ボタンにイベントのON/OFFを反映
        document.getElementById(id_buttom[i]).className = g_counters[i].unuse ? 'button_graph_gray' : share.show_line[i] ? 'button_graph_on' : 'button_graph';

        // ボタンにイベントを割り当て
        d3.select("#" + id_buttom[i])
            .data([i])
            .on("click", OnButton);

        function OnButton(i) {
            if (g_counters[i].unuse) return;
            share.show_line[i] = !share.show_line[i];
            this.className = share.show_line[i] ? 'button_graph_on' : 'button_graph';
            graph_line[i].Show(share.show_line[i]);
        }
    }

    // ボタンにイベントを割り当て
    document.getElementById("button_statistic_page").onclick = function () {
        PostData(share, "/statistic.html");
    }

    PlotSubView();

    GetCSVFile("input_mpi.csv", PlotMatrix, share);

    var dialog = new SettingDialog(share.updater);
    document.getElementById("settingButton").onclick = function () {
        dialog.Show();
    }

    function PlotMatrix(csvArray, share) {
        var matrix_comm = new Matrix(csvArray, share);
        share.updater.Add(matrix_comm.Update);
        matrix_comm.Update();
    }

    function PlotSubView() {
        if (share.label_select == null || share.time_select == null || share.rank_select == null) return;
        var event = null;
        for (var i = 0; i < events.length; i++) {
            if (share.rank_select != events[i].rank) continue;
            if (share.label_select != events[i].property.label) continue;
            if (events[i].time[0] <= share.time_select && share.time_select <= events[i].time[1]) {
                event = events[i];
                break;
            }
        }

        if (event == null) {
            return;
        }

        UpdatePropertyOfEvent(event);
        share.label_select = event.property.label;
        share.time_select = (event.time[0] + event.time[1]) / 2;
        share.rank_select = event.rank;

        if (clots.length == 0) {
            clots = GetClots(events);
        }
        var clot;
        for (var i = 0; i < clots.length; i++) {
            for (var j = 0; j < clots[i].length; j++) {
                if (clots[i][j] == event) {
                    clot = clots[i];
                    break;
                }
            }
        }

        var dataset = [];
        for (var i = 0; i < clots.length; i++) {
            if (event.property.label == clots[i][0].property.label) {
                var sum = d3.sum(clots[i], function (event) { return event.time[1] - event.time[0]; });
                dataset.push({ value: sum, clot: clots[i] });
            }
        }

        var histogram = new Histogram(dataset, clot, share)
        histogram.Show(true, 350, 300);
        share.updater.Run();
    }
}
