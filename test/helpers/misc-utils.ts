// import { createRequire } from "module"; // Bring in the ability to create the 'require' method
// const require = createRequire(import.meta.url); // construct the require method
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync("../../deployed-contracts.json")
const db = low(adapter)

db.defaults({ protocol: [], tokens: {} })
  .write()


export const getDb = () => db


// import { Low, JSONFile } from 'lowdb'

// const adapter = new JSONFile('../../deployed-contracts.json')
// export const getDb = () => new Low(adapter)
