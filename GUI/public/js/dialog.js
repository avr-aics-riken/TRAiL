Dialog = function () {
    var dialog = d3.select("#dialog");

    this.Generate = function () {
        dialog.style('display', 'block');
        dialog.append("div")
            .attr("id", "dialog_back")
            .classed('dialog_back', true);

        var dialog_body = dialog.append("div")
            .attr("id", "dialog_body")
            .classed('dialog_body', true);

        return dialog_body;
    }

    this.Clear = function () {
        dialog.selectAll("div")
            .remove();
    }
}

SettingDialog = function (updater) {
    var processSettingDialog = new ProcessSettingDialog(updater);
    var dialog = new Dialog();

    // Show dialog
    this.Show = function () {
        var dialog_body = dialog.Generate();

        dialog_body.append("h3")
            .append("text")
            .text("Setting Menu");

        var div = dialog_body.append("div")
            .style("float", "right");

        div.append("p")
            .append("text")
            .text("Process Setting");

        div.append("button")
            .text("Process Display Setting")
            .on("click", onProcessSetting);

        div.append("p")
            .append("text")
            .text("Range Setting");

        div.append("p")
            .append("text")
            .text("Line Graph Setting");

        div.append("button")
            .text("close")
            .attr("class", "dialog")
            .on("click", onClose);
    }

    function onProcessSetting() {
        dialog.Clear();
        processSettingDialog.Show();
    }

    // On OK buttom
    function onClose() {
        dialog.Clear();
    }
}

ProcessSettingDialog = function (updater) {
    var dialog = d3.select("#processDisplaySettingDialog");
    let settingList;

    refleshInput();

    dialog.select('#applyDialogButton').on('click', onApply);
    dialog.select('#resetDialogButton').on('click', onReset);
    dialog.select('#okDialogButton').on('click', onOK);
    dialog.select('#cancelDialogButton').on('click', onCancel);
    dialog.selectAll('input[name="selectProcess"]').on('change', refleshInput);

    // Show dialog
    this.Show = function () {
        dialog.style('display', 'block');
        settingList = getProcessSettingList();
        drawTable();
    }

    function onApply() {
        settingList.forEach(element => {
            element.selected = false;
        });

        if (dialog.select('input[name="selectProcess"]:checked').node().value == 'all') {
            for (let i = 0; i < settingList.length; i++) {
                settingList[i].selected = true;
            }
        } else {
            if (dialog.select('#selectRankIdListCheckbox').property('checked')) {
                let text = dialog.select('#rankIdList').property('value');
                let rankIdList = text.split(',');
                rankIdList.forEach(rankId => {
                    let rank = toInt(rankId);
                    if (rank < settingList.length) {
                        settingList[rank].selected = true;
                    }
                });
            }

            if (dialog.select('#selectRankRangeListCheckbox').property('checked')) {
                let text = dialog.select('#rankRangeList').property('value');
                let rankRangeList = text.split(',');
                rankRangeList.forEach(rankRangeText => {
                    const rankRange = rankRangeText.split('-');
                    const rankStart = toInt(rankRange[0]);
                    const rankEnd = toInt(rankRange[1]);
                    for (let rank = rankStart; rank <= rankEnd; ++rank) {
                        if (rank < settingList.length) {
                            settingList[rank].selected = true;
                        } else {
                            break;
                        }
                    }
                });
            }

            if (dialog.select('#selectRankLoopCheckbox').property('checked')) {
                const rankStart = toInt(dialog.select('#rankLoopStart').property('value'));
                const rankEnd = toInt(dialog.select('#rankLoopEnd').property('value'));
                const rankStep = toInt(dialog.select('#rankLoopStep').property('value'));
                for (let rank = rankStart; rank <= rankEnd; rank += rankStep) {
                    if (rank < settingList.length) {
                        settingList[rank].selected = true;
                    } else {
                        break;
                    }
                }
            }
        }

        drawTable();
    }

    // On Reset buttom
    function onReset() {
        for (let i = 0; i < settingList.length; ++i) {
            settingList[i].color = getProcessColor(i);
        }
        drawTable();
    }

    // On OK buttom
    function onOK() {
        onApply();
        setProcessSettingList(settingList);
        dialog.style('display', 'none');
        updater.Run();
    }

    // On Cancel buttom
    function onCancel() {
        dialog.style('display', 'none');
    }

    function drawTable() {
        var body = dialog.select('#processSettingTableBody');
        body.selectAll('tr').remove();
        for (let i = 0; i < settingList.length; ++i) {
            var row = body.append('tr');
            row.append('td')
                .append('input')
                .attr('type', 'checkbox')
                .attr('disabled', 'disabled')
                .attr('checked', settingList[i].selected ? 'checked' : null);

            row.append('td')
                .text(i);

            row.append('td')
                .append('input')
                .attr('type', 'color')
                .attr('value', settingList[i].color)
                .attr('class', 'settingColor')
                .on('change', function () {
                    settingList[i].color = this.value;
                });
        }
    }

    function refleshInput() {
        const disabled = 'disabled';
        if (dialog.select('input[name="selectProcess"]:checked').node().value == 'all') {
            dialog.select('#selectRankIdListCheckbox').property(disabled, disabled);
            dialog.select('#selectRankRangeListCheckbox').property(disabled, disabled);
            dialog.select('#selectRankLoopCheckbox').property(disabled, disabled);
            dialog.select('#rankIdList').property(disabled, disabled);
            dialog.select('#rankRangeList').property(disabled, disabled);
            dialog.select('#rankLoopStart').property(disabled, disabled);
            dialog.select('#rankLoopEnd').property(disabled, disabled);
            dialog.select('#rankLoopStep').property(disabled, disabled);
        } else {
            dialog.select('#selectRankIdListCheckbox').attr(disabled, null);
            dialog.select('#selectRankIdListCheckbox').attr(disabled, null);
            dialog.select('#selectRankRangeListCheckbox').attr(disabled, null);
            dialog.select('#selectRankLoopCheckbox').attr(disabled, null);
            dialog.select('#rankIdList').attr(disabled, null);
            dialog.select('#rankRangeList').attr(disabled, null);
            dialog.select('#rankLoopStart').attr(disabled, null);
            dialog.select('#rankLoopEnd').attr(disabled, null);
            dialog.select('#rankLoopStep').attr(disabled, null);
        }
    }

    function toInt(value) {
        return Math.floor(Number(value));
    }
}

GraphEdit = function (range_y, limit_range_y, rabel, Update) {
    var dialog = new Dialog();
    var id_input = ["range_y1", "range_y0"];
    var inputs;

    // Show dialog
    this.Show = function () {
        var dialog_body = dialog.Generate();

        dialog_body.append("p")
            .append("text")
            .text("Time Edit");

        // Create table
        var table = dialog_body.append("table")
            .attr("border", "3")
            .attr("class", "dialog");

        var thead = table.append("thead").append("tr");

        thead.selectAll("th")
            .data([rabel, "Select Value", "Limit Value"])
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

        p.append("button")
            .text("Cancel")
            .attr("class", "dialog")
            .on("click", OnCancel);
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

    // On Cancel buttom
    function OnCancel() {
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
        dialog_body.append("p")
            .append("text")
            .text("Time Edit");

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
            .attr("disabled", function () { return (count++ < 4 ? null : true); });

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

        p.append("button")
            .text("Cancel")
            .attr("class", "dialog")
            .on("click", OnCancel);
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
        range_select[0] = Math.min(valueList[0], valueList[1]);
        range_select[1] = Math.max(valueList[0], valueList[1]);
        range_active[0] = Math.min(valueList[2], valueList[3]);
        range_active[1] = Math.max(valueList[2], valueList[3]);

        PostData(share);
    }

    // On Cancel buttom
    function OnCancel() {
        dialog.Clear();
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
