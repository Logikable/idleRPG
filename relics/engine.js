const fs = require('fs')
const _ = require('lodash')
const colors = require('colors')

const Discord = require('discord.js')
const client = new Discord.Client()

const dataFile = 'data.txt'
const cfg = JSON.parse(fs.readFileSync('cfg').toString())
const token = cfg.token
const prefix = cfg.prefix

/*** functions ***/

const SEVERITY = {INFO: 0, WARNING: 1, ERROR: 2}

function log(msg, severity) {		// severity: 0 - info, 1 - warning, 2 - error
	function formatTime(i) {
		if (i < 10) {
			i = '0' + i
		}
		return i
	}
	severity = severity ? severity : SEVERITY.INFO
	const severityString = ['INFO', 'WARNING'.yellow, 'ERROR'.red]
	let date = new Date()
	let dateString = '[' + formatTime(date.getHours()) + ':' + formatTime(date.getMinutes()) + ':' + formatTime(date.getSeconds()) + ']'
	console.log(dateString + ' ' + severityString[severity] + ': ' + msg)
}

function load(GameClass) {
	if (!fs.existsSync(dataFile)) {
		log('Data file does not exist.', SEVERITY.WARNING)
		return
	}
	try {
		const data = JSON.parse(fs.readFileSync(dataFile))
		_.forEach(data, (data, userID) => {
			if (client.guilds.get(data.guildID) == undefined
				|| client.channels.get(data.channelID) == undefined) {
				log('Failed to load game of user ' + userID, SEVERITY.WARNING)
				return
			}
			client.channels.get(data.channelID).fetchMessage(data.messageID).then(message => {
				const user = client.users.get(userID)
				addGame(user, new GameClass(user, data))
				log('Successfully loaded game of user ' + userID, SEVERITY.INFO)
			}).catch(message => {
				log('Failed to load game of user ' + userID, SEVERITY.WARNING)
			})
		})
	} catch(e) {
		log('Corrupted data file - skipping.', SEVERITY.ERROR)
		return
	}
}

function save() {
	log('Saving...', SEVERITY.INFO)
	let data = {}
	games.forEach((game, userID) => {
		data[userID] = game._data()
		log('Saving game of user ' + userID, SEVERITY.INFO)
	})
	fs.writeFileSync(dataFile, JSON.stringify(data))
}

let cleanedup = false
function cleanup() {
	if (!cleanedup) {
		save()
		client.destroy()
		cleanedup = true
	}
	process.exit()
}

function setPlaying(game) {
	client.user.setGame(game)
}

/*** GAME ***/

let games = new Discord.Collection()

class Game {
	constructor(user, data) {
		if (user == null || user == undefined) {
			throw new TypeError('User cannot be null or undefined')
		}
		this.user = user
		this.data = data
		this.ram = new Discord.Collection()
		this.UIs = new Discord.Collection()
		this.UI = new UI()
		this.currentTick = 0

		this.guild = client.guilds.get(data.guildID)
		
		if (data.channelID && data.messageID) {
			this.channel = this.guild.channels.get(data.channelID)

			this.channel.fetchMessage(data.messageID).then(message => {
				this.message = message
			}).catch(message => { console.error })
		} else {
			this.guild.createChannel(user.id, 'text').then(channel => {
				this.channel = channel
				this.data.channelID = channel.id
				channel.overwritePermissions(this.guild.id, {
					READ_MESSAGES: false
				})
				channel.overwritePermissions(user, {
					READ_MESSAGES: true
				})
				channel.send('```Loading...```').then(message => {
					this.message = message
					this.data.messageID = message.id
				})
			}).catch(console.error)
		}
	}
	_data() {
		return this.data
	}
	_updateMessage(content) {
		if (this.message) {
			if (this.message.content !== content) {
				this.message.edit(content)
			}
		}
	}
	switchUI(ui) {
		this.UI = this.UIs.get(ui)
		this._updateMessage(this.UI._display())
	}
	tick() {
		this.UIs.forEach(UI => {
			if (!UI.paused()) {
				UI.tick(this.currentTick)
			}
		})
		if (this.currentTick % 5 === 0) {
			this._updateMessage(this.UI._display())
		}
		this.currentTick += 1
	}
	stop() {
		games.delete(this.user.id)
	}
}

class UI {
	constructor(data, name) {
		this.data = data
		this.name = name ? name : 'default'
		this.data[this.name] = {}
		this.data[this.name].paused = false
	}
	_display() {
		const raw = this.display()
		if (!(raw instanceof Array)) {
			return raw.substring(0, 2000)		// max 2000 characters
		}
		const trimmed = raw.slice(0, 40)
		return trimmed.join('\n').substring(0, 2000)	// limit to 2000
	}
	display() {		// returns what should be displayed
		return '```Loading...```'
	}
	registerCommand(command, options, func) {		// options should be an array of specifications: prefixed/unprefixed
		registerCommand(command, ['game', this.name, ...options], func)
	}
	paused() {
		return this.data[name].paused
	}
	pause() {
		this.data[name].paused = true
	}
	unpause() {
		this.data[name].paused = false
	}
	tick(currentTick) {

	}
}

class MultilogueUI extends UI {
	constructor(participants, script) {		// participants example: {usr: 'User', foe: 'Foe'}, scripts example: [{speaking: 'usr', text: 'Hi'}, ...]
		this.participants = participants
		this.script = []
		for (let i = 0; i < scripts.length; i += 1) {
			const details = scripts[i]
			this.script[i] = participants[details.speaking] + ': ' + details.text
		}
	}
	display() {

	}
}

function addGame(user, game) {
	if (games.has(user.id)) {
		throw new Error('User already has a game')
	}
	games.set(user.id, game)
}

function getGame(user) {
	if (!games.has(user.id)) {
		return null
	}
	return games.get(user.id)
}

/*** COMMANDS ***/

let commands = {
	dm: {
		prefixed: {},
		unprefixed: {}
	},
	text: {
		prefixed: {},
		unprefixed: {}
	},
	game: {

	}
}

function registerCommand(command, options, func) {		// options should be an array of specifications: dm/text, prefixed/unprefixed
	let tree = commands
	for (let key in options) {
		if (tree[options[key]] == undefined) {
			tree[options[key]] = {}
		}
		tree = tree[options[key]]
	}
	tree[command] = func
}

function filterChannel(message, tree) {
	if (message.channel instanceof Discord.TextChannel) {
		const game = games.find(game => game.channel.id == message.channel.id)
		if (game != undefined) {
			return filterPrefix(message, tree.game[game.UI.name])
		}
		return filterPrefix(message, tree.text)
	} else if (message.channel instanceof Discord.DMChannel) {
		return filterPrefix(message, tree.dm)
	}
	return false
}

function filterPrefix(message, tree) {
	if (message.content.startsWith(prefix)) {
		message.content = message.content.substring(prefix.length)
		return filterCommand(message, tree.prefixed)
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

/*** HOOKING ***/

let hooks = {
	'message': [],
	'ready': []
}

function on(on, func) {
	hooks[on].push(func)
}

/*** INIT ***/

client.on('channelDelete', channel => {		// if a channel is removed, then delete the game associated with it
	const game = games.find(game => game.channel.id == channel.id)
	if (game != undefined) {
		games.delete(game.user.id)
	}
})

client.on('message', message => {
	for (let key in hooks['message']) {
		hooks['message'][key](message)
	}
	filterChannel(message, commands)		// detects command

	if (games.find(game => {				// if channel is a game channel, delete any messages not from the bot
		if (game.channel == undefined) {
			return false
		}
		return game.channel.id === message.channel.id
	}) != undefined) {
		if (message.author != client.user) {
			message.delete()
		}
	}
})

client.on('ready', () => {
	setInterval(() => {
		games.forEach(game => {
			game.tick()
		})
	}, 500)

	for (let key in hooks['ready']) {
		hooks['ready'][key]()
	}
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

/*** exports ***/

exports.Game = Game
exports.UI = UI
exports.addGame = addGame
exports.getGame = getGame
exports.registerCommand = registerCommand
exports.on = on
exports.setPlaying = setPlaying
exports._prefix = prefix
exports.load = load
exports.log = log
exports.SEVERITY = SEVERITY
