const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

const replacements = [
  { from: /bg-indigo-600/g, to: 'bg-slate-900' },
  { from: /hover:bg-indigo-700/g, to: 'hover:bg-slate-800' },
  { from: /text-indigo-600/g, to: 'text-slate-900' },
  { from: /text-indigo-700/g, to: 'text-slate-900' },
  { from: /text-indigo-500/g, to: 'text-slate-800' },
  { from: /bg-indigo-50/g, to: 'bg-slate-100' },
  { from: /hover:bg-indigo-100/g, to: 'hover:bg-slate-200' },
  { from: /border-indigo-200/g, to: 'border-slate-300' },
  { from: /border-indigo-500/g, to: 'border-slate-800' },
  { from: /ring-indigo-500\/20/g, to: 'ring-slate-200' },
  { from: /ring-indigo-500/g, to: 'ring-slate-800' },
  { from: /shadow-md shadow-indigo-500\/20/g, to: 'shadow-sm' },
  { from: /shadow-sm shadow-indigo-500\/20/g, to: 'shadow-sm' },
  { from: /shadow-card-hover/g, to: 'shadow-md' },
  { from: /shadow-card/g, to: 'shadow-sm' },
  { from: /shadow-sidebar/g, to: 'shadow-sm' },
  { from: /rounded-3xl/g, to: 'rounded-xl' },
  { from: /rounded-2xl/g, to: 'rounded-lg' },
  { from: /bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600/g, to: 'bg-slate-900' },
  { from: /bg-gradient-to-tr from-indigo-500 to-purple-600/g, to: 'bg-slate-900' },
  { from: /shadow-purple-500\/20/g, to: 'shadow-sm' },
  { from: /bg-purple-600/g, to: 'bg-slate-800' },
  { from: /hover:bg-purple-700/g, to: 'hover:bg-slate-700' },
  { from: /border-slate-200\/80/g, to: 'border-slate-200' },
  { from: /border-slate-100/g, to: 'border-slate-200' },
  { from: /bg-slate-100\/75/g, to: 'bg-slate-50' },
  { from: /shadow-2xl/g, to: 'shadow-lg' },
  { from: /shadow-md shadow-indigo-500\/25/g, to: 'shadow-sm' }
];

walk('src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;
    replacements.forEach(r => {
      content = content.replace(r.from, r.to);
    });
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log('Updated', filePath);
    }
  }
});
