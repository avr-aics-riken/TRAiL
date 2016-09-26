BoxGraph = function (clots, events, share) {
    // 幅（ width ）と高さ（ height ）
    var width = 1400;
    var height = 400;
    var PADDING = 35;
    var show = true;

    var num_rank = d3.max(events, function (d) { return d.rank; }) + 1;
    var size_font = 18;
    var HEIGHT_BOX = 32;
    var HEIGHT_LINE = 6;

    share.updater.Add(Update);
    this.Width = function (w) { width = w; };
    this.Height = function (h) { height = h; };
    this.Show = Show;
    this.Update = Update;
    this.Reset = ResetRangeY;

    var elementId = "graph_box";

    var boxes = [];
    for (var i = 0; i < clots.length; i++) {
        boxes.push(new BoxWhisker(clots[i], num_rank));
    }
    boxes.sort(function (a, b) {
        if (a.boxes[0].time[0] < b.boxes[0].time[0]) return -1;
        if (a.boxes[0].time[0] > b.boxes[0].time[0]) return 1;
        return 0;
    });

    var range_y = d3.extent(boxes, function (d) { return d.value; });
    var limit_range_y = d3.extent(boxes, function (d) { return d.value; });
    ResetRangeY();
    var measure = new Measure(elementId)

    function Plot() {
        // スケール関数の生成
        var xScale = d3.scaleLinear()
            .domain(share.range_select)
            .range([0, width - PADDING * 2]);

        var yScale = d3.scaleLinear()
            .domain(range_y)
            .range([height - PADDING * 2 - HEIGHT_BOX / 2, HEIGHT_BOX / 2]);

        var xScaleInv = d3.scaleLinear()
            .domain([0, width - PADDING * 2])
            .range(share.range_select);

        var yScaleInv = d3.scaleLinear()
            .domain([height - PADDING - HEIGHT_BOX / 2, HEIGHT_BOX / 2 + PADDING])
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
            .text("Standard Deviation")
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

        // Draw whisker and box (The first box is whisker)
        graph.append("g")
            .selectAll("g")
            .data(boxes)
            .enter()
            .append("g")
            .selectAll("rect")
            .data(function (d) {
                return d.boxes;
            })
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
            .attr("y", function (d, i) {
                if (i == 0) return yScale(d.parent.value) - HEIGHT_LINE / 2;
                else return yScale(d.parent.value) - HEIGHT_BOX / 2;
            })
            .attr("width", function (d) {
                return xScale(d.time[1]) - xScale(d.time[0]);
            })
            .attr("height", function (d, i) {
                if (i == 0) return HEIGHT_LINE;
                else return HEIGHT_BOX;
            })
            .attr("rx", function (d, i) {
                if (i == 0) return 0;
                else return Math.min(6, (xScale(d.time[1]) - xScale(d.time[0])) / 5);
            })
            .attr("ry", function (d, i) {
                if (i == 0) return 0;
                else return Math.min(6, (xScale(d.time[1]) - xScale(d.time[0])) / 5);
            })
            .attr("stroke", "none")
            .attr("fill", function (d) {
                return d.property.color;
            })
            .on("contextmenu", function (d, i) {
                d3.event.preventDefault();
                Click(d, i);
            });

        // ラベルの生成
        graph.append("g")
            .selectAll("text")
            .data(boxes)
            .enter()
            .append("text")
            .filter(function (d, i) {
                var size_text = d.property.label.length * size_font / 2;
                var ret = (xScale(d.boxes[0].time[1]) - xScale(share.range_select[0])) >= size_text;
                ret &= (xScale(d.boxes[0].time[1]) - xScale(d.boxes[0].time[0])) >= size_text;
                if (i + 1 < boxes.length) {
                    ret &= (xScale(boxes[i + 1].boxes[0].time[0]) - xScale(share.range_select[0])) >= size_text;
                    ret &= (xScale(boxes[i + 1].boxes[0].time[0]) - xScale(d.boxes[0].time[0])) >= size_text;
                }
                return ret;
            })
            .text(function (d) {
                return d.property.label;
            })
            .attr("x", function (d) {
                if (share.range_select[0] <= d.boxes[0].time[0]) {
                    return (xScale(d.boxes[0].time[0]) + 5);
                } else {
                    return (xScale(share.range_select[0]) + 5);
                }
            })
            .attr("y", function (d) {
                return yScale(d.value) + HEIGHT_BOX / 2;
            })
            .attr("font-family", "sans-serif")
            .attr("font-size", size_font)
            .on("contextmenu", function (d, i) {
                d3.event.preventDefault();
                Click(d, i);
            });

        // X 軸の定義
        var xAxis = d3.axisBottom(xScale)
            .ticks(20);

        // Y 軸の定義
        var yAxis = d3.axisLeft(yScale)
            .ticks(5);

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
                var mousePos = d3.mouse(document.getElementById(elementId));
                if (Math.abs(mousePosStart[0] - mousePos[0]) + Math.abs(mousePosStart[1] - mousePos[1]) < 1) return;
                measure.Show(false);
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
    };

    function Click(d, i) {
        var clot;
        if (d.constructor == Box) {
            clot = d.parent.clot;
        } else {
            clot = d.clot;
        }
        UpdatePropertyOfClot(clot);
        share.label_select = clot[0].property.label;
        share.time_select = (clot[0].time[0] + clot[0].time[1]) / 2;
        var local = new ShareData();
        local.range_limit = [share.range_limit[0], share.range_limit[1]];
        local.range_active[0] = d3.min(clot, function (d) { return d.time[0]; });
        local.range_active[1] = d3.max(clot, function (d) { return d.time[1]; });
        local.range_select = [local.range_active[0], local.range_active[1]];
        local.label_select = share.label_select;
        local.time_select = (local.range_select[0] + local.range_select[1]) / 2;
        var graph_bar = new BarGraph(clot, null, local);
        graph_bar.Show(true, 350, 300);

        var dataset = [];
        for (var i = 0; i < clots.length; i++) {
            if (d.property.label == clots[i][0].property.label) {
                var sum = d3.sum(clots[i], function (event) { return event.time[1] - event.time[0]; });
                dataset.push({ value: sum, clot: clots[i] });
            }
        }
        var histogram = new Histogram(dataset, clot, share)
        histogram.Show(true, 350, 300);
    }

    function ClickRight(d, i) {
        var dialog = new GraphEdit(range_y, limit_range_y, Update);
        dialog.Show();
    }

    function ResetRangeY() {
        range_y = [limit_range_y[0], limit_range_y[1]];
    }
};
