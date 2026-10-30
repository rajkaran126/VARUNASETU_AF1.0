/**
 * Fix all double-escaped apostrophes in city/name fields of cable-data-real.ts
 * Pattern to fix: 'Some\\\\'thing'  → 'Some\\'thing'  (properly escaped apostrophe)
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'lib', 'cable-data-real.ts');
let content = fs.readFileSync(filePath, 'utf8');

// In the file bytes, a double-escaped apostrophe appears as: \\' (two chars: backslash + apostrophe → the \\ then ' ends the string)
// The literal bytes in the file: backslash backslash apostrophe = \\' (3 bytes)
// We need it to be: backslash apostrophe = \' (2 bytes)
// So we replace every occurrence of \\' with \'
// But we must be careful: \\ at end of string (like \\n etc) shouldn't be touched
// We ONLY want to replace \\' where the apostrophe would be in the middle of a string (not end)

// Simple approach: replace \\' globally. Since valid strings in this file use \' for escaping,
// any \\\\ followed by ' is wrong - the double backslash + quote breaks the string.

let count = 0;

// Replace all occurrences of two-backslash then apostrophe with one-backslash then apostrophe
// In JS regex: to match literal \\ in the file we use /\\\\/
// To match literal ' we use /'/
content = content.replace(/\\\\'/g, (match) => {
  count++;
  return "\\'";
});

console.log(`Fixed ${count} double-escaped apostrophes.`);
fs.writeFileSync(filePath, content, 'utf8');
console.log('cable-data-real.ts patched successfully.');
