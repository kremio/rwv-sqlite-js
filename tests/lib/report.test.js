const sampleValidReport = require('rwv-schema/sample.json')
const reportInsert = require('../../lib/report')
const getDB = require('../../lib/db')

describe('Inserting a report', () => {
  let db
  
  beforeEach( async (done) => {
    getDB().then( ({DB, migrations}) =>{
      db = DB
      //Start with a clean database
      migrations.reset( () => migrations.up( done ) )
    })
  })

  afterEach( () => db.close() )

  test( 'Reject invalid report', async (done) => {
    try{
      await reportInsert({}, db)
      done.fail(new Error('Validation should have failed'))
    }catch(e){
      done()
    }
  })

  test( 'Insert valid report', async (done) => {
    const result = await reportInsert(sampleValidReport, db)
    const spy = jest.fn()
    db.db.each('SELECT * FROM data', spy, (err, c) => {
      expect( err ).toBeNull()
      expect( spy ).toHaveBeenCalledTimes(1)
      expect( spy.mock.calls[0][0] ).toBeNull()
      expect( result ).toEqual(expect.objectContaining(spy.mock.calls[0][1]) )
      done()
    })
  })
})
