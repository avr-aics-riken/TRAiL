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

    // ダイアログを表示
    this.Show = function () {
        var dialog_body = dialog.Generate();

        // create table
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

    function OnReset() {
        inputs.property("value", function (d, i) { return limit_range_y[1 - i]; });
    }

    // ダイアログを閉じる
    function OnOK() {
        var temp = [document.getElementById(id_input[0]).value, document.getElementById(id_input[1]).value]
        range_y[0] = Math.min(temp[0], temp[1]);
        range_y[1] = Math.max(temp[0], temp[1]);
        Update();

        dialog.Clear();
    }
}
