// Assembles release/: windows/SEVEN.html (single-file build) next to the launcher.
import { copyFileSync, mkdirSync } from 'node:fs';
mkdirSync('release/windows', { recursive: true });
copyFileSync('dist-single/index.html', 'release/windows/SEVEN.html');
console.log('release/windows/SEVEN.html written');
