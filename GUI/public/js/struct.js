ShareData = function () {
    this.file_name = "";
    this.num_rank = 0;
    this.updater = new Updater();
    this.range_limit = new Array();
    this.range_active = new Array();
    this.range_select = new Array();
    this.label_select = null;
    this.time_select = null;
    this.rank_select = null;
    this.show_line = [true, true, true, true, true, true];
}

Updater = function () {
    this.updates = [];
    this.Run = function () {
        this.updates.forEach(function (Update) {
            Update();
        });
    };
    this.Add = function (Update) {
        this.updates.push(Update);
    };
};

Property = function (label, excl, counter) {
    this.label = label;
    this.excl = (excl.match("20") != null);
    this.counter = counter;
    this.counter.unuse = false;
    this.color = GetColor(this.label);
}

Counter = function (id, name, unit) {
    this.id = id; // defalt 0: comm, 1: calc, 2: hwpc1, 3: hwpc2, 4: hwpc3, 5: hwpc4
    this.name = name;
    this.unit = unit;
    this.Set = function (id, name, unit) {
        this.id = id;
        this.name = name;
        this.unit = unit;
    };
    this.unuse = true;
}

// RATE_TIME is the value for conversion to second
var RATE_TIME = 20000000
Event = function (property, data) {
    this.property = property;
    this.rank = Number(data[1]) - 1;
    this.time = [Number(data[2]) / RATE_TIME, Number(data[3]) / RATE_TIME];
    this.interval = this.time[1] - this.time[0];
    this.value = Number(data[4]);
};

BoxWhisker = function (clot, num_rank) {
    this.clot = clot;
    this.property = clot[0].property;
    this.value = GetStandardDeviation();
    this.boxes = GetBoxes(this);

    function GetStandardDeviation() {
        var costs = [];
        for (var i = 0; i < num_rank; i++) {
            costs[i] = 0;
        }
        for (var i = 0; i < clot.length; i++) {
            costs[clot[i].rank] += clot[i].time[1] - clot[i].time[0];
        }

        var num = 0;
        for (var i = 0; i < costs.length; i++) {
            if (0 < costs[i]) {
                num++;
            }
        }
        var average = d3.sum(clot, function (event) {
            return event.time[1] - event.time[0];
        }) / num;
        var sum = 0;
        for (var i = 0; i < costs.length; i++) {
            if (0 < costs[i]) {
                sum += Math.pow(costs[i] - average, 2);
            }
        }
        var variance = sum / num;
        //return Math.sqrt(variance);
        return Math.pow(variance, 1 / 16);
    }

    function GetBoxes(parent) {
        var boxes = [];
        var time = [];
        time[0] = d3.min(clot, function (d) { return d.time[0]; });
        time[1] = d3.max(clot, function (d) { return d.time[1]; });
        boxes.push(new Box(parent, time));

        var states = new Array(num_rank);
        for (var i = 0; i < states.length; i++) {
            states[i] = false;
        }
        var switches = GetSwitches();
        var state = false;
        for (var i = 0; i < switches.length; i++) {
            states[switches[i].rank] = switches[i].state;
            if (State() && !state) {
                state = true;
                time[0] = switches[i].time;
            } else if (state) {
                state = false;
                time[1] = switches[i].time;
                boxes.push(new Box(parent, time));
            }
        }

        return boxes;

        function GetSwitches() {
            var switches = [];
            for (var i = 0; i < clot.length; i++) {
                switches.push({ time: clot[i].time[0], rank: clot[i].rank, state: true });
                switches.push({ time: clot[i].time[1], rank: clot[i].rank, state: false });
            }
            switches.sort(function (a, b) {
                if (a.time < b.time) return -1;
                if (a.time > b.time) return 1;
                else {
                    if (!a.state && b.state) return -1;
                    if (a.state && !b.state) return 1;
                }
                return 0;
            });
            return switches;
        }

        function State() {
            var last = 0;
            for (; last < num_rank; last++) {
                if (!states[last]) { break; }
            }
            if (last == num_rank) return true;
            else return false;
        }
    }
};

Box = function (parent, time) {
    this.parent = parent;
    this.property = parent.property;
    this.time = [time[0], time[1]];
}

Communication = function (data) {
    var SIZE_TYPE = [1, 1, 1, 2, 2, 4, 4, 8, 8, 4, 8, 1];
    this.func = Number(data[0]); // 3: send, 4: recv
    this.rank_send = Number(data[1]) - 1;
    this.rank_recv = Number(data[2]) - 1;
    this.time = Number(data[3]) / RATE_TIME;
    this.type = Number(data[4]);
    this.size = Number(data[5]);
    if (0 <= this.type && this.type <= 11) {
        this.value = this.size * SIZE_TYPE[this.type] / 1000000000;
        //this.value = this.size / 1000000000;
    } else {
        //this.value = this.size / 1000000000;
        this.value = 0;
    }
};

function GetColor(c) {
    //var shuffle = Math.floor(Math.random() * 60);
    var int;
    //var color0 = d3.scale.category20();
    //var color1 = d3.scale.category20b();
    //var color2 = d3.scale.category20c();
    var colorList = [];
    colorList = colorList.concat(color_bright);
    //colorList = colorList.concat(color0.range());
    //colorList = colorList.concat(color0.range());
    //colorList = colorList.concat(color1.range());
    if (typeof c == "number") {
        int = c;
    } else if (typeof c == "string") {
        int = HashStringToInt(c, colorList.length);
    }
    return colorList[int % colorList.length];
}

function HashStringToInt(string, num) {
    var int = 0;
    for (var i = 0; i < string.length; i++) {
        int += string.charCodeAt(i) % num;
    }
    return int;
}

Contour = function (range_value) {
    var value_quo = (range_value[1] - range_value[0]) / 4;
    grad0 = d3.scaleLinear()
        .domain([range_value[0], range_value[0] + value_quo])
        .range(["#0000ff", "#00ffff"]);
    grad1 = d3.scaleLinear()
        .domain([range_value[0] + value_quo, range_value[0] + value_quo * 2])
        .range(["#00ffff", "#00ff00"]);
    grad2 = d3.scaleLinear()
        .domain([range_value[0] + value_quo * 2, range_value[0] + value_quo * 3])
        .range(["#00ff00", "#ffff00"]);
    grad3 = d3.scaleLinear()
        .domain([range_value[0] + value_quo * 3, range_value[1]])
        .range(["#ffff00", "#ff0000"]);
    this.GetColor = function (value) {
        var color = "#000000";
        if (value <= 0) {
            color = "#ffffff";
        } else if (value < range_value[0]) {
            color = "#0000ff";
        } else if (value < range_value[0] + value_quo) {
            color = grad0(value);
        } else if (value < range_value[0] + value_quo * 2) {
            color = grad1(value);
        } else if (value < range_value[0] + value_quo * 3) {
            color = grad2(value);
        } else if (value < range_value[1]) {
            color = grad3(value);
        } else {
            color = "#ff0000";
        }
        return color;
    }
}

var color_bright = [
    "#00bfff",
    "#00ced1",
    "#00deab",
    "#00fa9a",
    "#00ff7f",
    "#00ffff",
    "#00ffff",
    "#1e90ff",
    "#40e0d0",
    "#48d1cc",
    "#6495ed",
    "#66cdaa",
    "#7cfc00",
    "#7fff00",
    "#7fffd4",
    "#87ceeb",
    "#87cefa",
    "#8fbc8f",
    "#90ee90",
    "#9370db",
    "#98fb98",
    "#9acd32",
    "#a9a9a9",
    "#add8e6",
    "#adff2f",
    "#b0c4de",
    "#b0e0e6",
    "#b8860b",
    "#ba55d3",
    "#bc8f8f",
    "#bdb76b",
    "#c0c0c0",
    "#cd5c5c",
    "#cd853f",
    "#d2691e",
    "#d2b48c",
    "#d3d3d3",
    "#d8bfd8",
    "#da70d6",
    "#daa520",
    "#db7093",
    "#dcdcdc",
    "#dda0dd",
    "#deb887",
    "#e0ffff",
    "#e6e6fa",
    "#e9967a",
    "#ee82ee",
    "#eee8aa",
    "#f08080",
    "#f0e68c",
    "#f4a460",
    "#f5deb3",
    "#f5f5dc",
    "#fa8072",
    "#faebd7",
    "#faf0e6",
    "#ff4500",
    "#ff6347",
    "#ff69b4",
    "#ff7f50",
    "#ff8c00",
    "#ffa07a",
    "#ffa500",
    "#ffb6c1",
    "#ffc0cb",
    "#ffd700",
    "#ffdab9",
    "#ffdead",
    "#ffe4b5",
    "#ffe4c4",
    "#ffe4e1",
    "#ffebcd",
    "#ffefd5",
    "#fff0f5",
    "#fffacd",
    "#ffff00",
];

