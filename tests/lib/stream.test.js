const sampleValidReport = require('rwv-schema/sample.json')
const { Readable } = require('stream')
const getDB = require('../../lib/db')
const InsertStream = require('../../lib/stream')

/*
//Use this stream to pipe reports to the db insert stream
class ReportsStream extends Readable{
  constructor( onStartRead ){
    //Call the Readable Stream constructor
    super({
      objectMode: true
    })
    this.queue = []
  }

  pushReport( report ){
    //console.log("Push report", report)
    return this.queue.push(report)
  }

  endStream(){
    this.push(null)
  }

  //
  // Implementation of Readable
  // see: https://nodejs.org/api/stream.html#stream_implementing_a_readable_stream
  //
  _read(){
    console.log("_READ_", this.queue.length)
    this.push( this.queue.shift() || null )
  }

}
*/


describe('Inserting reports using a stream', () => {

  let insertStream
  
  beforeEach( async (done) => {
    getDB().then( ({DB, migrations}) =>{
      insertStream = new InsertStream({},DB)
      //Start with a clean database
      //migrations.silence(false)
      migrations.reset( () => migrations.up( done ) )
    })
  })
  
  afterEach( () => {
    insertStream.destroy()
  })

  /*
   * Somehow a 'warm-up' request is necessary otherwise the
   * migrations are not always run...
   * TODO: This makes the tests flaky, fix it!
   */
  
  test( 'Table created', async (done) => {
    insertStream.getDB().db.each("SELECT * FROM sqlite_master WHERE type='table'", (err,d) => {}, done)
  })
  

  test( 'Insert a single report' , async (done) => {


      const spy = jest.fn()
      insertStream.write( sampleValidReport, null, () => {

      const db = insertStream.getDB().db
      db.each('SELECT * FROM data', spy, (err, c) => {
        expect( err ).toBeNull()
        expect( c ).toEqual(1)
        expect( spy ).toHaveBeenCalledTimes(1)
        spy.mockReset()
        db.each('SELECT * FROM location', spy, (err, c) => {
          expect( err ).toBeNull()
          expect( spy ).toHaveBeenCalledTimes( sampleValidReport.locations.length )
          spy.mockReset()
          db.each('SELECT * FROM source', spy, (err, c) => {
            expect( err ).toBeNull()
            expect( spy ).toHaveBeenCalledTimes( sampleValidReport.sources.length )

            done()
          })
        })
      })
    })

  })

  test( 'Insert 2 or more reports', async (done) => {
    const aReport = (r) => Object.assign(
      {},
      sampleValidReport,
      {uri: `${sampleValidReport.uri}${r}`}
    )

    const n = [...Array(Math.round(2 + Math.random() * 10))]
    n.map((v,i) => aReport(i) )
      .forEach( insertStream.write.bind(insertStream) )

    insertStream.end(null,null, () => {
      const db = insertStream.getDB().db
      db.all('SELECT * FROM data', (err, c) => {
        expect( err ).toBeNull()
        expect( c.length ).toEqual(n.length)
        done()
      })
    })
  })

  test( 'Atomic operation', async (done) => {

    /*
     * Need to clear the module cache in order to 
     * set up a module mock for this particular test
     */
    jest.resetModules()
    jest.mock( '../../lib/location', () => async () => {
      return Promise.reject( 'test' )
    })

    const _InsertStream = require('../../lib/stream')

    const _insertStream = new _InsertStream({},insertStream.getDB())

    _insertStream.on('error', (err) => {
      //console.log(err)
      expect(err).toEqual('test')
      const db = _insertStream.getDB().db
      db.all('SELECT * FROM data', (err, c) => {
        expect(err).toBeNull()
        expect(c.length).toEqual(0)
        done()
      })
    })

    _insertStream.write( sampleValidReport )

  })
})
