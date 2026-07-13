/* Calculator tool — safe arithmetic evaluator (no eval). Supports + - * / % ^
   and parentheses. Also computes EMI when asked via the emi operation. */

function tokenize(expr) {
  return expr.match(/\d+\.?\d*|[+\-*/%^()]/g) || [];
}

/* Shunting-yard → RPN → evaluate. */
function evaluate(expr) {
  const prec = { "+": 1, "-": 1, "*": 2, "/": 2, "%": 2, "^": 3 };
  const out = [], ops = [];
  for (const t of tokenize(expr)) {
    if (/^\d/.test(t)) out.push(parseFloat(t));
    else if (t === "(") ops.push(t);
    else if (t === ")") {
      while (ops.length && ops[ops.length - 1] !== "(") out.push(ops.pop());
      ops.pop();
    } else {
      while (ops.length && prec[ops[ops.length - 1]] >= prec[t]) out.push(ops.pop());
      ops.push(t);
    }
  }
  while (ops.length) out.push(ops.pop());

  const st = [];
  for (const t of out) {
    if (typeof t === "number") { st.push(t); continue; }
    const b = st.pop(), a = st.pop();
    if (a === undefined || b === undefined) throw new Error("bad expression");
    st.push(t === "+" ? a + b : t === "-" ? a - b : t === "*" ? a * b :
            t === "/" ? a / b : t === "%" ? a % b : Math.pow(a, b));
  }
  if (st.length !== 1 || !isFinite(st[0])) throw new Error("bad expression");
  return st[0];
}

function emi(principal, annualRatePct, months) {
  const r = annualRatePct / 12 / 100;
  if (r === 0) return principal / months;
  const f = Math.pow(1 + r, months);
  return (principal * r * f) / (f - 1);
}

export const calculatorTool = {
  name: "calculator",
  description:
    "Perform exact arithmetic. Use for any math: costs, totals, per-acre quantities, percentages, and loan EMI. " +
    "operation='eval' computes an arithmetic expression. operation='emi' computes a loan EMI from principal, annual_rate_percent and months.",
  input_schema: {
    type: "object",
    properties: {
      operation: { type: "string", enum: ["eval", "emi"] },
      expression: { type: "string", description: "Arithmetic expression, e.g. (5000*42)/1.5" },
      principal: { type: "number" },
      annual_rate_percent: { type: "number" },
      months: { type: "number" },
    },
    required: ["operation"],
  },
  async run(input) {
    if (input.operation === "emi") {
      const m = emi(input.principal, input.annual_rate_percent, input.months);
      const total = m * input.months;
      return JSON.stringify({
        emi: Math.round(m), total_payment: Math.round(total),
        total_interest: Math.round(total - input.principal),
      });
    }
    return String(evaluate(String(input.expression || "")));
  },
};
