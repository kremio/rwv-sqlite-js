const { spawn } = require('child_process')
const {Transform} = require('stream')

class StringToJSON extends Transform {
  constructor(options) {
    super( {readableObjectMode: true, writableObjectMode: false} )
  }

  _transform( input, encoding, cb){
    try{
      cb(null, JSON.parse(input.toString()) )
    }catch(e){
      cb(e)
    }

  }
}

class JSONToString extends Transform {
  constructor(options) {
    super( {readableObjectMode: false,  writableObjectMode: true} )
  }

  _transform( input, encoding, cb){
    try{
      cb(null, JSON.stringify(input) )
    }catch(e){
      cb(e)
    }

  }
}

const launch = async (insertStream, command, args) => {

  const source = spawn( command, args)
  const stringToJSON = new StringToJSON()

  return new Promise( (success, failed) => {

    const cleanUp = () =>{
      stringToJSON.unpipe( insertStream )
      source.stdout.unpipe( stringToJSON )
      stringToJSON.destroy()
    }

    const exitOnFailure = (reason) => {
      cleanUp()
      failed(reason)
      source.kill('SIGPIPE')
    }

    source.stderr.on('data', (data) => {
      exitOnFailure( data.toString() )
    })
    
  /*
    source.stdout.on('end', () => {
      console.log("stdout ended")
    })

    source.stdout.on('close', () => {
      console.log("stdout closed")
    })

    insertStream.on('unpipe', () => {
      console.log(`toDB un-piped`)
    })*/

    source.on('close', (code) => {
      //console.log(`child process exited with code ${code}`)
      cleanUp()
      success(code)
    })

    stringToJSON.on('error', exitOnFailure)

    source.stdout
        .pipe( stringToJSON  )
        .pipe( insertStream )
        .on('error', exitOnFailure )

  })
}

module.exports = {
  launch,
  JSONToString
}
