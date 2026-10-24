// Every formula and conversion in the app. Each entry has:
//   id, group, name, formula, means, say, note   -> the cheat-sheet card
//   facts (list) or rules ([left, right] rows)   -> extra reference, optional
//   inputs + solve(values)                       -> the "show my work" solver, optional
// solve() returns { steps: [[label, math], ...], plain } or { error }.

// ---------- Number helpers ----------

// Readable number: rounds float noise, uses a real minus sign.
function fmt(n) {
    if (!isFinite(n)) return "undefined";
    if (n === 0) n = 0;   // turns -0 into plain 0
    const a = Math.abs(n);
    let s;
    if (a !== 0 && (a < 0.0001 || a >= 1e12)) {
        s = n.toExponential(4);
    } else {
        s = (Math.round(n * 1e6) / 1e6).toLocaleString("en-US", { maximumFractionDigits: 6 });
    }
    return s.replace("-", "−");
}

// Same as fmt, but negatives get parentheses when plugged into a formula.
function p(n) {
    return n < 0 ? "(" + fmt(n) + ")" : fmt(n);
}

// Turns 6 into ⁶ and -3 into ⁻³.
function sup(n) {
    const map = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻" };
    return String(n).split("").map(function (c) { return map[c] ?? c; }).join("");
}

function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
        const t = b;
        b = a % b;
        a = t;
    }
    return a;
}

// One term of an equation, written the way a teacher would:
// term(1, "x²", true) -> "x²", term(-5, "x") -> " − 5x", term(6, "") -> " + 6"
function term(n, letter, first) {
    const size = Math.abs(n) === 1 && letter ? "" : fmt(Math.abs(n));
    if (first) return (n < 0 ? "−" : "") + size + letter;
    return (n < 0 ? " − " : " + ") + size + letter;
}

// "3/4" style fraction, or just "3" if the bottom is 1.
function fraction(top, bottom) {
    if (bottom < 0) {
        top = -top;
        bottom = -bottom;
    }
    return bottom === 1 ? fmt(top) : fmt(top) + "/" + fmt(bottom);
}

// ---------- Unit conversions ----------
// Each unit is [short name, long name, how many base units one of it is].

function unitConverter(id, name, units, facts, note) {
    const options = units.map(function (u) { return { value: u[0], label: u[0] + " (" + u[1] + ")" }; });
    return {
        id: id,
        group: "Conversions",
        name: name,
        formula: "new = old × conversion number",
        means: "Find how many of the new unit fit in one of the old unit, then multiply.",
        say: "\"Multiply by the conversion number. If 1 new unit is bigger, divide instead.\"",
        note: note,
        facts: facts,
        keywords: units.map(function (u) { return u[0] + " " + u[1]; }).join(" "),
        inputs: [
            { id: "value", label: "Amount", value: "1" },
            { id: "from", label: "From", options: options, value: units[0][0] },
            { id: "to", label: "To", options: options, value: units[1][0] }
        ],
        solve: function (v) {
            const from = units.find(function (u) { return u[0] === v.from; });
            const to = units.find(function (u) { return u[0] === v.to; });
            const amount = v.value;
            if (from === to) {
                return { steps: [["Same unit, nothing to do", fmt(amount) + " " + to[0]]], plain: "Pick two different units." };
            }
            const factor = from[2] / to[2];
            const result = amount * factor;
            let steps;
            if (factor >= 1) {
                steps = [
                    ["The conversion number", "1 " + from[0] + " = " + fmt(factor) + " " + to[0]],
                    ["Multiply", fmt(amount) + " × " + fmt(factor)],
                    ["Answer", "= " + fmt(result) + " " + to[0]]
                ];
            } else {
                const inverse = 1 / factor;
                steps = [
                    ["1 " + to[0] + " is bigger, so divide", "1 " + to[0] + " = " + fmt(inverse) + " " + from[0]],
                    ["Divide", fmt(amount) + " ÷ " + fmt(inverse)],
                    ["Answer", "= " + fmt(result) + " " + to[0]]
                ];
            }
            return { steps: steps, plain: fmt(amount) + " " + from[0] + " = " + fmt(result) + " " + to[0] + "." };
        }
    };
}

// ---------- Temperature (needs real formulas, not one multiplier) ----------

function fToC(f) {
    const c = (f - 32) * 5 / 9;
    return { value: c, steps: [
        ["°F to °C formula", "C = (F − 32) × 5/9"],
        ["Plug in", "C = (" + p(f) + " − 32) × 5/9"],
        ["Subtract first (parentheses)", "C = " + p(f - 32) + " × 5/9"],
        ["Times 5, then divide by 9", "C = " + fmt(c)]
    ] };
}

function cToF(c) {
    const f = c * 9 / 5 + 32;
    return { value: f, steps: [
        ["°C to °F formula", "F = C × 9/5 + 32"],
        ["Plug in", "F = " + p(c) + " × 9/5 + 32"],
        ["Multiply first (PEMDAS)", "F = " + p(c * 9 / 5) + " + 32"],
        ["Add 32", "F = " + fmt(f)]
    ] };
}

function cToK(c) {
    const k = c + 273.15;
    return { value: k, steps: [
        ["°C to K formula", "K = C + 273.15"],
        ["Plug in and add", "K = " + p(c) + " + 273.15 = " + fmt(k)]
    ] };
}

function kToC(k) {
    const c = k - 273.15;
    return { value: c, steps: [
        ["K to °C formula", "C = K − 273.15"],
        ["Plug in and subtract", "C = " + p(k) + " − 273.15 = " + fmt(c)]
    ] };
}

// ---------- The list ----------

const FORMULAS = [
    // ===== Lines and graphs =====
    {
        id: "slope",
        group: "Lines and graphs",
        name: "Slope",
        formula: "m = (y₂ − y₁) / (x₂ − x₁)",
        means: "How steep the line is. Up-change ÷ right-change.",
        say: "\"m equals y-two minus y-one, over x-two minus x-one.\"",
        note: "The little ₁ and ₂ just mean \"point 1\" and \"point 2.\" Not math, just labels. Positive = uphill, negative = downhill, 0 = flat.",
        keywords: "rise over run steep line graph",
        inputs: [
            { id: "x1", label: "x₁", value: "2" }, { id: "y1", label: "y₁", value: "3" },
            { id: "x2", label: "x₂", value: "6" }, { id: "y2", label: "y₂", value: "11" }
        ],
        solve: function (v) {
            const rise = v.y2 - v.y1;
            const run = v.x2 - v.x1;
            const steps = [
                ["Start with the formula", "m = (y₂ − y₁) / (x₂ − x₁)"],
                ["Plug in your numbers", "m = (" + p(v.y2) + " − " + p(v.y1) + ") / (" + p(v.x2) + " − " + p(v.x1) + ")"],
                ["Subtract top and bottom", "m = " + fmt(rise) + " / " + fmt(run)]
            ];
            if (run === 0) {
                steps.push(["Bottom is 0, and you can't divide by 0", "m = undefined"]);
                return { steps: steps, plain: "A vertical line. Its slope is undefined." };
            }
            const m = rise / run;
            // A slope like 0.666667 reads better as 2/3, so show the fraction too.
            let asFraction = "";
            let size = fmt(Math.abs(m));
            if (!Number.isInteger(m) && Number.isInteger(rise) && Number.isInteger(run)) {
                const g = gcd(rise, run);
                asFraction = "  (= " + fraction(rise / g, run / g) + ")";
                size = fraction(Math.abs(rise / g), Math.abs(run / g));
            }
            steps.push(["Divide", "m = " + fmt(m) + asFraction]);
            let plain;
            if (m === 0) plain = "Flat line: it doesn't go up or down.";
            else plain = "Every 1 step right, the line goes " + (m > 0 ? "up " : "down ") + size + ".";
            return { steps: steps, plain: plain };
        }
    },
    {
        id: "line",
        group: "Lines and graphs",
        name: "Line through 2 points",
        formula: "y = mx + b",
        means: "The equation of a line. m = slope, b = where it crosses the y-axis.",
        say: "\"y equals m x plus b.\"",
        note: "Slope-intercept form. Find m first (slope formula), then plug one point in to find b.",
        keywords: "slope intercept equation of a line y=mx+b",
        inputs: [
            { id: "x1", label: "x₁", value: "2" }, { id: "y1", label: "y₁", value: "3" },
            { id: "x2", label: "x₂", value: "6" }, { id: "y2", label: "y₂", value: "11" }
        ],
        solve: function (v) {
            const run = v.x2 - v.x1;
            if (run === 0) return { error: "Both points have the same x, so it's a vertical line: x = " + fmt(v.x1) + "." };
            const m = (v.y2 - v.y1) / run;
            const b = v.y1 - m * v.x1;
            const sign = b < 0 ? " − " : " + ";
            return { steps: [
                ["Find the slope", "m = (" + p(v.y2) + " − " + p(v.y1) + ") / (" + p(v.x2) + " − " + p(v.x1) + ") = " + fmt(m)],
                ["Plug m and point 1 into y = mx + b", p(v.y1) + " = " + p(m) + " × " + p(v.x1) + " + b"],
                ["Multiply", p(v.y1) + " = " + p(m * v.x1) + " + b"],
                ["Subtract to get b alone", "b = " + p(v.y1) + " − " + p(m * v.x1) + " = " + fmt(b)],
                ["Write the line", "y = " + fmt(m) + "x" + sign + fmt(Math.abs(b))]
            ], plain: "Slope " + fmt(m) + ", crosses the y-axis at " + fmt(b) + "." };
        }
    },
    {
        id: "distance",
        group: "Lines and graphs",
        name: "Distance",
        formula: "d = √((x₂ − x₁)² + (y₂ − y₁)²)",
        means: "How far apart two points are. It's the Pythagorean theorem in disguise.",
        say: "\"d equals the square root of x-change squared plus y-change squared.\"",
        note: "Square each change BEFORE adding. Squaring makes negatives positive.",
        keywords: "length between points",
        inputs: [
            { id: "x1", label: "x₁", value: "1" }, { id: "y1", label: "y₁", value: "2" },
            { id: "x2", label: "x₂", value: "4" }, { id: "y2", label: "y₂", value: "6" }
        ],
        solve: function (v) {
            const dx = v.x2 - v.x1;
            const dy = v.y2 - v.y1;
            const sum = dx * dx + dy * dy;
            return { steps: [
                ["Start with the formula", "d = √((x₂ − x₁)² + (y₂ − y₁)²)"],
                ["Plug in", "d = √((" + p(v.x2) + " − " + p(v.x1) + ")² + (" + p(v.y2) + " − " + p(v.y1) + ")²)"],
                ["Subtract inside each ( )", "d = √(" + p(dx) + "² + " + p(dy) + "²)"],
                ["Square each one", "d = √(" + fmt(dx * dx) + " + " + fmt(dy * dy) + ")"],
                ["Add", "d = √" + fmt(sum)],
                ["Square root", "d = " + fmt(Math.sqrt(sum))]
            ], plain: "The points are " + fmt(Math.sqrt(sum)) + " units apart." };
        }
    },
    {
        id: "midpoint",
        group: "Lines and graphs",
        name: "Midpoint",
        formula: "M = ((x₁ + x₂)/2, (y₁ + y₂)/2)",
        means: "The point exactly halfway between two points. Average the x's, average the y's.",
        say: "\"Add the x's and halve it, add the y's and halve it.\"",
        note: "",
        keywords: "middle halfway average",
        inputs: [
            { id: "x1", label: "x₁", value: "2" }, { id: "y1", label: "y₁", value: "3" },
            { id: "x2", label: "x₂", value: "6" }, { id: "y2", label: "y₂", value: "11" }
        ],
        solve: function (v) {
            const mx = (v.x1 + v.x2) / 2;
            const my = (v.y1 + v.y2) / 2;
            return { steps: [
                ["Start with the formula", "M = ((x₁ + x₂)/2, (y₁ + y₂)/2)"],
                ["Plug in", "M = ((" + p(v.x1) + " + " + p(v.x2) + ")/2, (" + p(v.y1) + " + " + p(v.y2) + ")/2)"],
                ["Add", "M = (" + fmt(v.x1 + v.x2) + "/2, " + fmt(v.y1 + v.y2) + "/2)"],
                ["Divide by 2", "M = (" + fmt(mx) + ", " + fmt(my) + ")"]
            ], plain: "Halfway point: (" + fmt(mx) + ", " + fmt(my) + ")." };
        }
    },

    // ===== Equations =====
    {
        id: "linear",
        group: "Equations",
        name: "Solve ax + b = c",
        formula: "x = (c − b) / a",
        means: "Get x alone: undo the + b first, then undo the × a.",
        say: "\"Subtract b from both sides, then divide both sides by a.\"",
        note: "Whatever you do to one side, do to the other side. That's the whole rule.",
        keywords: "linear equation solve for x one step two step",
        inputs: [
            { id: "a", label: "a", value: "2" }, { id: "b", label: "b", value: "3" },
            { id: "c", label: "c", value: "11" }
        ],
        solve: function (v) {
            if (v.a === 0) return { error: "a can't be 0 (then there's no x to solve for)." };
            const right = v.c - v.b;
            const x = right / v.a;
            return { steps: [
                ["Write it out", term(v.a, "x", true) + (v.b ? term(v.b, "") : "") + " = " + fmt(v.c)],
                ["Subtract " + fmt(v.b) + " from both sides", term(v.a, "x", true) + " = " + fmt(v.c) + " − " + p(v.b) + " = " + fmt(right)],
                ["Divide both sides by " + fmt(v.a), "x = " + fmt(right) + " / " + p(v.a)],
                ["Answer", "x = " + fmt(x)]
            ], plain: "Check: " + fmt(v.a) + " × " + p(x) + " + " + p(v.b) + " = " + fmt(v.a * x + v.b) + "." };
        }
    },
    {
        id: "quadratic",
        group: "Equations",
        name: "Quadratic formula",
        formula: "x = (−b ± √(b² − 4ac)) / 2a",
        means: "Solves any ax² + bx + c = 0. Usually gives two answers (the ± means one with +, one with −).",
        say: "\"x equals negative b, plus or minus the square root of b squared minus 4 a c, all over 2 a.\"",
        note: "Get the equation to = 0 first. b² − 4ac is called the discriminant: positive = 2 answers, 0 = 1 answer, negative = no real answers.",
        keywords: "polynomial ax^2 discriminant roots zeros x squared",
        inputs: [
            { id: "a", label: "a (x² number)", value: "1" }, { id: "b", label: "b (x number)", value: "-5" },
            { id: "c", label: "c (plain number)", value: "6" }
        ],
        solve: function (v) {
            if (v.a === 0) return { error: "a can't be 0. Without x² it isn't a quadratic; use Solve ax + b = c." };
            const d = v.b * v.b - 4 * v.a * v.c;
            const steps = [
                ["Your equation", term(v.a, "x²", true) + (v.b ? term(v.b, "x") : "") + (v.c ? term(v.c, "") : "") + " = 0"],
                ["Discriminant first: b² − 4ac", p(v.b) + "² − 4 × " + p(v.a) + " × " + p(v.c) + " = " + fmt(v.b * v.b) + " − " + p(4 * v.a * v.c) + " = " + fmt(d)]
            ];
            if (d < 0) {
                steps.push(["Negative under the √", "No real solutions"]);
                return { steps: steps, plain: "The curve never touches the x-axis, so there's no real answer." };
            }
            const root = Math.sqrt(d);
            steps.push(["Square root of it", "√" + fmt(d) + " = " + fmt(root)]);
            steps.push(["Plug into the formula", "x = (" + fmt(-v.b) + " ± " + fmt(root) + ") / " + fmt(2 * v.a)]);
            const x1 = (-v.b + root) / (2 * v.a);
            const x2 = (-v.b - root) / (2 * v.a);
            if (d === 0) {
                steps.push(["± of 0 is the same either way", "x = " + fmt(x1)]);
                return { steps: steps, plain: "One answer: x = " + fmt(x1) + "." };
            }
            steps.push(["Do + and − separately", "x = " + fmt(x1) + "  or  x = " + fmt(x2)]);
            return { steps: steps, plain: "Two answers: " + fmt(x1) + " and " + fmt(x2) + "." };
        }
    },
    {
        id: "pemdas",
        group: "Equations",
        name: "Order of operations",
        formula: "P → E → M/D → A/S",
        means: "The order you do math in. Go top to bottom; M/D and A/S go left to right.",
        say: "\"Please Excuse My Dear Aunt Sally.\"",
        note: "Multiply and divide are a tie, so do whichever comes first, left to right. Same for add and subtract.",
        keywords: "pemdas order operations",
        rules: [
            ["P", "Parentheses ( ) first, innermost out"],
            ["E", "Exponents: 3² = 9"],
            ["M / D", "Multiply and divide, left to right"],
            ["A / S", "Add and subtract, left to right"],
            ["Ex", "10 − 2 × 3 + 8 ÷ 4 → 10 − 6 + 2 → 6"]
        ]
    },

    // ===== Exponents and roots =====
    {
        id: "power",
        group: "Exponents and roots",
        name: "Exponent (power)",
        formula: "aⁿ = a × a × … (n times)",
        means: "The little number says how many copies of the big number to multiply.",
        say: "\"a to the n-th power.\"",
        note: "Anything to the 0 is 1. A negative exponent means flip it: a⁻ⁿ = 1/aⁿ.",
        keywords: "power squared cubed exponent",
        inputs: [
            { id: "a", label: "Base (big number)", value: "2" }, { id: "n", label: "Exponent (little)", value: "5" }
        ],
        solve: function (v) {
            const result = Math.pow(v.a, v.n);
            const steps = [["Write it", p(v.a) + sup(v.n)]];
            if (v.n === 0) {
                steps.push(["Anything (except 0) to the 0 is 1", "= 1"]);
            } else if (Number.isInteger(v.n) && v.n > 0 && v.n <= 10) {
                steps.push(["Write out " + v.n + " copies", Array(v.n).fill(p(v.a)).join(" × ")]);
                steps.push(["Multiply", "= " + fmt(result)]);
            } else if (Number.isInteger(v.n) && v.n < 0) {
                steps.push(["Negative exponent = flip it", "= 1 / " + p(v.a) + sup(-v.n)]);
                steps.push(["Work the bottom", "= 1 / " + fmt(Math.pow(v.a, -v.n))]);
                steps.push(["Divide", "= " + fmt(result)]);
            } else {
                steps.push(["Calculate", "= " + fmt(result)]);
            }
            return { steps: steps, plain: p(v.a) + sup(v.n) + " = " + fmt(result) + "." };
        }
    },
    {
        id: "exponent-rules",
        group: "Exponents and roots",
        name: "Exponent rules",
        formula: "aᵐ · aⁿ = aᵐ⁺ⁿ",
        means: "Shortcuts for exponents with the same base. Count the copies and they all make sense.",
        say: "\"Same base: multiplying adds the exponents.\"",
        note: "These only work when the base (big number) is the same.",
        keywords: "exponent rules laws product quotient power zero negative",
        rules: [
            ["aᵐ · aⁿ = aᵐ⁺ⁿ", "Multiply → add exponents. 2² · 2³ = 2⁵"],
            ["aᵐ / aⁿ = aᵐ⁻ⁿ", "Divide → subtract exponents. 5⁶ / 5² = 5⁴"],
            ["(aᵐ)ⁿ = aᵐⁿ", "Power of a power → multiply. (3²)³ = 3⁶"],
            ["(ab)ⁿ = aⁿbⁿ", "Each piece gets the exponent. (2x)³ = 8x³"],
            ["a⁰ = 1", "Anything (not 0) to the 0 is 1"],
            ["a⁻ⁿ = 1/aⁿ", "Negative → flip it. 2⁻³ = 1/8"]
        ]
    },
    {
        id: "sqrt",
        group: "Exponents and roots",
        name: "Square root",
        formula: "√a = b  because  b² = a",
        means: "What number times itself gives a?",
        say: "\"The square root of a.\"",
        note: "Perfect squares to know: 1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144.",
        keywords: "root radical square root",
        inputs: [{ id: "a", label: "Number", value: "49" }],
        solve: function (v) {
            if (v.a < 0) return { error: "No real square root of a negative number." };
            const r = Math.sqrt(v.a);
            const steps = [["Ask: what times itself = " + fmt(v.a) + "?", "? × ? = " + fmt(v.a)]];
            if (Number.isInteger(r)) {
                steps.push(["Perfect square", fmt(r) + " × " + fmt(r) + " = " + fmt(v.a)]);
                steps.push(["Answer", "√" + fmt(v.a) + " = " + fmt(r)]);
            } else {
                steps.push(["Not a perfect square, so it's a decimal", "√" + fmt(v.a) + " ≈ " + fmt(r)]);
            }
            return { steps: steps, plain: "√" + fmt(v.a) + " = " + fmt(r) + "." };
        }
    },

    // ===== Percent =====
    {
        id: "percent-of",
        group: "Percent",
        name: "Percent of a number",
        formula: "part = (p ÷ 100) × whole",
        means: "Turn the percent into a decimal, then multiply.",
        say: "\"p percent of the whole.\"",
        note: "\"Of\" in math means multiply.",
        keywords: "percent percentage tip discount tax",
        inputs: [{ id: "p", label: "Percent (%)", value: "20" }, { id: "whole", label: "Of what", value: "80" }],
        solve: function (v) {
            const d = v.p / 100;
            return { steps: [
                ["Percent to decimal (÷ 100)", fmt(v.p) + "% = " + fmt(d)],
                ["Multiply", fmt(d) + " × " + p(v.whole)],
                ["Answer", "= " + fmt(d * v.whole)]
            ], plain: fmt(v.p) + "% of " + fmt(v.whole) + " is " + fmt(d * v.whole) + "." };
        }
    },
    {
        id: "percent-change",
        group: "Percent",
        name: "Percent change",
        formula: "% change = (new − old) / old × 100",
        means: "How much something went up or down, compared to where it started.",
        say: "\"New minus old, over old, times 100.\"",
        note: "Always divide by the OLD number.",
        keywords: "increase decrease growth",
        inputs: [{ id: "old", label: "Old", value: "50" }, { id: "now", label: "New", value: "65" }],
        solve: function (v) {
            if (v.old === 0) return { error: "Old can't be 0 (can't divide by 0)." };
            const diff = v.now - v.old;
            const pct = diff / v.old * 100;
            return { steps: [
                ["Subtract", fmt(v.now) + " − " + p(v.old) + " = " + fmt(diff)],
                ["Divide by old", fmt(diff) + " / " + p(v.old) + " = " + fmt(diff / v.old)],
                ["Times 100", "= " + fmt(pct) + "%"]
            ], plain: pct >= 0 ? "Went up " + fmt(pct) + "%." : "Went down " + fmt(-pct) + "%." };
        }
    },

    // ===== Shapes =====
    {
        id: "rect-area",
        group: "Shapes",
        name: "Rectangle area",
        formula: "A = l × w",
        means: "How much flat space is inside. Length times width.",
        say: "\"Area equals length times width.\"",
        note: "Area is in square units (ft², m²) because you multiplied two lengths.",
        keywords: "length width square rectangle",
        inputs: [{ id: "l", label: "Length", value: "8" }, { id: "w", label: "Width", value: "5" }],
        solve: function (v) {
            return { steps: [
                ["Start with the formula", "A = l × w"],
                ["Plug in", "A = " + fmt(v.l) + " × " + fmt(v.w)],
                ["Multiply", "A = " + fmt(v.l * v.w)]
            ], plain: "Area is " + fmt(v.l * v.w) + " square units." };
        }
    },
    {
        id: "rect-perimeter",
        group: "Shapes",
        name: "Rectangle perimeter",
        formula: "P = 2l + 2w",
        means: "The distance around the outside. Two lengths plus two widths.",
        say: "\"Perimeter equals 2 length plus 2 width.\"",
        note: "Perimeter is plain units (ft, m), not squared.",
        keywords: "around fence border",
        inputs: [{ id: "l", label: "Length", value: "8" }, { id: "w", label: "Width", value: "5" }],
        solve: function (v) {
            return { steps: [
                ["Start with the formula", "P = 2l + 2w"],
                ["Plug in", "P = 2 × " + fmt(v.l) + " + 2 × " + fmt(v.w)],
                ["Multiply first", "P = " + fmt(2 * v.l) + " + " + fmt(2 * v.w)],
                ["Add", "P = " + fmt(2 * v.l + 2 * v.w)]
            ], plain: "It's " + fmt(2 * v.l + 2 * v.w) + " units around." };
        }
    },
    {
        id: "triangle-area",
        group: "Shapes",
        name: "Triangle area",
        formula: "A = ½ × b × h",
        means: "A triangle is half a rectangle, so it's half of base × height.",
        say: "\"Area equals one-half base times height.\"",
        note: "Height is straight up from the base (a right angle), not the slanted side.",
        keywords: "triangle base height",
        inputs: [{ id: "b", label: "Base", value: "10" }, { id: "h", label: "Height", value: "6" }],
        solve: function (v) {
            return { steps: [
                ["Start with the formula", "A = ½ × b × h"],
                ["Plug in", "A = ½ × " + fmt(v.b) + " × " + fmt(v.h)],
                ["Multiply base × height", "A = ½ × " + fmt(v.b * v.h)],
                ["Half of it", "A = " + fmt(v.b * v.h / 2)]
            ], plain: "Area is " + fmt(v.b * v.h / 2) + " square units." };
        }
    },
    {
        id: "circle-area",
        group: "Shapes",
        name: "Circle area",
        formula: "A = πr²",
        means: "Space inside a circle. r = radius (center to edge). π ≈ 3.14159.",
        say: "\"Area equals pi r squared.\"",
        note: "Radius is half the diameter. Square the radius FIRST, then times π.",
        keywords: "circle radius pi",
        inputs: [{ id: "r", label: "Radius", value: "3" }],
        solve: function (v) {
            return { steps: [
                ["Start with the formula", "A = π × r²"],
                ["Plug in", "A = π × " + p(v.r) + "²"],
                ["Square the radius (PEMDAS: E before M)", "A = π × " + fmt(v.r * v.r)],
                ["Times π", "A ≈ " + fmt(Math.PI * v.r * v.r)]
            ], plain: "Area is about " + fmt(Math.PI * v.r * v.r) + " square units (exactly " + fmt(v.r * v.r) + "π)." };
        }
    },
    {
        id: "circumference",
        group: "Shapes",
        name: "Circle circumference",
        formula: "C = 2πr",
        means: "The distance around a circle.",
        say: "\"Circumference equals 2 pi r.\"",
        note: "Same as π × diameter.",
        keywords: "circle around perimeter pi",
        inputs: [{ id: "r", label: "Radius", value: "3" }],
        solve: function (v) {
            return { steps: [
                ["Start with the formula", "C = 2 × π × r"],
                ["Plug in", "C = 2 × π × " + fmt(v.r)],
                ["Multiply", "C ≈ " + fmt(2 * Math.PI * v.r)]
            ], plain: "About " + fmt(2 * Math.PI * v.r) + " units around (exactly " + fmt(2 * v.r) + "π)." };
        }
    },
    {
        id: "pythagorean",
        group: "Shapes",
        name: "Pythagorean theorem",
        formula: "a² + b² = c²",
        means: "For right triangles: the two short sides squared add up to the long side squared.",
        say: "\"a squared plus b squared equals c squared.\"",
        note: "c is always the longest side, across from the square corner. Leave c blank to find it, or leave a blank to find a missing short side.",
        keywords: "right triangle hypotenuse leg",
        inputs: [{ id: "a", label: "a (short side)", value: "3" }, { id: "b", label: "b (short side)", value: "4" }, { id: "c", label: "c (long side)", value: "", optional: true }],
        solve: function (v) {
            if (isNaN(v.c)) {
                if (isNaN(v.a) || isNaN(v.b)) return { error: "Fill in a and b to find c." };
                const sum = v.a * v.a + v.b * v.b;
                return { steps: [
                    ["Start with the formula", "a² + b² = c²"],
                    ["Plug in", p(v.a) + "² + " + p(v.b) + "² = c²"],
                    ["Square each", fmt(v.a * v.a) + " + " + fmt(v.b * v.b) + " = c²"],
                    ["Add", fmt(sum) + " = c²"],
                    ["Square root both sides", "c = " + fmt(Math.sqrt(sum))]
                ], plain: "The long side is " + fmt(Math.sqrt(sum)) + "." };
            }
            const known = isNaN(v.a) ? v.b : v.a;
            if (isNaN(known)) return { error: "Fill in two of the three sides." };
            const diff = v.c * v.c - known * known;
            if (diff <= 0) return { error: "c has to be the longest side." };
            return { steps: [
                ["Start with the formula", "a² + b² = c²"],
                ["Plug in what you know", p(known) + "² + ?² = " + p(v.c) + "²"],
                ["Square them", fmt(known * known) + " + ?² = " + fmt(v.c * v.c)],
                ["Subtract " + fmt(known * known) + " from both sides", "?² = " + fmt(diff)],
                ["Square root both sides", "? = " + fmt(Math.sqrt(diff))]
            ], plain: "The missing short side is " + fmt(Math.sqrt(diff)) + "." };
        }
    },
    {
        id: "box-volume",
        group: "Shapes",
        name: "Box volume",
        formula: "V = l × w × h",
        means: "How much a box holds. Length times width times height.",
        say: "\"Volume equals length times width times height.\"",
        note: "Volume is in cubic units (ft³, m³).",
        keywords: "volume cube box rectangular prism",
        inputs: [{ id: "l", label: "Length", value: "4" }, { id: "w", label: "Width", value: "3" }, { id: "h", label: "Height", value: "2" }],
        solve: function (v) {
            return { steps: [
                ["Start with the formula", "V = l × w × h"],
                ["Plug in", "V = " + fmt(v.l) + " × " + fmt(v.w) + " × " + fmt(v.h)],
                ["Multiply left to right", "V = " + fmt(v.l * v.w) + " × " + fmt(v.h)],
                ["Answer", "V = " + fmt(v.l * v.w * v.h)]
            ], plain: "It holds " + fmt(v.l * v.w * v.h) + " cubic units." };
        }
    },

    // ===== Conversions =====
    {
        id: "temperature",
        group: "Conversions",
        name: "Temperature (°F, °C, K)",
        formula: "C = (F − 32) × 5/9   ·   F = C × 9/5 + 32",
        means: "°F and °C don't start at the same zero, so it's a formula, not one multiplier.",
        say: "\"Subtract 32, times 5 over 9\" to get Celsius. \"Times 9 over 5, plus 32\" to get Fahrenheit.",
        note: "Kelvin is Celsius + 273.15 (science class).",
        facts: ["Water freezes: 32°F = 0°C", "Water boils: 212°F = 100°C", "Body temp: 98.6°F = 37°C", "K = C + 273.15"],
        keywords: "temp fahrenheit celsius kelvin degrees",
        inputs: [
            { id: "value", label: "Temperature", value: "72" },
            { id: "from", label: "From", options: [{ value: "F", label: "°F" }, { value: "C", label: "°C" }, { value: "K", label: "K" }], value: "F" },
            { id: "to", label: "To", options: [{ value: "F", label: "°F" }, { value: "C", label: "°C" }, { value: "K", label: "K" }], value: "C" }
        ],
        solve: function (v) {
            const symbol = { F: "°F", C: "°C", K: "K" };
            if (v.from === v.to) return { steps: [["Same unit, nothing to do", fmt(v.value) + " " + symbol[v.to]]], plain: "Pick two different units." };
            let steps = [];
            let c = v.value;
            if (v.from === "F") { const r = fToC(v.value); steps = steps.concat(r.steps); c = r.value; }
            if (v.from === "K") { const r = kToC(v.value); steps = steps.concat(r.steps); c = r.value; }
            let result = c;
            if (v.to === "F") { const r = cToF(c); steps = steps.concat(r.steps); result = r.value; }
            if (v.to === "K") { const r = cToK(c); steps = steps.concat(r.steps); result = r.value; }
            return { steps: steps, plain: fmt(v.value) + " " + symbol[v.from] + " = " + fmt(result) + " " + symbol[v.to] + "." };
        }
    },
    unitConverter("length", "Length", [
        ["in", "inches", 0.0254], ["ft", "feet", 0.3048], ["yd", "yards", 0.9144], ["mi", "miles", 1609.344],
        ["mm", "millimeters", 0.001], ["cm", "centimeters", 0.01], ["m", "meters", 1], ["km", "kilometers", 1000]
    ], ["1 ft = 12 in", "1 yd = 3 ft", "1 mi = 5,280 ft", "1 in = 2.54 cm", "1 m ≈ 3.281 ft", "1 mi ≈ 1.609 km", "1 km = 1,000 m", "1 m = 100 cm = 1,000 mm"], "Metric is all 10s: milli = 1/1000, centi = 1/100, kilo = 1000."),
    unitConverter("weight", "Weight / mass", [
        ["oz", "ounces", 0.028349523125], ["lb", "pounds", 0.45359237], ["ton", "US tons", 907.18474],
        ["g", "grams", 0.001], ["kg", "kilograms", 1], ["t", "metric tonnes", 1000]
    ], ["1 lb = 16 oz", "1 ton = 2,000 lb", "1 kg ≈ 2.205 lb", "1 oz ≈ 28.35 g", "1 kg = 1,000 g"], ""),
    unitConverter("volume", "Volume (liquid)", [
        ["tsp", "teaspoons", 0.00492892159375], ["tbsp", "tablespoons", 0.01478676478125], ["fl oz", "fluid ounces", 0.0295735295625],
        ["cup", "cups", 0.2365882365], ["pt", "pints", 0.473176473], ["qt", "quarts", 0.946352946], ["gal", "gallons", 3.785411784],
        ["mL", "milliliters", 0.001], ["L", "liters", 1]
    ], ["3 tsp = 1 tbsp", "2 tbsp = 1 fl oz", "8 fl oz = 1 cup", "2 cups = 1 pt", "2 pt = 1 qt", "4 qt = 1 gal", "1 L ≈ 1.057 qt", "1 gal ≈ 3.785 L"], "US measurements."),
    unitConverter("area", "Area", [
        ["in²", "square inches", 0.00064516], ["ft²", "square feet", 0.09290304], ["yd²", "square yards", 0.83612736],
        ["acre", "acres", 4046.8564224], ["mi²", "square miles", 2589988.110336],
        ["cm²", "square centimeters", 0.0001], ["m²", "square meters", 1], ["ha", "hectares", 10000], ["km²", "square kilometers", 1000000]
    ], ["1 ft² = 144 in² (12 × 12)", "1 yd² = 9 ft² (3 × 3)", "1 acre = 43,560 ft²", "1 mi² = 640 acres", "1 m² ≈ 10.76 ft²", "1 ha = 10,000 m²"], "Square units: the length conversion gets squared. 1 ft = 12 in, so 1 ft² = 12 × 12 = 144 in²."),
    unitConverter("time", "Time", [
        ["s", "seconds", 1], ["min", "minutes", 60], ["hr", "hours", 3600], ["day", "days", 86400],
        ["wk", "weeks", 604800], ["yr", "years", 31557600]
    ], ["1 min = 60 s", "1 hr = 60 min = 3,600 s", "1 day = 24 hr", "1 wk = 7 days", "1 yr ≈ 365.25 days"], "A year here is 365.25 days (the leap-year average)."),
    unitConverter("speed", "Speed", [
        ["mph", "miles per hour", 0.44704], ["km/h", "kilometers per hour", 1 / 3.6], ["ft/s", "feet per second", 0.3048],
        ["m/s", "meters per second", 1], ["knot", "knots", 1852 / 3600]
    ], ["1 mph ≈ 1.609 km/h", "60 mph = 88 ft/s", "1 m/s = 3.6 km/h", "1 knot ≈ 1.151 mph"], ""),
    {
        id: "fraction-decimal",
        group: "Conversions",
        name: "Fraction → decimal → percent",
        formula: "top ÷ bottom = decimal  ·  decimal × 100 = %",
        means: "A fraction IS a division problem. Divide it, then times 100 for percent.",
        say: "\"Top divided by bottom.\"",
        note: "",
        facts: ["1/2 = 0.5 = 50%", "1/4 = 0.25 = 25%", "3/4 = 0.75 = 75%", "1/3 ≈ 0.333 = 33.3%", "1/5 = 0.2 = 20%", "1/10 = 0.1 = 10%"],
        keywords: "fraction decimal percent convert numerator denominator",
        inputs: [{ id: "top", label: "Top (numerator)", value: "3" }, { id: "bottom", label: "Bottom (denominator)", value: "8" }],
        solve: function (v) {
            if (v.bottom === 0) return { error: "Bottom can't be 0." };
            const d = v.top / v.bottom;
            const steps = [];
            if (Number.isInteger(v.top) && Number.isInteger(v.bottom)) {
                const g = gcd(v.top, v.bottom);
                if (g > 1) steps.push(["Simplify (both divide by " + g + ")", fraction(v.top, v.bottom) + " = " + fraction(v.top / g, v.bottom / g)]);
            }
            steps.push(["Divide top by bottom", fmt(v.top) + " ÷ " + p(v.bottom) + " = " + fmt(d)]);
            steps.push(["Times 100 for percent", fmt(d) + " × 100 = " + fmt(d * 100) + "%"]);
            return { steps: steps, plain: fraction(v.top, v.bottom) + " = " + fmt(d) + " = " + fmt(d * 100) + "%." };
        }
    },
    {
        id: "decimal-fraction",
        group: "Conversions",
        name: "Decimal → fraction",
        formula: "0.75 = 75/100 = 3/4",
        means: "Count the decimal places, put the digits over 1 with that many zeros, then simplify.",
        say: "\"Seventy-five hundredths.\"",
        note: "1 decimal place = over 10, 2 places = over 100, 3 places = over 1,000.",
        keywords: "decimal to fraction simplify",
        inputs: [{ id: "d", label: "Decimal", value: "0.75" }],
        solve: function (v, raw) {
            const text = String(raw.d).trim().replace("−", "-");
            const places = text.includes(".") ? text.split(".")[1].length : 0;
            if (places > 9) return { error: "Too many decimal places (9 max)." };
            const bottom = Math.pow(10, places);
            const top = Math.round(v.d * bottom);
            const g = gcd(top, bottom);
            const steps = [
                ["Count decimal places", places + " place" + (places === 1 ? "" : "s") + " → over " + fmt(bottom)],
                ["Write it as a fraction", fmt(v.d) + " = " + fraction(top, bottom)]
            ];
            if (g > 1) steps.push(["Simplify (both divide by " + fmt(g) + ")", "= " + fraction(top / g, bottom / g)]);
            else steps.push(["Can't simplify", "= " + fraction(top, bottom)]);
            return { steps: steps, plain: fmt(v.d) + " = " + fraction(top / g, bottom / g) + " = " + fmt(v.d * 100) + "%." };
        }
    },
    {
        id: "percent-decimal",
        group: "Conversions",
        name: "Percent → decimal",
        formula: "p% = p ÷ 100",
        means: "Percent means \"out of 100.\" Divide by 100 = move the decimal 2 spots left.",
        say: "\"Percent means per hundred.\"",
        note: "Going back: decimal × 100 = percent (move 2 spots right).",
        keywords: "percent to decimal",
        inputs: [{ id: "p", label: "Percent (%)", value: "35" }],
        solve: function (v) {
            return { steps: [
                ["Percent means out of 100", fmt(v.p) + "% = " + fmt(v.p) + "/100"],
                ["Divide by 100 (decimal 2 spots left)", "= " + fmt(v.p / 100)]
            ], plain: fmt(v.p) + "% = " + fmt(v.p / 100) + "." };
        }
    },
    {
        id: "scientific",
        group: "Conversions",
        name: "Scientific notation",
        formula: "number = c × 10ⁿ  (1 ≤ c < 10)",
        means: "A short way to write huge or tiny numbers. n = how many spots the decimal moved.",
        say: "\"c times ten to the n.\"",
        note: "Big number → positive n. Tiny number (0.00…) → negative n.",
        facts: ["4,500,000 = 4.5 × 10⁶", "0.0032 = 3.2 × 10⁻³", "10³ = 1,000", "10⁻² = 0.01"],
        keywords: "scientific notation powers of ten exponent",
        inputs: [{ id: "n", label: "Number", value: "4500000" }],
        solve: function (v) {
            if (v.n === 0) return { error: "0 is just 0." };
            const e = Math.floor(Math.log10(Math.abs(v.n)));
            const c = v.n / Math.pow(10, e);
            const direction = e > 0 ? "left" : "right";
            const steps = [["Move the decimal so one digit is in front", fmt(v.n) + " → " + fmt(c)]];
            if (e !== 0) steps.push(["It moved " + Math.abs(e) + " spot" + (Math.abs(e) === 1 ? "" : "s") + " " + direction, "n = " + fmt(e)]);
            steps.push(["Write it", fmt(c) + " × 10" + sup(e)]);
            return { steps: steps, plain: fmt(v.n) + " = " + fmt(c) + " × 10" + sup(e) + "." };
        }
    },
    {
        id: "angles",
        group: "Conversions",
        name: "Degrees ↔ radians",
        formula: "rad = deg × π/180  ·  deg = rad × 180/π",
        means: "Two ways to measure angles. A full circle is 360° or 2π radians.",
        say: "\"Times pi over 180\" to get radians.",
        note: "You'll use this in trig. 180° = π.",
        facts: ["360° = 2π", "180° = π", "90° = π/2", "60° = π/3", "45° = π/4", "30° = π/6"],
        keywords: "degrees radians angle pi trig",
        inputs: [
            { id: "value", label: "Angle", value: "90" },
            { id: "from", label: "From", options: [{ value: "deg", label: "degrees" }, { value: "rad", label: "radians" }], value: "deg" }
        ],
        solve: function (v) {
            if (v.from === "deg") {
                const rad = v.value * Math.PI / 180;
                const steps = [
                    ["Degrees to radians formula", "rad = deg × π/180"],
                    ["Plug in", "rad = " + p(v.value) + " × π/180"]
                ];
                if (Number.isInteger(v.value) && v.value !== 0) {
                    const g = gcd(v.value, 180);
                    const top = v.value / g;
                    const bottom = 180 / g;
                    const piText = (top === 1 ? "" : top === -1 ? "−" : fmt(top)) + "π" + (bottom === 1 ? "" : "/" + bottom);
                    steps.push(["Simplify " + fmt(v.value) + "/180", "rad = " + piText]);
                }
                steps.push(["As a decimal", "rad ≈ " + fmt(rad)]);
                return { steps: steps, plain: fmt(v.value) + "° ≈ " + fmt(rad) + " radians." };
            }
            const deg = v.value * 180 / Math.PI;
            return { steps: [
                ["Radians to degrees formula", "deg = rad × 180/π"],
                ["Plug in", "deg = " + p(v.value) + " × 180/π"],
                ["Calculate", "deg ≈ " + fmt(deg) + "°"]
            ], plain: fmt(v.value) + " radians ≈ " + fmt(deg) + "°." };
        }
    }
];
