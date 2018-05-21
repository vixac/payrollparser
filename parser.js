var readline = require('readline');

var print = console.log;

var currentPerson = emptyPerson();
var STATES = [  createIdState(),
    createDateState(),
    createProcessingState()
];

function emptyPerson() {
	return {
		state : -1,
		idString: "",
		dateString: "",
		processingString: ""
	};
}

function createState(isBegun, extract) {
	return {
		isBegun: isBegun,
		extract: extract 
	};
}




/* returns 
a string without the prefixed tabs
and the number of tabs removed.
*/
function parseTabs(line) {
	var numTabs = 0;
	var lineLength = line.length;

	for(var i = 0 ; i < lineLength; i++) {
		var c = line.charAt(i);
		if(c === "\t") {
			numTabs += 1;
		} else {
			return  {

				numTabs: numTabs,
				string: line.substring(numTabs)
			};
		}
	}
	return {
		numTabs: 0,
		string: ""
	};
}

function getValue(input) {
	var clean = parseTabs(input);
	return clean.string;
}

function createIdState() {
	var ID_TAB_COUNT = 3;
    function isBegin(input) {
    	var clean = parseTabs(input);
    	return clean.numTabs === ID_TAB_COUNT;
    }
    return createState(isBegin, getValue);
}

function createDateState() {
	var DATE_TAB_COUNT = 4;
	function isBegun(input) {
		var clean = parseTabs(input);
		return clean.numTabs === DATE_TAB_COUNT;
	}

	return createState(isBegun, getValue);
}

function createProcessingState() {
	var PROCESSING_CONTENT_TAB_COUNT = 8;
	function isBegun(input) {
		var clean  = parseTabs(input);
		return input.indexOf("Processing") !== 1 || clean.numTabs === 0 || clean.numTabs === PROCESSING_CONTENT_TAB_COUNT;
	}
	function getProcessingValue(input) {
		
		var clean = parseTabs(input);
		if(clean.numTabs === 0) { //ignore empty lines.
			return "";
		}
		if(clean.numTabs !== PROCESSING_CONTENT_TAB_COUNT) {
			return "";
		}
		return clean.string;
	}
	return createState(isBegun, getProcessingValue);
}

function append(string) {
	if(string === null) {
		return;
	}
	if(string.trim().length === 0 ) {
		return;
	}
	switch (currentPerson.state)  {
		case 0:
			currentPerson.idString += " " + string;
			break;
		case 1:
		 	currentPerson.dateString +=  " " + string;
		 	break;
		case 2: 
		    currentPerson.processingString +=  " " + string;
		    break;
		default:
		break;
	}
}

//get the next state index, looping it round if we've reached the end.
function nextBeginIndex() {
	var next = currentPerson.state + 1;
	if(next === STATES.length) {
		return 0;
	}
	return next;
}
var firstPass = true;
function addCompletedPersion() {
	if(firstPass) {
		firstPass = false ;
		return ;
	}
	var row = getRow(currentPerson);
	print(row);
	currentPerson = emptyPerson();
}
//read a single line of stdin


function quote(string) {
	return "\"" + string + "\"";
}
function comma(string) {
	return string + ",";
}

function getId(string) {
	var firstSpaceIndex = string.indexOf("\t");
	return string.substring(0,firstSpaceIndex);
}

function getName(string) {
	var firstSpaceIndex = string.indexOf(" ");
	return parseTabs(string.substring(firstSpaceIndex)).string;
}
function getRow(currentPerson) {
	var row = "";
	var comma = ",";

print("ID IS" + currentPerson.idString);
	var id = getId(currentPerson.idString);
	var name = getName(currentPerson.idString);
	row += quote(id);
	row += comma;
	row += quote()
	row += quote(currentPerson.dateString);
	row += comma;
	row += quote(currentPerson.processingString);
	return row;
}


function processLine(line) {
    var s = currentPerson.state;
    var next = nextBeginIndex();
    if(STATES[next].isBegun(line)) { //VXTODO this is wrong. first and second entities are getting scrambled.
		if(s === 0) {
    		addCompletedPersion();
    	}	
   		currentPerson.state = next;  
   		var output = STATES[next].extract(line);
   		append(output);
    }
    else if (s !== -1) {
    	append(STATES[s].extract(line));
    }
    if(endOfContent(line)) {
    	addCompletedPersion();
    	process.exit();
    }
}

function endOfContent(line) {
	return line.indexOf("Processing at End of Selection") !== -1;
}

//start reading stdin.
function main() {    
	var rl = readline.createInterface({
	  input: process.stdin,
	  output: process.stdout,
	  terminal: false
	});

	rl.on('line', function(line){
	    processLine(line);
	})
}

main();