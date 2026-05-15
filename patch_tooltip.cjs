const fs = require('fs');
let code = fs.readFileSync('src/components/ArticleView.tsx', 'utf8');

code = code.replace(
  'className="absolute bottom-full left-1/2 z-30 mb-2 w-64 -translate-x-1/2',
  'className="absolute bottom-full left-1/2 z-30 mb-2 w-max max-w-[calc(100vw-2rem)] sm:max-w-[256px] -translate-x-1/2'
);

fs.writeFileSync('src/components/ArticleView.tsx', code);
