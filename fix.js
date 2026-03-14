const fs = require('fs');
const d = fs.readFileSync(process.env.HOME+'/baxto-pro/gensite.js','utf8');
const b = d.split("'")[1];
fs.writeFileSync(process.env.HOME+'/baxto-pro/public/index.html', Buffer.from(b,'base64'));
console.log('Listo! ' + b.length + ' chars');
