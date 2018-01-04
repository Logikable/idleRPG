'use strict'

const fs = require('fs')

const Discord = require('discord.js')
const client = new Discord.Client()

const dataFile = 'data.txt'
const token = fs.readFileSync('token').toString()	// thanks random guy who found my github and told me to remove it
const devId = '313850299838365698'
const prefix = '.'

var games = {}

const items = {
	0: {
		name: 'bag_of_gold',
		dispName: 'Bag of Gold',
		maxStack: '1'
	}
}

// inclusive
function randI(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min)
}

// returns promise of a message object
function dm(user, message) {
	return user.send(message)
}

function newGame(user) {
	const game = new Game()
	game.newGame(user)
	games[user.id] = game
}

function load() {
	if (!fs.existsSync(dataFile)) {
		return
	}
	const raw = fs.readFileSync(dataFile)
	const data = JSON.parse(raw)

	const gamesData = data.games
	for (var key in gamesData) {
		const gameData = gamesData[key]
		const user = client.users.get(key)		// key is user id

		const game = new Game()
		game.load(user, gameData)
		
		games[key] = game
	}
	console.log('Loaded data from disk')
}

function save() {
	var data = {
		games: {}
	}
	for (var userId in games) {		// userId is key
		const game = games[userId]
		data.games[userId] = game.save()
	}
	fs.writeFileSync(dataFile, JSON.stringify(data))
	console.log('Saved data to disk')
}

var cleaned = false
function cleanup() {
	if (!cleaned) {
		save()
		cleaned = true	
	}
	process.exit()
}

class Log {
	constructor(game, msg) {		// msg should not be a promise
		this.msg = msg
		this.contents = msg.content.split('\n')
	}

	log(line) {
		this.contents.push(line)
	}

	update() {
		const size = this.contents.length
		const start = (size > 40 ? size - 40 : 0)
		this.contents = this.contents.slice(start, size)
		this.msg.edit(this.contents.join('\n'))
	}
}

class Mob {
	constructor(minH, maxH) {
		this.maxHP = randI(minH, maxH)
		this.hp = this.maxHP
		this.xp = Math.ceil(this.hp / 5)
	}

	// callback function if mob dies
	hurt(dmg, onHurt, onDeath) {
		this.hp -= dmg
		if (this.hp <= 0) {
			this.hp = 0
		}

		onHurt(this)
		if (this.hp === 0) {
			onDeath(this)
		}
	}
}

class Inventory {
	constructor(game) {
		this.mu = 0
		this.contents = {}
	}

	add(item) {

	}
}

class Game {
	constructor() {
		this.ready = false
	}

	newGame(user) {
		this.user = user
		this.xp = 0
		const dmPromise = dm(this.user, 'Welcome to IdleRPG!')
		dmPromise.then((msg) => {
			this.logger = new Log(this, msg)
			this.ready = true
		})
	}

	load(user, data) {
		this.xp = data.xp

		const msg = user.dmChannel.fetchMessage(data.logger.msgId)		// promise of a msg
		msg.then((msg) => {
			this.logger = new Log(this, msg)
			this.logger.contents = data.logger.contents
			this.ready = true
		})

		if (data.mob) {
			this.mob = new Mob(0, 0)
			this.mob.maxHP = data.mob.maxHP
			this.mob.hp = data.mob.hp
			this.mob.xp = data.mob.xp
		}	
	}

	save() {
		if (!this.ready) {		// don't try to save a game that hasn't loaded
			return
		}

		var data = {}
		data.xp = this.xp
		data.logger = {
			msgId: this.logger.msg.id,
			contents: this.logger.contents
		}
		if (this.mob) {
			data.mob = {
				maxHP: this.mob.maxHP,
				hp: this.mob.hp,
				xp: this.mob.xp
			}
		}
		return data		
	}

	log(msg) {
		this.logger.log(msg)
	}

	tickLogger() {
		if (this.ready) {
			this.logger.update()
		}
	}

	spawnMob() {
		const mob = new Mob(4, 16)
		this.log('A new challenger! **[' + mob.hp + 'hp]**')
		return mob
	}

	gainXp(amt) {
		this.xp += amt
		this.log('**+' + amt + 'xp** [' + this.xp + 'xp]')
	}

	tick() {
		if (!this.ready) {
			return
		}
		if (!this.mob) {
			this.mob = this.spawnMob()
		}
		var dmg = randI(2, 4)
		const prevHp = this.mob.hp

		this.mob.hurt(dmg,
			(mob) => {
				this.log(dmg + 'dmg [' + prevHp + '->' + mob.hp + 'hp]')
			},
			(mob) => {
				this.gainXp(mob.xp)
				this.mob = null
			})
	}
}

// commands
function _new(message) {
	if (games[message.author.id] == undefined){
		newGame(message.author)
	}
}

commands = {
	dm: {
		prefixed: {

		},
		unprefixed: {

		}
	},
	text: {
		prefixed: {
			new: _new
		},
		unprefixed: {

		}
	}
}

/********* runs on boot ***********/

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
	}, 1000)

	setInterval(() => {
		for (var key in games) {
			const game = games[key]
			game.tickLogger()
		}
	}, 2500)

	client.user.setGame('IdleRPG Dev [5%]')
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
