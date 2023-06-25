'use strict'
const db = require('./db');
const crypto = require('crypto');


exports.getUser = (email, password) => {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users WHERE email = ?';
      db.get(sql, [email], (err, row) => {
        if (err) {
          reject(err);
        } else if (row === undefined) {
          resolve(false);
        }
        else {
          const user = { username: row.username, email: row.email , role: row.role };
  
          crypto.scrypt(password, row.salt, 32, function (err, hashedPassword) {
            if (err) reject(err);
            if (!crypto.timingSafeEqual(Buffer.from(row.password, 'hex'), hashedPassword))
              resolve(false);
            else
              resolve(user);
          });
        }
      });
    });
  };
  

exports.getUsers = () => {
  return new Promise( (resolve, reject) => {
    const sql = 'SELECT username FROM users'
    db.all(sql, [], (err, rows) => {
      if(err)
        reject(err)
      resolve(rows)
    })
  })
}