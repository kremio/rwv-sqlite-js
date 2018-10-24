const fields = ["reportURI","cause","pageURL","createdDate"]

/*
 * Store the given error in the database.
 */
const insert = async ( reportURI, cause, pageURL, db ) => {

  const data = {
    reportURI,
    cause,
    pageURL,
    createdDate: (new Date()).toISOString()
  }

  await db.insertRow( data, 'error', fields )
  return data
}

/*
 * Retrieve the last inserted error from the database.
 */
const get = async (db) => {
  return await new Promise( (s,f) => {
    db.db.get('SELECT * FROM error ORDER BY createdDate DESC LIMIT 1', (err, row) => {
      if(err){
        f(err)
        return
      }
      s( row )
    })
  })
}

/*
 * Delete all errors
 */
const clear = async (db) => {
  return await new Promise( (s,f) => {
    db.db.run('DELETE FROM error', (err) => {
      if(err){
        f(err)
        return
      }
      s( true )
    })
  })
}

module.exports = {
  insert,
  get,
  clear
}
