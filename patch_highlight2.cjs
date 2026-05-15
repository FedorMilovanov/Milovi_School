const fs = require('fs');
let css = fs.readFileSync('src/styles/global.css', 'utf8');

const regex = /\.smart-highlight\s*\{[\s\S]*?padding:\s*0\s*1px;\n\}/;

const newHighlight = `.smart-highlight {
  font-weight: 600;
  color: var(--text-primary);
  position: relative;
  text-shadow: 0 0 12px rgba(100, 149, 237, 0.12);
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
}
.dark .smart-highlight {
  text-shadow: 0 0 15px rgba(147, 197, 253, 0.25);
}
.smart-highlight::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0.1em;
  width: 100%;
  height: 1.5px;
  background: linear-gradient(90deg, transparent, rgba(100, 149, 237, 0.25), transparent);
  border-radius: 2px;
  pointer-events: none;
}
.dark .smart-highlight::after {
  background: linear-gradient(90deg, transparent, rgba(147, 197, 253, 0.35), transparent);
}`;

if (regex.test(css)) {
  css = css.replace(regex, newHighlight);
  fs.writeFileSync('src/styles/global.css', css);
  console.log("Success");
} else {
  console.log("Not found");
}
