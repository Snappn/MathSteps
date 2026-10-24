function tokenize(text) {
    const pieces = [];
    let number = "";

    for(const ch of text) {
        if ("0123456789.".includes(ch)) {
            number = number + ch;
        } else { 
            if (number !== "") {
                pieces.push(number);
                number = "";
            }
            if ("+-*/()".includes(ch)) {
                pieces.push(ch);
            }
        }
    }
    if (number !== "") {
        pieces.push(number);
    }
    return pieces; 
}

function multiplyDivide(pieces, start) {
    let i = start;
    while (i < pieces.length && pieces[i] !== ")") {
        const op = pieces[i];
        if (op === "*" || op === "/") {
            const left = Number(pieces[i - 1]);
            const right = Number(pieces[i + 1]);
            let answer;
            if (op === "*") {
                answer = left * right;
            } else {
                answer = left / right;
            }
            pieces.splice(i - 1, 3, String(answer));
            addStep(left + " " + op + " " + right + " = " + answer, pieces);
        } else {
            i = i + 1;
        }
    }
}

function addSubtract(pieces, start) { 
    let i = start;
    while (i < pieces.length && pieces[i] !== ")") {
        const op = pieces[i];
        if (op === "+"  || op === "-") {
            const left = Number(pieces[i - 1]);
            const right = Number(pieces[i + 1]);
            let answer; 
            if (op === "+") {
                answer = left + right;
            } else { 
                answer = left - right;
            }
            pieces.splice(i - 1, 3, String(answer));
            addStep(left + " " + op + " " + right + " = " + answer, pieces);
        } else {
            i = i + 1;
        }
    }
}

function parentheses(pieces) {
    let close = pieces.indexOf(")");
    while (close !== -1) {
        const open = pieces.lastIndexOf("(", close);
        multiplyDivide(pieces, open + 1);
        addSubtract(pieces, open + 1);
        pieces.splice(open, 3, pieces[open + 1]);
        addStep("Drop the ( )", pieces);
        close = pieces.indexOf(")");
    }
}

function addStep(label, pieces) {
    const li = document.createElement("li");
    const text = document.createElement("div");

    const what = document.createElement("span");
    what.className = "step-label";
    what.textContent = label;

    const math = document.createElement("span");
    math.className = "step-math";
    math.textContent = pieces.join(" ");

    text.appendChild(what);
    text.appendChild(math);
    li.appendChild(text);
    document.getElementById("steps").appendChild(li);
}

function showPieces(event) {
    event.preventDefault();
    const text = document.getElementById("problem").value;
    const pieces = tokenize(text);

    document.getElementById("steps").replaceChildren();
    addStep("The pieces", pieces);
    parentheses(pieces);
    multiplyDivide(pieces, 0);
    addSubtract(pieces, 0);
}
document.getElementById("solve-form").addEventListener("submit", showPieces);