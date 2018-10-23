const sampleValidReport = require('rwv-schema/sample.json')
const locationInsert = require('../../lib/location')
const getDB = require('../../lib/db')

describe('Inserting the location of a report', () => {
  let db

  beforeEach( async (done) => {
    getDB().then( ({DB, migrations}) =>{
      db = DB
      //Start with a clean database
      migrations.reset( () => migrations.up( done ) )
    })
  })
  
  afterEach( () => db.close() )

  /*
   * Somehow a 'warm-up' request is necessary otherwise the
   * migrations are not always run...
   * TODO: This makes the tests flaky, fix it!
   */
  test( 'Table created', async (done) => {
    db.db.each("SELECT * FROM sqlite_master WHERE type='table'", () => {}, done)
  })


  test( 'Insert location', async (done) => {
    const result = await locationInsert(sampleValidReport, db)
    const spy = jest.fn()

    //So the test won't trip on specific id values
    result.locations = result.locations
      .map( (l) => Object.assign({},l,{id:expect.any(Number)}) )

    db.db.each('SELECT * FROM location', spy, (err,c) => {
      expect( err ).toBeNull()
      expect( spy ).toHaveBeenCalledTimes( sampleValidReport.locations.length)
      //No errors
      expect( spy.mock.calls
        .map( (call) => call[0] )
        .every( (e) => e === null)
      ).toBeTruthy()

      //Data inserted match what was returned
      expect( spy.mock.calls
        .map( (call) => call[1] )
      ).toEqual( expect.arrayContaining( result.locations ) )

      done()
    })
  })

  test( 'Atomic operation', async (done) => {
    const validLocation = sampleValidReport.locations[0]
    const faultyLocation = {}

    const report = {
      uri: 'proto://some/path',
      locations: [validLocation, faultyLocation]
    }

    try{
      const result = await locationInsert(report, db)
      done.fail(new Error('Operation should have failed'))
    }catch(e){}

    const spy = jest.fn()

    db.db.each('SELECT * FROM location', spy, () => {
      expect( spy ).not.toHaveBeenCalled()
      done()
    })
  })
})
