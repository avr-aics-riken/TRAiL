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
    this.color = getRangeColor(this.label);
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

function getProcessColor(rank) {
    return processColors[rank % processColors.length];
}

function getRangeColor(label) {
    int = HashStringToInt(label, rangeColors.length);
    return rangeColors[int % rangeColors.length];
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

var rangeColors = [
    "#4080C0",
    "#FF4000",
    "#80FFC0",
    "#00FFC0",
    "#FF8000",
    "#FFC040",
    "#C0FF00",
    "#FF8080",
    "#FFC0C0",
    "#40C0FF",
    "#80C080",
    "#40FF40",
    "#0040FF",
    "#4080FF",
    "#8040FF",
    "#FFC000",
    "#FF4040",
    "#C04040",
    "#C04080",
    "#40C080",
    "#4040C0",
    "#C0FFFF",
    "#40FF00",
    "#80FFFF",
    "#00FF40",
    "#40C040",
    "#80C040",
    "#80FF80",
    "#FF80FF",
    "#40FF80",
    "#4040FF",
    "#40FFFF",
    "#8000FF",
    "#FF00FF",
    "#C040FF",
    "#C0C0FF",
    "#80C000",
    "#00C080",
    "#FFC0FF",
    "#FFFF40",
    "#C00080",
    "#FFFF00",
    "#C000C0",
    "#00FFFF",
    "#C08080",
    "#C0C040",
    "#FFFF80",
    "#C0FF40",
    "#C0C000",
    "#00FF80",
    "#80FF40",
    "#FF40C0",
    "#80C0C0",
    "#0080FF",
    "#00C0C0",
    "#FF40FF",
    "#80C0FF",
    "#FF0040",
    "#C0FFC0",
    "#8080C0",
    "#FF00C0",
    "#C040C0",
    "#C0C0C0",
    "#8040C0",
    "#C0FF80",
    "#FF0080",
    "#C08000",
    "#C0C080",
    "#C000FF",
    "#FF4080",
    "#FF80C0",
    "#C08040",
    "#8080FF",
    "#FFC080",
    "#40C0C0",
    "#4000FF",
    "#FF8040",
    "#40FFC0",
    "#00C0FF",
    "#80FF00",
    "#8000C0",
    "#C080C0",
    "#0080C0",
    "#C080FF",
];

var processColors = [
    "#206020",
    "#C02000",
    "#806080",
    "#204060",
    "#408020",
    "#00C000",
    "#802060",
    "#208020",
    "#0020C0",
    "#E00000",
    "#A02000",
    "#200060",
    "#600000",
    "#004000",
    "#00A060",
    "#004020",
    "#404080",
    "#608020",
    "#602040",
    "#008040",
    "#00A040",
    "#0020A0",
    "#808020",
    "#600080",
    "#604080",
    "#006000",
    "#A00000",
    "#A06000",
    "#406080",
    "#808060",
    "#0060A0",
    "#E00020",
    "#A02020",
    "#0040A0",
    "#406000",
    "#406060",
    "#608060",
    "#0000A0",
    "#206060",
    "#402060",
    "#204000",
    "#800060",
    "#C00040",
    "#806060",
    "#004060",
    "#604040",
    "#008000",
    "#404060",
    "#20A020",
    "#604020",
    "#20A040",
    "#C02020",
    "#20E000",
    "#402040",
    "#A00020",
    "#008020",
    "#000080",
    "#404000",
    "#808040",
    "#404020",
    "#60A000",
    "#0000FF",
    "#C04000",
    "#2020A0",
    "#004040",
    "#206080",
    "#802020",
    "#0000E0",
    "#600040",
    "#000020",
    "#604060",
    "#40A000",
    "#000060",
    "#204020",
    "#6000A0",
    "#A02040",
    "#402080",
    "#C00020",
    "#400000",
    "#800080",
    "#800000",
    "#0000C0",
    "#602080",
    "#608000",
    "#006040",
    "#406040",
    "#804040",
    "#606060",
    "#602020",
    "#408040",
    "#208060",
    "#E02000",
    "#200020",
    "#2000E0",
    "#0040C0",
    "#402020",
    "#400020",
    "#604000",
    "#4000A0",
    "#FF0000",
    "#A04000",
    "#208080",
    "#808000",
    "#202060",
    "#004080",
    "#20C020",
    "#602060",
    "#600060",
    "#802040",
    "#606000",
    "#400060",
    "#206000",
    "#208000",
    "#A00040",
    "#402000",
    "#2000C0",
    "#600020",
    "#804060",
    "#200040",
    "#00E020",
    "#602000",
    "#A00060",
    "#406020",
    "#008060",
    "#606040",
    "#200000",
    "#804000",
    "#40A020",
    "#00FF00",
    "#802080",
    "#00A000",
    "#0020E0",
    "#204080",
    "#006080",
    "#202000",
    "#202040",
    "#606020",
    "#00C020",
    "#00E000",
    "#C00000",
    "#808080",
    "#208040",
    "#002080",
    "#00C040",
    "#804080",
    "#404040",
    "#008080",
    "#400040",
    "#002000",
    "#206040",
    "#804020",
    "#408060",
    "#202020",
    "#204040",
    "#000040",
    "#202080",
    "#4020A0",
    "#2020C0",
    "#200080",
    "#006060",
    "#002020",
    "#608080",
    "#800020",
    "#400080",
    "#20A000",
    "#002040",
    "#00A020",
    "#806020",
    "#608040",
    "#4000C0",
    "#806000",
    "#20C000",
    "#800040",
    "#806040",
    "#802000",
    "#2040A0",
    "#006020",
    "#002060",
    "#A04020",
    "#408000",
    "#606080",
    "#40C000",
    "#2000A0",
    "#408080",
];
