const fields = ["reportURI","name","publishedDate","url","createdDate"]

/*
 * Insert the locations of the given report in the database.
 * It is assumed that the input array is valid.
 */
const insertSources = async ( report, db ) => {

  const clone = Object.assign({}, report)
  clone.sources = []

  await db.transactionBegin( () => Promise.all( report.sources.map( (source) => {
    const data = Object.assign( {publishedDate:null, url:"null"}, source )
    data.reportURI = report.uri
    //add current datetime
    data.createdDate = (new Date()).toISOString()
    clone.sources.push( data )
    return db.insertRow( data, 'source', fields )
  } ) ) )
  await db.transactionCommit()

  return clone
}

module.exports = insertSources
