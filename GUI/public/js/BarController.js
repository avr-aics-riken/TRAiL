BarController = function (events, share) {
    var WIDTH = 1000;
    var HEIGHT = 100;
    var PADDING = 20;

    var controller;
    var range_limit = share.range_limit;
    var range_active = share.range_active;
    var range_select = share.range_select;
    share.updater.Add(Update);
    this.Update = Update;
    this.Plot = Plot;

    var num_rank = d3.max(events, function (d) { return d.rank; }) + 1;

    // スケール関数の生成
    var xScale = d3.scaleLinear()
        .domain(range_limit)
        .range([PADDING, WIDTH - PADDING]);

    var yScale = d3.scaleLinear()
        .domain([0, num_rank])
        .range([PADDING / 2, HEIGHT - PADDING * 3 / 2]);

    function Plot() {
        // 幅（ Width ）と高さ（ height ）
        // SVG 要素の生成
        var svg = d3.select("#controller")
            .append("svg")
            .attr("width", WIDTH)
            .attr("height", HEIGHT)
            .on("contextmenu", function (d, i) {
                d3.event.preventDefault();
                ClickRight(d, i);
            });

        PlotBar(svg);
        PlotController(svg);
    }

    function PlotBar(svg) {
        // Make back screen to get event
        svg.append("rect")
            .attr("x", PADDING)
            .attr("y", PADDING / 2)
            .attr("width", WIDTH - PADDING * 2)
            .attr("height", HEIGHT - PADDING * 2)
            .attr("fill", "white")
            .attr("opacity", 0);

        // 棒グラフの生成
        svg.append("g")
            .selectAll("rect")
            .data(events)
            .enter()
            .append("rect")
            .attr("x", function (d) {
                return d.x = xScale(d.time[0]);
            })
            .attr("y", function (d) {
                return d.y = yScale(d.rank);
            })
            .attr("width", function (d) {
                return xScale(d.time[1]) - xScale(d.time[0]);
            })
            .attr("height", (HEIGHT - PADDING * 2) / num_rank)
            .attr("fill", function (d) {
                return d.property.color;
            });

        // X 軸の定義
        var xAxis = d3.axisBottom(xScale)
            .ticks(20);

        // X 軸の生成
        svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + 0 + "," + (HEIGHT - PADDING * 3 / 2) + ")")
            .call(xAxis);
    }

    function PlotController(svg) {
        var drag = d3.drag()
            .subject(function subject(d) {
                return d == null ? { x: event.x, y: event.y } : d;
            })
            .on("start", DragStarted)
            .on("drag", Dragged)
            .on("end", DragEnded);

        controller = svg.append("g");
        controller
            .selectAll("rect")
            .data(components)
            .enter()
            .append("rect")
            .attr("x", function (d) {
                return d.Fx();
            })
            .attr("y", function (d) {
                return d.y;
            })
            .attr("width", function (d) {
                return d.Fwidth();
            })
            .attr("height", function (d) {
                return d.height;
            })
            .attr("fill", function (d) {
                return d.color;
            })
            .attr("fill-opacity", function (d) {
                return d.fill_opacity;
            })
            .attr("stroke", function (d) {
                return d.stroke;
            })
            .attr("stroke-width", function (d) {
                return d.stroke_width;
            })
            .attr("stroke-opacity", function (d) {
                return 1.0;
            })
            .style('cursor', 'col-resize')
            .call(drag)
            .append("svg:title")
            .text("To show Edit Dialog, right-click on this.");

        function DragStarted(d) {
            d3.event.sourceEvent.stopPropagation();
            d3.select(this).classed("dragging", true);
        }

        function Dragged(d) {
            var dt = d3.event.dx * (range_limit[1] - range_limit[0]) / (WIDTH - 2 * PADDING);
            if (d.type == "bar_select_left") {
                if (range_select[1] < range_select[0] + dt) {
                    range_select[0] = (range_select[0] + range_select[1]) / 2;
                } else {
                    range_select[0] += dt;
                }
            } else if (d.type == "bar_select_right") {
                if (range_select[1] + dt < range_select[0]) {
                    range_select[1] = (range_select[0] + range_select[1]) / 2;
                } else {
                    range_select[1] += dt;
                }
            } else if (d.type == "window_select") {
                if (range_select[0] + dt < range_active[0]) {
                    range_select[1] = range_active[0] + (range_select[1] - range_select[0]);
                    range_select[0] = range_active[0];
                } else if (range_active[1] < range_select[1] + dt) {
                    range_select[0] = range_active[1] - (range_select[1] - range_select[0]);
                    range_select[1] = range_active[1];
                } else {
                    range_select[0] += dt;
                    range_select[1] += dt;
                }
            } else if (d.type == "bar_limit_left") {
                if (range_active[1] < range_active[0] + dt) {
                    range_active[0] = (range_active[0] + range_active[1]) / 2;
                } else {
                    range_active[0] += dt;
                }
            } else if (d.type == "bar_limit_right") {
                if (range_active[1] + dt < range_active[0]) {
                    range_active[1] = (range_active[0] + range_active[1]) / 2;
                } else {
                    range_active[1] += dt;
                }
            } else if (d.type == "window_limit") {
                if (range_active[0] + dt < range_limit[0]) {
                    range_active[1] = range_limit[0] + (range_active[1] - range_active[0]);
                    range_active[0] = range_limit[0];
                } else if (range_limit[1] < range_active[1] + dt) {
                    range_active[0] = range_limit[1] - (range_active[1] - range_active[0]);
                    range_active[1] = range_limit[1];
                } else {
                    range_active[0] += dt;
                    range_active[1] += dt;
                }
            }

            range_active[0] = Math.max(range_active[0], range_limit[0]);
            range_active[1] = Math.min(range_active[1], range_limit[1]);
            range_select[0] = Math.max(range_select[0], range_active[0]);
            range_select[1] = Math.min(range_select[1], range_active[1]);
            if (range_active[1] < range_select[0]) {
                range_select[0] = range_active[1];
            }
            if (range_select[1] < range_active[0]) {
                range_select[1] = range_active[0];
            }
            share.updater.Run();
        }

        function DragEnded(d) {
            d3.select(this).classed("dragging", false);
            if (d.type == "bar_limit_left" ||
                d.type == "bar_limit_right" ||
                d.type == "window_limit") {
                PostData(share);
            }
        }
    }

    function Update() {
        controller
            .selectAll("rect")
            .data(components)
            .attr("x", function (d) {
                return d.Fx();
            })
            .attr("width", function (d) {
                return d.Fwidth();
            });
    }

    var bar_width = 8;
    var components = [
        {
            type: "blind_left",
            x: xScale(range_select[0]),
            Fx: function () {
                return xScale(range_limit[0]);
            },
            y: PADDING / 2,
            Fwidth: function () {
                return xScale(range_active[0]) - xScale(range_limit[0]);
            },
            height: HEIGHT - PADDING * 2,
            color: "black",
            fill_opacity: 0.4,
            stroke: "none",
            stroke_width: 0
        },
        {
            type: "blind_right",
            x: xScale(range_select[0]),
            Fx: function () {
                return xScale(range_active[1]);
            },
            y: PADDING * 0.5,
            Fwidth: function () {
                return xScale(range_limit[1]) - xScale(range_active[1]);
            },
            height: HEIGHT - PADDING * 2,
            color: "black",
            fill_opacity: 0.4,
            stroke: "none",
            stroke_width: 0
        },
        {
            type: "window_limit",
            x: xScale(range_active[0]),
            Fx: function () {
                return xScale(range_active[0]);
            },
            y: 0,
            Fwidth: function () {
                return xScale(range_active[1]) - xScale(range_active[0]);
            },
            height: HEIGHT,
            color: "white",
            fill_opacity: 0,
            stroke: "none",
            stroke_width: 10
        },
        {
            type: "bar_limit_left",
            x: xScale(range_active[0]) - bar_width,
            Fx: function () {
                return xScale(range_active[0]) - bar_width;
            },
            y: 0,
            Fwidth: function () {
                return bar_width;
            },
            height: HEIGHT,
            color: "midnightblue",
            fill_opacity: 1.0,
            stroke: "none",
            stroke_width: 0
        },
        {
            type: "bar_limit_right",
            x: xScale(range_active[1]),
            Fx: function () {
                return xScale(range_active[1]);
            },
            y: 0,
            Fwidth: function () {
                return bar_width;
            },
            height: HEIGHT,
            color: "midnightblue",
            fill_opacity: 1.0,
            stroke: "none",
            stroke_width: 0
        },
        {
            type: "window_select",
            x: xScale(range_select[0]),
            Fx: function () {
                return xScale(range_select[0]);
            },
            y: bar_width / 2,
            Fwidth: function () {
                return xScale(range_select[1]) - xScale(range_select[0]);
            },
            height: HEIGHT - bar_width,
            color: "pink",
            fill_opacity: 0,
            stroke: "orange",
            stroke_width: bar_width
        },
        {
            type: "bar_select_left",
            x: xScale(range_select[0]) - bar_width / 2,
            Fx: function () {
                return xScale(range_select[0]) - bar_width / 2;
            },
            y: 0,
            Fwidth: function () {
                return bar_width;
            },
            height: HEIGHT,
            color: "orange",
            fill_opacity: 1.0,
            stroke: "none",
            stroke_width: 0
        },
        {
            type: "bar_select_right",
            x: xScale(range_select[1]) - bar_width / 2,
            Fx: function () {
                return xScale(range_select[1]) - bar_width / 2;
            },
            y: 0,
            Fwidth: function () {
                return bar_width;
            },
            height: HEIGHT,
            color: "orange",
            fill_opacity: 1.0,
            stroke: "none",
            stroke_width: 0
        },
    ];

    function ClickRight(d, i) {
        var dialog = new TimeEdit(share);
        dialog.Show();
    }
}

Measure = function (graph_area) {
    var width = 0;
    var height = 0;
    var show = false;
    var measure;
    var svg;

    this.Width = function (w) { width = w; };
    this.Height = function (h) { height = h; };
    this.SVG = function (s) { svg = s; };
    this.Show = Show;
    this.Update = Update;

    var mousePosStart;
    function Plot() {
        if (svg == null) return;
        var mousePos = d3.mouse(document.getElementById(graph_area));
        if (Math.abs(mousePosStart[0] - mousePos[0]) + Math.abs(mousePosStart[1] - mousePos[1]) < 1) return;
        measure = svg.append("g");
        if (Math.abs(mousePosStart[0] - mousePos[0]) < Math.abs(mousePosStart[1] - mousePos[1])) {
            measure.append("rect")
                .attr("x", 0)
                .attr("y", Math.min(mousePosStart[1], mousePos[1]))
                .attr("width", width)
                .attr("height", Math.abs(mousePosStart[1] - mousePos[1]))
                .attr("fill", "orange")
                .attr("stroke", "orange")
                .attr("fill-opacity", 0.5)
                .attr("stroke-opacity", 0.8);
        } else {
            measure.append("rect")
                .attr("x", Math.min(mousePosStart[0], mousePos[0]))
                .attr("y", 0)
                .attr("width", Math.abs(mousePosStart[0] - mousePos[0]))
                .attr("height", height)
                .attr("fill", "orange")
                .attr("stroke", "orange")
                .attr("fill-opacity", 0.5)
                .attr("stroke-opacity", 0.8);
        }
    }

    function Show(s, w, h, svg) {
        show = s;
        if (show && w != null && h != null) {
            mousePosStart = d3.mouse(document.getElementById(graph_area));
            width = w;
            height = h;
        }
    }

    function Update() {
        Clear();
        if (show) {
            Plot();
        }
    }

    function Clear() {
        if (measure) {
            measure.remove();
        }
    }
}
