BarGraph = function (events, clots, share) {
    // 幅（ width ）と高さ（ height ）
    var width = 1400;
    var height = 400;
    var initialHeight = 400;
    var PADDING = 35;
    var num_rank = d3.max(events, function (d) { return d.rank; }) + 1;
    var size_font = 18;
    var show = true;
    var max_height = 40;

    share.updater.Add(Update);
    this.Width = function (w) { width = w; };
    this.Height = function (h) { initialHeight = h; };
    this.Show = Show;
    this.Update = Update;
    this.Reset = ResetRangeY;

    var elementId = "graph_bar";

    //var range_y = [];

    var limit_range_y = d3.extent(events, function (d) { return d.rank; }); limit_range_y[1]++;
    //ResetRangeY();

    var measure = new Measure(elementId)

    function Plot() {
        var selectedProcessList = getSelectedProcessList();
        height = Math.min(selectedProcessList.length * max_height + PADDING * 2, initialHeight);

        // スケール関数の生成
        var xScale = d3.scaleLinear()
            .domain(share.range_select)
            .range([0, width - PADDING * 2]);

        var yScale = d3.scaleLinear()
            .domain([-0.5, selectedProcessList.length - 0.5])
            .range([height - PADDING * 2, 0]);

        var xScaleInv = d3.scaleLinear()
            .domain([0, width - PADDING * 2])
            .range(share.range_select);

        var yScaleInv = d3.scaleLinear()
            .domain([height - PADDING * 2, 0])
            .range([-0.5, selectedProcessList.length - 0.5]);

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
            .attr("y", (PADDING + size_font) / 2)
            // .on("contextmenu", function (d, i) {
            //     d3.event.preventDefault();
            //     ClickRight(d, i);
            // })
            .append("svg:title")
            .text("To show Edit Dialog, right-click on this.");

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

        var marginMaxNum = 10;
        var margin = 1;
        if (marginMaxNum < selectedProcessList.length) {
            margin = 0;
        }
        var height_bar = (height - PADDING * 2) / selectedProcessList.length - margin * 2;
        if (max_height < height_bar) {
            height_bar = max_height;
        }

        // Draw bar
        graph.append("g")
            .selectAll("rect")
            .data(events)
            .enter()
            .append("rect")
            .filter(function (d) {
                if (!selectedProcessList.includes(d.rank)) {
                    return false;
                }
                var ret = (share.range_select[0] <= d.time[1]);
                ret &= (d.time[0] <= share.range_select[1]);
                return ret;
            })
            .attr("x", function (d) {
                return xScale(d.time[0]);
            })
            .attr("y", function (d) {
                var index = selectedProcessList.indexOf(d.rank);
                return yScale(index) - height_bar / 2 - margin;
            })
            .attr("width", function (d) {
                return xScale(d.time[1]) - xScale(d.time[0]);
            })
            .attr("height", height_bar)
            .attr("stroke", "none")
            .attr("stroke-width", 1)
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
                    if (!selectedProcessList.includes(d.rank)) {
                        return false;
                    }
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
                    var index = selectedProcessList.indexOf(d.rank);
                    return yScale(index) + size_font / 2;
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
            .ticks(Math.min(selectedProcessList.length, (height - PADDING * 2) / 40))
            .tickFormat(function (index) { return selectedProcessList[index]; });

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
                    // TOOD select
                    var minIndex = Math.round(yScaleInv(Math.max(mousePosStart[1], mousePos[1]) - PADDING)) + 1;
                    var maxIndex = Math.round(yScaleInv(Math.min(mousePosStart[1], mousePos[1]) - PADDING));
                    var newSelectedProcessList = [];
                    for (let index = minIndex; index < maxIndex; index++) {
                        newSelectedProcessList.push(selectedProcessList[index]);
                    }
                    setSelectedProcessList(newSelectedProcessList);
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
    }

    function Show(s, w, h) {
        show = s;
        if (show && w != null && h != null) {
            width = w;
            initialHeight = h;
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

    // function ClickRight(d, i) {
    //     var dialog = new GraphEdit(range_y, limit_range_y, "Rank", Update);
    //     dialog.Show();
    // }

    function ResetRangeY() {
        // range_y = [limit_range_y[0], limit_range_y[1]];
    }
}
