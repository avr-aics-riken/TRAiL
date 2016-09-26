Dialog = function () {
    var dialog = d3.select("#dialog");

    this.Generate = function () {
        dialog.append("div")
            .attr("id", "dialog_back");

        var dialog_body = dialog.append("div")
            .attr("id", "dialog_body");

        dialog_body.append("p")
            .append("text")
            .text("Graph Edit");

        return dialog_body;
    }

    this.Clear = function () {
        dialog.selectAll("div")
            .remove();
    }

}

GraphEdit = function (range_y, limit_range_y, Update) {
    var dialog = new Dialog();
    var id_input = ["range_y1", "range_y0"];
    var inputs;

    // Show dialog
    this.Show = function () {
        var dialog_body = dialog.Generate();

        // Create table
        var table = dialog_body.append("table")
            .attr("border", "3")
            .attr("class", "dialog");

        var thead = table.append("thead").append("tr");

        thead.selectAll("th")
            .data(["Standard Deviation", "Select Value", "Limit Value"])
            .enter()
            .append("th")
            .text(function (d) {
                return d;
            });

        var tbody = table.append("tbody");

        var trows = tbody
            .selectAll("tr")
            .data([null, null])
            .enter()
            .append("tr");

        trows.data(["Max", "Min"])
            .append("th")
            .text(function (d) { return d });

        inputs = trows.data(id_input)
            .append("td")
            .append("input")
            .attr("type", "number")
            .attr("id", function (d) { return d; })
            .attr("value", function (d, i) { return range_y[1 - i]; });

        trows.data(limit_range_y)
            .append("td")
            .append("input")
            .attr("type", "number")
            .attr("value", function (d, i) { return limit_range_y[1 - i]; })
            .attr("disabled", true);

        var p = dialog_body.append("p")
            .style("float", "right");

        p.append("button")
            .text("Reset")
            .attr("class", "dialog")
            .on("click", OnReset);

        p.append("button")
            .text("OK")
            .attr("class", "dialog")
            .on("click", OnOK);
    }

    // On Reset buttom
    function OnReset() {
        inputs.property("value", function (d, i) { return limit_range_y[1 - i]; });
    }

    // On OK buttom
    function OnOK() {
        var temp = [document.getElementById(id_input[0]).value, document.getElementById(id_input[1]).value]
        range_y[0] = Math.min(temp[0], temp[1]);
        range_y[1] = Math.max(temp[0], temp[1]);
        Update();

        dialog.Clear();
    }
}

TimeEdit = function (share) {
    var dialog = new Dialog();
    var trows;
    var range_select = share.range_select;
    var range_active = share.range_active;
    var range_limit = share.range_limit;

    // Show dialog
    this.Show = function () {
        var dialog_body = dialog.Generate();
        var ranges = [range_select, range_active, range_limit];

        // Create table
        var table = dialog_body.append("table")
            .attr("border", "3")
            .attr("class", "dialog");

        var thead = table.append("thead").append("tr");

        thead.selectAll("th")
            .data(["Time", "Min", "Max", ""])
            .enter()
            .append("th")
            .text(function (d) {
                return d;
            });

        var tbody = table.append("tbody")
            .attr("id", "ttt");

        trows = tbody
            .selectAll("tr")
            .data(ranges)
            .enter()
            .append("tr");

        var text_th = ["Select", "Active", "Limit"];
        trows.append("th")
            .text(function (d, i) { return text_th[i]; });

        var count = 0;
        trows.selectAll("tr")
            .data(function (d) { return d; })
            .enter()
            .append("td")
            .append("input")
            .attr("type", "number")
            .attr("value", function (d) { return d; })
            .attr("disabled", function () { return (count++ < 4 ? null : true); } );

        trows.filter(function (d) { return d != range_limit })
            .append("button")
            .text("Reset")
            .attr("class", "dialog")
            .on("click", OnResetSingle);

        var p = dialog_body.append("p")
            .style("float", "right");

        p.append("button")
            .text("Reset")
            .attr("class", "dialog")
            .on("click", OnReset);

        p.append("button")
            .text("OK")
            .attr("class", "dialog")
            .on("click", OnOK);
    }

    // On Reset single buttom
    function OnResetSingle(range) {
        var valueList = GetValueList();

        if (range == range_select) {
            // Set range_select range_active
            valueList[0] = valueList[2];
            valueList[1] = valueList[3];
        } else {
            // Set range_active range_limit
            valueList[2] = valueList[4];
            valueList[3] = valueList[5];
        }

        SetValueList(valueList);
    }

    // On Reset buttom
    function OnReset(range) {
        var valueList = GetValueList();

        for (var i = 0; i < 4; i++) {
            // Set range_select and range_active range_limit
            valueList[i] = valueList[4 + (i % 2)];
        }

        SetValueList(valueList);
    }

    // On OK buttom
    function OnOK() {
        // Set value from dialog
        var valueList = GetValueList();
        for (var i = 0; i < 4; i++) {
            if (i < 2) {
                range_select[i] = valueList[i];
            } else {
                range_active[i % 2] = valueList[i];
            }
        }

        PostData(share);
    }

    // Get Value List
    function GetValueList() {
        var valueList = [];
        trows.selectAll("td")
            .selectAll("input")
            .each(function () {
                valueList.push(d3.select(this).property("value"));
            });
        return valueList;
    }

    // Set Value List
    function SetValueList(valueList) {
        if (valueList.length < 4) {
            return;
        }
        var i = 0;
        trows.filter(function (d) { return d != range_limit })
            .selectAll("td")
            .filter(function (d) { return typeof d === "number"; })
            .selectAll("input")
            .property("value", function (d) {
                return valueList[i++];
            });
        return valueList;
    }
}
