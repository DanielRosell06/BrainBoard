import { Editor } from '@tldraw/tldraw';
console.log(Object.keys(Editor.prototype).filter(k => k.toLowerCase().includes('snapshot')));
