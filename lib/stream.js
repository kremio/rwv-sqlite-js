const insertReport = require('./report')
const insertLocations = require('./location')
const insertSources = require('./source')
const {Transform} = require('stream')

class InsertStream extends Transform{
  constructor(options, DB) {
    super( Object.assign( {}, options , {objectMode: true}) )
    this.DB = DB
  }

  /*
   * Insert the report in the DB.
   * This is an atomic operation, if an error occurs nothing will be inserted.
   */
  async _doInsert(report, cb){
    const DB = this.getDB()
    let r
    try{
      r = await DB.transactionBegin(
      async () => insertReport( report, DB )
      .then( (r) => insertLocations(r, DB) )
      .then( (r) => insertSources(r, DB) )
      //.catch( (e) => { cb( e ) } )
    )
    }catch(e){
      throw(e)
    }
    await this.DB.transactionCommit()
    return r
  }

  getDB(){
    if(!this.DB){
      throw new Error('No database connection provided')
    }

    return this.DB
  }

  /*
   * Transform Stream implementation.
   */
  _transform(report, encoding, cb){
    try{
      this.getDB()
    }catch(e){
      cb( e )
      return
    }

    this._doInsert(report, cb)
      .then( (r) => cb(null, r) )
      .catch( (e) => {
        console.log( "Stream error:", e)
        cb(e)
      })
  }

  /*
   * Free the handle to the DB file
   */
  _destroy(err, cb){
    cb(this.getDB().close())
  }
}

module.exports = InsertStream
