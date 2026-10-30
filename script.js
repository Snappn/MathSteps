// Screens + routing. The formulas themselves live in formulas.js.
// URL hash picks the screen: "#/" = home list, "#/f/slope" = the slope page.
// Using the hash means the phone's back button works.

const GROUP_ORDER = ["Lines and graphs", "Equations", "Polynomials", "Exponents and roots", "Percent", "Shapes", "Conversions"];

let current = null;   // the formula whose page is open

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function showScreen(name) {
    document.querySelectorAll(".screen").forEach(function (screen) {
        screen.classList.add("hidden");
    });
    document.getElementById("screen-" + name).classList.remove("hidden");
    document.getElementById("back").classList.toggle("hidden", name === "home");
    window.scrollTo(0, 0);
}

// ---------- Home: grouped list + search ----------

function renderList() {
    const query = document.getElementById("search").value.trim().toLowerCase();
    const list = document.getElementById("list");
    list.replaceChildren();

    GROUP_ORDER.forEach(function (group) {
        const matches = FORMULAS.filter(function (f) {
            if (f.group !== group) return false;
            const haystack = (f.name + " " + f.formula + " " + f.group + " " + (f.keywords ?? "")).toLowerCase();
            return haystack.includes(query);
        });
        if (matches.length === 0) return;

        list.appendChild(el("h2", "group-title", group));
        matches.forEach(function (f) {
            const row = el("a", "row");
            row.href = "#/f/" + f.id;
            row.appendChild(el("span", "row-name", f.name));
            row.appendChild(el("span", "row-formula", f.formula));
            list.appendChild(row);
        });
    });

    if (!list.hasChildNodes()) {
        list.appendChild(el("p", "empty", "Nothing matches \"" + query + "\"."));
    }
}

// ---------- Formula page ----------

function renderPage(f) {
    current = f;

    // The cheat-sheet card
    const card = document.getElementById("formula-card");
    card.replaceChildren();
    card.appendChild(el("h2", null, f.name));
    card.appendChild(el("p", "formula", f.formula));
    const means = el("p");
    means.appendChild(el("strong", null, "Means: "));
    means.appendChild(document.createTextNode(f.means));
    card.appendChild(means);
    const say = el("p", "say");
    say.appendChild(el("strong", null, "Say it: "));
    say.appendChild(document.createTextNode(f.say));
    card.appendChild(say);
    if (f.note) card.appendChild(el("p", "note", f.note));

    if (f.facts) {
        card.appendChild(el("h2", null, "Know these"));
        const facts = el("ul", "facts");
        f.facts.forEach(function (fact) { facts.appendChild(el("li", null, fact)); });
        card.appendChild(facts);
    }

    if (f.rules) {
        const table = el("table", "rules");
        f.rules.forEach(function (rule) {
            const tr = el("tr");
            tr.appendChild(el("td", null, rule[0]));
            tr.appendChild(el("td", null, rule[1]));
            table.appendChild(tr);
        });
        card.appendChild(table);
    }

    // The "Try it" boxes (reference-only cards like PEMDAS have none)
    document.getElementById("try-card").classList.toggle("hidden", !f.inputs);
    document.getElementById("work-card").classList.add("hidden");
    document.getElementById("error").textContent = "";

    const inputs = document.getElementById("inputs");
    inputs.replaceChildren();
    (f.inputs ?? []).forEach(function (input) {
        const label = el("label", null, input.label);
        let box;
        if (input.options) {
            // Phones won't wrap dropdown text, so each dropdown gets its own full-width row
            label.className = "wide";
            box = el("select");
            input.options.forEach(function (o) {
                const option = el("option", null, o.label);
                option.value = o.value;
                box.appendChild(option);
            });
        } else if (input.text) {
            // A typed polynomial like 3x^2 - 2x + 5: full width, plain keyboard
            label.className = "wide";
            box = el("input");
            box.type = "text";
            box.autocomplete = "off";
            box.autocapitalize = "off";
            box.spellcheck = false;
        } else {
            box = el("input");
            box.type = "number";
            box.step = "any";
            box.inputMode = "decimal";
            box.addEventListener("focus", function () { box.select(); });
        }
        box.id = "in-" + input.id;
        box.value = input.value;
        label.appendChild(box);
        inputs.appendChild(label);
    });

    showScreen("page");
}

function showWork(event) {
    event.preventDefault();
    const f = current;
    const values = {};
    const raw = {};
    const error = document.getElementById("error");

    for (const input of f.inputs) {
        const text = document.getElementById("in-" + input.id).value;
        raw[input.id] = text;
        if (input.options) {
            values[input.id] = text;
        } else if (input.text) {
            if (text.trim() === "") {
                error.textContent = "Fill in every box.";
                return;
            }
            values[input.id] = text;
        } else if (text.trim() === "") {
            if (!input.optional) {
                error.textContent = "Fill in every box.";
                return;
            }
            values[input.id] = NaN;
        } else {
            values[input.id] = Number(text);
        }
    }

    const result = f.solve(values, raw);
    const workCard = document.getElementById("work-card");
    if (result.error) {
        error.textContent = result.error;
        workCard.classList.add("hidden");
        return;
    }
    error.textContent = "";

    const steps = document.getElementById("steps");
    steps.replaceChildren();
    result.steps.forEach(function (step) {
        const li = el("li");
        const text = el("div");
        text.appendChild(el("span", "step-label", step[0]));
        text.appendChild(el("span", "step-math", step[1]));
        li.appendChild(text);
        steps.appendChild(li);
    });
    document.getElementById("plain").textContent = result.plain ?? "";
    workCard.classList.remove("hidden");
    workCard.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ---------- Routing ----------

function route() {
    const match = location.hash.match(/^#\/f\/(.+)$/);
    const f = match ? FORMULAS.find(function (x) { return x.id === match[1]; }) : null;
    if (f) {
        renderPage(f);
    } else {
        showScreen("home");
    }
}

document.getElementById("search").addEventListener("input", renderList);
document.getElementById("try-form").addEventListener("submit", showWork);
window.addEventListener("hashchange", route);

renderList();
route();
