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
            if ("+-*/".includes(ch)) {
                pieces.push(ch);
            }
        }
    }
    if (number !== "") {
        pieces.push(number);
    }
    return pieces; 
}

function multiplyDivide(pieces) {
    let i = 0;
    while (i < pieces.length) {
        const op = pieces[i];
        if (op === "*" || op === "/") {
            const left = Number(pieces[i - 1]);
            const right = Number(pieces[i +1]);
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
    multiplyDivide(pieces);
}
document.getElementById("solve-form").addEventListener("submit", showPieces);