const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../server/db.ts');
let content = fs.readFileSync(filePath, 'utf8');

const replacements = [
  // IDs
  ['usr_allen_001', 'usr_allen_006'],
  ['usr_sarah_002', 'usr_1792419058259_ehg5'],
  ['usr_fatima_003', 'usr_1792423308615_lq64'],
  // Names
  ['Allen Okoro', 'Allen Kinetic'],
  ['Sarah Adesina', 'Lola'],
  ['Fatima Bello', 'wolf'],
  // Usernames
  ['allenokoro', 'allenkinetic006'],
  ['sarah_adesina', 'lola'],
  ['fatimabello', 'kai'],
  // Variable names
  ['users: [allenUser, sarahUser, fatimaUser]', 'users: [allenUser, lolaUser, wolfUser]'],
];

for (const [from, to] of replacements) {
  content = content.replaceAll(from, to);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Cleaned server/db.ts successfully');
