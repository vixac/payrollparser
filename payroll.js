var readline = require('readline');
var process = require('process');
var out = console.log;
var Block = /** @class */ (function () {
    function Block(lines) {
        this.errors = "";
        for (var i = 0, l = lines.length; i < l; i++) {
            var line = lines[i];
            switch (line.linetype) {
                case LineType.UserName: {
                    var user = parseUserLine(line.cleanLine);
                    this.id = user[0];
                    this.name = user[1];
                    break;
                }
                case LineType.Date: {
                    this.date = line.cleanLine;
                    break;
                }
                case LineType.Processing: {
                    break;
                }
                case LineType.Splits: {
                    break;
                }
                case LineType.Unknown: {
                    this.errors += (line.cleanLine);
                }
            }
        }
    }
    return Block;
}());
var TabLine = /** @class */ (function () {
    function TabLine(line) {
        var numTabs = 0;
        for (var i = 0, l = line.length; i < l; i++) {
            var c = line.charAt(i);
            if (c === "\t") {
                numTabs += 1;
            }
            else {
                this.numTabs = numTabs;
                this.cleanLine = line.substring(numTabs);
                this.linetype = toLineType(numTabs);
                return;
            }
        }
        this.numTabs = numTabs;
        this.cleanLine = line;
        this.linetype = LineType.Ignore;
    }
    return TabLine;
}());
var LineType;
(function (LineType) {
    LineType[LineType["Ignore"] = 0] = "Ignore";
    LineType[LineType["UserName"] = 3] = "UserName";
    LineType[LineType["Date"] = 4] = "Date";
    LineType[LineType["Splits"] = 5] = "Splits";
    LineType[LineType["Processing"] = 7] = "Processing";
    LineType[LineType["Unknown"] = -1] = "Unknown";
})(LineType || (LineType = {}));
//returns id and name
function parseUserLine(line) {
    var firstSpace = line.indexOf("\t");
    var id = line.substr(0, firstSpace);
    var rest = line.substring(firstSpace);
    var startOfName = 0;
    var tabLine = new TabLine(rest);
    /*
    for(var i=0; i< rest.length; i++) {
        if(rest[i] !== "\t") {
            continue;
        }
        startOfName +=1;
    }
    */
    var name = rest.substring(startOfName);
    return [id, tabLine.cleanLine];
}
function toLineType(numTabs) {
    switch (numTabs) {
        case LineType.Ignore: {
            return LineType.Ignore;
        }
        case LineType.UserName: {
            return LineType.UserName;
        }
        case LineType.Date: {
            return LineType.Date;
        }
        case LineType.Splits: {
            return LineType.Splits;
        }
        case LineType.Processing: {
            return LineType.Processing;
        }
    }
    return LineType.Unknown;
}
function isStartLine(tabLine) {
    return tabLine.numTabs === 3;
}
function isEndLine(line) {
    return line.indexOf("Processing at End of Selection") !== -1;
}
function trimJunk(lines) {
    var output = [];
    var started = false;
    for (var i = 0, l = lines.length; i < l; i++) {
        var line = lines[i];
        var tabLine = new TabLine(line);
        if (tabLine.numTabs == LineType.Ignore) {
            continue;
        }
        if (!started && isStartLine(tabLine)) {
            started = true;
        }
        if (started) {
            if (isEndLine(line)) {
                return output;
            }
            output.push(tabLine);
        }
    }
}
function tabsLinesToBlocks(tabLines) {
    var blocks = [];
    var currentLines = [];
    var postProcessing = false;
    for (var i = 0, l = tabLines.length; i < l; i++) {
        var tab = tabLines[i];
        if (tab.numTabs === LineType.UserName) {
            if (currentLines.length > 0) {
                var newBlock = new Block(currentLines.slice());
                blocks.push(newBlock);
                currentLines = [];
            }
        }
        currentLines.push(tab);
    }
    //last line needs doing outside the loop
    var newBlock = new Block(currentLines);
    blocks.push(newBlock);
    return blocks;
}
function printTitleCSVStyle() {
    out("Id, Name, Date, Errors");
}
function printBlockCSVStyle(b) {
    //for(var i=0, l = b.length; i<l; i++) {
    //    out(`lineType => ${LineType[b.lines[i].linetype]}: "${b.lines[i].cleanLine}"`);
    //}
    //out(`Block: ID:"${b.id}", name:"${b.name}", date:"${b.date}",errors: "${b.errors}"`)
    out(b.id + ", " + b.name + ", " + b.date + ", " + b.errors);
}
function parseDocument(lines) {
    //out(`parsing ${lines.length} lines`);
    var tabLines = trimJunk(lines);
    var blocks = tabsLinesToBlocks(tabLines);
    printTitleCSVStyle();
    for (var i = 0, l = blocks.length; i < l; i++) {
        var b = blocks[i];
        printBlockCSVStyle(b);
    }
}
function runFromStdIn() {
    var lines = [];
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
    });
    rl.on('line', function (line) {
        lines.push(line);
    });
    setTimeout(function () {
        parseDocument(lines);
        process.exit();
    }, 500);
}
runFromStdIn();
