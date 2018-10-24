const error = require('../../lib/error')
const getDB = require('../../lib/db')

describe('Storing and retrieving errors', () => {

  let db
  
  beforeEach( async (done) => {
    getDB().then( ({DB, migrations}) =>{
      db = DB
      //Start with a clean database
      migrations.reset( () => migrations.up( done ) )
    })
  })

  afterEach( () => db.close() )

  test( 'Insert an error', async (done) => {
    const myError = {
      reportURI: 'protocol:/path/ressource',
      cause: 'A description of the error',
      pageURL:  'https:/acme.com/chronik?page=65'
    }
    
    const result = await error.insert(myError.reportURI, myError.cause, myError.pageURL, db)

    const spy = jest.fn()
    db.db.each('SELECT * FROM error', spy, async (err, c) => {
      expect( err ).toBeNull()
      expect( spy ).toHaveBeenCalledTimes(1)

      const retrieved = await error.get(db)
      expect( retrieved ).toEqual( result )
      done()
    })
    
  })

  test( 'Retrieves the latest inserted error', async (done) => {
    const error1 = {
      reportURI: 'protocol:/path/ressource1',
      cause: 'A description of the error',
      pageURL:  'https:/acme.com/chronik?page=65'
    }

    const error2 = {
      reportURI: 'protocol:/path/ressource2',
      cause: 'A description of the error',
      pageURL:  'https:/acme.com/chronik?page=65'
    }

    const result1 = await error.insert(error1.reportURI, error1.cause, error1.pageURL, db)
    //Let some time pass by between inserts
    setTimeout( async () => {
      const result2 = await error.insert(error2.reportURI, error2.cause, error2.pageURL, db)

      const retrieved1 = await error.get(db)
      expect( retrieved1 ).toEqual( result2 )

      const retrieved2 = await error.get(db)
      expect( retrieved2 ).toEqual( result2 )
      done()
    }, 500 )
  })

  test( 'Clear all errors' , async () => {
    const error1 = {
      reportURI: 'protocol:/path/ressource1',
      cause: 'A description of the error',
      pageURL:  'https:/acme.com/chronik?page=65'
    }

    const error2 = {
      reportURI: 'protocol:/path/ressource2',
      cause: 'A description of the error',
      pageURL:  'https:/acme.com/chronik?page=65'
    }

    await error.insert(error1.reportURI, error1.cause, error1.pageURL, db)
    await error.insert(error2.reportURI, error2.cause, error2.pageURL, db)
    await error.clear(db)
    const retrieved = await error.get(db)
    expect( retrieved ).toBeUndefined()
  })

})
