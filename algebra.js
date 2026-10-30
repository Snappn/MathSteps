// College Algebra pages: polynomials, factoring, and solving equations / inequalities.
// Same entry shape as formulas.js (see the top of that file); these get added to FORMULAS.
// Inputs with text: true are typed polynomials like "3x^2 - 2x + 5", passed to solve() as text.

// ---------- Polynomial helpers ----------
// A polynomial is an array of numbers where the spot is the power: [5, -2, 3] = 3x² − 2x + 5.

// Reads "3x^2 - 2x + 5" (also x², 3*x, −, spaces) into an array. Returns null if it can't.
function parsePoly(text) {
    let s = String(text).toLowerCase()
        .replace(/[−–]/g, "-").replace(/\s+/g, "").replace(/\*/g, "")
        .replace(/²/g, "^2").replace(/³/g, "^3").replace(/⁴/g, "^4").replace(/⁵/g, "^5");
    if (s === "") return null;
    const terms = s.match(/[+-]?[^+-]+/g);
    if (!terms || terms.join("") !== s) return null;
    const poly = [];
    for (const t of terms) {
        const m = t.match(/^([+-]?)(\d*\.?\d*)(x(\^(\d+))?)?$/);
        if (!m || (m[2] === "" && !m[3])) return null;
        const size = m[2] === "" ? 1 : Number(m[2]);
        if (isNaN(size)) return null;
        const power = m[3] ? (m[5] ? Number(m[5]) : 1) : 0;
        if (power > 12) return null;
        while (poly.length <= power) poly.push(0);
        poly[power] += (m[1] === "-" ? -1 : 1) * size;
    }
    return poly;
}

function letter(power) {
    return power === 0 ? "" : power === 1 ? "x" : "x" + sup(power);
}

// [5, -2, 3] -> "3x² − 2x + 5"
function polyText(poly) {
    let out = "";
    for (let power = poly.length - 1; power >= 0; power--) {
        const n = Math.round(poly[power] * 1e9) / 1e9;
        if (n === 0) continue;
        out += term(n, letter(power), out === "");
    }
    return out === "" ? "0" : out;
}

// One term on its own: (3, 2) -> "3x²", (-1, 1) -> "−x"
function oneTerm(n, power) {
    return term(n, letter(power), true);
}

// Non-zero terms, highest power first: [[coef, power], ...]
function termsOf(poly) {
    const list = [];
    for (let power = poly.length - 1; power >= 0; power--) {
        if (poly[power] !== 0) list.push([poly[power], power]);
    }
    return list;
}

function multiplyPolys(a, b) {
    const out = Array(a.length + b.length - 1).fill(0);
    a.forEach(function (x, i) { b.forEach(function (y, j) { out[i + j] += x * y; }); });
    return out;
}

function isInt(n) {
    return Number.isInteger(n);
}

// (x + 3) style binomial: k·x + m, with k = 1 written as just x.
function binomial(k, m) {
    return "(" + term(k, "x", true) + (m ? term(m, "") : "") + ")";
}

// Every whole-number pair that multiplies to n (n ≠ 0), both signs: [[1, 6], [2, 3], [-1, -6], ...]
function factorPairs(n) {
    const pairs = [];
    const a = Math.abs(n);
    for (let i = 1; i * i <= a; i++) {
        if (a % i !== 0) continue;
        const j = a / i;
        if (n > 0) {
            pairs.push([i, j], [-i, -j]);
        } else {
            pairs.push([i, -j], [-i, j]);
        }
    }
    return pairs;
}

// Factors ax² + bx + c over whole numbers (a ≠ 0, all whole numbers), the AC way.
// Returns { gcf, m, n, g1, p, q, k } meaning gcf·(g1·x + k)(p·x + q), or { gcf, prime: true }.
// m + n = b and m·n = (a/gcf)(c/gcf): the split of the middle term.
function factorQuadratic(a, b, c) {
    let gcf = gcd(gcd(a, b), c) || 1;
    if (a < 0) gcf = -gcf;            // pull a negative out so the x² term is positive
    const A = a / gcf, B = b / gcf, C = c / gcf;
    if (C === 0) {
        // Ax² + Bx = x(Ax + B)
        return { gcf: gcf, m: B, n: 0, g1: 1, k: 0, p: A, q: B, noConstant: true };
    }
    const pair = factorPairs(A * C).find(function (pr) { return pr[0] + pr[1] === B; });
    if (!pair) return { gcf: gcf, prime: true, A: A, B: B, C: C };
    let [m, n] = pair;
    // Group (Ax² + mx) + (nx + C): first group = g1·x(px + q)
    let g1 = gcd(A, m);
    let p = A / g1, q = m / g1;
    let k = n / p;                     // always whole, since q·n = p·C and gcd(p, q) = 1
    return { gcf: gcf, m: m, n: n, g1: g1, p: p, q: q, k: k, A: A, B: B, C: C };
}

// "2(x + 3)(x − 1)" style text for a factorQuadratic result.
function factoredText(f) {
    const front = f.gcf === 1 ? "" : f.gcf === -1 ? "−" : fmt(f.gcf);
    if (f.noConstant) return front + "x" + binomial(f.p, f.q);
    return front + binomial(f.p, f.q) + binomial(f.g1, f.k);
}

function needWhole(v, names) {
    return names.every(function (n) { return isInt(v[n]); });
}

const SIGNS = [
    { value: "<", label: "<  (less than)" }, { value: "≤", label: "≤  (less than or equal)" },
    { value: ">", label: ">  (greater than)" }, { value: "≥", label: "≥  (greater than or equal)" }
];
const FLIP = { "<": ">", "≤": "≥", ">": "<", "≥": "≤" };

FORMULAS.push(
    // ===== Polynomials =====
    {
        id: "add-poly",
        group: "Polynomials",
        name: "Add / subtract polynomials",
        formula: "combine like terms: 3x² + 5x² = 8x²",
        means: "Only terms with the same letter AND the same little power can be added. Add their numbers, keep the x part.",
        say: "\"Like terms: same x, same power.\"",
        note: "Subtracting? The minus hits EVERY term in the second polynomial, so flip all its signs first.",
        keywords: "polynomial add subtract combine like terms",
        inputs: [
            { id: "p1", label: "First polynomial", value: "3x^2 - 2x + 5", text: true },
            { id: "op", label: "Do", options: [{ value: "+", label: "+ add" }, { value: "-", label: "− subtract" }], value: "-" },
            { id: "p2", label: "Second polynomial", value: "x^2 + 4x - 1", text: true }
        ],
        solve: function (v) {
            const a = parsePoly(v.p1), b = parsePoly(v.p2);
            if (!a || !b) return { error: "Type them like 3x^2 - 2x + 5 (use ^ for powers)." };
            const steps = [["Write it", "(" + polyText(a) + ") " + (v.op === "+" ? "+" : "−") + " (" + polyText(b) + ")"]];
            const second = v.op === "+" ? b : b.map(function (n) { return -n; });
            const joined = polyText(a) + termsOf(second).map(function (t) { return term(t[0], letter(t[1])); }).join("");
            if (v.op === "-") steps.push(["The minus flips every sign in the second one", joined]);
            else steps.push(["Drop the ( )", polyText(a) + " + " + polyText(b)]);
            const size = Math.max(a.length, second.length);
            const sum = [];
            for (let power = size - 1; power >= 0; power--) {
                const x = a[power] ?? 0, y = second[power] ?? 0;
                if (x === 0 && y === 0) continue;
                sum[power] = x + y;
                const what = power === 0 ? "plain numbers" : letter(power) + " terms";
                const both = x === 0 ? oneTerm(y, power) : oneTerm(x, power) + (y ? term(y, letter(power)) : "");
                steps.push(["Like terms: " + what, both + " = " + (x + y === 0 ? "0" : oneTerm(x + y, power))]);
            }
            for (let i = 0; i < size; i++) sum[i] = sum[i] ?? 0;
            steps.push(["Answer", polyText(sum)]);
            return { steps: steps, plain: "= " + polyText(sum) };
        }
    },
    {
        id: "multiply-poly",
        group: "Polynomials",
        name: "Multiply polynomials (FOIL)",
        formula: "(a + b)(c + d) = ac + ad + bc + bd",
        means: "Every term in the first one multiplies every term in the second one. Then combine like terms.",
        say: "Two binomials: \"First, Outer, Inner, Last.\"",
        note: "Multiplying x's ADDS the little powers: x² · x³ = x⁵.",
        keywords: "foil multiply polynomial binomial distribute expand box method",
        inputs: [
            { id: "p1", label: "First", value: "2x + 3", text: true },
            { id: "p2", label: "Second", value: "x - 4", text: true }
        ],
        solve: function (v) {
            const a = parsePoly(v.p1), b = parsePoly(v.p2);
            if (!a || !b) return { error: "Type them like 2x + 3 (use ^ for powers)." };
            const ta = termsOf(a), tb = termsOf(b);
            if (ta.length === 0 || tb.length === 0) return { error: "One of them is 0, so the answer is 0." };
            if (ta.length * tb.length > 16) return { error: "That's a lot of terms. Keep it to 4 terms in each." };
            const steps = [["Write it", "(" + polyText(a) + ")(" + polyText(b) + ")"]];
            const foil = ta.length === 2 && tb.length === 2;
            const names = ["First", "Outer", "Inner", "Last"];
            const products = [];
            ta.forEach(function (x, i) {
                tb.forEach(function (y, j) {
                    const label = foil ? names[i * 2 + j] : "Term " + (i + 1) + " × term " + (j + 1);
                    const coef = x[0] * y[0], power = x[1] + y[1];
                    products.push([coef, power]);
                    steps.push([label, oneTerm(x[0], x[1]) + " · " + (y[0] < 0 ? "(" + oneTerm(y[0], y[1]) + ")" : oneTerm(y[0], y[1])) + " = " + oneTerm(coef, power)]);
                });
            });
            steps.push(["All of them in a row", products.map(function (t, i) { return i === 0 ? oneTerm(t[0], t[1]) : term(t[0], letter(t[1])); }).join("")]);
            const out = multiplyPolys(a, b);
            steps.push(["Combine like terms", polyText(out)]);
            return { steps: steps, plain: "= " + polyText(out) };
        }
    },
    {
        id: "special-products",
        group: "Polynomials",
        name: "Special products",
        formula: "(a + b)² = a² + 2ab + b²",
        means: "Shortcuts for patterns that show up all the time. Same answer as FOIL, just faster.",
        say: "\"First squared, two times first times last, last squared.\"",
        note: "(a + b)² is NOT a² + b². You always get the middle 2ab.",
        keywords: "special products perfect square binomial squared conjugates difference of squares cube",
        rules: [
            ["(a + b)²", "a² + 2ab + b²"],
            ["(a − b)²", "a² − 2ab + b²"],
            ["(a + b)(a − b)", "a² − b²  (middle cancels)"],
            ["(a + b)³", "a³ + 3a²b + 3ab² + b³"],
            ["(a − b)³", "a³ − 3a²b + 3ab² − b³"]
        ],
        inputs: [
            { id: "k", label: "x number (in kx + m)", value: "3" },
            { id: "m", label: "Plain number (m)", value: "2" },
            { id: "kind", label: "Pattern", options: [
                { value: "sq", label: "(kx + m)²" }, { value: "conj", label: "(kx + m)(kx − m)" }, { value: "cube", label: "(kx + m)³" }
            ], value: "sq" }
        ],
        solve: function (v) {
            if (v.k === 0) return { error: "The x number can't be 0." };
            const A = oneTerm(v.k, 1), B = fmt(v.m);
            const first = binomial(v.k, v.m);
            if (v.kind === "sq") {
                const out = [v.m * v.m, 2 * v.k * v.m, v.k * v.k];
                return { steps: [
                    ["Write it", first + "²"],
                    ["Pattern (a + b)² = a² + 2ab + b²", "a = " + A + ",  b = " + p(v.m)],
                    ["a²", "(" + A + ")² = " + oneTerm(v.k * v.k, 2)],
                    ["2ab", "2 · " + A + " · " + p(v.m) + " = " + oneTerm(2 * v.k * v.m, 1)],
                    ["b²", p(v.m) + "² = " + fmt(v.m * v.m)],
                    ["Answer", polyText(out)]
                ], plain: "= " + polyText(out) };
            }
            if (v.kind === "conj") {
                const out = [-v.m * v.m, 0, v.k * v.k];
                return { steps: [
                    ["Write it", first + binomial(v.k, -v.m)],
                    ["Pattern (a + b)(a − b) = a² − b²", "a = " + A + ",  b = " + B],
                    ["a²", "(" + A + ")² = " + oneTerm(v.k * v.k, 2)],
                    ["b²", p(v.m) + "² = " + fmt(v.m * v.m)],
                    ["The middle terms cancel", polyText(out)]
                ], plain: "= " + polyText(out) };
            }
            const out = [v.m ** 3, 3 * v.k * v.m * v.m, 3 * v.k * v.k * v.m, v.k ** 3];
            return { steps: [
                ["Write it", first + "³"],
                ["Pattern (a + b)³ = a³ + 3a²b + 3ab² + b³", "a = " + A + ",  b = " + p(v.m)],
                ["a³", "(" + A + ")³ = " + oneTerm(v.k ** 3, 3)],
                ["3a²b", "3 · (" + A + ")² · " + p(v.m) + " = " + oneTerm(3 * v.k * v.k * v.m, 2)],
                ["3ab²", "3 · " + A + " · " + p(v.m) + "² = " + oneTerm(3 * v.k * v.m * v.m, 1)],
                ["b³", p(v.m) + "³ = " + fmt(v.m ** 3)],
                ["Answer", polyText(out)]
            ], plain: "= " + polyText(out) };
        }
    },
    {
        id: "factoring-plan",
        group: "Polynomials",
        name: "Factoring game plan",
        formula: "GCF → count the terms → pick the pattern",
        means: "Factoring is multiplying in reverse: turn a sum into things multiplied together. Go down this list every time.",
        say: "\"GCF first, then count the terms.\"",
        note: "Check every answer by multiplying it back out (FOIL). You should land on what you started with.",
        keywords: "factor factoring strategy gcf grouping steps how to factor",
        rules: [
            ["1. GCF", "Pull out the biggest number (and x) that goes into every term: 6x² + 9x = 3x(2x + 3)"],
            ["2 terms", "a² − b² = (a + b)(a − b)  ·  a³ + b³ = (a + b)(a² − ab + b²)  ·  a³ − b³ = (a − b)(a² + ab + b²)  ·  a² + b² doesn't factor"],
            ["3 terms, x² first", "x² + bx + c: two numbers that multiply to c and add to b"],
            ["3 terms, ax² first", "AC method: two numbers that multiply to a·c and add to b, split the middle, group"],
            ["3 terms, squares", "a² + 2ab + b² = (a + b)²  ·  a² − 2ab + b² = (a − b)²"],
            ["4 terms", "Grouping: (first two) + (last two), pull the GCF from each, the ( ) should match"],
            ["Last", "Look inside every ( ) again: can any of them factor more?"]
        ]
    },
    {
        id: "factor-trinomial",
        group: "Polynomials",
        name: "Factor x² + bx + c",
        formula: "x² + bx + c = (x + m)(x + n)  where m·n = c, m + n = b",
        means: "Find two numbers that MULTIPLY to the plain number and ADD to the x number.",
        say: "\"Multiply to c, add to b.\"",
        note: "c positive: both numbers have b's sign. c negative: one is + and one is −, the bigger one gets b's sign.",
        keywords: "factor trinomial quadratic x^2 bx c two numbers multiply add",
        inputs: [{ id: "b", label: "b (x number)", value: "-5" }, { id: "c", label: "c (plain number)", value: "6" }],
        solve: function (v) {
            if (!needWhole(v, ["b", "c"])) return { error: "Use whole numbers." };
            const poly = [v.c, v.b, 1];
            const steps = [["Your trinomial", polyText(poly)]];
            if (v.c === 0) {
                steps.push(["No plain number: pull out the x", "x" + binomial(1, v.b)]);
                return { steps: steps, plain: "= x" + binomial(1, v.b) };
            }
            steps.push(["Need two numbers", "multiply to " + fmt(v.c) + ",  add to " + fmt(v.b)]);
            const pairs = factorPairs(v.c);
            const hit = pairs.find(function (pr) { return pr[0] + pr[1] === v.b; });
            if (pairs.length <= 12) {
                steps.push(["Every pair that multiplies to " + fmt(v.c), pairs.map(function (pr) {
                    return p(pr[0]) + "·" + p(pr[1]) + " → adds to " + fmt(pr[0] + pr[1]) + (pr === hit ? " ✓" : "");
                }).join("\n")]);
            }
            if (!hit) {
                steps.push(["No pair adds to " + fmt(v.b), "Prime: doesn't factor with whole numbers"]);
                return { steps: steps, plain: "It doesn't factor. To solve = 0, use the quadratic formula." };
            }
            const answer = binomial(1, hit[0]) + binomial(1, hit[1]);
            steps.push(["The two numbers", fmt(hit[0]) + " and " + fmt(hit[1])]);
            steps.push(["Answer", answer]);
            steps.push(["Check (FOIL it back)", polyText(multiplyPolys([hit[0], 1], [hit[1], 1])) + " ✓"]);
            return { steps: steps, plain: "= " + answer };
        }
    },
    {
        id: "ac-method",
        group: "Polynomials",
        name: "Factor ax² + bx + c (AC method)",
        formula: "find m·n = a·c, m + n = b, then split bx and group",
        means: "When there's a number in front of x², multiply a × c, find the two numbers, split the middle term into two, and factor by grouping.",
        say: "\"Multiply a and c, find the pair, split the middle, group.\"",
        note: "GCF first. If no pair works, it's prime (use the quadratic formula to solve).",
        keywords: "ac method factor grouping trinomial leading coefficient split middle term",
        inputs: [
            { id: "a", label: "a (x² number)", value: "6" }, { id: "b", label: "b (x number)", value: "7" },
            { id: "c", label: "c (plain number)", value: "2" }
        ],
        solve: function (v) {
            if (!needWhole(v, ["a", "b", "c"])) return { error: "Use whole numbers." };
            if (v.a === 0) return { error: "a can't be 0 (then there's no x²)." };
            const steps = [["Your trinomial", polyText([v.c, v.b, v.a])]];
            const f = factorQuadratic(v.a, v.b, v.c);
            const front = f.gcf === 1 ? "" : f.gcf === -1 ? "−" : fmt(f.gcf);
            if (f.gcf !== 1) steps.push(["GCF first: pull out " + fmt(f.gcf), front + "(" + polyText([f.C ?? v.c / f.gcf, f.B ?? v.b / f.gcf, f.A ?? v.a / f.gcf]) + ")"]);
            if (f.noConstant) {
                steps.push(["No plain number: pull out the x", factoredText(f)]);
                return { steps: steps, plain: "= " + factoredText(f) };
            }
            steps.push(["a · c", fmt(f.A) + " · " + p(f.C) + " = " + fmt(f.A * f.C)]);
            steps.push(["Two numbers", "multiply to " + fmt(f.A * f.C) + ",  add to " + fmt(f.B)]);
            if (f.prime) {
                steps.push(["No pair works", "Prime: doesn't factor with whole numbers"]);
                return { steps: steps, plain: "It doesn't factor. To solve = 0, use the quadratic formula." };
            }
            steps.push(["The pair", fmt(f.m) + " and " + fmt(f.n)]);
            steps.push(["Split the middle: " + oneTerm(f.B, 1) + " = " + oneTerm(f.m, 1) + term(f.n, "x"), oneTerm(f.A, 2) + term(f.m, "x") + term(f.n, "x") + term(f.C, "")]);
            steps.push(["Group in twos", "(" + oneTerm(f.A, 2) + term(f.m, "x") + ") + (" + oneTerm(f.n, 1) + term(f.C, "") + ")"]);
            steps.push(["GCF of each group", oneTerm(f.g1, 1) + binomial(f.p, f.q) + term(f.k, "") + binomial(f.p, f.q)]);
            steps.push(["Pull out the matching ( )", binomial(f.p, f.q) + binomial(f.g1, f.k)]);
            steps.push(["Answer", factoredText(f)]);
            return { steps: steps, plain: "= " + factoredText(f) };
        }
    },
    {
        id: "diff-squares",
        group: "Polynomials",
        name: "Difference of squares",
        formula: "a² − b² = (a + b)(a − b)",
        means: "Something squared MINUS something squared splits into a plus and a minus version.",
        say: "\"Square root of each, one plus, one minus.\"",
        note: "Only a MINUS works. a² + b² (a sum of squares) doesn't factor.",
        keywords: "difference of squares factor a^2 - b^2 conjugates",
        inputs: [{ id: "A", label: "x² number (A in Ax² − C)", value: "4" }, { id: "C", label: "Number being subtracted (C)", value: "25" }],
        solve: function (v) {
            if (!needWhole(v, ["A", "C"]) || v.A <= 0 || v.C <= 0) return { error: "Use positive whole numbers: Ax² − C." };
            const steps = [["Your binomial", oneTerm(v.A, 2) + " − " + fmt(v.C)]];
            const g = gcd(v.A, v.C);
            const A = v.A / g, C = v.C / g;
            if (g > 1) steps.push(["GCF first: pull out " + g, fmt(g) + "(" + oneTerm(A, 2) + " − " + fmt(C) + ")"]);
            const ra = Math.sqrt(A), rc = Math.sqrt(C);
            if (!isInt(ra) || !isInt(rc)) {
                steps.push(["Square roots aren't whole", "√" + fmt(A) + " = " + fmt(ra) + ",  √" + fmt(C) + " = " + fmt(rc)]);
                return { steps: steps, plain: "Not a difference of perfect squares with whole numbers." };
            }
            steps.push(["Square roots", "√(" + oneTerm(A, 2) + ") = " + oneTerm(ra, 1) + ",   √" + fmt(C) + " = " + fmt(rc)]);
            const answer = (g > 1 ? fmt(g) : "") + binomial(ra, rc) + binomial(ra, -rc);
            steps.push(["One +, one −", answer]);
            return { steps: steps, plain: "= " + answer };
        }
    },
    {
        id: "cubes",
        group: "Polynomials",
        name: "Sum / difference of cubes",
        formula: "a³ ± b³ = (a ± b)(a² ∓ ab + b²)",
        means: "Something cubed plus or minus something cubed. Cube root each one, then fill in the pattern.",
        say: "Signs: \"SOAP\" = Same, Opposite, Always Positive.",
        note: "a³ + b³ = (a + b)(a² − ab + b²)  ·  a³ − b³ = (a − b)(a² + ab + b²). The second ( ) never factors more.",
        keywords: "sum difference of cubes factor a^3 b^3 soap",
        inputs: [
            { id: "A", label: "x³ number (A)", value: "8" },
            { id: "sign", label: "Sign", options: [{ value: "+", label: "+ (sum)" }, { value: "-", label: "− (difference)" }], value: "-" },
            { id: "C", label: "Plain number (C)", value: "27" }
        ],
        solve: function (v) {
            if (!needWhole(v, ["A", "C"]) || v.A <= 0 || v.C <= 0) return { error: "Use positive whole numbers: Ax³ ± C." };
            const s = v.sign === "+" ? 1 : -1;
            const steps = [["Your binomial", oneTerm(v.A, 3) + (s > 0 ? " + " : " − ") + fmt(v.C)]];
            const g = gcd(v.A, v.C);
            const A = v.A / g, C = v.C / g;
            if (g > 1) steps.push(["GCF first: pull out " + g, fmt(g) + "(" + oneTerm(A, 3) + (s > 0 ? " + " : " − ") + fmt(C) + ")"]);
            const ra = Math.round(Math.cbrt(A)), rc = Math.round(Math.cbrt(C));
            if (ra ** 3 !== A || rc ** 3 !== C) {
                return { steps: steps, plain: "Not perfect cubes with whole numbers (cubes: 1, 8, 27, 64, 125, 216…)." };
            }
            steps.push(["Cube roots", "a = " + oneTerm(ra, 1) + ",   b = " + fmt(rc)]);
            const second = "(" + oneTerm(ra * ra, 2) + term(-s * ra * rc, "x") + term(rc * rc, "") + ")";
            steps.push([s > 0 ? "(a + b)(a² − ab + b²)" : "(a − b)(a² + ab + b²)", "a² = " + oneTerm(ra * ra, 2) + ",  ab = " + oneTerm(ra * rc, 1) + ",  b² = " + fmt(rc * rc)]);
            const answer = (g > 1 ? fmt(g) : "") + binomial(ra, s * rc) + second;
            steps.push(["Answer (SOAP signs)", answer]);
            return { steps: steps, plain: "= " + answer };
        }
    },
    {
        id: "synthetic",
        group: "Polynomials",
        name: "Synthetic division",
        formula: "divide by (x − r): bring down, × r, add, repeat",
        means: "A fast way to divide a polynomial by (x − r) using only its numbers.",
        say: "\"Bring down, multiply, add.\"",
        note: "Dividing by (x + 3)? Then r = −3 (flip the sign). Fill a 0 for any missing power. The remainder equals P(r).",
        keywords: "synthetic division divide polynomial remainder factor theorem long division",
        inputs: [
            { id: "poly", label: "Polynomial", value: "x^3 - 6x^2 + 11x - 6", text: true },
            { id: "r", label: "r (dividing by x − r)", value: "2" }
        ],
        solve: function (v) {
            const poly = parsePoly(v.poly);
            if (!poly || poly.length < 2) return { error: "Type a polynomial with x in it, like x^3 - 6x^2 + 11x - 6." };
            const coefs = poly.slice().reverse();   // highest power first
            const steps = [
                ["Your problem", "(" + polyText(poly) + ") ÷ " + binomial(1, -v.r)],
                ["Write the numbers (0 for missing powers)", fmt(v.r) + "  |  " + coefs.map(fmt).join("   ")]
            ];
            const row = [coefs[0]];
            steps.push(["Bring down the first one", fmt(coefs[0])]);
            for (let i = 1; i < coefs.length; i++) {
                const times = row[i - 1] * v.r;
                const sum = coefs[i] + times;
                steps.push(["× " + fmt(v.r) + ", then add to " + fmt(coefs[i]), fmt(row[i - 1]) + " × " + p(v.r) + " = " + fmt(times) + ",   " + fmt(coefs[i]) + " + " + p(times) + " = " + fmt(sum)]);
                row.push(sum);
            }
            const remainder = row.pop();
            const quotient = row.slice().reverse();
            steps.push(["Bottom row", row.map(fmt).join("   ") + "  |  " + fmt(remainder)]);
            steps.push(["Last number = remainder, the rest = answer (one power lower)", polyText(quotient) + (remainder ? "  remainder " + fmt(remainder) : "")]);
            const plain = remainder === 0
                ? "= " + polyText(quotient) + ". Remainder 0, so " + binomial(1, -v.r) + " is a factor."
                : "= " + polyText(quotient) + (remainder < 0 ? " − " : " + ") + fmt(Math.abs(remainder)) + "/" + binomial(1, -v.r) + ". Remainder " + fmt(remainder) + ".";
            return { steps: steps, plain: plain };
        }
    },

    // ===== Equations and inequalities =====
    {
        id: "linear-both",
        group: "Equations",
        name: "Solve ax + b = cx + d",
        formula: "x terms to one side, numbers to the other, divide",
        means: "x on both sides: move all the x's to the left, all the plain numbers to the right, then divide.",
        say: "\"Whatever you do to one side, do to the other.\"",
        note: "If the x's cancel out: a true statement (like 3 = 3) means every x works; a false one (3 = 5) means no solution.",
        keywords: "linear equation x both sides solve variables",
        inputs: [
            { id: "a", label: "a (left x)", value: "5" }, { id: "b", label: "b (left number)", value: "3" },
            { id: "c", label: "c (right x)", value: "2" }, { id: "d", label: "d (right number)", value: "12" }
        ],
        solve: function (v) {
            const left = (n, m) => (n ? oneTerm(n, 1) : "") + (m ? term(m, "", !n) : (n ? "" : "0"));
            const steps = [["Your equation", left(v.a, v.b) + " = " + left(v.c, v.d)]];
            const k = v.a - v.c, r = v.d - v.b;
            if (v.c !== 0) steps.push([(v.c < 0 ? "Add " + oneTerm(-v.c, 1) + " to" : "Subtract " + oneTerm(v.c, 1) + " from") + " both sides", left(k, v.b) + " = " + fmt(v.d)]);
            if (v.b !== 0) steps.push([(v.b < 0 ? "Add " + fmt(-v.b) + " to" : "Subtract " + fmt(v.b) + " from") + " both sides", (k ? oneTerm(k, 1) : "0") + " = " + fmt(r)]);
            if (k === 0) {
                steps.push(["The x's are gone", "0 = " + fmt(r)]);
                return { steps: steps, plain: r === 0 ? "True no matter what: every number works." : "That's false, so there's no solution." };
            }
            const x = r / k;
            steps.push(["Divide both sides by " + fmt(k), "x = " + fmt(r) + " ÷ " + p(k) + " = " + fmt(x)]);
            steps.push(["Check", fmt(v.a * x + v.b) + " = " + fmt(v.c * x + v.d) + " ✓"]);
            return { steps: steps, plain: "x = " + fmt(x) };
        }
    },
    {
        id: "quadratic-factoring",
        group: "Equations",
        name: "Solve a quadratic by factoring",
        formula: "ax² + bx + c = 0 → (  )(  ) = 0 → each ( ) = 0",
        means: "Factor it, then use the zero rule: if two things multiply to 0, one of them is 0.",
        say: "\"Set each factor equal to zero.\"",
        note: "It HAS to equal 0 first. If it won't factor, use the quadratic formula or completing the square.",
        keywords: "quadratic equation solve factoring zero product property roots",
        inputs: [
            { id: "a", label: "a (x² number)", value: "2" }, { id: "b", label: "b (x number)", value: "-1" },
            { id: "c", label: "c (plain number)", value: "-15" }
        ],
        solve: function (v) {
            if (!needWhole(v, ["a", "b", "c"])) return { error: "Use whole numbers (or use the quadratic formula)." };
            if (v.a === 0) return { error: "a can't be 0. Without x² use Solve ax + b = cx + d." };
            const steps = [["Your equation", polyText([v.c, v.b, v.a]) + " = 0"]];
            const f = factorQuadratic(v.a, v.b, v.c);
            if (f.prime) {
                steps.push(["Try to factor", "No whole-number pair works"]);
                return { steps: steps, plain: "It doesn't factor. Use the quadratic formula or completing the square." };
            }
            steps.push(["Factor it (AC method)", factoredText(f) + " = 0"]);
            const roots = [];
            const solveOne = function (k, m) {
                const x = -m / k;
                const frac = isInt(x) ? fmt(x) : fraction(-m / gcd(m, k), k / gcd(m, k));
                steps.push(["Set " + binomial(k, m) + " = 0", k === 1 ? "x = " + frac : oneTerm(k, 1) + " = " + fmt(-m) + "  →  x = " + frac]);
                roots.push([x, frac]);
            };
            if (f.noConstant) {
                steps.push(["Set x = 0", "x = 0"]);
                roots.push([0, "0"]);
                solveOne(f.p, f.q);
            } else {
                solveOne(f.p, f.q);
                solveOne(f.g1, f.k);
            }
            const unique = roots.filter(function (r, i) { return roots.findIndex(function (s) { return Math.abs(s[0] - r[0]) < 1e-9; }) === i; });
            return { steps: steps, plain: unique.length === 1 ? "One answer: x = " + unique[0][1] + "." : "x = " + unique[0][1] + "  or  x = " + unique[1][1] };
        }
    },
    {
        id: "complete-square",
        group: "Equations",
        name: "Completing the square",
        formula: "x² + bx + (b/2)² = (x + b/2)²",
        means: "Turn the x² and x part into a perfect square, then square-root both sides.",
        say: "\"Half of b, squared, add it to both sides.\"",
        note: "x² needs a 1 in front first (divide everything by a). The ± on the square root gives two answers.",
        keywords: "completing the square quadratic solve half b squared vertex",
        inputs: [
            { id: "a", label: "a (x² number)", value: "1" }, { id: "b", label: "b (x number)", value: "6" },
            { id: "c", label: "c (plain number)", value: "-7" }
        ],
        solve: function (v) {
            if (v.a === 0) return { error: "a can't be 0 (then there's no x²)." };
            const steps = [["Your equation", polyText([v.c, v.b, v.a]) + " = 0"]];
            let b = v.b, c = v.c;
            if (v.a !== 1) {
                b = v.b / v.a;
                c = v.c / v.a;
                steps.push(["Divide everything by " + fmt(v.a), polyText([c, b, 1]) + " = 0"]);
            }
            if (c !== 0) steps.push([c < 0 ? "Add " + fmt(-c) + " to both sides" : "Subtract " + fmt(c) + " from both sides", polyText([0, b, 1]) + " = " + fmt(-c)]);
            const half = b / 2, add = half * half;
            steps.push(["Half of b, squared", "(" + fmt(b) + " ÷ 2)² = " + p(half) + "² = " + fmt(add)]);
            const right = -c + add;
            steps.push(["Add " + fmt(add) + " to both sides", polyText([add, b, 1]) + " = " + fmt(-c) + " + " + fmt(add) + " = " + fmt(right)]);
            const square = "(x" + (half ? term(half, "") : "") + ")²";
            steps.push(["Left side is a perfect square", square + " = " + fmt(right)]);
            if (right < 0) {
                steps.push(["Square root of a negative", "No real solutions"]);
                return { steps: steps, plain: "No real answers (it would need the square root of a negative)." };
            }
            const root = Math.sqrt(right);
            const exact = isInt(root) ? fmt(root) : "√" + fmt(right) + " ≈ " + fmt(root);
            steps.push(["Square root both sides (±)", "x" + (half ? term(half, "") : "") + " = ± " + exact]);
            const x1 = -half + root, x2 = -half - root;
            const rootText = isInt(root) ? fmt(root) : "√" + fmt(right);
            steps.push([half ? (half > 0 ? "Subtract " + fmt(half) + " from both sides" : "Add " + fmt(-half) + " to both sides") : "x is alone", "x = " + (half ? fmt(-half) + " ± " : "± ") + rootText]);
            if (right === 0) return { steps: steps, plain: "One answer: x = " + fmt(x1) + "." };
            steps.push([isInt(root) ? "Do + and − separately" : "Do + and − separately (as decimals)", "x = " + fmt(x1) + "  or  x = " + fmt(x2)]);
            const exactText = isInt(root) ? "" : "  (exact: x = " + (half ? fmt(-half) + " ± " : "± ") + rootText + ")";
            return { steps: steps, plain: "x = " + fmt(x1) + "  or  x = " + fmt(x2) + exactText };
        }
    },
    {
        id: "absolute-value",
        group: "Equations",
        name: "Solve |ax + b| = c",
        formula: "|stuff| = c  →  stuff = c  OR  stuff = −c",
        means: "Absolute value is distance from 0, so the inside can be c steps to the right or c steps to the left. Solve both.",
        say: "\"Split it into a positive case and a negative case.\"",
        note: "Get the | | alone first. If c is negative there's no answer (distance can't be negative). If c = 0 there's one.",
        keywords: "absolute value equation solve two cases bars",
        inputs: [
            { id: "a", label: "a (x number)", value: "2" }, { id: "b", label: "b (plain number)", value: "-3" },
            { id: "c", label: "c (right side)", value: "7" }
        ],
        solve: function (v) {
            if (v.a === 0) return { error: "a can't be 0 (then there's no x)." };
            const inside = oneTerm(v.a, 1) + (v.b ? term(v.b, "") : "");
            const steps = [["Your equation", "|" + inside + "| = " + fmt(v.c)]];
            if (v.c < 0) {
                steps.push(["Right side is negative", "No solution"]);
                return { steps: steps, plain: "No solution: absolute value is never negative." };
            }
            const cases = v.c === 0 ? [0] : [v.c, -v.c];
            const xs = [];
            cases.forEach(function (target, i) {
                const x = (target - v.b) / v.a;
                xs.push(x);
                steps.push([(i === 0 ? "Case 1: " : "Case 2: ") + inside + " = " + fmt(target), oneTerm(v.a, 1) + " = " + fmt(target - v.b) + "  →  x = " + fmt(x)]);
            });
            steps.push(["Check", xs.map(function (x) { return "|" + fmt(v.a * x + v.b) + "| = " + fmt(Math.abs(v.a * x + v.b)); }).join(",  ") + " ✓"]);
            return { steps: steps, plain: xs.length === 1 ? "x = " + fmt(xs[0]) : "x = " + fmt(xs[0]) + "  or  x = " + fmt(xs[1]) };
        }
    },
    {
        id: "linear-inequality",
        group: "Equations",
        name: "Solve an inequality ax + b < c",
        formula: "solve like an equation, but FLIP the sign when you × or ÷ by a negative",
        means: "Same moves as solving for x. The one trap: multiplying or dividing by a negative flips < to > (and ≤ to ≥).",
        say: "\"Negative divide, flip the sign.\"",
        note: "Interval notation: ( ) = the end isn't included (< or >), [ ] = it is (≤ or ≥). Infinity always gets ( ).",
        keywords: "inequality solve less greater flip interval notation number line",
        inputs: [
            { id: "a", label: "a (x number)", value: "-3" }, { id: "b", label: "b (plain number)", value: "4" },
            { id: "sign", label: "Sign", options: SIGNS, value: "<" },
            { id: "c", label: "c (right side)", value: "19" }
        ],
        solve: function (v) {
            if (v.a === 0) return { error: "a can't be 0 (then there's no x)." };
            const steps = [["Your inequality", oneTerm(v.a, 1) + (v.b ? term(v.b, "") : "") + " " + v.sign + " " + fmt(v.c)]];
            const r = v.c - v.b;
            if (v.b !== 0) steps.push([v.b < 0 ? "Add " + fmt(-v.b) + " to both sides" : "Subtract " + fmt(v.b) + " from both sides", oneTerm(v.a, 1) + " " + v.sign + " " + fmt(r)]);
            let sign = v.sign;
            const x = r / v.a;
            if (v.a < 0) {
                sign = FLIP[sign];
                steps.push(["Divide by " + fmt(v.a) + ": NEGATIVE, so flip " + v.sign + " to " + sign, "x " + sign + " " + fmt(x)]);
            } else if (v.a !== 1) {
                steps.push(["Divide by " + fmt(v.a) + " (positive, sign stays)", "x " + sign + " " + fmt(x)]);
            }
            const included = sign === "≤" || sign === "≥";
            const interval = sign === "<" || sign === "≤"
                ? "(−∞, " + fmt(x) + (included ? "]" : ")")
                : (included ? "[" : "(") + fmt(x) + ", ∞)";
            steps.push(["Interval notation", interval]);
            steps.push(["On a number line", (included ? "filled" : "open") + " dot at " + fmt(x) + ", shade " + (sign === "<" || sign === "≤" ? "left" : "right")]);
            return { steps: steps, plain: "x " + sign + " " + fmt(x) + "   →   " + interval };
        }
    }
);
