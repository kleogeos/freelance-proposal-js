# freelance-proposal-js

![test](https://github.com/kleogeos/freelance-proposal-js/actions/workflows/test.yml/badge.svg)

Generate a clean, print-ready HTML client proposal/quote from a JSON file.
Zero dependencies, Node.js — the npx port of
[freelance-proposal-cli](https://github.com/kleogeos/freelance-proposal-cli)
for anyone who'd rather not have Python installed.

```bash
npx github:kleogeos/freelance-proposal-js example.json -o proposal.html
```

Produces a one-page proposal: summary, scope of work, itemized pricing with
a total, timeline, terms, and a signature line — ready to open in a browser
and print to PDF or send as a link.

### Install (optional)

```bash
npm install -g github:kleogeos/freelance-proposal-js
freelance-proposal example.json -o proposal.html
```

### JSON format

```json
{
  "proposal_number": "P-2026-014",
  "from": "Your name",
  "to": "Client name",
  "date": "2026-10-15",
  "valid_until": "2026-11-15",
  "summary": "One-paragraph description of the project.",
  "scope": ["Task one", "Task two"],
  "pricing": [{"description": "Design", "amount": 1800}],
  "timeline": "4 weeks from signed proposal.",
  "terms": "50% deposit to start, 50% on delivery.",
  "notes": "Optional free-text note."
}
```

Only `pricing` is required; every other field is optional and omitted
sections just don't render.

### Where this fits

Same output, same fields, as the Python original
[freelance-proposal-cli](https://github.com/kleogeos/freelance-proposal-cli) —
this port is for anyone whose toolchain is Node.js rather than Python.
Proposal gets accepted → track the work with
[freelance-time-cli](https://github.com/kleogeos/freelance-time-cli) → log
costs with [freelance-expense-cli](https://github.com/kleogeos/freelance-expense-cli) →
bill it with [freelance-invoice-js](https://github.com/kleogeos/freelance-invoice-js).

More free tools: [Freelancer Toolbox](https://kleogeos.github.io/freelancer-tools/donate.html?src=cli-proposal-js).

## Tests

```bash
node test.js
```
