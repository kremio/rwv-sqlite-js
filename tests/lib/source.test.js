const sampleValidReport = require('rwv-schema/sample.json')
const sourceInsert = require('../../lib/source')
const getDB = require('../../lib/db')

describe('Inserting the sources of a report', () => {
  let db

  beforeEach( async (done) => {
    getDB().then( ({DB, migrations}) =>{
      db = DB
      //Start with a clean database
      migrations.reset( () => migrations.up( done ) )
    })
  })
  
  afterEach( () => db.close() )

  test( 'Insert source', async (done) => {
    const result = await sourceInsert(sampleValidReport, db)
    const spy = jest.fn()

    //So the test won't trip on specific id values
    result.sources = result.sources
      .map( (s) => Object.assign({},s,{id:expect.any(Number)}) )

    db.db.each('SELECT * FROM source', spy, (err, c) => {
      expect( err ).toBeNull()
      expect( spy ).toHaveBeenCalledTimes( sampleValidReport.sources.length)
      //No errors
      expect( spy.mock.calls
        .map( (call) => call[0] )
        .every( (e) => e === null)
      ).toBeTruthy()

      //Data inserted match what was returned
      expect( spy.mock.calls
        .map( (call) => call[1] )
      ).toEqual( expect.arrayContaining( result.sources ) )

      done()
    })
  })

  test( 'Atomic operation', async (done) => {
    const validSource = sampleValidReport.sources[0]
    const faultySource = {}

    const report = {
      uri: 'proto://some/path',
      sources: [validSource, faultySource]
    }

    try{
      const result = await sourceInsert(report, db)
      done.fail(new Error('Operation should have failed'))
    }catch(e){}

    const spy = jest.fn()

    db.db.each('SELECT * FROM source', spy, () => {
      expect( spy ).not.toHaveBeenCalled()
      done()
    })
  })
})
