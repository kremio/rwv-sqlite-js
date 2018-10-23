const path = require('path')
const DBMigrate = require('db-migrate')
const sqlite3 = require('sqlite3').verbose()


class Db {
  constructor( dbFile, dbConnection = undefined ){
    if( dbConnection ){
      this.db = dbConnection
    }else{
      //console.log("db", dbFile )
      this.db = new sqlite3.Database(dbFile, (err) => {
        if (err) {
          throw err
        }
        //console.log('Connected to ' + dbFile)
      })
    }
    this.transactions = 0
  }

  close(){
    this.db.close((err) => {
      if (err) {
        throw err
      }
      //console.log('Database connection closed.')
    })
  }

  async transactionBegin( bodyFunc ){
    if( this.transactions == 0 ){
      this.db.run("begin transaction")
    }
    this.transactions += 1

    let result
    try{
      result = await bodyFunc()
    }catch(e){
      this.db.run("rollback transaction")
      this.transactions = 0
      throw e
    }
    return result
  }

  async transactionCommit(){
    this.transactions -= 1
    if( this.transactions > 0 ){
      return
    }
    
    return await new Promise((s,f) => {
      this.db.run("commit", (err) => {
        if (err) {
          f(err)
          return
        }
        s( )
      })
    })
  }

  insertStatement( authorizedKeys, values, tableName ){
    const dataJSON = authorizedKeys.reduce( (acc, k) => {
      if(!values[k]){
        return acc
      }

      acc[k] = values[k]
      return acc
    }, {})

    const keys = Object.keys(dataJSON)
    
    return {
      data: keys.map((k) => dataJSON[k]),
      statement: `INSERT INTO ${tableName}(${keys.map((k)=> `[${k}]`).join(',')}) VALUES(${keys.map(() => '?').join(',')})`
    }
  }

  async insertRow( inputData, table, fields ){
    return new Promise( (success, failure) => {
      const {statement, data} = this.insertStatement( fields, inputData, table )
      this.db.run(statement, data, (err) => {
        if (err) {
          failure(err)
          return
        }
        success( )
      })
    })
  }

}

//Construct an interface to communicate with the Db
let DB = null
let migrations = null

const getDB = ( pathToConfigFile = '../config/database.json', silent = true ) => new Promise( (success, failure) => {
  //console.log("getDB called, mode", process.env.NODE_ENV)
  if( DB && migrations ){ //already initialized
    //console.log("DB already created")
    success( {DB, migrations} )
    return
  }
  //console.log("DB not ready")
  
  migrations = DBMigrate.getInstance(true, {
    config: path.resolve(__dirname, pathToConfigFile),
    env: process.env.NODE_ENV || 'dev',
    throwUncatched: true
  }, (driver, instance, cb) => {
    //console.log("dbmigrate instance called", instance)
    DB = new Db( undefined, driver._driver.connection )
    cb()
  })

  migrations.silence(silent)
  migrations.up( () =>  success( {DB, migrations} ) )

})

module.exports = getDB

