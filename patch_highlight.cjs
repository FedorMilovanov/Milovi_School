const fs = require('fs');
let css = fs.readFileSync('src/styles/global.css', 'utf8');

const oldHighlight = `.smart-highlight {
  font-weight: 600;
  color: var(--text-primary);
  background: linear-gradient(120deg, rgba(232, 198, 112, 0.18) 0%, transparent 100%);
  background-size: 100% 40%;
  background-repeat: no-repeat;
  background-position: 0 100%;
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
  padding: 0 1px;
}`;

const newHighlight = `.smart-highlight {
  font-weight: 600;
  color: var(--text-primary);
  position: relative;
  text-shadow: 0 0 15px rgba(100, 149, 237, 0.15); /* Subtle blue glow */
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
}
.dark .smart-highlight {
  text-shadow: 0 0 15px rgba(147, 197, 253, 0.25); /* Slightly stronger for dark mode */
}
.smart-highlight::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0.1em;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(100, 149, 237, 0.3), transparent);
  border-radius: 2px;
  pointer-events: none;
}
.dark .smart-highlight::after {
  background: linear-gradient(90deg, transparent, rgba(147, 197, 253, 0.4), transparent);
}`;

css = css.replace(oldHighlight, newHighlight);
fs.writeFileSync('src/styles/global.css', css);
