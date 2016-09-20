var PlotPage = 1; // 0 : PageStatistic, 1 : PageGraphic

function PlotPageGraphic(csvArray) {
    var events = GetEvents(csvArray);
    if (events.length == 0) return;
    var clots = GetClots(events);

    var share = new ShareData();
    SetDataBySession(share);
    SetRange(events, share);

    var controller = new BarController(events, share);
    var graph_bar = new BarGraph(events, clots, share);
    var graph_comm = new LineGraph(events, 0, share);
    var graph_calc = new LineGraph(events, 1, share);
    var graph_hwpc0 = new LineGraph(events, 2, share);
    var graph_hwpc1 = new LineGraph(events, 3, share);
    var graph_hwpc2 = new LineGraph(events, 4, share);
    var graph_hwpc3 = new LineGraph(events, 5, share);

    controller.Plot();
    graph_bar.Show(true, 1000, 300);
    graph_comm.Show(share.pane_comm, 1000, 200);
    graph_calc.Show(share.pane_calc, 1000, 200);
    graph_hwpc0.Show(share.pane_hwpc0, 1000, 200);
    graph_hwpc1.Show(share.pane_hwpc1, 1000, 200);
    graph_hwpc2.Show(share.pane_hwpc2, 1000, 200);
    graph_hwpc3.Show(share.pane_hwpc3, 1000, 200);
    GetCSVFile("input_mpi.csv", PlotMatrix, share);

    // ボタンにイベントのON/OFFを反映
    document.getElementById("button_comm").className = g_counters[0].unuse ? 'button_graph_gray' : share.pane_comm ? 'button_graph_on' : 'button_graph';
    document.getElementById("button_calc").className = g_counters[1].unuse ? 'button_graph_gray' : share.pane_calc ? 'button_graph_on' : 'button_graph';
    document.getElementById("button_hwpc0").className = g_counters[2].unuse ? 'button_graph_gray' : share.pane_hwpc0 ? 'button_graph_on' : 'button_graph';
    document.getElementById("button_hwpc1").className = g_counters[3].unuse ? 'button_graph_gray' : share.pane_hwpc1 ? 'button_graph_on' : 'button_graph';
    document.getElementById("button_hwpc2").className = g_counters[4].unuse ? 'button_graph_gray' : share.pane_hwpc2 ? 'button_graph_on' : 'button_graph';
    document.getElementById("button_hwpc3").className = g_counters[5].unuse ? 'button_graph_gray' : share.pane_hwpc3 ? 'button_graph_on' : 'button_graph';

    // ボタンにイベントを割り当て
    document.getElementById("button_statistic_page").onclick = function () {
        PostData(share, "/statistic.html");
    }
    document.getElementById("button_reset_time").onclick = function () {
        share.range_select = share.range_active = share.range_limit;
        PostData(share);
    }
    document.getElementById("button_reset_view").onclick = function () {
        graph_bar.Reset();
        graph_comm.Reset();
        graph_calc.Reset();
        graph_hwpc0.Reset();
        graph_hwpc1.Reset();
        graph_hwpc2.Reset();
        graph_hwpc3.Reset();
        share.updater.Run();
    }

    document.getElementById("button_comm").onclick = function () {
        if (g_counters[0].unuse) return;
        share.pane_comm = !share.pane_comm;
        this.className = share.pane_comm ? 'button_graph_on' : 'button_graph';
        graph_comm.Show(share.pane_comm);
    }

    document.getElementById("button_calc").onclick = function () {
        if (g_counters[1].unuse) return;
        share.pane_calc = !share.pane_calc;
        this.className = share.pane_calc ? 'button_graph_on' : 'button_graph';
        graph_calc.Show(share.pane_calc);
    }

    document.getElementById("button_hwpc0").onclick = function () {
        if (g_counters[2].unuse) return;
        share.pane_hwpc0 = !share.pane_hwpc0;
        this.className = share.pane_hwpc0 ? 'button_graph_on' : 'button_graph';
        graph_hwpc0.Show(share.pane_hwpc0);
    }

    document.getElementById("button_hwpc1").onclick = function () {
        if (g_counters[3].unuse) return;
        share.pane_hwpc1 = !share.pane_hwpc1;
        this.className = share.pane_hwpc1 ? 'button_graph_on' : 'button_graph';
        graph_hwpc1.Show(share.pane_hwpc1);
    }

    document.getElementById("button_hwpc2").onclick = function () {
        if (g_counters[4].unuse) return;
        share.pane_hwpc2 = !share.pane_hwpc2;
        this.className = share.pane_hwpc2 ? 'button_graph_on' : 'button_graph';
        graph_hwpc2.Show(share.pane_hwpc2);
    }

    document.getElementById("button_hwpc3").onclick = function () {
        if (g_counters[5].unuse) return;
        share.pane_hwpc3 = !share.pane_hwpc3;
        this.className = share.pane_hwpc3 ? 'button_graph_on' : 'button_graph';
        graph_hwpc3.Show(share.pane_hwpc3);
    }

    PlotSubView();

    function PlotMatrix(csvArray, share) {
        var matrix_comm = new Matrix(csvArray, share);
        share.updater.Add(matrix_comm.Update);
        matrix_comm.Update();
    }

    function PlotSubView() {
        if (share.label_select == null || share.time_select == null || share.rank_select == null) return;
        var event;
        for (var i = 0; i < events.length; i++) {
            if (share.rank_select != events[i].rank) continue;
            if (share.label_select != events[i].property.label) continue;
            if (events[i].time[0] <= share.time_select && share.time_select <= events[i].time[1]) {
                event = events[i];
                break;
            }
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
