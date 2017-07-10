const fs = require('fs')

const Discord = require('discord.js')
const client = new Discord.Client()

const dataFile = 'data.txt'
const token = fs.readFileSync('token').toString()
const prefix = '.'

var commands = {
	dm: {
		prefixed: {},
		unprefixed: {}
	},
	text: {
		prefixed: {},
		unprefixed: {}
	}
}

var games = {}

function load() {
	if (!fs.existsSync(dataFile)) {
		return
	}
}

function cleanup() {
	
}

class Game {
	constructor(user) {
		this.user = user
		this.data = {}
		this.ram = {}
		this.UIs = {}
		this.UI = new UI()
		this.currentTick = 0
	}
	_load(data) {
		this.data = data
		if (this.data.messageID) {
			this.user.dmChannel.fetchMessage(this.data.messageID).then(message => {
				this.message = message
			}).catch(message => {
				console.log('Message not found.')
			})
		} else {
			_newMessage('```DEFAULT UI```')
		}
	}
	_save() {
		return this.data
	}
	_newMessage(content) {
		this.user.send(content).then(message => {
			this.message = message
			this.data.messageID = message.id
		}).catch(message => {
			console.log('Unable to send user ' + this.user.id + ' a message.')
		})
	}
	_updateMessage(content) {
		if (this.message.content !== content) {
			this.message.edit(content)
		}
	}
	switchUI(ui) {
		this.UI = this.UIs[ui]
		this._updateMessage(this.UI.display())
	}
	tick() {
		if (currentTick % 5 === 0) {
			_updateMessage(this.UI.display())
		}
		currentTick += 1
	}
}
exports.Game = Game

class UI {
	display() {		// returns what should be displayed
		return '```DEFAULT UI```'
	}
}
exports.UI = UI

exports.registerCommand = function(command, options, func) {
	var tree = commands
	for (var key in options) {
		tree = tree[options[key]]
	}
	tree[command] = func
}

function filterChannel(message, tree) {
	if (message.channel instanceof Discord.TextChannel) {
		return filterPrefix(message, tree.text)
	} else if (message.channel instanceof Discord.DMChannel) {
		return filterPrefix(message, tree.dm)
	}
	return false
}

function filterPrefix(message, tree) {
	if (message.content.startsWith(prefix)) {
		message.content = message.content.substring(prefix.length)
		return filterCommand(message)
	} else {
		return filterCommand(message, tree.unprefixed)
	}
}

function filterCommand(message, tree) {
	if (message.content in tree) {
		tree[message.content](message)
		return true
	}
	return false
}

client.on('message', message => {
	filterChannel(message, commands)
})

client.on('ready', () => {
	load()

	setInterval(() => {
		for (var key in games) {
			const game = games[key]
			game.tick()
		}
	}, 500)

	client.user.setGame('IdleRPG Dev [??%]')
})

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
