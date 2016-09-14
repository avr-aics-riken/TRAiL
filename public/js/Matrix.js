Matrix = function (csvArray, share) {
    // 幅（ width ）と高さ（ height ）
    var width = 300;
    var height = 300;
    var PADDING = 30;
    var size_font = 18;
    var show = true;
    this.Update = Update;

    var comms = [];
    for (var i = 0; i < csvArray.length; i++) {
        if (csvArray[i][0] == "") continue;
        comms.push(new Communication(csvArray[i]))
    }

    var range_rank = [Number.MAX_VALUE, -Number.MAX_VALUE];
    for (var i = 0; i < comms.length; i++) {
        range_rank[0] = Math.min(range_rank[0], comms[i].rank_send, comms[i].rank_recv);
        range_rank[1] = Math.max(range_rank[1], comms[i].rank_send, comms[i].rank_recv);
    }
    var num_rank = range_rank[1] + 1;

    function Plot() {
        if (comms.length == 0) {
            var div = d3.select("#matrix_comm");
            div.selectAll("p")
                .remove();
            div.append("p")
                .text("No Data");
            return;
        }
        var matrix = [];
        for (var i = 0; i < num_rank; i++) {
            matrix.push([]);
            for (var j = 0; j < num_rank; j++) {
                matrix[i].push({ x: i, y: j, value: 0 });
            }
        }

        for (var i = 0; i < comms.length; i++) {
            if (share.range_select[0] <= comms[i].time &&
                comms[i].time <= share.range_select[1]) {
                matrix[comms[i].rank_send][comms[i].rank_recv].value += comms[i].value;
            }
        }
        var range_value = [Number.MAX_VALUE, -Number.MAX_VALUE];
        for (var i = 0; i < matrix.length; i++) {
            for (var j = 0; j < matrix[i].length; j++) {
                if (0 < matrix[i][j].value) {
                    range_value[0] = Math.min(range_value[0], matrix[i][j].value);
                    range_value[1] = Math.max(range_value[1], matrix[i][j].value);
                }
            }
        }
        contour = new Contour(range_value);

        // SVG 要素の生成
        var svg = d3.select("#matrix_comm")
            .append("svg")
            .attr("width", width)
            .attr("height", height)

        svg.append("text")
            .text("Rank")
            .attr("x", PADDING / 2)
            .attr("y", height - (PADDING - size_font) / 2);

        svg.append("text")
            .text("GB")
            .style("font-size", "14px")
            .attr("x", width - PADDING + size_font / 2)
            .attr("y", (PADDING + size_font) / 2);

        svg.append("text")
            .text("Rank")
            .attr("x", PADDING / 2)
            .attr("y", height - (PADDING - size_font) / 2);

        // グラフエリアの生成
        var graph = svg.append("svg")
            .attr("x", PADDING)
            .attr("y", PADDING)
            .attr("width", width - PADDING * 2)
            .attr("height", height - PADDING * 2);

        // スケール関数の生成
        var xScale = d3.scaleLinear()
            .domain([range_rank[0], range_rank[1] + 1])
            .range([0, width - PADDING * 2]);

        var yScale = d3.scaleLinear()
            .domain([range_rank[0], range_rank[1] + 1])
            .range([0, height - PADDING * 2]);

        var size_cell = (height - PADDING * 2) / num_rank;

        // SVG 要素の生成
        svg.attr("width", width)
            .attr("height", height);

        // 棒グラフの生成
        graph.attr("x", PADDING)
            .attr("y", PADDING)
            .attr("width", width - PADDING * 2)
            .attr("height", height - PADDING * 2);

        graph.append("g")
            .selectAll("g")
            .data(matrix)
            .enter()
            .append("g")
            .selectAll("rect")
            .data(function (d, i) { return matrix[i]; })
            .enter()
            .append("rect")
            .attr("x", function (d) {
                return xScale(d.x);
            })
            .attr("y", function (d) {
                return yScale(d.y);
            })
            .attr("width", size_cell)
            .attr("height", size_cell)
            .attr("stroke", "none")
            .attr("stroke-width", 1)
            .attr("fill", function (d) {
                return contour.GetColor(d.value);
            });

        var sample = new Array(64);
        var iScale = d3.scaleLinear()
            .domain([0, sample.length])
            .range(range_value);
        var valueScale = d3.scaleLinear()
            .domain(range_value)
            .range([height - PADDING, PADDING]);
        for (var i = 0; i < sample.length; i++) {
            sample[i] = iScale(i + 1);
        }
        height_sample = Math.abs(valueScale(iScale(1)) - valueScale(iScale(0)));
        svg.append("g")
            .selectAll("g")
            .data(sample)
            .enter()
            .append("rect")
            .attr("x", width - 5)
            .attr("y", function (d, i) {
                return valueScale(d);
            })
            .attr("width", 5)
            .attr("height", height_sample)
            .attr("fill", function (d, i) {
                return contour.GetColor(d);
            });

        // X 軸の定義
        var xAxis = d3.axisTop(xScale)
            .ticks(Math.min(num_rank, (width - PADDING * 2) / 40));

        // Y 軸の定義
        var yAxis = d3.axisLeft(yScale)
            .ticks(Math.min(num_rank, (height - PADDING * 2) / 40));

        // sample軸の定義
        var valueAxis = d3.axisLeft(valueScale)
            .ticks((height - PADDING * 2) / 40);

        // X 軸の生成
        svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + PADDING + "," + PADDING + ")")
            .call(xAxis);

        // Y 軸の生成
        svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + PADDING + "," + PADDING + ")")
            .call(yAxis);

        // sample 軸の生成
        svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + (width - 5) + ",0)")
            .call(valueAxis);

    }

    function Update() {
        Clear();
        if (show) {
            Plot();
        }
    }

    function Clear() {
        d3.select("#matrix_comm")
            .selectAll("svg")
            .remove();
    };

}

