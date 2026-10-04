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

      for (const [lightClass, darkClass] of Object.entries(classMap)) {
        // The script added: lightClass + " " + darkClass + " transition-colors"
        const exactMatch = `${lightClass} ${darkClass} transition-colors`;
        if (content.includes(exactMatch)) {
          content = content.split(exactMatch).join(lightClass);
          modified = true;
        }

        // Just in case it was modified slightly or added twice
        const regexStr = `\\s+${darkClass}\\s+transition-colors`;
        const regex = new RegExp(regexStr, 'g');
        if (regex.test(content)) {
          content = content.replace(regex, '');
          modified = true;
        }

        const justDarkClassRegex = new RegExp(`\\s+${darkClass}\\b`, 'g');
        if (justDarkClassRegex.test(content)) {
            content = content.replace(justDarkClassRegex, '');
            modified = true;
        }
      }
      
      // Clean up multiple spaces and duplicate transition-colors
      const dupTransRegex = /(transition-colors\s*){2,}/g;
      if (dupTransRegex.test(content)) {
          content = content.replace(dupTransRegex, 'transition-colors ');
          modified = true;
      }

      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Reverted ${fullPath}`);
      }
    }
  }
}

processDirectory(path.join(__dirname, 'src'));
