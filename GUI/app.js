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
app.all('/', function (req, res) {
    res.redirect('/home.html');
});

app.all('/home.html', function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/html', charaset: 'UTF-8' });
    ResponsFile(res, req.url);
});

app.get('/*.html', function (req, res) {
    if (HasCSV(req.session)) {
        res.writeHead(200, { 'Content-Type': 'text/html', charaset: 'UTF-8' });
        ResponsFile(res, req.url);
    } else {
        res.redirect('/home.html');
    }
});

app.post('/*.html', function (req, res) {
    if (HasCSV(req.session)) {
        res.writeHead(200, { 'Content-Type': 'text/html', charaset: 'UTF-8' });
        SetSession(req);
        ResponsFile(res, req.url);
    } else {
        res.redirect('/home.html');
    }
});

app.all('/js/*.js', function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/javascript', charaset: 'UTF-8' });
    ResponsFile(res, req.url);
});

app.all('/css/*.css', function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/css', charaset: 'UTF-8' });
    ResponsFile(res, req.url);
});

app.post('/upload', function (req, res) {
    upload.single('file_csv')(req, res, function (err) {
        if (!err && req.file) {
            if (!req.file.originalname.match(/.csv/)) {
                res.redirect('/home.html');
                return;
            }

            if (HasCSV(req.session)) {
                ClearFile(req.session.path_csv);
            }
            req.session.path_csv = req.file.path;
            req.session.share = new ShareData();
            req.session.share.file_name = req.file.originalname;
        }

        if (HasCSV(req.session)) {
            var url_parts = url.parse(req.url, true);
            var query = url_parts.query;
            if (typeof query.url_next !== 'undefined') {
                res.redirect(query.url_next);
                return;
            }
        } else {
            res.redirect('/home.html');
        }
    });
});

app.post('/clear', function (req, res) {
    if (req.session.path_csv) {
        ClearFile(req.session.path_csv);
        req.session.path_csv = null;
    }
    req.session.share = new ShareData();
    res.redirect('/home.html');
});

app.all('/input.csv', function (req, res) {
    if (req.session.path_csv) {
        ResponsCsv(req, res, req.session.path_csv);
    } else {
        ResponsCsv(req, res, __dirname + req.url);
    }
});

app.all('/input_mpi.csv', function (req, res) {
    if (req.session.path_csv) {
        ResponsFile(res, req.session.path_csv.replace(".csv", "_mpi.csv"));
    } else {
        ResponsFile(res, __dirname + req.url);
    }
});

app.all('/session_data.js', function (req, res) {
    var data = 'var session;\n';
    if (!req.session.share) {
        req.session.share = new ShareData();
    }

    data += 'session = ' + JSON.stringify(req.session.share) + ';\n';

    res.write(data);
    res.end();
});

app.listen(settings.port);
console.log('Server running at http://localhost:' + settings.port + '/');
ClearUploadedFiles();

function SetSession(req) {
    if (req.body.share_str) {
        req.session.share = JSON.parse(req.body.share_str);
    }
}

function ResponsFile(res, path) {
    fs.readFile('public' + path, 'utf-8', function (error, data) {
        if (error) {
            console.log('Not found file:' + path);
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

            if (lines[i].search(/<head>/) !== -1) {
                state = 1;
                res.write(lines[i] + '\n');
                continue;
            } else if (lines[i].search(/<Event>/) !== -1) {
                state = 3;
                res.write(lines[i] + '\n');
                continue;
            }

            if (state === 1) {
                if (line_csv.length >= 3) {
                    res.write(lines[i] + '\n');
                    num_rank = Number(line_csv[0]);
                    SetRange(line_csv);
                }
                state = 2;
            } else if (state === 2) {
                res.write(lines[i] + '\n');
            } else if (state === 3) {
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

        if (req.session.share && req.session.share.range_active && req.session.share.range_active.length >= 2) {
            range_active = req.session.share.range_active;
        } else {
            range_active = [range_limit[0], range_limit[1]];
        }
    }

    function IsVisible(line_csv) {
        var visible;
        if (num_rank === null || range_limit.length < 2 || range_active === null) {
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

function HasCSV(session) {
    if (session.path_csv && fs.lstatSync(session.path_csv).isFile()) {
        return true;
    }
    return false;
}

function ClearFile(path) {
    if (fs.lstatSync(path).isFile()) {
        fs.unlink(path, function (error) {
            if (error) {
                console.log("Caught error removing update files : ", error);
            }
        });
    }
}

function ClearUploadedFiles() {
    var path = 'public/uploads';
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file, index) {
            var curPath = path + "/" + file;
            ClearFile(curPath);
        });
    }
}

ShareData = function () {
    this.file_name = "";
    this.num_rank = 0;
    this.updater = null;
    this.range_limit = new Array();
    this.range_active = new Array();
    this.range_select = new Array();
    this.label_select = null;
    this.time_select = null;
    this.rank_select = null;
    this.show_line = [true, true, true, true, true, true];
}
