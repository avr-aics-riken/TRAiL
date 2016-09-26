var PlotPage = 0; // 0 : PageStatistic, 1 : PageGraphic
function InitPage() {
    SetPathCSV();
}

function PlotPageStatistic(csvArray) {
    var events = GetEvents(csvArray);
    if (events.length == 0) return;
    var clots = GetClots(events)

    var share = new ShareData();
    SetDataBySession(share);
    SetRange(events, share);

    var controller = new BarController(events, share);
    var graph_box = new BoxGraph(clots, events, share);

    controller.Plot();
    graph_box.Show(true, 1000, 700);

    // ボタンにイベントを割り当て
    document.getElementById("button_graphic_page").onclick = function () {
        PostData(share, "/graphic.html");
    }
    PlotSubView();

    function PlotSubView() {
        if (share.label_select == null || share.time_select == null) return;
        var clot;
        for (var i = 0; i < clots.length; i++) {
            if (share.label_select != clots[i][0].property.label) continue;
            for (var j = 0; j < clots[i].length; j++) {
                if (clots[i][j].time[0] <= share.time_select && share.time_select <= clots[i][j].time[1]) {
                    clot = clots[i];
                    break;
                }
            }
        }
        UpdatePropertyOfClot(clot);
        var local = new ShareData();
        local.range_limit = [share.range_limit[0], share.range_limit[1]];
        local.range_active[0] = d3.min(clot, function (d) { return d.time[0]; });
        local.range_active[1] = d3.max(clot, function (d) { return d.time[1]; });
        local.range_select = [local.range_active[0], local.range_active[1]];
        var graph_bar = new BarGraph(clot, null, local);
        graph_bar.Show(true, 350, 300);

        var dataset = [];
        for (var i = 0; i < clots.length; i++) {
            if (clot[0].property.label == clots[i][0].property.label) {
                var sum = d3.sum(clots[i], function (event) { return event.time[1] - event.time[0]; });
                dataset.push({ value: sum, clot: clots[i] });
            }
        }
        var histogram = new Histogram(dataset, clot, share)
        histogram.Show(true, 350, 300);
    }
}
