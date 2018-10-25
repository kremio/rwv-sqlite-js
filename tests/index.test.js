const sampleValidReport = require('rwv-schema/sample.json')
const getDB = require('../lib/db')
const InsertStream = require('../lib/stream')
const {launch,JSONToString} = require('../index')


describe('Inserting report by running a command', () => {

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
   * migrations are not executed...
   * TODO: This makes the tests flaky, fix it!
   */
  test( 'Table created', async (done) => {
    insertStream.getDB().db.each("SELECT * FROM sqlite_master WHERE type='table'", (err,d) => {}, done)
  })


  test( 'Insert a single report' , async (done) => {
    const result = await launch(insertStream, 'cat',['./node_modules/rwv-schema/sample.json'])
    expect( result ).toEqual(0)
    const spy = jest.fn()

    insertStream.getDB().db.each('SELECT * FROM data', spy, (err, c) => {
      expect( err ).toBeNull()
      expect( c ).toEqual(1)
      expect( spy ).toHaveBeenCalledTimes(1)
      done()
    })
  })

  test( 'Invalid command', async (done) => {
    try{
      const result = await launch(insertStream, 'cat',['./sample.json'])
      done.fail(new Error('Command execution should have failed'))
    }catch(e){
      done()
    }
  })

  test( 'Insert multiple reports with delay', async (done) => {
    const howMany = Math.round(2 + Math.random() * 2)
    const result = await launch(insertStream, 'node', ['./tests/gen_reports.js', howMany, 1000])
    expect( result ).toEqual(0)
    const spy = jest.fn()

    insertStream.getDB().db.each('SELECT * FROM data', spy, (err, c) => {
      expect( err ).toBeNull()
      expect( c ).toEqual(howMany)
      expect( spy ).toHaveBeenCalledTimes(howMany)
      done()
    })

  })

  test( 'Stops on invalid input', async (done) => {
    try{
      const result = await launch(insertStream, 'node', ['./tests/gen_reports.js', 4, 500, 'fail'])
      done.fail(new Error('Command execution should have failed'))
    }catch(e){
      expect( e ).toBeInstanceOf( SyntaxError )
    }
    //Exactly one report should have been inserted before the error occured
    const spy = jest.fn()
    insertStream.getDB().db.each('SELECT * FROM data', spy, (err, c) => {
      expect( err ).toBeNull()
      expect( c ).toEqual(1)
      expect( spy ).toHaveBeenCalledTimes(1)
      done()
    })


  })

})
