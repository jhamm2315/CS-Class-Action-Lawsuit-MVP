// frontend/src/utils/pii.js
const SSN = /\b\d{3}-\d{2}-\d{4}\b/g;
const DOB = /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])[\/\-](19|20)\d{2}\b/g;
const PHONE = /(?:\+?1[\s\-\.]?)?\(?\d{3}\)?[\s\-\.]?\d{3}[\s\-\.]?\d{4}\b/g;
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

export function scanTextPII(text) {
  const res = [];
  for (const [type, rgx] of [["SSN", SSN],["DOB", DOB],["PHONE", PHONE],["EMAIL", EMAIL]]) {
    const matches = text.match(rgx) || [];
    for (const m of matches) res.push({ type, value: m });
  }
  return res;
}