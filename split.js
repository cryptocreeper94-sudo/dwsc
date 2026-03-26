import fs from 'fs';

const source = fs.readFileSync('src/main.lume', 'utf8');
const lines = source.split('\n');

const outDir = 'src/lume';
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

let activeFile = '00_intro.lume';
let content = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for section boundary
    if (line.match(/^(\/)+ ─── GLOBAL STYLES/i)) {
        fs.writeFileSync(`${outDir}/${activeFile}`, content.join('\n'));
        activeFile = '01_styles.lume';
        content = [line];
    } else if (line.match(/^(\/)+ ─── NAVIGATION/i)) {
        fs.writeFileSync(`${outDir}/${activeFile}`, content.join('\n'));
        activeFile = '02_nav.lume';
        content = [line];
    } else if (line.match(/^(\/)+ ─── HERO SECTION/i)) {
        fs.writeFileSync(`${outDir}/${activeFile}`, content.join('\n'));
        activeFile = '03_hero.lume';
        content = [line];
    } else if (line.match(/^(\/)+ ─── LUME SECTION/i)) {
        fs.writeFileSync(`${outDir}/${activeFile}`, content.join('\n'));
        activeFile = '04_lume.lume';
        content = [line];
    } else if (line.match(/^(\/)+ ─── RESEARCH CAROUSEL/i)) {
        fs.writeFileSync(`${outDir}/${activeFile}`, content.join('\n'));
        activeFile = '05_research.lume';
        content = [line];
    } else if (line.match(/^(\/)+ ─── ECOSYSTEM \(FOCUSED\)/i)) {
        fs.writeFileSync(`${outDir}/${activeFile}`, content.join('\n'));
        activeFile = '06_ecosystem.lume';
        content = [line];
    } else if (line.match(/^(\/)+ ─── UNIFIED INFRASTRUCTURE/i)) {
        fs.writeFileSync(`${outDir}/${activeFile}`, content.join('\n'));
        activeFile = '07_infrastructure.lume';
        content = [line];
    } else if (line.match(/^(\/)+ ─── PAPERS SECTION/i)) {
        fs.writeFileSync(`${outDir}/${activeFile}`, content.join('\n'));
        activeFile = '08_papers.lume';
        content = [line];
    } else if (line.match(/^(\/)+ ─── BLOG/i)) {
        fs.writeFileSync(`${outDir}/${activeFile}`, content.join('\n'));
        activeFile = '09_blog.lume';
        content = [line];
    } else if (line.match(/^(\/)+ ─── DEVELOPER PORTAL/i)) {
        fs.writeFileSync(`${outDir}/${activeFile}`, content.join('\n'));
        activeFile = '10_portal.lume';
        content = [line];
    } else if (line.match(/^(\/)+ ─── FOOTER/i)) {
        fs.writeFileSync(`${outDir}/${activeFile}`, content.join('\n'));
        activeFile = '12_footer.lume'; // Note: 11 is reserved for account hub
        content = [line];
    } else {
        content.push(line);
    }
}

// Write the last file
if (content.length > 0) {
    fs.writeFileSync(`${outDir}/${activeFile}`, content.join('\n'));
}

console.log("Successfully split main.lume into " + outDir);
