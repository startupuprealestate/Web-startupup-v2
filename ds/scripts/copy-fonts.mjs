import { cpSync, mkdirSync } from 'node:fs';

mkdirSync('dist', { recursive: true });
cpSync('src/fonts', 'dist/fonts', { recursive: true });
console.log('copied src/fonts -> dist/fonts');
