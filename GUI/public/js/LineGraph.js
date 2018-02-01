LineGraph = function (events, type_graph, share) {
    // 幅（ Width ）と高さ（ height ）
    var width = 1400;
    var height = 400;
    var PADDING = 35;
    var show = true;
    var size_font = 18;
    var num_rank = d3.max(events, function (d) { return d.rank; }) + 1;

    share.updater.Add(Update);
    this.Width = function (w) { width = w; };
    this.Height = function (h) { height = h; };
    this.Show = Show;
    this.Update = Update;
    this.Reset = ResetRangeY;

    var counter = g_counters[type_graph];

    var vertical_axis_label = counter.name + " " + counter.unit;
    var elementId = "graph_line" + String(type_graph);

    var lines = GetLines(events, type_graph);

    var measure = new Measure(elementId)

    var clots = [];
    var range_y = [];
    var limit_range_y = [];
    limit_range_y[0] = d3.min(lines, function (l) { return d3.min(l, function (p) { return p.value; }) });
    limit_range_y[1] = d3.max(lines, function (l) { return d3.max(l, function (p) { return p.value; }) });
    ResetRangeY();
    var temp;

    function Plot() {
        let processSettingList = getProcessSettingList();

        // スケール関数の生成
        var xScale = d3.scaleLinear()
            .domain(share.range_select)
            .range([0, width - PADDING * 2]);

        var yScale = d3.scaleLinear()
            .domain(range_y)
            .range([height - PADDING, PADDING]);

        var xScaleInv = d3.scaleLinear()
            .domain([0, width - PADDING * 2])
            .range(share.range_select);

        var yScaleInv = d3.scaleLinear()
            .domain([height - PADDING, PADDING])
            .range(range_y);

        var zoom = d3.zoom()
            .on("zoom", Zoom);

        var drag = d3.drag()
            .on("start", DragStart)
            .on("drag", Drag)
            .on("end", DragEnd);

        // SVG 要素の生成
        var svg = d3.select("#" + elementId)
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        svg.append("text")
            .text(vertical_axis_label)
            .attr("x", PADDING / 2)
            .attr("y", (PADDING + size_font) / 2)
            .on("contextmenu", function (d, i) {
                d3.event.preventDefault();
                ClickRight(d, i);
            })
            .append("svg:title")
            .text("To show Edit Dialog, right-click on this.");

        svg.append("text")
            .text("sec")
            .attr("x", width - size_font * 3 / 2)
            .attr("y", height - PADDING + size_font / 2);

        // 折れ線グラフエリアの生成
        var graph = svg.append("svg")
            .attr("x", PADDING)
            .attr("y", PADDING)
            .attr("width", width - PADDING * 2)
            .attr("height", height - PADDING * 2)
            .call(drag)
            .call(zoom)
            .on("contextmenu", function (d, i) {
                d3.event.preventDefault();
            });

        // Make back screen to get event
        graph.append("g")
            .append("rect")
            .attr("width", width - PADDING * 2)
            .attr("height", height - PADDING * 2)
            .attr("fill", "white")
            .attr("opacity", 0);

        var line = d3.line()
            .x(function (d) { return xScale(d.time); })
            .y(function (d) { return yScale(d.value) - PADDING; })
            .curve(d3.curveStepAfter);

        // 棒グラフエリアの生成
        graph.call(zoom);

        graph.append("g")
            .selectAll("g")
            .data(lines)
            .enter()
            .append("path")
            .attr("stroke", function (d, i) {
                return processSettingList[i].color;
            })
            .style("stroke-width", 3)
            .datum(function (d, i) {
                if (processSettingList[i].selected) {
                    return lines[i];
                } else {
                    // filter メソッドにインデックス誤るバグがあるため、
                    // filter機能を仮実装
                    return [];
                }
            })
            .attr("class", "line")
            .attr("d", line)
            .on("contextmenu", function (d, i) {
                d3.event.preventDefault();
                Click(d, i);
            });

        if (share.rank_select != null && processSettingList[share.rank_select].selected) {
            graph.append("path")
                .datum(lines[share.rank_select])
                .attr("class", "line")
                .attr("d", line)
                .attr("stroke", function (d, i) {
                    return processSettingList[share.rank_select].color;
                })
                .style("stroke-width", 5);
        }

        // TODO ラベルの生成
        // var texts = svg.append("g");

        // X 軸の定義
        var xAxis = d3.axisBottom(xScale)
            .ticks(20);

        // Y 軸の定義
        var yAxis = d3.axisLeft(yScale)
            .ticks(5, "s");

        // X 軸の生成
        svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + PADDING + "," + (height - PADDING) + ")")
            .call(xAxis);

        // Y 軸の生成
        svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + PADDING + ",0)")
            .call(yAxis);

        measure.Update(svg);

        function Zoom() {
            if (d3.event.sourceEvent.type == "wheel") {
                var mousePos = d3.mouse(this);
                var speed = 1.1;
                var scale = (d3.event.sourceEvent.deltaY > 0) ? (1 / speed) : speed;
                share.range_select[0] = Math.max(share.range_select[0] * scale + xScaleInv(mousePos[0]) * (1 - scale), share.range_active[0]);
                share.range_select[1] = Math.min(share.range_select[1] * scale + xScaleInv(mousePos[0]) * (1 - scale), share.range_active[1]);
            }
            share.updater.Run();
        }

        var mousePosStart;
        function DragStart() {
            if (d3.event.sourceEvent.type == "mousedown" && d3.event.sourceEvent.button == 0) {
                d3.event.sourceEvent.stopPropagation();
                mousePosStart = d3.mouse(document.getElementById(elementId));
                measure.SVG(svg);
                measure.Show(true, width, height);
            }
        }

        function Drag() {
            measure.Update();
        }

        function DragEnd() {
            if (d3.event.sourceEvent && d3.event.sourceEvent.type == "mouseup" && d3.event.sourceEvent.button == 0) {
                measure.Show(false);
                var mousePos = d3.mouse(document.getElementById(elementId));
                if (Math.abs(mousePosStart[0] - mousePos[0]) + Math.abs(mousePosStart[1] - mousePos[1]) < 1) return;
                if (Math.abs(mousePosStart[0] - mousePos[0]) < Math.abs(mousePosStart[1] - mousePos[1])) {
                    range_y[0] = yScaleInv(Math.max(mousePosStart[1], mousePos[1]));
                    range_y[1] = yScaleInv(Math.min(mousePosStart[1], mousePos[1]));
                    Update();
                } else {
                    share.range_active[0] = xScaleInv(Math.min(mousePosStart[0], mousePos[0]) - PADDING);
                    share.range_active[1] = xScaleInv(Math.max(mousePosStart[0], mousePos[0]) - PADDING);
                    share.range_select[0] = share.range_active[0];
                    share.range_select[1] = share.range_active[1];
                    PostData(share);
                }
            }
        }

        function Click(d, r) {
            share.rank_select = r;
            var event;
            var mousePos = d3.mouse(document.getElementById(elementId));
            var time_select = xScaleInv(mousePos[0] - PADDING);
            for (var i = 0; i < events.length; i++) {
                if (events[i].rank == r && events[i].time[0] <= time_select && time_select <= events[i].time[1]) {
                    event = events[i];
                }
            }
            UpdatePropertyOfEvent(event);
            share.label_select = event.property.label;
            share.time_select = time_select;

            if (!share.updater) return;
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
                    if (clots[i] == clot) {
                        dataset.push({ value: sum, clot: clots[i], opacity: 1.0 });
                    } else {
                        dataset.push({ value: sum, clot: clots[i], opacity: 0.5 });
                    }
                }
            }

            var histogram = new Histogram(dataset, clot, share)
            histogram.Show(true, 350, 300);
            share.rank_select = event.rank;
            share.updater.Run();
        }
    }

    function Show(s, w, h) {
        show = s;
        if (w != null && h != null) {
            width = w;
            height = h;
        }
        Update();
    }

    function Update() {
        Clear();
        if (show) {
            Plot();
        }
    }

    function Clear() {
        d3.select("#" + elementId)
            .selectAll("svg")
            .remove();
    }

    function ClickRight(d, i) {
        var dialog = new GraphEdit(range_y, limit_range_y, vertical_axis_label, Update);
        dialog.Show();
    }

    function ResetRangeY() {
        range_y = [limit_range_y[0], limit_range_y[1] + (limit_range_y[1] - limit_range_y[0]) / 10];
    }
}

function GetLines(events, type) {
    var lines = [];
    var num_rank = d3.max(events, function (d) { return d.rank; }) + 1;
    for (var i = 0; i < num_rank; i++) {
        lines.push([])
    }
    var stack = []; var last = -1;
    var rank = -1;
    // solve value
    for (var i = 0; i < events.length; i++) {
        if (events[i].property.counter.id != type) continue;

        if (rank != events[i].rank) {
            rank = events[i].rank;
            PopAll();
        }

        if (last < 0) {
            Push(events[i]);
        } else {
            if (events[i].time[0] <= stack[last].time[1]) {
                Push(events[i]);
            } else {
                while (0 <= last && stack[last].time[1] < events[i].time[0]) {
                    Pop();
                }
                Push(events[i]);
            }
        }

    }
    PopAll();

    for (var i = 0; i < lines.length; i++) {
        if (lines[i].length > 0) {
            lines[i].sort(function (a, b) {
                if (a.time < b.time) return -1;
                if (a.time > b.time) return 1;
                return 0;
            });
            // Set First point for appearance.
            lines[i].unshift({ time: lines[i][0].time, value: 0 });
        }
    }

    return lines;

    function Push(element) {
        if (element.property.excl) {
            stack.push(element)
            last++;
        }
    }

    function Pop() {
        element = stack.pop();
        last--;
        if (last < 0) {
            lines[element.rank].push({ time: element.time[0], value: element.value });
            lines[element.rank].push({ time: element.time[1], value: 0 });
        } else {
            lines[element.rank].push({ time: element.time[0], value: element.value });
            lines[element.rank].push({ time: element.time[1], value: stack[last].value });
        }
    }

    function PopAll() {
        while (0 <= last) {
            Pop();
        }
    }

}
