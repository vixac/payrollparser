declare function require(name:string): any;
var readline = require('readline');
var process = require('process');
var out = console.log;
var fs = require('fs')

class  Block {
    public id:string
    public name:string
    public date:string
    public errors:string = ""
    constructor(lines:TabLine[]) {
        
        for(var i=0,l=lines.length; i<l;i++) {
            var line = lines[i]
            switch(line.linetype) {
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
                case LineType.Splits:{
                    break;
                }
                case LineType.Unknown: {
                    this.errors +=(line.cleanLine);
                }
            
            }
        }
    }
}
interface Row {
    
}
class TabLine {
    public numTabs: number
    public cleanLine: string
    public linetype: LineType
    constructor(line) {
        var numTabs = 0;
        for(var i = 0, l = line.length ; i < l; i++) {
            var c = line.charAt(i);
            if(c === "\t") {
                numTabs += 1;
            } else {
                this.numTabs = numTabs
                this.cleanLine = line.substring(numTabs)
                this.linetype = toLineType(numTabs)
                return;
            }   
        }
        this.numTabs = numTabs
        this.cleanLine = line
        this.linetype = LineType.Ignore
    }
    
}
interface CSV {
    title: string
    rows: string[]
}

enum LineType {
    Ignore = 0,
    UserName = 3,
    Date = 4,
    Splits = 5,
    Processing =7,
    Unknown = -1
}


//returns id and name
function parseUserLine(line:string): [string,string] {
    var firstSpace = line.indexOf("\t");
    var id = line.substr(0,firstSpace);
    var rest = line.substring(firstSpace);
    var startOfName: number = 0 
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
    
    return [id, tabLine.cleanLine]
}

function toLineType(numTabs: number): LineType {
    switch(numTabs) {
        case LineType.Ignore: {
            return LineType.Ignore
        }
        case LineType.UserName: {
            return LineType.UserName
        }
        case LineType.Date: {
            return LineType.Date
        }
        case LineType.Splits: {
            return LineType.Splits
        }
        case LineType.Processing: {
            return LineType.Processing
        }
    }
    return LineType.Unknown
}

function isStartLine(tabLine: TabLine): boolean {
    return tabLine.numTabs === 3;
}
function isEndLine(line:string): boolean {
    return line.indexOf("Processing at End of Selection") !== -1;
}

function trimJunk(lines: string[]): TabLine[] {
    var output:TabLine[] = []
    var started:boolean = false 
    for(var i = 0, l = lines.length ; i < l; i++) {
        var line = lines[i];
        var tabLine = new TabLine(line);
        if (tabLine.numTabs == LineType.Ignore) {
            continue;
        }
        if (!started && isStartLine(tabLine)) {
            started = true;
        }
        if(started) {
            if(isEndLine(line)) {
                return output
            }
            output.push(tabLine)
        }
    }
}

function tabsLinesToBlocks(tabLines:TabLine[]): Block[] {
    var blocks:Block[] = []
    var currentLines:TabLine[] =[]
    var postProcessing = false
    for(var i = 0, l = tabLines.length ; i < l; i++) {
        var tab = tabLines[i];
        if(tab.numTabs === LineType.UserName) {
            if(currentLines.length > 0) {
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
    return blocks
}

function getCSVTitle(): string {
    return "Id, Name, Date, Errors"; 
}


//VXTODO RM
function printTitleCSVStyle() {
    out(`Id, Name, Date, Errors`);
}

//VXTODO RM
function printBlockCSVStyle(b: Block) {
    //for(var i=0, l = b.length; i<l; i++) {
    //    out(`lineType => ${LineType[b.lines[i].linetype]}: "${b.lines[i].cleanLine}"`);
    //}

    //out(`Block: ID:"${b.id}", name:"${b.name}", date:"${b.date}",errors: "${b.errors}"`)
    out(`${b.id}, ${b.name}, ${b.date}, ${b.errors}`)
}

function CSVStyle(b: Block): string {
    return `${b.id}, ${b.name}, ${b.date}, ${b.errors}`;
}

//VXTODO RM
function parseDocument(lines: string[]): void { 
    //out(`parsing ${lines.length} lines`);
    var tabLines = trimJunk(lines);
    var blocks = tabsLinesToBlocks(tabLines);
    printTitleCSVStyle()
    for(var i = 0, l = blocks.length ; i < l; i++) {
        var b = blocks[i];
        printBlockCSVStyle(b);
    }
}

function parse(lines: string[]): string[] {
    var tabLines = trimJunk(lines);
    var blocks = tabsLinesToBlocks(tabLines);
    var output: string[] = []
    output.push(getCSVTitle());
    for(var i = 0, l = blocks.length ; i < l; i++) {
        var b = blocks[i];
        output.push(CSVStyle(b))
    }
    return output
}

function runFromStdIn(): void {
    
    var lines: string[] = []
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
    });
  
    rl.on('line', function(line){
          lines.push(line);
    });
    setTimeout(() => {
        parseDocument(lines)
        process.exit();
    }, 500);
}

function runWithInputFile(fileName: string, outputFileName: string): void {
  fs.readFile(fileName, 'utf8', function(err, data) {
    if (err) { 
        out(`Oops! Tabby couldn't open ${fileName}. Heres why: \n ${err}`)
        return 
    }
    out(`Reading file ...`);
    var lines: string[] = data.split('\n');
    out(`${fileName} is ${lines.length} lines long.`);
    var output = parse(lines);
    
    out(`Tabby has finished reading '${fileName}`)
    var outputString = ""
    for(var i = 0, l = output.length ; i < l; i++) {
        outputString += output[i] + "\n";
    }
    fs.writeFile(outputFileName, outputString, function(err){ 
        if(err) {
            out(`Error saving output: ${err}`)
        }
        else {
            out(`${output.length} rows created. Output saved in '${outputFileName}'`)
            out(`Tabby is finished..............................`)
        }
    });
  });
}

function main():void {
    out(`Tabby is starting.............................`)
    var fileName: string = process.argv[2] || "files/input.txt";
    var outputFileName: string = process.argv[3] || "files/output.csv";
    out(`Looking for input file named '${fileName}'`)
    runWithInputFile(fileName, outputFileName);
}

main();

