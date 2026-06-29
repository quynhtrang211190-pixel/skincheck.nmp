const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');

// Extract all <script> contents
const scriptRegex = /<script>([\s\S]*?)<\/script>/gi;
let match;
let scriptContent = '';

while ((match = scriptRegex.exec(html)) !== null) {
  scriptContent += match[1] + '\n';
}

try {
  new vm.Script(scriptContent);
  console.log("Syntax Validation: OK");
} catch (e) {
  console.error("Syntax Error Found:\n", e.message);
  console.error(e.stack);
  process.exit(1);
}
