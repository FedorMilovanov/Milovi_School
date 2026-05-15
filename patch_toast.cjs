const fs = require('fs');
let code = fs.readFileSync('src/components/Toast.tsx', 'utf8');

// Add className prop
code = code.replace(
  'export default function ToastContainer() {',
  'export default function ToastContainer({ className }: { className?: string }) {'
);

// Replace fixed bottom style with class-based fallback
code = code.replace(
  '<div className="fixed left-1/2 -translate-x-1/2 z-50 flex flex-col-reverse gap-2 pointer-events-none" style={{ bottom: \'calc(5.5rem + env(safe-area-inset-bottom, 0px))\' }}>',
  '<div className={`fixed left-1/2 -translate-x-1/2 z-50 flex flex-col-reverse gap-2 pointer-events-none ${className || "max-md:bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:bottom-6"}`}>'
);

fs.writeFileSync('src/components/Toast.tsx', code);
