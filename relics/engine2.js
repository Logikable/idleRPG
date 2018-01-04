const fs = require('fs')

const Discord = require('discord.js')
const client = new Discord.Client()

const cfg = JSON.parse(fs.readFileSync('cfg').toString())
const token = cfg.token
const prefix = cfg.prefix

let cleanedup = false
function cleanup() {
	if (!cleanedup) {
		client.destroy()
		cleanedup = true
	}
	process.exit()
}



client.login(token)

// Cleanup crew
function exitHandler(options, err) {
    if (options.cleanup) cleanup()
    if (err) console.log(err.stack)
    if (options.exit) cleanup()
}
//do something when app is closing
process.on('exit', exitHandler.bind(null, { cleanup:true }))
//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, { exit:true }))
//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, { exit:true }))
