Histogram = function (dataset, clot_select, share) {
    // 幅（ width ）と高さ（ height ）
    var width = 1400;
    var height = 400;
    var PADDING = 30;
    var max_value = d3.max(dataset, function (d) { return d.value; });
    var size_font = 18;
    var show = true;

    share.updater.Add(Update);
    this.Width = function (w) { width = w; };
    this.Height = function (h) { height = h; };
    this.Show = Show;
    this.Update = Update;

    function Plot() {
        // SVG 要素の生成
        var svg = d3.select("#histogram")
            .append("svg")
            .attr("width", width)
            .attr("height", height)

        svg.append("text")
            .text("Total Time Cost")
            .attr("x", PADDING / 2)
            .attr("y", (PADDING + size_font) / 2);

        svg.append("text")
            .text("num")
            .style("font-size", "14px")
            .attr("x", width - PADDING + 2)
            .attr("y", height - PADDING + 14 / 2);

        // グラフエリアの生成
        var graph = svg.append("svg")
            .attr("x", PADDING)
            .attr("y", PADDING)
            .attr("width", width - PADDING * 2)
            .attr("height", height - PADDING * 2);

        // Make back screen to get event
        graph.append("g")
            .append("rect")
            .attr("width", width - PADDING * 2)
            .attr("height", height - PADDING * 2)
            .attr("fill", "white")
            .attr("opacity", 0)
            .on("contextmenu", function (d, i) {
                d3.event.preventDefault();
            });

        // スケール関数の生成
        var xScale = d3.scaleLinear()
            .domain([1 / 2, dataset.length + 1 / 2])
            .range([0, width - PADDING * 2]);

        var yScale = d3.scaleLinear()
            .domain([max_value, 0])
            .range([0, height - PADDING * 2]);

        var width_bar = (width - PADDING * 2) / dataset.length / 2;

        // SVG 要素の生成
        svg.attr("width", width)
            .attr("height", height);

        // 棒グラフの生成
        graph.attr("x", PADDING)
            .attr("y", PADDING)
            .attr("width", width - PADDING * 2)
            .attr("height", height - PADDING * 2);

        graph.append("g")
            .selectAll("rect")
            .data(dataset)
            .enter()
            .append("rect")
            .attr("x", function (d, i) {
                return xScale(i + 3 / 4);
            })
            .attr("y", function (d) {
                return yScale(d.value);
            })
            .attr("width", width_bar)
            .attr("height", function (d) {
                return yScale(0) - yScale(d.value);
            })
            .attr("fill", function (d) {
                return d.clot[0].property.color;
            })
            .attr("opacity", function (d) {
                if (d.clot == clot_select || clot_select == null) {
                    return 1.0;
                } else {
                    return 0.5
                }
            })
            .on("contextmenu", function (d, i) {
                d3.event.preventDefault();
                Click(d, i);
            });

        // X 軸の定義
        var xAxis = d3.axisBottom(xScale)
            .ticks(Math.min(dataset.length, (width - PADDING * 2) / 50));

        // Y 軸の定義
        var yAxis = d3.axisLeft(yScale)
            .ticks((height - PADDING * 2) / 50);

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
    };

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
        d3.select("#histogram")
            .selectAll("svg")
            .remove();
    }

    function Click(d, i) {
        UpdatePropertyOfClot(d.clot);
        clot_select = d.clot;
        share.label_select = d.clot[0].property.label;
        share.time_select = (d.clot[0].time[0] + d.clot[0].time[1]) / 2;
        Update();
        if (PlotPage == 0) { // 0 : PageStatistic
            var local = new ShareData();
            local.range_limit[0] = d3.min(d.clot, function (d) { return d.time[0]; });
            local.range_limit[1] = d3.max(d.clot, function (d) { return d.time[1]; });
            local.range_active = [local.range_limit[0], local.range_limit[1]];
            local.range_select = [local.range_active[0], local.range_active[1]];
            local.label_select = share.label_select;
            local.time_select = share.time_select;
            var graph_bar = new BarGraph(d.clot, null, local);
            graph_bar.Show(true, 350, 300);
        }
    }
}

function GetClots(events) {
    var clots = [];
    // make set of event group by label
    var labelset = {};
    for (var i = 0; i < events.length; i++) {
        if (!labelset[events[i].property.label]) {
            labelset[events[i].property.label] = [];
        }
        labelset[events[i].property.label].push(events[i]);
    }
    for (var label in labelset) {
        labelset[label].sort(function (a, b) {
            if (a.time[0] < b.time[0]) return -1;
            if (a.time[0] > b.time[0]) return 1;
            return 0;
        });
    }

    for (var label in labelset) {
        var time = [-Number.MAX_VALUE, -Number.MAX_VALUE];
        for (var i = 0; i < labelset[label].length; i++) {
            if (time[1] < labelset[label][i].time[0]) {
                // make new clot
                clots.push([labelset[label][i]]);
                time[0] = labelset[label][i].time[0];
                time[1] = labelset[label][i].time[1];
            } else {
                // add into clot
                clots[clots.length - 1].push(labelset[label][i]);
                time[1] = Math.max(time[1], labelset[label][i].time[1]);
            }
        }
    }
    return clots;
}

