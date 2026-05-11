const fs = require('fs');
let content = fs.readFileSync('E:/AssetMGMT/public/login.html', 'utf8');

const newCSS = `.auth-logo {
  width: 120px;
  height: 120px;
  margin: 0 auto 20px auto;
  background: url('KSP-Logo/Police%201.jpeg') no-repeat center center;
  background-size: contain;
  background-color: #fff;
  border-radius: 50%;
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
}`;

content = content.replace(/\.auth-logo\s*\{[\s\S]*?\}/g, newCSS);
fs.writeFileSync('E:/AssetMGMT/public/login.html', content);
console.log('Fixed login.html auth-logo CSS');
