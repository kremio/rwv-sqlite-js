const sampleValidReport = require('rwv-schema/sample.json')

const howMany = Number( process.argv[2] )
const howLong = Number( process.argv[3] ) //in ms
const fail = process.argv.length > 4 //if true, invalid input will be generated after the 1st output

const aReport = (r) => Object.assign(
  {},
  sampleValidReport,
  {uri: `${sampleValidReport.uri}${r}`}
)

const n = [...Array(howMany)]
const tasks = n.map((v,i) => {
  if(i == 1 && fail){
    return aReport(i)
  }else{
    return JSON.stringify( aReport(i) )
  }
}).map( (v,i) => new Promise( (s,f) => setTimeout( () =>{
  console.log(v)
  s()
}, i*howLong)
))

Promise.all( tasks )
  .then( () => process.exit() )
  .catch( () => process.exit(1) )
