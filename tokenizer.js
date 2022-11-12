const TT_VAR = "VAR";
const TT_NUM = "NUM";
const TT_SIGN = "SIGN";
const TT_EOL = "EOL";
const TT_EOF = "EOF";
const TT_COMMAND = "COMMAND";
const TT_MARKER = "MARKER";
const TT_MARKER_POS = "MARKERPOS";
const TT_UNKNOWN = "UNKNOWN";

const TT_CHILD = "CHILD";

const ERR_UNEXPECTED_END = "unexpected end";
const ERR_UNEXPECTED_ELSE = "unexpected else";
const ERR_UNKNOWN_CHARACTER = "unknown character";
const ERR_COMMAND_NOT_RECOGNIZED = "command not recognized";
const ERR_MARKER_NOT_FOUND = "marker not found";
const ERR_EMPTY_LOOP = "empty loop";
const ERR_EMPTY_WHILE = "empty while";
const ERR_IF_NO_GOTO = "if contains something else than GOTO MARKER"

function isDigit(c) {
  return c >= "0" && c <= "9";
}
function isLetter(c) {
  return c >= "A" && c <= "Z";
}
function isSign(c) {
  return c == "-" || c == "+" || c == "!" || c == "<" || c == ">" || c == "=";
}

function makeToken(type, pos, line, value, parent) {
  return { pos: pos, type: type, line: line, value: value, parent: parent };
}

function getPos(token) {
  return "(" + token.line + ", " + token.pos + ")";
}

function tokenString(t) {
    if(t.type == TT_VAR) return "x" + t.value;
    if(t.type == TT_MARKER) return "M" + t.value;
    if(t.type == TT_MARKER_POS) return "M" + t.value + ":";
    if(t.type == TT_EOL) return ";";
    if(t.type == TT_CHILD || t.type == TT_EOF) return t.type;

    return t.value;
}

// turn string of code into array of tokens

// returns undefined when encountering error
function tokenize(s) {
  s = s.toUpperCase();
  let i = 0;
  let lookahead;
  let tokens = [];
  let line = 0;
  // walk through each character of string
  while (i < s.length) {
    lookahead = s[i];

    // skip new lines and whitespaces
    if (lookahead == "\n") {
      line += 1;
      i += 1;
    } else if (lookahead == " " || lookahead == "\t") {
      i += 1;
    }
    // COMMENT
    // skip comments
    else if (lookahead == "#") {
      while (lookahead != "\n" && i < s.length) {
        i += 1;
        lookahead = s[i];
      }
    }
    // create token after this
    // VARIABLE
    else if (lookahead == "X") {
      let start = i;
      i += 1;
      lookahead = s[i];
      let value = "";
      while (isDigit(lookahead) && i < s.length) {
        value += lookahead;
        i += 1;
        lookahead = s[i];
      }
      tokens.push(makeToken(TT_VAR, start, line, parseInt(value)));
    }
    // NUMBER
    else if (isDigit(lookahead)) {
      let start = i;
      let value = "";
      while (isDigit(lookahead) && i < s.length) {
        value += lookahead;
        i += 1;
        lookahead = s[i];
      }
      tokens.push(makeToken(TT_NUM, start, line, parseInt(value)));
    }
    // MARKER
    else if (lookahead == "M") {
      let start = i;
      i += 1;
      lookahead = s[i];
      let value = "";
      while (isDigit(lookahead) && i < s.length) {
        value += lookahead;
        i += 1;
        lookahead = s[i];
      }
      if (lookahead == ":") {
        tokens.push(makeToken(TT_MARKER_POS, start, line, parseInt(value)));
        i += 1;
      } else {
        tokens.push(makeToken(TT_MARKER, start, line, parseInt(value)));
      }
    }
    // COMMAND
    else if (isLetter(lookahead)) {
      let value = "";
      let start = i;
      while (isLetter(lookahead) && i < s.length) {
        value += lookahead;
        i += 1;
        lookahead = s[i];
      }
      tokens.push(makeToken(TT_COMMAND, start, line, value));
    }
    // END OF LINE
    else if (lookahead == ";") {
      tokens.push(makeToken(TT_EOL, i, line, lookahead));
      i += 1;
    }
    // SIGN
    else if (isSign(lookahead)) {
      let start = i;
      let value = "";
      while (isSign(lookahead) && i < s.length) {
        value += lookahead;
        i += 1;
        lookahead = s[i];
      }
      tokens.push(makeToken(TT_SIGN, start, line, value));
    } else {
      cons.error(
        ERR_UNKNOWN_CHARACTER,
        makeToken(TT_UNKNOWN, i, line, lookahead)
      );
      return;
    }
  }
  tokens.push(makeToken(TT_EOF, i, line));

  return tokens;
}
