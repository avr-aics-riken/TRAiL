var http = require('http');
var fs = require('fs');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var multer = require('multer');
var url = require('url');
var settings = require('./settings');

var app = express();
var server = http.createServer();
var upload = multer({ dest: 'public/uploads/' });

//セッション設定
app.use(session({
    secret: 'secretKey'
}));
app.use(bodyParser());


//ルーティング設定
app.get('/', function (req, res) {
    res.redirect('/home.html');
});

app.post('/', function (req, res) {
    res.redirect('/home.html');
});

app.get('/*.html', function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/html', charaset: 'UTF-8' });
    ResponsFile(res, req.url);
});

app.post('/*.html', function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/html', charaset: 'UTF-8' });
    SetSession(req);
    ResponsFile(res, req.url);
});

app.get('/js/*.js', function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/javascript', charaset: 'UTF-8' });
    ResponsFile(res, req.url);
});

app.get('/css/*.css', function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/css', charaset: 'UTF-8' });
    ResponsFile(res, req.url);
});

app.post('/upload', function (req, res) {
    upload.single('file_csv')(req, res, function (err) {
        if (err) {
            res.redirect('/home.html');
            return;
        }

        if (typeof req.file !== 'undefined') {
            req.session.path_csv = req.file.path;
        }

        var url_parts = url.parse(req.url, true);
        var query = url_parts.query;
        if (typeof query.url_next === 'undefined') {
            res.redirect('/home.html');
        } else {
            res.redirect(query.url_next);
        }
    });
})

app.post('/upload', upload.single('file_csv'), function (req, res, next) {
    req.session.path_csv = req.file.path;
    var url_parts = url.parse(req.url, true);
    var query = url_parts.query;
    res.redirect(query.url_next);
})

app.get('/input.csv', function (req, res) {
    if (req.session.path_csv) {
        ResponsCsv(req, res, req.session.path_csv);
    } else {
        ResponsCsv(req, res, __dirname + req.url);
    }
});

app.get('/input_mpi.csv', function (req, res) {
    if (req.session.path_csv) {
        ResponsFile(res, req.session.path_csv.replace(".csv", "_mpi.csv"));
    } else {
        ResponsFile(res, __dirname + req.url);
    }
});

app.get('/session_data.js', function (req, res) {
    var data = 'var session = new ShareData();\n';
    if (req.session.range_active) {
        data += 'session.range_active[0] = ' + req.session.range_active[0] + ';\n'
        data += 'session.range_active[1] = ' + req.session.range_active[1] + ';\n'
    }
    if (req.session.range_select) {
        data += 'session.range_select[0] = ' + req.session.range_select[0] + ';\n'
        data += 'session.range_select[1] = ' + req.session.range_select[1] + ';\n'
    }
    if (req.session.label_select) {
        data += 'session.label_select = \"' + req.session.label_select + '\";\n'
    }
    if (req.session.time_select) {
        data += 'session.time_select = ' + req.session.time_select + ';\n'
    }
    if (req.session.rank_select) {
        data += 'session.rank_select = ' + req.session.rank_select + ';\n'
    }
    if (req.session.pane_comm) {
        data += 'session.pane_comm = ' + req.session.pane_comm + ';\n'
    }
    if (req.session.pane_calc) {
        data += 'session.pane_calc = ' + req.session.pane_calc + ';\n'
    }
    if (req.session.pane_hwpc0) {
        data += 'session.pane_hwpc0 = ' + req.session.pane_hwpc0 + ';\n'
    }
    if (req.session.pane_hwpc1) {
        data += 'session.pane_hwpc1 = ' + req.session.pane_hwpc1 + ';\n'
    }
    if (req.session.pane_hwpc2) {
        data += 'session.pane_hwpc2 = ' + req.session.pane_hwpc2 + ';\n'
    }
    if (req.session.pane_hwpc3) {
        data += 'session.pane_hwpc3 = ' + req.session.pane_hwpc3 + ';\n'
    }
    res.write(data);
    res.end();
});

app.listen(settings.port);
console.log('Server running at http://localhost:' + settings.port + '/');
ClearUploadedFiles();

function SetSession(req) {
    if (req.body.path_csv && req.body.path_csv != req.session.path_csv) {
        req.session.path_csv = req.body.path_csv;
        req.session.range_limit = null;
        req.session.range_select = null;
        req.session.range_active = null;
        req.session.label_select = null;
        req.session.time_select = null;
        req.session.rank_select = null;
        req.session.pane_comm = true;
        req.session.pane_calc = true;
        req.session.pane_hwpc0 = false;
        req.session.pane_hwpc1 = false;
        req.session.pane_hwpc2 = false;
        req.session.pane_hwpc3 = false;
    }
    if (req.body.start_limit && req.body.end_limit) {
        req.session.range_limit = [Number(req.body.start_limit), Number(req.body.end_limit)];
    }
    if (req.body.start_active && req.body.end_active) {
        req.session.range_active = [Number(req.body.start_active), Number(req.body.end_active)];
    }
    if (req.body.start_select && req.body.end_select) {
        req.session.range_select = [Number(req.body.start_select), Number(req.body.end_select)];
    }
    if (req.body.label_select) {
        req.session.label_select = req.body.label_select;
    }
    if (req.body.time_select) {
        req.session.time_select = req.body.time_select;
    }
    if (req.body.rank_select) {
        req.session.rank_select = req.body.rank_select;
    }
    req.session.pane_comm = req.body.pane_comm;
    req.session.pane_calc = req.body.pane_calc;
    req.session.pane_hwpc0 = req.body.pane_hwpc0;
    req.session.pane_hwpc1 = req.body.pane_hwpc1;
    req.session.pane_hwpc2 = req.body.pane_hwpc2;
    req.session.pane_hwpc3 = req.body.pane_hwpc3;
}

function ResponsFile(res, path) {
    fs.readFile('public' + path, 'utf-8', function (error, data) {
        if (error) {
            console.log('not found file:' + path);
            return ResponsNotFound(res);
        }
        res.write(data);
        res.end();
    });
}

function ResponsCsv(req, res, path) {
    stream = fs.createReadStream(path, {
        flags: 'r',
        encoding: 'utf-8',
        fd: null,
        bufferSize: 1
    });
    var text = '';
    //start reading the file
    var csvArray = new Array();
    var range_limit = new Array();
    var range_active;
    var num_rank;
    var state = 0;

    stream.addListener('data', function (data) {
        //stream.pause();
        text += data;
        var lines = text.split("\n");
        for (var i = 0; i < lines.length - 1; i++) {
            var line_csv = lines[i].split(",");

            if (lines[i].search(/<head>/) != -1) {
                state = 1;
                res.write(lines[i] + '\n');
                continue;
            } else if (lines[i].search(/<Event>/) != -1) {
                state = 3;
                res.write(lines[i] + '\n');
                continue;
            }

            if (state == 1) {
                if (line_csv.length >= 3) {
                    res.write(lines[i] + '\n');
                    num_rank = Number(line_csv[0]);
                    SetRange(line_csv);
                }
                state = 2;
            } else if (state == 2) {
                res.write(lines[i] + '\n');
            } else if (state == 3) {
                if (IsVisible(line_csv)) {
                    res.write(lines[i] + '\n');
                }
            }
        }
        text = lines[lines.length - 1];
        //stream.resume();
    })

    stream.on('end', function () {
         res.end();
    });

    stream.on('error', function (error) {
        console.log("Caught file stream error: ", error);
    });

    var RATE_TIME = 20000000;
    function SetRange(line_csv) {
        range_limit[0] = Number(line_csv[1]) / RATE_TIME;
        range_limit[1] = Number(line_csv[2]) / RATE_TIME;

        if (req.session.range_active) {
            range_active = req.session.range_active;
        } else {
            range_active = [range_limit[0], range_limit[1]];
        }
    }

    function IsVisible(line_csv) {
        var visible;
        if (num_rank == null || range_limit.length < 2 || range_active == null) {
            console.log('CSV format error');
            return true;
        }
        range = new Array(2);
        range[0] = Number(line_csv[2]) / RATE_TIME;
        range[1] = Number(line_csv[3]) / RATE_TIME;
        visible = (range[0] <= range_active[1]);
        visible &= (range[1] >= range_active[0]);
        visible &= (range[1] - range[0] >= (range_active[1] - range_active[0]) * num_rank / 50000);
        visible |= (range[1] - range[0] >= (range_limit[1] - range_limit[0]) * num_rank / 2000);
        return visible;
    }
}

function ResponsNotFound(res) {
    res.writeHead(404, { 'content-Type': 'text/plain' });
    res.write("Not found");
    res.end();
}

function ClearUploadedFiles() {
    var path = 'public/uploads';
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file, index) {
            var curPath = path + "/" + file;
            if (!fs.lstatSync(curPath).isDirectory()) {
                fs.unlink(curPath, function (error) {
                    if (error) {
                        console.log("Caught error removing update files : ", error);
                    }
                });
            }
        });
    }
}
