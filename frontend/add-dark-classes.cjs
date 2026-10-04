const fs = require('fs');
const path = require('path');

const classMap = {
  'bg-white': 'dark:bg-neutral-900',
  'bg-neutral-50': 'dark:bg-neutral-950', // or 900
  'bg-neutral-100': 'dark:bg-neutral-800',
  'bg-neutral-200': 'dark:bg-neutral-700',
  'text-neutral-900': 'dark:text-neutral-50',
  'text-neutral-800': 'dark:text-neutral-100',
  'text-neutral-700': 'dark:text-neutral-200',
  'text-neutral-600': 'dark:text-neutral-300',
  'text-neutral-500': 'dark:text-neutral-400',
  'border-neutral-200': 'dark:border-neutral-700',
  'border-neutral-300': 'dark:border-neutral-600',
  'hover:bg-neutral-50': 'dark:hover:bg-neutral-800',
  'hover:bg-neutral-100': 'dark:hover:bg-neutral-700',
  'ring-neutral-200': 'dark:ring-neutral-700',
};

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && file !== 'node_modules' && file !== 'dist') {
      processDirectory(fullPath);
    } else if (stat.isFile() && (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts'))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;

      // Simple string replacements for class names
      // We look for the class surrounded by spaces, quotes, or backticks
      
      for (const [lightClass, darkClass] of Object.entries(classMap)) {
        // Regex to match the lightClass but only if darkClass is not already there
        // e.g. /bg-white(?!\s+dark:bg-neutral-900)/g
        
        // Let's use a simpler approach: split by lightClass, then join with "lightClass darkClass"
        // But we need to make sure we don't duplicate.
        const regex = new RegExp(`\\b${lightClass}\\b(?!\\s+${darkClass})`, 'g');
        if (regex.test(content)) {
          content = content.replace(regex, `${lightClass} ${darkClass} transition-colors`);
          modified = true;
        }
      }
      
      // Additional general text colors if not covered
      
      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(path.join(__dirname, 'src'));
