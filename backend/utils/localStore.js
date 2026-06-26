const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'crm.json');

const readData = () => {
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  const data = JSON.parse(raw);
  return {
    leads: Array.isArray(data.leads) ? data.leads : [],
    notes: Array.isArray(data.notes) ? data.notes : [],
  };
};

const writeData = (data) => {
  fs.writeFileSync(DATA_FILE, `${JSON.stringify(data, null, 2)}\n`);
};

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

module.exports = { readData, writeData, createId };
