const fs = require('fs');
const { Client } = require('pg');

const ENV = fs.readFileSync(process.cwd() + '/.env', 'utf8');

const CREDENTIALS = ENV.split('\n').reduce(
  (acc, v) => (([k, p] = v.split('=')), (acc[k.toLowerCase()] = p), acc),
  {}
);

const client = new Client(CREDENTIALS);

client
  .connect()
  .then(() => console.log('Connected to db...'))
  .catch(err => console.log('Connection error', err));

module.exports = client;
