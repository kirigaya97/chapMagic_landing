import fs from 'fs';
import path from 'path';

const heroPath = path.join(process.cwd(), 'src', 'components', 'sections', 'Hero.astro');

try {
    console.log('--- DEBUG: HERO.ASTRO CONTENT START ---');
    const content = fs.readFileSync(heroPath, 'utf8');
    console.log(content);
    console.log('--- DEBUG: HERO.ASTRO CONTENT END ---');
} catch (e) {
    console.error('--- DEBUG: FAILED TO READ HERO.ASTRO ---');
    console.error(e);
}
