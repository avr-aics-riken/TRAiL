BarGraph = function (events, clots, share) {
    // 幅（ width ）と高さ（ height ）
    var width = 1400;
    var height = 400;
    var PADDING = 35;
    var num_rank = d3.max(events, function (d) { return d.rank; }) + 1;
    var size_font = 18;
    var show = true;

    share.updater.Add(Update);
    this.Width = function (w) { width = w; };
    this.Height = function (h) { height = h; };
    this.Show = Show;
    this.Update = Update;
    this.Reset = ResetRangeY;

    var elementId = "graph_bar";

    var range_y = [];
    ResetRangeY();

    var measure = new Measure(elementId)

    function Plot() {
        // スケール関数の生成
        var xScale = d3.scaleLinear()
            .domain(share.range_select)
            .range([0, width - PADDING * 2]);

        var yScale = d3.scaleLinear()
            .domain([range_y[0], range_y[1]])
            .range([0, height - PADDING * 2]);

        var xScaleInv = d3.scaleLinear()
            .domain([0, width - PADDING * 2])
            .range(share.range_select);

        var yScaleInv = d3.scaleLinear()
            .domain([0, height - PADDING * 2])
            .range([range_y[0], range_y[1]]);

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
            .text("Rank")
            .attr("x", PADDING / 2)
            .attr("y", (PADDING + size_font) / 2);

        svg.append("text")
            .text("sec")
            .attr("x", width - size_font * 3 / 2)
            .attr("y", height - PADDING + size_font / 2);

        // グラフエリアの生成
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

        var height_bar = (height - PADDING * 2) / (range_y[1] - range_y[0]);

        // Draw bar
        graph.append("g")
            .selectAll("rect")
            .data(events)
            .enter()
            .append("rect")
            .filter(function (d) {
                var ret = (share.range_select[0] <= d.time[1]);
                ret &= (d.time[0] <= share.range_select[1]);
                return ret;
            })
            .attr("x", function (d) {
                return xScale(d.time[0]);
            })
            .attr("y", function (d) {
                return yScale(d.rank);
            })
            .attr("width", function (d) {
                return xScale(d.time[1]) - xScale(d.time[0]);
            })
            .attr("height", height_bar)
            .attr("stroke", "none")
            .attr("stroke-width", 1)
            .attr("rx", function (d) {
                return ((height - PADDING * 2) / num_rank * 0.2);
            })
            .attr("ry", function (d) {
                return ((height - PADDING * 2) / num_rank * 0.2);
            })
            .attr("fill", function (d) {
                return d.property.color;
            })
            .on("contextmenu", function (d, i) {
                d3.event.preventDefault();
                Click(d, i);
            });

        // ラベルの生成
        if (height_bar > size_font) {
            graph.append("g")
                .selectAll("text")
                .data(events)
                .enter()
                .append("text")
                .filter(function (d, i) {
                    var size_text = d.property.label.length * size_font / 2;
                    var ret = (xScale(d.time[1]) - xScale(share.range_select[0])) >= size_text;
                    ret &= (xScale(d.time[1]) - xScale(d.time[0])) >= size_text;
                    if (i + 1 < events.length && d.rank == events[i + 1].rank) {
                        ret &= (xScale(events[i + 1].time[0]) - xScale(share.range_select[0])) >= size_text;
                        ret &= (xScale(events[i + 1].time[0]) - xScale(d.time[0])) >= size_text;
                    }
                    return ret;
                })
                .text(function (d) {
                    return d.property.label;
                })
                .attr("x", function (d) {
                    if (share.range_select[0] <= d.time[0]) {
                        return (xScale(d.time[0]) + 5);
                    } else {
                        return (xScale(share.range_select[0]) + 5);
                    }
                })
                .attr("y", function (d) {
                    return yScale(d.rank + 1) - (height_bar - size_font) / 2;
                })
                .attr("fill", "black")
                .on("contextmenu", function (d, i) {
                    d3.event.preventDefault();
                    Click(d, i);
                });
        }

        // X 軸の定義
        var xAxis = d3.axisBottom(xScale)
            .ticks((width - PADDING * 2) / 50);

        // Y 軸の定義
        var yAxis = d3.axisLeft(yScale)
            .ticks(Math.min(range_y[1] - range_y[0], (height - PADDING * 2) / 40));

        // X 軸の生成
        svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + PADDING + "," + (height - PADDING) + ")")
            .call(xAxis);

        // Y 軸の生成
        svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + PADDING + "," + PADDING + ")")
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
                measure.Show(true, width, height);
            }
        }

        function Drag() {
            share.updater.Run();
        }

        function DragEnd() {
            if (d3.event.sourceEvent && d3.event.sourceEvent.type == "mouseup" && d3.event.sourceEvent.button == 0) {
                measure.Show(false);
                var mousePos = d3.mouse(document.getElementById(elementId));
                if (Math.abs(mousePosStart[0] - mousePos[0]) + Math.abs(mousePosStart[1] - mousePos[1]) < 1) return;
                if (Math.abs(mousePosStart[0] - mousePos[0]) < Math.abs(mousePosStart[1] - mousePos[1])) {
                    range_y[0] = yScaleInv(Math.min(mousePosStart[1], mousePos[1]) - PADDING);
                    range_y[1] = yScaleInv(Math.max(mousePosStart[1], mousePos[1]) - PADDING);
                    share.updater.Run();
                } else {
                    share.range_active[0] = xScaleInv(Math.min(mousePosStart[0], mousePos[0]) - PADDING);
                    share.range_active[1] = xScaleInv(Math.max(mousePosStart[0], mousePos[0]) - PADDING);
                    share.range_select[0] = share.range_active[0];
                    share.range_select[1] = share.range_active[1];
                    PostData(share);
                }
            }
        }
    }

    function Show(s, w, h) {
        show = s;
        if (show && w != null && h != null) {
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

    function Click(event, i) {
        UpdatePropertyOfEvent(event);
        share.label_select = event.property.label;
        share.time_select = (event.time[0] + event.time[1]) / 2;
        share.rank_select = event.rank;

        if (PlotPage != 1) return; // 1 : PageGraphic
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

    function ResetRangeY() {
        range_y[0] = d3.min(events, function (d) { return d.rank; });
        range_y[1] = d3.max(events, function (d) { return d.rank; }) + 1;
    }
}
