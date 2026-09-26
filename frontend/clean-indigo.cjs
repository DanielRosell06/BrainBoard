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
  { from: /bg-indigo-100\/80/g, to: 'bg-slate-100' },
  { from: /bg-indigo-100\/70/g, to: 'bg-slate-100' },
  { from: /bg-indigo-100/g, to: 'bg-slate-100' },
  { from: /border-indigo-100\/80/g, to: 'border-slate-200' },
  { from: /border-indigo-100\/70/g, to: 'border-slate-200' },
  { from: /border-indigo-100/g, to: 'border-slate-200' },
  { from: /border-indigo-300/g, to: 'border-slate-300' },
  { from: /border-indigo-400/g, to: 'border-slate-400' },
  { from: /border-indigo-600/g, to: 'border-slate-900' },
  { from: /border-t-indigo-500/g, to: 'border-t-slate-900' },
  { from: /text-indigo-800/g, to: 'text-slate-900' },
  { from: /from-indigo-500 via-purple-500 to-pink-500/g, to: 'bg-slate-900' },
  { from: /bg-gradient-to-br from-indigo-50\/80 via-purple-50\/40 to-slate-50/g, to: 'bg-slate-50' },
  { from: /from-indigo-500 to-purple-500/g, to: 'bg-slate-900' },
  { from: /focus-within:border-indigo-400/g, to: 'focus-within:border-slate-400' },
  { from: /focus-within:ring-indigo-50/g, to: 'focus-within:ring-slate-100' },
  { from: /focus:border-indigo-300/g, to: 'focus:border-slate-300' },
  { from: /ring-indigo-400\/20/g, to: 'ring-slate-400/20' },
  { from: /bg-gradient-to-tr/g, to: '' } // Since we map gradients to solid bg-slate-900, bg-gradient-to-tr isn't needed
];

walk('src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;
    replacements.forEach(r => {
      content = content.replace(r.from, r.to);
    });
    // clean up any leftover 'bg-slate-900 bg-slate-900'
    content = content.replace(/bg-slate-900 bg-slate-900/g, 'bg-slate-900');
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log('Updated', filePath);
    }
  }
});
