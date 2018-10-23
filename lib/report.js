const validate = require('rwv-schema')

const fields = ["uri","title","description","startDate","endDate","iso3166_2","motives","contexts","factums","tags","createdDate"]

/*
 * Validate the given report and insert it in the database.
 * Returns the report if all went well, throws an exception
 * otherwise.
 */
const insertReport = async ( report, db ) => {
  validate( report ) //throws error if the report is not valid

  const data = Object.assign( {endDate: null}, report )
  //collapse arrays into strings
  data.contexts = data.contexts ? data.contexts.join('%') : null
  data.motives  = data.motives  ? data.motives.join('%') : null
  data.factums  = data.factums  ? data.factums.join('%') : null
  data.tags     = data.tags     ? data.tags.join('%') : null
  //add current datetime
  data.createdDate = (new Date()).toISOString()

  await db.insertRow( data, 'data', fields )
  return data
}

module.exports = insertReport
