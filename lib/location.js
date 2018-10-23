const fields = ["reportURI","subdivisions","latitude","longitude","createdDate"]

/*
 * Insert the locations of the given report in the database.
 * It is assumed that the input array is valid.
 */
const insertLocations = async ( report, db ) => {

  const clone = Object.assign({}, report)
  clone.locations = []
  await db.transactionBegin ( () => Promise.all( report.locations.map( (location) => {
    const data = Object.assign( {latitude:null, longitude:null}, location )
    data.reportURI = report.uri
    //collapse arrays into strings
    data.subdivisions = data.subdivisions.join('%')
    //add current datetime
    data.createdDate = (new Date()).toISOString()
    clone.locations.push( data )
    return db.insertRow( data, 'location', fields )
  } ) ) )
  await db.transactionCommit()

  return clone
}

module.exports = insertLocations
