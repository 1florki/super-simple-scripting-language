CodeMirror.defineSimpleMode("simplemode", {
  start: [
    { regex: /x\d+/, token: "variable-2" },
    { regex: /M\d+/, token: "string" },
    { regex: /THEN/, indent: true, token: "keyword" },
    { regex: /END/, dedent: true, token: "keyword", dedentIfLineStart: true },
    { regex: /(?:IF|GOTO|LOOP|WHILE)\b/, token: "keyword" },
    { regex: /\d+/, token: "number" },
    { regex: /#.*/, token: "comment" },
    { regex: /[-+\/*=<>!]+/, token: "operator" },
  ],
});
CodeMirror.defineSimpleMode("consolemode", {
  start: [
    { regex: /#.*/, token: "keyword" },
    { regex: />.*/, token: "number" },
  ],
});

var cons = CodeMirror(document.querySelector("#console-div"), {
  value: "",
  mode: "consolemode",
  theme: "dracula",
  readOnly: "nocursor",
  lineWrapping: true,
});

cons.log = (v) => {
  cons.setValue(cons.getValue() + v + "\n");

  cons.scrollIntoView({ line: cons.lineCount() - 1, ch: 0 });
};

cons.error = (v, token, endtoken) => {
  let s = "";
  if(endtoken) {
    s += "lines " + (token.line + 1) + " - " + (endtoken.line + 1) + ":";
  } else {
    s += "line " + (token.line + 1) + ":";
  }
  cons.log("# ERROR! " + s + " " + v);
}
cons.log("hello world!");

var editor = CodeMirror(document.querySelector("#code-div"), {
  mode: "simplemode",
  lineNumbers: true,
  tabSize: 2,
  lineWrapping: true,
  value: `x1 = x1 + 2;
x2 = x2 + 3;

x3 = x1 + 0;
x4 = x1 + 0;

# add and subtract x1 and x2
LOOP x2 THEN
  x3 = x3 - 1;
  x4 = x4 + 1;
END;

# multiply x1 and x2
LOOP x1 THEN
  LOOP x2 THEN
    x5 = x5 + 1;
  END;
END;`,
  theme: "3024-night",
});

addMemTable([], 100);

function dehighlightAll() {
  let children = document.getElementsByClassName("CodeMirror-code")[0].children;
  for (let c of children) {
    c.removeAttribute("style");
  }
}

editor.highlight = (x) => {
  let children = document.getElementsByClassName("CodeMirror-code")[0].children;
  for (let c of children) {
    c.removeAttribute("style");
  }
  if (x == undefined) return;
  if (children.length <= x) return;
  if (x < 0) x = children.length + x;

  children[x].setAttribute("style", "background: rgba(100, 100, 100, 0.5);");
};

editor.updateMemTable = (array, num) => {
  num = num == undefined ? array.length : num;
  for (let i = 0; i < num; i++) {
    let cell = document.getElementById("cell" + i);
    let data = i < array.length ? array[i] : 0;
    if (cell != undefined) cell.innerHTML = data;
  }
};

function addMemTable(array, num) {
  var table = document.getElementById("memTable");
  num = num == undefined ? array.length : num;
  for (var i = 0; i < num; i++) {
    var row = document.createElement("TR");

    var indexCell = document.createElement("TD");
    indexCell.setAttribute("style", "background: rgb(50, 50, 50);");
    var dataCell = document.createElement("TD");
    dataCell.setAttribute("id", "cell" + i);

    row.appendChild(indexCell);
    row.appendChild(dataCell);

    var index = document.createTextNode(i);
    var data = document.createTextNode(i < array.length ? array[i] : 0);

    indexCell.appendChild(index);
    dataCell.appendChild(data);

    table.appendChild(row);
    document.body.appendChild(document.createElement("hr"));
  }
}

let running = false;
function run() {
  running = !running;
  editor.setOption("readOnly", running);

  let runButton = document.getElementById("runButton");
  runButton.setAttribute("class", running ? "stopButton" : "startButton");
  runButton.innerHTML = running ? "Stop" : "Run";

  if (running) {
    //cons.log("starting...");
    let code = editor.getValue();
    let tokens = tokenize(code);
    //cons.log("tokenized...");
    let sourceTree = parse(tokens);
    cons.log("parsed...");
    //cons.log(walk(sourceTree.value));
    cons.log("running...");
    let i = new Interpreter(sourceTree);
    let success = i.start();
    editor.updateMemTable(i.x);
    if(success) {
      cons.log("> ran successfully!");
    }
  }

  running = !running;
  editor.setOption("readOnly", running);

  runButton.setAttribute("class", running ? "stopButton" : "startButton");
  runButton.innerHTML = running ? "STOP" : "RUN";
  
  runButton.addEventListener("click", run);
}

window.onload = () => {
  let runButton = document.getElementById("runButton");
  runButton.addEventListener("click", run);

  let showMemButton = document.getElementById("showMemButton");
  showMemButton.addEventListener("click", () => {
    let mem = document.getElementById("table-wrapper");
    let current = mem.getAttribute("style") == "display: none;";
    console.log(current);
    mem.setAttribute("style", current ? "display: block;" : "display: none;");
    let code = document.getElementById("code-wrapper");
    code.setAttribute("class", current ? "" : "full");
  });
}
/*
# calculate factorial(n)
# set x1 to n
x1 = x1 + 8;

# save x1 in x5
x5 = x1 + 0;

# set x1 and x2 = 1
x1 = x100 + 1;
x2 = x100 + 1;

# loop n times
LOOP x5 THEN
  # next number
  # multiply current number with interim result
  x3 = x100 + 0;
	LOOP x1 THEN
  	LOOP x2 THEN
    	x3 = x3 + 1;
  	END;
	END;
  x2 = x2 + 1;
  x1 = x3 + 0;
END;

x0 = x1 + 0;
*/
