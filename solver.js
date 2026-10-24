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

function showPieces(event) {
    event.preventDefault();
    const text = document.getElementById("problem").value;
    const pieces = tokenize(text);

    const steps = document.getElementById("steps");
    steps.replaceChildren();
    const li = document.createElement("li");
    const math = document.createElement("span");
    math.className = "step-math";
    math.textContent = pieces.join(" | ");
    li.appendChild(math);
    steps.appendChild(li);
}
document.getElementById("solve-form").addEventListener("submit", showPieces);