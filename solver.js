// Step solver: type a problem, see every step in PEMDAS order.
// Lessons 1-4 (pieces, × ÷ pass, + − pass, parentheses) written by Derrick 10/24.
// Lessons 5-6 (exponents, pasted symbols, negatives, 2(3+4), solving for x) finished by Mark 10/30.
//
// Every number piece is a value { a, b } meaning a·x + b. Plain numbers have a = 0,
// so the same passes work for "12 + 3*4.5" and for "3(x - 2) = x + 4".

function value(a, b) {
    return { a: a, b: b };
}

function isValue(piece) {
    return typeof piece === "object";
}

// Rounds float noise: 0.1*3 shows 0.3, not 0.30000000000000004.
function clean(n) {
    const r = Math.round(n * 1e10) / 1e10;
    return r === 0 ? 0 : r;
}

// 0.75 -> "3/4" when a small fraction matches exactly, else null.
function asFraction(n) {
    if (Number.isInteger(n)) return null;
    for (let bottom = 2; bottom <= 1000; bottom++) {
        const top = Math.round(n * bottom);
        if (Math.abs(top / bottom - n) < 1e-9) return top + "/" + bottom;
    }
    return null;
}

// { a: 3, b: -2 } -> "3x - 2", { a: 0, b: 5 } -> "5", "*" -> "×"
function show(v) {
    if (!isValue(v)) return { "*": "×", "/": "÷" }[v] ?? v;
    const a = clean(v.a), b = clean(v.b);
    if (a === 0) return String(b);
    const xPart = a === 1 ? "x" : a === -1 ? "-x" : a + "x";
    if (b === 0) return xPart;
    return xPart + (b < 0 ? " - " + -b : " + " + b);
}

// One value inside a step label: 2x + 3 gets ( ) so "2 × (x + 3)" reads right.
function wrap(piece) {
    return clean(piece.a) !== 0 && clean(piece.b) !== 0 ? "(" + show(piece) + ")" : show(piece);
}

// A value with x AND a number in it gets ( ) so "2 × (x + 3)" reads right,
// and a negative number being powered gets ( ) so (-2) ^ 2 doesn't read as -2 ^ 2.
function showAll(pieces) {
    return pieces.map(function (piece, i) {
        if (!isValue(piece) || pieces.length === 1) return show(piece);
        const insideParens = pieces[i - 1] === "(" && pieces[i + 1] === ")";
        const mixed = clean(piece.a) !== 0 && clean(piece.b) !== 0;
        const negativeBase = clean(piece.a) === 0 && piece.b < 0 && pieces[i + 1] === "^";
        return (mixed && !insideParens) || negativeBase ? "(" + show(piece) + ")" : show(piece);
    }).join(" ");
}

// ---------- Lesson 1 (+ Lesson 5 Part B): chop the problem into pieces ----------

function tokenize(text) {
    // Pasted symbols become plain ones: × · → *, ÷ → /, − – → -, ² ³ → ^2 ^3
    const s = text.toLowerCase()
        .replace(/[×·]/g, "*").replace(/÷/g, "/").replace(/[−–]/g, "-")
        .replace(/²/g, "^2").replace(/³/g, "^3").replace(/\s+/g, "");
    const pieces = [];
    let i = 0;

    // 2(3), (1)(2) and 3x all mean multiply: add the * nobody typed.
    function pushValueOrOpen(piece) {
        const last = pieces[pieces.length - 1];
        if (last !== undefined && (isValue(last) || last === ")")) pieces.push("*");
        pieces.push(piece);
    }

    function readNumber() {
        let number = "";
        while (i < s.length && "0123456789.".includes(s[i])) {
            number = number + s[i];
            i = i + 1;
        }
        if (number === "." || number.split(".").length > 2) throw new Error("\"" + number + "\" isn't a number.");
        return Number(number);
    }

    while (i < s.length) {
        const ch = s[i];
        const last = pieces[pieces.length - 1];
        const afterOperator = last === undefined || (!isValue(last) && last !== ")");

        if ("0123456789.".includes(ch)) {
            const n = readNumber();
            if (s[i] === "x" && s[i + 1] !== "^") {
                pushValueOrOpen(value(n, 0));   // 3x is one piece
                i = i + 1;
            } else {
                pushValueOrOpen(value(0, n));
            }
        } else if (ch === "x") {
            pushValueOrOpen(value(1, 0));
            i = i + 1;
        } else if (ch === "-" && afterOperator) {
            // A negative sign, not subtract: -3, 2 * -3, -(1 + 2), -x
            i = i + 1;
            if (i < s.length && "0123456789.".includes(s[i])) {
                const n = readNumber();
                if (s[i] === "^") {
                    // -2^2 means -(2^2) = -4, so the minus stays outside the power
                    pieces.push(value(0, -1), "*", value(0, n));
                } else if (s[i] === "x" && s[i + 1] !== "^") {
                    pieces.push(value(-n, 0));   // -3x is one piece
                    i = i + 1;
                } else {
                    pieces.push(value(0, -n));
                }
            } else if (s[i] === "x" && s[i + 1] !== "^") {
                pieces.push(value(-1, 0));   // -x is one piece
                i = i + 1;
            } else {
                pieces.push(value(0, -1), "*");
            }
        } else if (ch === "+" && afterOperator) {
            i = i + 1;   // a plus sign in front of a number changes nothing
        } else if (ch === "(") {
            pushValueOrOpen("(");
            i = i + 1;
        } else if ("+-*/^)=".includes(ch)) {
            pieces.push(ch);
            i = i + 1;
        } else {
            throw new Error("I don't know what \"" + ch + "\" means here. Use numbers, x, + - * / ^ ( ) and =.");
        }
    }
    return pieces;
}

// Catches typos before solving, with a plain reason.
function check(pieces) {
    if (pieces.length === 0) throw new Error("One side is empty. Type something on both sides of the =.");
    let depth = 0;
    pieces.forEach(function (piece, i) {
        if (piece === "(") depth = depth + 1;
        if (piece === ")") {
            depth = depth - 1;
            if (depth < 0) throw new Error("There's a ) without a ( before it.");
            if (pieces[i - 1] === "(") throw new Error("There's an empty ( ).");
        }
        if (!isValue(piece) && "+-*/^".includes(piece)) {
            const before = pieces[i - 1], after = pieces[i + 1];
            if (before === undefined || (!isValue(before) && before !== ")")) throw new Error("\"" + show(piece) + "\" needs a number before it.");
            if (after === undefined || (!isValue(after) && after !== "(")) throw new Error("\"" + show(piece) + "\" needs a number after it.");
        }
    });
    if (depth > 0) throw new Error("A ( never got closed with a ).");
}

// ---------- Lesson 5: exponents (right to left: 2^3^2 = 2^9 = 512) ----------

function exponents(pieces, start) {
    let end = start;
    while (end < pieces.length && pieces[end] !== ")") end = end + 1;
    let i = pieces.lastIndexOf("^", end - 1);
    while (i >= start) {
        const left = pieces[i - 1];
        const right = pieces[i + 1];
        if (right.a !== 0) throw new Error("x can't be up in the exponent here.");
        let answer;
        if (left.a !== 0) {
            if (right.b !== 1) throw new Error("This solver does x to the 1st power only. For x² use the quadratic pages.");
            answer = left;
        } else {
            answer = value(0, Math.pow(left.b, right.b));
            if (!isFinite(answer.b)) throw new Error(show(left) + " ^ " + show(right) + " isn't a real number.");
        }
        pieces.splice(i - 1, 3, answer);
        addStep((left.b < 0 && left.a === 0 ? "(" + show(left) + ")" : show(left)) + " ^ " + show(right) + " = " + show(answer), pieces);
        end = end - 2;
        i = pieces.lastIndexOf("^", end - 1);
    }
}

// ---------- Lesson 2: multiply / divide, left to right ----------

function multiplyDivide(pieces, start) {
    let i = start;
    while (i < pieces.length && pieces[i] !== ")") {
        const op = pieces[i];
        if (op === "*" || op === "/") {
            const left = pieces[i - 1];
            const right = pieces[i + 1];
            let answer;
            if (op === "*") {
                if (left.a !== 0 && right.a !== 0) throw new Error("x times x makes x². This solver does x to the 1st power only.");
                if (left.a !== 0) {
                    answer = value(left.a * right.b, left.b * right.b);
                } else {
                    answer = value(right.a * left.b, right.b * left.b);
                }
            } else {
                if (right.a !== 0) throw new Error("Dividing by x isn't something this solver does.");
                if (right.b === 0) throw new Error("Can't divide by 0: " + show(left) + " ÷ 0 has no answer.");
                answer = value(left.a / right.b, left.b / right.b);
            }
            pieces.splice(i - 1, 3, answer);
            addStep(wrap(left) + " " + show(op) + " " + wrap(right) + " = " + show(answer), pieces);
        } else {
            i = i + 1;
        }
    }
}

// ---------- Lesson 3: add / subtract, left to right ----------

function addSubtract(pieces, start) {
    let i = start;
    while (i < pieces.length && pieces[i] !== ")") {
        const op = pieces[i];
        if (op === "+" || op === "-") {
            const left = pieces[i - 1];
            const right = pieces[i + 1];
            const sign = op === "+" ? 1 : -1;
            const answer = value(left.a + sign * right.a, left.b + sign * right.b);
            pieces.splice(i - 1, 3, answer);
            // 2x + 3 has nothing to combine (x's and plain numbers stay apart), so it isn't a step
            const unlike = (left.a === 0 || right.a === 0) && (left.b === 0 || right.b === 0);
            if (!unlike) addStep(wrap(left) + " " + op + " " + wrap(right) + " = " + show(answer), pieces);
        } else {
            i = i + 1;
        }
    }
}

// ---------- Lesson 4: parentheses, innermost first ----------

function parentheses(pieces) {
    let close = pieces.indexOf(")");
    while (close !== -1) {
        const open = pieces.lastIndexOf("(", close);
        exponents(pieces, open + 1);
        multiplyDivide(pieces, open + 1);
        addSubtract(pieces, open + 1);
        pieces.splice(open, 3, pieces[open + 1]);
        addStep("Drop the ( )", pieces);
        close = pieces.indexOf(")");
    }
}

// One whole side, in PEMDAS order. Returns its single value.
function simplify(pieces) {
    parentheses(pieces);
    exponents(pieces, 0);
    multiplyDivide(pieces, 0);
    addSubtract(pieces, 0);
    return pieces[0];
}

// ---------- Lesson 6: solve for x ----------

function solveEquation(left, right) {
    const a = left.a - right.a;
    const b = right.b - left.b;
    addRaw("Both sides simplified", show(left) + " = " + show(right));
    if (clean(right.a) !== 0) {
        addRaw((right.a < 0 ? "Add " + show(value(-right.a, 0)) + " to" : "Subtract " + show(value(right.a, 0)) + " from") + " both sides",
            show(value(a, left.b)) + " = " + show(value(0, right.b)));
    }
    if (clean(left.b) !== 0) {
        addRaw((left.b < 0 ? "Add " + clean(-left.b) + " to" : "Subtract " + clean(left.b) + " from") + " both sides",
            show(value(a, 0)) + " = " + clean(b));
    }
    if (clean(a) === 0) {
        addRaw("The x's cancelled", "0 = " + clean(b));
        return clean(b) === 0 ? "True for every x: any number works." : "That's false, so there's no solution.";
    }
    const x = b / a;
    if (clean(a) !== 1) addRaw("Divide both sides by " + clean(a), "x = " + clean(b) + " ÷ " + clean(a));
    const fraction = asFraction(clean(x));
    addRaw("Answer", "x = " + clean(x) + (fraction ? "  (= " + fraction + ")" : ""));
    return "x = " + clean(x) + (fraction ? " = " + fraction : "") + ". Check: both sides come out to " + clean(left.a * x + left.b) + ".";
}

// ---------- Showing the steps ----------

let sideLabel = "";   // "(left side)" / "(right side)" while solving an equation

function addRaw(label, math) {
    const li = document.createElement("li");
    const text = document.createElement("div");

    const what = document.createElement("span");
    what.className = "step-label";
    what.textContent = label;

    const shown = document.createElement("span");
    shown.className = "step-math";
    shown.textContent = math;

    text.appendChild(what);
    text.appendChild(shown);
    li.appendChild(text);
    document.getElementById("steps").appendChild(li);
}

function addStep(label, pieces) {
    addRaw(label + (sideLabel ? "  " + sideLabel : ""), showAll(pieces));
}

function showPieces(event) {
    event.preventDefault();
    const text = document.getElementById("problem").value;
    const error = document.getElementById("error");
    const plain = document.getElementById("plain");
    document.getElementById("steps").replaceChildren();
    error.textContent = "";
    plain.textContent = "";
    sideLabel = "";

    try {
        const pieces = tokenize(text);
        const equals = pieces.filter(function (piece) { return piece === "="; }).length;
        if (equals > 1) throw new Error("Only one = please.");
        if (equals === 0) {
            check(pieces);
            addStep("The pieces", pieces);
            const answer = simplify(pieces);
            const fraction = clean(answer.a) === 0 ? asFraction(clean(answer.b)) : null;
            plain.textContent = "= " + show(answer) + (fraction ? " = " + fraction : "") + (clean(answer.a) !== 0 ? "  (simplified)" : "");
            return;
        }
        const at = pieces.indexOf("=");
        const left = pieces.slice(0, at), right = pieces.slice(at + 1);
        check(left);
        check(right);
        addRaw("The pieces", showAll(left) + " = " + showAll(right));
        const hasX = pieces.some(function (piece) { return isValue(piece) && piece.a !== 0; });
        sideLabel = "(left side)";
        const l = simplify(left);
        sideLabel = "(right side)";
        const r = simplify(right);
        sideLabel = "";
        if (!hasX) {
            plain.textContent = clean(l.b) === clean(r.b) ? "True: both sides are " + show(l) + "." : "False: " + show(l) + " isn't " + show(r) + ".";
            return;
        }
        plain.textContent = solveEquation(l, r);
    } catch (problem) {
        error.textContent = problem.message;
    }
}

document.getElementById("solve-form").addEventListener("submit", showPieces);
