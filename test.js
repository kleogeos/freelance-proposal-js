const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { render, esc, money } = require("./index.js");

// Values cross-checked byte-for-byte against the Python implementation
// (kleogeos/freelance-proposal-cli, proposal.py money()) including
// round-half-to-even tie cases on the exact binary value (same class of
// bug found and fixed in freelance-tax-js's round2() / akt-rabot-js).
assert.strictEqual(money(1800), "$1,800.00");
assert.strictEqual(money(0), "$0.00");
assert.strictEqual(money(4238.865), "$4,238.86"); // true binary value < .5, rounds down
assert.strictEqual(money(2.675), "$2.67"); // true binary value < .5, rounds down
assert.strictEqual(money(1234567.5), "$1,234,567.50");

assert.strictEqual(esc("<script>alert(1)</script>"), "&lt;script&gt;alert(1)&lt;/script&gt;");
assert.strictEqual(esc("O'Brien & \"Co\""), "O&#x27;Brien &amp; &quot;Co&quot;");

const html = render({
  pricing: [{ description: "Design", amount: 1800 }],
});
assert.ok(html.includes("$1,800.00"));
assert.ok(!html.includes("Summary")); // omitted when absent

const html2 = render({
  summary: "A project",
  scope: ["Task one", "Task two"],
  pricing: [
    { description: "Design", amount: 1800 },
    { description: "Build", amount: 2400 },
  ],
  timeline: "4 weeks",
  terms: "50% deposit",
  notes: "Hosting billed separately",
});
assert.ok(html2.includes("Summary"));
assert.ok(html2.includes("Scope of work"));
assert.ok(html2.includes("Task one"));
assert.ok(html2.includes("$4,200.00")); // total
assert.ok(html2.includes("Timeline"));
assert.ok(html2.includes("Terms"));
assert.ok(html2.includes("Hosting billed separately"));

// output-file round trip via the CLI entrypoint
const tmpIn = path.join(os.tmpdir(), `proposal-test-${process.pid}.json`);
const tmpOut = path.join(os.tmpdir(), `proposal-test-${process.pid}.html`);
fs.writeFileSync(tmpIn, JSON.stringify({ pricing: [{ description: "x", amount: 1 }] }));
try {
  const { execFileSync } = require("child_process");
  execFileSync(process.execPath, [path.join(__dirname, "index.js"), tmpIn, "-o", tmpOut]);
  const written = fs.readFileSync(tmpOut, "utf8");
  assert.ok(written.includes("Proposal"));
} finally {
  fs.unlinkSync(tmpIn);
  if (fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut);
}

console.log("All tests passed.");
