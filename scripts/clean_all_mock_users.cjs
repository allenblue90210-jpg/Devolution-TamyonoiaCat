const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, '../data/db.json');
const raw = fs.readFileSync(dbPath, 'utf8');
const data = JSON.parse(raw);

const fakeIds = ['usr_allen_001', 'usr_sarah_002', 'usr_fatima_003', 'usr_1792419706090_6uj2'];
const fakeUsernames = ['allenokoro', 'sarah_adesina', 'fatimabello', 'testrealuser'];

// Filter users list
data.users = data.users.filter(u => !fakeIds.includes(u.id) && !fakeUsernames.includes(u.username));

// Mapping replacements for remaining records
const idMap = {
  'usr_allen_001': 'usr_allen_006',
  'usr_sarah_002': 'usr_1792419058259_ehg5',
  'usr_fatima_003': 'usr_1792423308615_lq64',
  'usr_1792419706090_6uj2': 'usr_allen_nuclear',
};

const nameMap = {
  'Allen Okoro': 'Allen Kinetic',
  'Sarah Adesina': 'Lola',
  'Fatima Bello': 'wolf',
  'Test Real User': 'Allen Nuclear',
};

function deepReplace(obj) {
  if (Array.isArray(obj)) {
    return obj.map(deepReplace);
  } else if (obj !== null && typeof obj === 'object') {
    const newObj = {};
    for (const [k, v] of Object.entries(obj)) {
      if (fakeIds.includes(k) || fakeUsernames.includes(k)) {
        // Skip or re-key
        continue;
      }
      let val = v;
      if (typeof val === 'string') {
        if (idMap[val]) val = idMap[val];
        for (const [fName, rName] of Object.entries(nameMap)) {
          if (val.includes(fName)) {
            val = val.replace(new RegExp(fName, 'g'), rName);
          }
        }
      } else if (typeof val === 'object' && val !== null) {
        val = deepReplace(val);
      }
      newObj[k] = val;
    }
    return newObj;
  }
  return obj;
}

const cleaned = deepReplace(data);

// Ensure impressions dictionary has legitimate keys
if (!cleaned.impressions) cleaned.impressions = {};
delete cleaned.impressions.usr_allen_001;
delete cleaned.impressions.allenokoro;
delete cleaned.impressions.usr_sarah_002;
delete cleaned.impressions.sarah_adesina;
delete cleaned.impressions.usr_fatima_003;
delete cleaned.impressions.fatimabello;

cleaned.impressions.usr_allen_006 = cleaned.impressions.usr_allen_006 || { impressions: 2420, witnessCount: 310 };
cleaned.impressions.allenkinetic006 = cleaned.impressions.allenkinetic006 || { impressions: 2420, witnessCount: 310 };
cleaned.impressions.usr_allen_nuclear = cleaned.impressions.usr_allen_nuclear || { impressions: 1890, witnessCount: 240 };
cleaned.impressions.allenblue = cleaned.impressions.allenblue || { impressions: 1890, witnessCount: 240 };
cleaned.impressions.usr_1792419058259_ehg5 = cleaned.impressions.usr_1792419058259_ehg5 || { impressions: 1380, witnessCount: 195 };
cleaned.impressions.lola = cleaned.impressions.lola || { impressions: 1380, witnessCount: 195 };

fs.writeFileSync(dbPath, JSON.stringify(cleaned, null, 2), 'utf8');
console.log('Successfully cleaned db.json. Remaining users count:', cleaned.users.length);
cleaned.users.forEach(u => console.log(`- ${u.id}: ${u.fullName} (@${u.username}) <${u.email}>`));
