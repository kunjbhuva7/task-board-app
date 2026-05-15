const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'frontend/src/pages'));
const sidebarPath = path.join(__dirname, 'frontend/src/components/Sidebar.jsx');
if (fs.existsSync(sidebarPath)) files.push(sidebarPath);

files.forEach(file => {
  if (file.includes('Login.jsx')) return;
  
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Colors
  content = content.replace(/#F8FAFC/gi, '#1E293B');
  content = content.replace(/#94A3B8/gi, '#64748B');
  content = content.replace(/#0F172A/gi, '#F8FAFC');
  
  // Replace white text color (rough heuristic: color:'white' or color: 'white')
  content = content.replace(/color:\s*['"]white['"]/gi, "color:'#1E293B'");
  content = content.replace(/color:\s*['"]#fff['"]/gi, "color:'#1E293B'");
  content = content.replace(/color:\s*['"]#ffffff['"]/gi, "color:'#1E293B'");

  // Opacities
  content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.03\)/g, 'rgba(0,0,0,0.02)');
  content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.04\)/g, 'rgba(0,0,0,0.03)');
  content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.05\)/g, 'rgba(0,0,0,0.04)');
  content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.06\)/g, 'rgba(0,0,0,0.04)');
  content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.08\)/g, 'rgba(0,0,0,0.08)');
  content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.1\)/g, 'rgba(0,0,0,0.08)');
  content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.15\)/g, 'rgba(0,0,0,0.1)');
  content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.2\)/g, 'rgba(0,0,0,0.1)');
  content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.3\)/g, 'rgba(0,0,0,0.15)');
  
  // Specific dark backgrounds
  content = content.replace(/background:\s*['"]rgba\(0,\s*0,\s*0,\s*0\.2\)['"]/g, "background:'rgba(255,255,255,0.7)'");
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated:', file);
  }
});
