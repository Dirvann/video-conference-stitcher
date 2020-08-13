// get the child_process module
const {spawn} = require('child_process')

let command = 'ls -a'
// open a child process
let process = spawn(command, [], {shell: true})

process.stdout.on('data', data => {
  console.log(data.toString())
})

// write your multiline variable to the child process
//process.stdin.write('multiLineVariable')
//process.stdin.end()

const app = require('express')()
app.listen(4000,() => console.log('helo'))