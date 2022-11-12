var indent = 1;

// returns print of source tree (call with tree.value)
// walk through
function walk(tree) {
  let output = "\n--" + Array(indent).join("--");
  tree.forEach((node, i) => {
    let c;
    if (node.type == TT_CHILD) {
      indent++;
      output += walk(node.value);
      indent--;
    } else if (node.type == TT_VAR) c = "x" + node.value;
    else if (node.type == TT_MARKER) c = "M" + node.value;
    else if (node.type == TT_MARKER_POS) c = "M" + node.value + ":";
    else if (node.type == TT_EOL)
      c = ";\n" + Array(indent + (i == tree.length - 1 ? 0 : 1)).join("--");
    else if (node.type != TT_EOF) c = node.value;

    if (c != undefined) output += (node.type == TT_EOL ? "" : " ") + c;
  });
  return output;
}

// returns source tree as {value: [array]} where array is a list of tokens
// and child tokens having their own array as a value

// returns undefined when encountering error
function parse(t) {
  let tree = { value: [] };
  let current = tree;
  let i = 0;
  while (i < t.length) {
    let token = t[i];
    token.parent = current.parent;
    token.index = current.value.length;

    if(current.value.length > 0) {
        current.value[current.value.length - 1].next = token;
    }
    if (token.type == TT_COMMAND) {
      if (token.value == "THEN") {
        current.value.push(token);
        let child = makeToken(TT_CHILD, token.pos, token.line, [], current);
        token.next = child;
        child.index = current.value.length;

        current.value.push(child);
        current = child;
      } else if (token.value == "ELSE") {
        current = current.parent;
        if (current == undefined) {
          cons.error(ERR_UNEXPECTED_ELSE, token);
          return;
        }

        if(current.value.length > 0) {
            current.value[current.value.length - 1].next = token;
        }

        current.value.push(token);
        let child = makeToken(TT_CHILD, token.pos, token.line, [], current);
        token.next = child;

        child.index = current.value.length;
        current.value.push(child);
        current = child;
      } else if (token.value == "END") {
        if (current.value.length == 0) {
          cons.error(ERR_UNEXPECTED_END, token);
          return;
        }

        current = current.parent;
        if (current == undefined) {
          cons.error(ERR_UNEXPECTED_END, token);
          return;
        }

        if(current.value.length > 0) {
            current.value[current.value.length - 1].next = token;
        }

        token.parent = current.parent;
        current.value.push(token);
      } else {
        current.value.push(token);
      }
    } else {
      current.value.push(token);
    }
    i += 1;
  }
  return tree;
}
