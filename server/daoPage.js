'use strict';

/* Data Access Object (DAO) module for accessing pages data */

const db = require('./db');
const fs = require('fs');
const dayjs = require("dayjs");


/**
 * used for the front-office
 * @returns only published pages
 */
exports.getPublishedPages = () => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM pages'
    db.all(sql, [], (err, rows) => {
      if (err) { reject(err); }
      else {
        rows = rows.filter(row => {

          let rowDate = String(row.publishDate);
          let pubDate;
          if (rowDate === undefined) return false;
          else {

            pubDate = dayjs(rowDate).format('YYYY-MM-DD');
            const currentDate = dayjs().format('YYYY-MM-DD');

            return dayjs(dayjs(currentDate)).isAfter(dayjs(pubDate))
          }
        })
        resolve(rows)
      }
    })
  })
}

/**
 * used for the back-office pages
 * @returns all the pages, also the published ones
 */
exports.getCreatedPages = () => {
  return new Promise((resolve, reject) => {

    const sql = 'SELECT * FROM pages'
    db.all(sql, [], (err, rows) => {
      if (err) reject(err)
      else {
        resolve(rows)
      }
    })
  })
}


/**
 * Get the single page
 * @returns [ { pageid, title, creatingDate, publishDate, userid }, {...} ]
 */
exports.getPage = (pageid) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM pages WHERE pageid = ?';
    db.get(sql, [pageid], (err, page) => {
      if (err) { reject(err); }
      else
        resolve(page)
    })
  })
}

exports.getPublishedBlocks = (pageid) => {
  return new Promise((resolve, reject) => {
    const sqlcheckdate = "SELECT publishDate from pages WHERE pageid = ?"
    db.get(sqlcheckdate, [pageid], (err, pubDate) => {
      if (err) reject(err);
      else {

        if(pubDate === [])
          reject(err)
        else {
        const currentDate = dayjs();
        let check_public = currentDate.isAfter(dayjs(pubDate.publishDate));

        if (check_public) {
          const sqlGetBlocks = "SELECT blockid, username, type, content, rank, pageid FROM blocks WHERE pageid = ?"
          db.all(sqlGetBlocks, [pageid], (err, rows) => {

            if (err) reject(err);
            else 
              resolve(rows)
            
          })
        }
        else 
          resolve([]);
      }
      }
    })
  }
  )
}

exports.getCreatedBlocks = (pageid) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM blocks WHERE pageid = ?"
    db.all(sql, [pageid], (err, blocks) => {
      if (err) { reject(err) }
      else {
        resolve(blocks)
      }
    })
  })
}


/**
 * 
 * @param {*} pageid: unused identifier
 * @param {*} blockid: block identifier
 * @returns {blockid, type, content, rank}
 */
exports.getBlock = (pageid, blockid) => {
  return new Promise((resolve, reject) => {
    //                                               
    const sql = 'SELECT * FROM pages as P, blocks as B WHERE P.pageid = B.pageid AND B.blockid = ?'
    db.all(sql, [blockid], (err, block) => {
      if (err) { reject(err) }
      else
        resolve(block)
    })
  })
}


/**
 * 
 * @param {*} page: page's information to be applied (not possible for creationDate)
 * @param {*} pageid: page identifier
 * @returns 
 */
exports.editPage = (page, pageid) => {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE pages SET title = ?, publishDate = ?, username = ? WHERE pageid = ?'
    db.run(sql, [page.title, page.publishDate, page.username, pageid], (err) => {
      if (err)
        reject(err)
        else {
          const updateBlocks = 'UPDATE blocks SET username = ? WHERE pageid = ?'
          db.run(updateBlocks, [page.username, pageid], (err) => {
            if(err)
              reject(err)
            else 
              resolve({ message: `page ${pageid} is updated` })
          })
        }
    })
  })
}

/**
 * 
 * @param {*} block: block's information to be applied
 * @param {*} pageid: unused identifier
 * @param {*} blockid: block identifier 
 * @returns 
 */
exports.editBlock = (block, pageid, blockid) => {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE blocks SET content = ? WHERE blockid = ?'
    db.run(sql, [block.content, blockid], (err) => {
      if (err)
        reject(err)
      resolve({ message: `block ${blockid} is updated` })
    })

  })
}

function countHeader(pageid) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT COUNT(*) as count FROM blocks WHERE pageid = ? and type = "header"'
    db.get(sql, [pageid], (err, count) => {
      if (err)
        reject(err)
      resolve(count.count)
    })
  })
}

function countOthers(pageid) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT COUNT(*) as count FROM blocks WHERE pageid = ? and type <> "header"'
    db.get(sql, [pageid], (err, count) => {
      if (err)
        reject(err)
      resolve(count.count)
    })
  })
}

function isHeader(blockid) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT type FROM blocks WHERE blockid = ?'
    db.get(sql, [blockid], (err, row) => {
      if (err)
        reject(err)
      if (row.type === [])
        resolve(true)
      if (row.type === 'header')
        resolve(true)
      else resolve(false)
    })
  })
}

/**
 * Delete a single block if we have the identifier
 * @param blockid: block identifier
 * @returns 
 */
exports.deleteBlock = async (blockid, pageid) => {

  const count = await countHeader(pageid)

  const countOther = await countOthers(pageid)

  const headerType = await isHeader(blockid)

  return new Promise((resolve, reject) => {
    if (headerType && count === 1)
      resolve(-1)
    else if (countOther === 1)
      resolve(-1)
    else {
      const sqlUpdate = 'UPDATE blocks SET rank = rank-1 WHERE rank > (SELECT rank FROM blocks WHERE blockid = ?) AND pageid = (SELECT pageid FROM blocks WHERE blockid = ?)'
      db.run(sqlUpdate, [blockid, blockid], (err) => {
        if (err)
          reject(err)

        const sqlDelete = 'DELETE FROM blocks WHERE blockid = ? ';
        db.run(sqlDelete, [blockid], (err) => {
          if (err)
            reject(err);

          resolve(null);
        });
      })
    }
  })
}
/**
 * Delete all the blocks for the given page
 * @param pageid: page identifier
 * @returns 
 */
exports.deleteBlocksByPageId = (pageid) => {
  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM blocks WHERE pageid = ?'
    db.run(sql, [pageid], (err) => {
      if (err)
        reject(err)
      resolve(null)
    })
  })
}

/**
 * Delete the page
 * @param {*} pageid: page identifier 
 * @returns 
 */
exports.deletePage = (pageid) => {
  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM pages WHERE pageid = ?'
    db.run(sql, [pageid], (err) => {
      if (err)
        reject(err)
      resolve(null)
    })
  })
}


exports.updateWebName = (newWebName) => {
  return new Promise( (resolve, reject) => {
    const sql = 'DELETE FROM webname'
    db.run(sql, [], (err) => {
      if(err)
        reject(err)
      else {
        const sqlInsert = 'INSERT INTO webname(name) VALUES(?)'
        db.run(sqlInsert, [newWebName], (err) => {
          if(err) {
            reject(err)
          }
          else resolve( JSON.stringify( {name: newWebName} ) )
        })

      }
    })
  })
}




exports.getWebName = () => {
  return new Promise( (resolve, reject) => {
    const sql = 'SELECT name FROM webname'
    db.get(sql, [], (err, name) => {
      if(err)
        reject(err)
      else {
        resolve(name.name)
      }
    })
  })

}

exports.addBlock = (block, pageid, username) => {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO blocks(type, content, rank, pageid, username) VALUES (?, ?, ?, ?, ?)'
    db.run(sql, [block.type, block.content, block.rank, pageid, username], err => {
      if (err)
        reject(err)
      resolve(null)
    })

  })
}

exports.addPage = (page) => {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO pages(title, creationDate, publishDate, username) VALUES (?, ?, ?, ?)'
    db.run(sql, [page.title, page.creationDate, page.publishDate, page.username], err => {
      if (err)
        reject(err)
      const insertedIdQuery = 'SELECT last_insert_rowid() AS id';
      db.get(insertedIdQuery, (err, row) => {
        if (err)
          reject(err)
        const insertedId = row.id
        resolve(insertedId)
      })
    })
  }
  )
}

function getMaxRank(pageid) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT blockid FROM blocks WHERE pageid = ? AND rank = (SELECT MAX(rank) FROM blocks WHERE pageid = ?)'
    db.get(sql, [pageid, pageid], (err, res) => {
      if (err)
        reject(err)
      resolve(res.blockid)
    })
  })
}


function getMinRank(pageid) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT blockid FROM blocks WHERE pageid = ? AND rank = 1'
    db.get(sql, [pageid], (err, res) => {
      if (err)
        reject(err)
      resolve(res.blockid)
    })
  })
}

exports.moveBlock = async (pageid, blockId, move) => {
  const minBlockId = await getMinRank(pageid)
  const maxBlockId = await getMaxRank(pageid)
  if(move === 'up' && blockId == minBlockId) {
    return 'block is not moved'
  }
  else if(move === 'down' && blockId == maxBlockId){
    return 'block is not moved'
  }
  else return new Promise(async (resolve, reject) => {
    if (move === 'up') {
        const sqlUpdatePrevious = 'UPDATE blocks SET rank = (SELECT rank FROM blocks WHERE blockid = ? AND pageid = ?) WHERE rank = (SELECT rank FROM blocks WHERE blockid = ? AND pageid = ?)-1'

        db.run(sqlUpdatePrevious, [blockId, pageid, blockId, pageid], (err) => {
          if (err)
            reject(err)
          const sqlUpdateCurrent = 'UPDATE blocks SET rank = rank-1 WHERE blockid = ?'
          db.run(sqlUpdateCurrent, [blockId], (err) => {
            if (err)
              reject(err)
            resolve('block is moved')
          })
        })
      }
    
    else if (move === 'down') {

        const sqlUpdatePrevious = 'UPDATE blocks SET rank = (SELECT rank FROM blocks WHERE blockid = ? AND pageid = ?) WHERE rank = (SELECT rank FROM blocks WHERE blockid = ? AND pageid = ?)+1'

        db.run(sqlUpdatePrevious, [blockId, pageid, blockId, pageid], (err) => {
          if (err)
            reject(err)
          const sqlUpdateCurrent = 'UPDATE blocks SET rank = rank+1 WHERE blockid = ?'
          db.run(sqlUpdateCurrent, [blockId], (err) => {
            if (err)
              reject(err)
            resolve('block is moved')
          })
        }
        )
      }
    
    else
      reject({ error: 'not moved' })
  })
}