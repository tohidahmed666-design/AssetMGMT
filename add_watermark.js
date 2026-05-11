const fs = require('fs');
const path = require('path');
const publicDir = 'E:/AssetMGMT/public';
const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

const watermark = `
<!-- Developer Watermark -->
<style>
.dev-watermark {
  position: fixed;
  bottom: 105px;
  right: 25px;
  width: 70px;
  opacity: 0.7;
  pointer-events: none;
  z-index: 9999;
  filter: grayscale(10%);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  transition: all 0.3s ease;
}
</style>
<img src="/G-NTTF.png" alt="Developer Watermark" class="dev-watermark" title="Developed by G-NTTF" />
</body>`;

files.forEach(file => {
  const filePath = path.join(publicDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Strip out old watermark if it exists
  content = content.replace(/<!-- Developer Watermark -->[\s\S]*?<img[^>]+class="dev-watermark"[^>]*>\s*/gi, '');
  
  // Inject new watermark
  content = content.replace(/<\/body>/i, watermark);
  fs.writeFileSync(filePath, content);
  console.log('Updated watermark in ' + file);
});
