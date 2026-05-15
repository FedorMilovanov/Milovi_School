const fs = require('fs');
let code = fs.readFileSync('src/components/ArticlePageShell.tsx', 'utf8');

code = code.replace(
  '<ToastContainer />',
  '<ToastContainer className="max-lg:bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:bottom-6" />'
);

fs.writeFileSync('src/components/ArticlePageShell.tsx', code);
