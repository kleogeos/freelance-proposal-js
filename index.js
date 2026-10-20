#!/usr/bin/env node
"use strict";

const fs = require("fs");

// Matches Python's html.escape(str(s), quote=True): & first, then <, >, ", '.
function esc(v) {
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

// Correctly-rounded cents (ties-to-even) from the exact binary value of a
// double -- same fix as freelance-tax-js/akt-rabot-js's money rounding,
// needed because a naive *100 + Math.round can manufacture a spurious tie
// that Python's f"${n:,.2f}" (rounding from the true binary value) would not.
function moneyCents(n) {
  if (n === 0) return 0n;
  const neg = n < 0;
  const ax = Math.abs(n);
  const s = ax.toFixed(20);
  const [intPart, fracPart] = s.split(".");
  const keep = fracPart.slice(0, 2);
  const rest = fracPart.slice(2);
  let roundUp;
  if (rest[0] > "5") roundUp = true;
  else if (rest[0] < "5") roundUp = false;
  else {
    const restAfter = rest.slice(1).replace(/0+$/, "");
    if (restAfter.length > 0) roundUp = true;
    else roundUp = parseInt(keep[1] || "0", 10) % 2 === 1;
  }
  let keepNum = BigInt(intPart + keep.padEnd(2, "0"));
  if (roundUp) keepNum += 1n;
  return neg ? -keepNum : keepNum;
}

// Mirrors Python's f"${n:,.2f}"
function money(n) {
  let cents = moneyCents(n);
  const neg = cents < 0n;
  if (neg) cents = -cents;
  const whole = cents / 100n;
  const frac = cents % 100n;
  const wholeStr = whole.toString();
  let grouped = "";
  for (let i = 0; i < wholeStr.length; i++) {
    if (i > 0 && (wholeStr.length - i) % 3 === 0) grouped += ",";
    grouped += wholeStr[i];
  }
  return (neg ? "-$" : "$") + grouped + "." + frac.toString().padStart(2, "0");
}

function render(data) {
  const pricing = data.pricing;
  const total = pricing.reduce((acc, p) => acc + p.amount, 0);

  const scopeItems = (data.scope || []).map((s) => `<li>${esc(s)}</li>`).join("\n");

  const pricingRows = pricing
    .map(
      (p) =>
        `<tr><td>${esc(p.description)}</td>` +
        `<td style='text-align:right'>${money(p.amount)}</td></tr>`
    )
    .join("\n");

  const summary = esc(data.summary !== undefined ? data.summary : "");
  const timeline = esc(data.timeline !== undefined ? data.timeline : "");
  const terms = esc(data.terms !== undefined ? data.terms : "");
  const notes = esc(data.notes !== undefined ? data.notes : "");
  const proposalNumber = esc(data.proposal_number !== undefined ? data.proposal_number : "");
  const from = esc(data.from !== undefined ? data.from : "");
  const to = esc(data.to !== undefined ? data.to : "");
  const date = esc(data.date !== undefined ? data.date : "");
  const validUntil = esc(data.valid_until !== undefined ? data.valid_until : "");

  return `<!doctype html><html><head><meta charset="utf-8">
<title>Proposal ${proposalNumber}</title>
<style>
body{font-family:-apple-system,Arial,sans-serif;max-width:680px;margin:40px auto;color:#1a1a1a}
table{width:100%;border-collapse:collapse;margin-top:12px}
th,td{padding:8px;border-bottom:1px solid #ddd}
th{text-align:left;color:#666;font-size:13px;text-transform:uppercase}
.total{font-size:20px;font-weight:bold}
.meta{color:#666;font-size:14px}
h2{font-size:15px;text-transform:uppercase;color:#666;margin-top:28px;margin-bottom:4px}
ul{margin-top:4px}
.sign{margin-top:48px;display:flex;gap:40px}
.sign div{flex:1;border-top:1px solid #333;padding-top:4px;font-size:13px;color:#666}
@media print{body{margin:0}}
</style></head><body>
<h1>Proposal ${proposalNumber}</h1>
<p class="meta">From: ${from}<br>
To: ${to}<br>
Date: ${date} &middot; Valid until: ${validUntil}</p>

${summary ? "<h2>Summary</h2><p>" + summary + "</p>" : ""}
${scopeItems ? "<h2>Scope of work</h2><ul>" + scopeItems + "</ul>" : ""}

<h2>Pricing</h2>
<table>
<tr><th>Item</th><th style="text-align:right">Amount</th></tr>
${pricingRows}
</table>
<p style="text-align:right;margin-top:8px"><span class="total">Total: ${money(total)}</span></p>

${timeline ? "<h2>Timeline</h2><p>" + timeline + "</p>" : ""}
${terms ? "<h2>Terms</h2><p>" + terms + "</p>" : ""}
${notes ? "<p class='meta'>" + notes + "</p>" : ""}

<div class="sign">
<div>Accepted by (client), date</div>
<div>${from}, date</div>
</div>
</body></html>`;
}

function printHelp() {
  console.log(`freelance-proposal-js - generate an HTML client proposal/quote from a JSON file

Usage:
  freelance-proposal <input.json> [-o output.html]

Run without installing:
  npx github:kleogeos/freelance-proposal-js example.json -o proposal.html
`);
}

function main() {
  const argv = process.argv.slice(2);
  if (!argv.length || argv[0] === "--help" || argv[0] === "-h") {
    printHelp();
    process.exit(argv.length ? 0 : 1);
  }

  let input = null;
  let output = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-o" || a === "--output") output = argv[++i];
    else if (!input) input = a;
  }

  if (!input) {
    printHelp();
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(input, "utf8"));
  } catch (e) {
    if (e.code === "ENOENT") {
      console.error(`Error: file not found: ${input}`);
    } else {
      console.error(`Error: invalid JSON in ${input}: ${e.message}`);
    }
    process.exit(1);
  }

  if (!data.pricing || !data.pricing.length) {
    console.error("Error: JSON must include a non-empty 'pricing' list");
    process.exit(1);
  }

  const out = render(data);
  if (output) {
    fs.writeFileSync(output, out);
    console.error(`wrote ${output}`);
  } else {
    console.log(out);
  }
}

module.exports = { render, esc, money };

if (require.main === module) {
  main();
}
