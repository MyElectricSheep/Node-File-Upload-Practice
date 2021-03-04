const client = require('../auth/connect');

const findAll = (cols = '*', table, cb) => {
  client.query(`SELECT ${cols} FROM ${table}`, (err, res) => {
    if (cb) return cb(err, res);
  });
};

const insertOne = (table, cols, values, cb) => {
  client.query(
    `INSERT INTO ${table} (${cols}) VALUES (${values.id}) RETURNING *`,
    values.data,
    (err, res) => {
      if (cb) return cb(err, res);
    }
  );
};

module.exports = {
  findAll,
  insertOne
};
