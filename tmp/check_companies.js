const fs = require('fs');
const companies = JSON.parse(fs.readFileSync('a:/Stock-Simulator/src/data/companies.json', 'utf8'));

const qualifying = companies.filter(co => {
  return co.roe >= 15 && co.pe <= 35 && co.debt_to_equity <= 1.0 && co.profit_growth >= 10;
});

console.log('Total Companies:', companies.length);
console.log('Qualifying (Standard Filters):', qualifying.length);
console.log('Sample Qualifying:', qualifying.map(c => c.name).slice(0, 5));
