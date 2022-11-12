// {var}, {num}, {child}, {marker}
var validCommands = [
  {
    struct: ["{var}", "=", "{var}", "+", "{num}"],
    f: (c, i) => {
      let var2 = i.getMem(c[2].value);
      i.setMem(c[0].value, var2 + c[4].value);
      return true;
    },
  },
  {
    struct: ["{var}", "=", "{var}", "-", "{num}"],
    f: (c, i) => {
      let var2 = i.getMem(c[2].value);
      i.setMem(c[0].value, var2 - c[4].value);
      return true;
    },
  },
  {
    struct: ["LOOP", "{var}", "THEN", "{child}", "END"],
    children: 1,
    f: (c, i) => {
      let num = i.getMem(c[1].value);

      if (c[3].value.length == 0) {
        cons.error(ERR_EMPTY_LOOP, c[3]);
        return false;
      }
      for (let x = 0; x < num; x++) {
        if (i.interpret(c[3].value[0], false) == false) return false;
      }
      return true;
    },
  },
  {
    struct: ["IF", "{var}", "=", "{num}", "THEN", "{child}", "END"],
    f: (c, i) => {
      if (i.getMem(c[1].value) == c[3].value) {
        if (
          c[5].value.length != 3 ||
          c[5].value[0].value != "goto" ||
          c[5].value[1].type != TT_MARKER
        ) {
          cons.error(ERR_IF_NO_GOTO, c[5]);
          return false;
        }
        return i.interpret(c[5].value[0], false);
      }
      return true;
    },
  },
  {
    struct: ["WHILE", "{var}", "!=", "{num}", "THEN", "{child}", "END"],
    f: (c, i) => {
      if (c[5].value.length == 0) {
        cons.error(ERR_EMPTY_WHILE, c[5]);
      }
      while (i.getMem(c[1].value) != c[3].value) {
        if (i.interpret(c[5].value[0], false) == false) return false;
      }
      return true;
    },
  },
  {
    struct: ["GOTO", "{marker}"],
    f: (c, i) => {
      let marker = i.findMarker(c[1].value);
      if (marker == undefined) {
        cons.error(ERR_MARKER_NOT_FOUND, c[1]);
        return false;
      }
      i.interpret(marker);
      return false;
    },
  },
];

class Interpreter {
  constructor(tree) {
    this.tree = tree;
    this.x = [];
  }
  start() {
    return this.interpret(this.tree.value[0]);
  }

  findMarker(marker, children) {
    children = children || this.tree.value;
    for (let i = 0; i < children.length; i++) {
      let token = children[i];
      if (token.type == TT_MARKER_POS && token.value == marker) return token;
      if (token.type == TT_CHILD) {
        let result = this.findMarker(marker, token.value);
        if (result) return result;
      }
    }
  }

  print() {
    for (let i = 0; i < this.x.length; i++) {
      cons.log("x" + i + ": " + this.x[i]);
    }
  }
  getMem(i) {
    if (i >= this.x.length) return 0;
    else return this.x[i];
  }
  setMem(i, val) {
    while (i >= this.x.length) this.x.push(0);
    this.x[i] = Math.max(val, 0);
  }

  printCommand(command) {
    let s = "";
    for (let i = 0; i < command.length; i++) {
      s += " " + tokenString(command[i]);
    }
    return s;
  }

  interpret(token, shouldGoOn) {
    let lookahead = token;
    while (token != undefined) {
      let command = [];

      while (
        lookahead.type != TT_EOL &&
        lookahead.type != TT_EOF
      ) {
        if (lookahead.type != TT_MARKER_POS) command.push(lookahead);
        lookahead = lookahead.next;
        if(lookahead == undefined) {
            console.log("shiat")
        }
      }
      let shouldContinue = this.executeCommand(command);
      if (shouldContinue == false) return false;

      if (shouldGoOn == false && lookahead.parent != lookahead.next.parent) {
        return;
      }

      lookahead = lookahead.next;
      if(lookahead == undefined) return true;
    }
    return true;
  }
  executeCommand(command) {
    //console.log(this.printCommand(command));
    if (command.length < 1) return true;
    if(command.length == 1 && (command[0].type == TT_EOL || command.value == "END")) return true;

    for (let valid of validCommands) {
      let struct = valid.struct;
      let check = struct.length == command.length;

      for (let i = 0; i < struct.length && check; i++) {
        let validWord = struct[i];
        if (i >= command.length) {
          check = false;
          break;
        }
        if (validWord.startsWith("{")) {
          if (
            (validWord == "{var}" && command[i].type != TT_VAR) ||
            (validWord == "{num}" && command[i].type != TT_NUM) ||
            (validWord == "{marker}" && command[i].type != TT_MARKER) ||
            (validWord == "{child}" && command[i].type != TT_CHILD)
          ) {
            check = false;
            break;
          }
        } else if (validWord != command[i].value) {
          check = false;
          break;
        }
      }
      if (check) {
        return valid.f(command, this);
      }
    }
    cons.error(
      ERR_COMMAND_NOT_RECOGNIZED + this.printCommand(command),
      command[0],
      command[command.length - 1]
    );
    return false;
  }
}
