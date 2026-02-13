const patterns = [
  { name: "SSN", re: /\b\d{3}-?\d{2}-?\d{4}\b/g },
  { name: "PHONE", re: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g },
  { name: "EMAIL", re: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  { name: "DOB", re: /\b(?:\d{1,2}[\/\-]){2}\d{2,4}\b/g },
  { name: "ADDRESS-ish", re: /\b\d{1,6}\s+[A-Za-z0-9.\s]{3,}\b/g },
  { name: "ZIP", re: /\b\d{5}(?:-\d{4})?\b/g },
  { name: "BANK/ROUTING", re: /\b\d{9,12}\b/g },
];

export function detectPII(text) {
  const hits = [];
  for (const p of patterns) {
    let m;
    while ((m = p.re.exec(text)) !== null) {
      hits.push({ type: p.name, start: m.index, end: m.index + m[0].length, value: m[0] });
    }
  }
  return hits.sort((a,b)=>a.start-b.start);
}

export function redactPII(text) {
  let redacted = text;
  for (const p of patterns) {
    redacted = redacted.replace(p.re, `[${p.name}]`);
  }
  return redacted;

  const matches = [];
  let text = input;

  rules.forEach(({ label, re }) => {
    text = text.replace(re, (m, _1, offset) => {
      matches.push({ label, value: m, index: offset });
      return m.replace(/./g, mask);
    });
  });

  return { text, matches };
}