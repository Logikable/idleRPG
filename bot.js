'use strict'

const fs = require('fs')

const Discord = require('discord.js')
const client = new Discord.Client()

const dataFile = 'data.txt'
const token = 'MzE4MTk4MTA2NzcwMzc0NjU4.DAu4sA.-YZYc9GgHMCo09leIAs4D761fTY'
const devId = 313850299838365698

var games = []

// inclusive
function randI(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min)
}

// returns promise of a message object
function dm(user, message) {
	return user.send(message)
}

function newGame(user) {
	const game = new Game(user)
	game.init()
	games.push(game)
}

function load() {
	if (!fs.existsSync(dataFile)) {
		return
	}
	const raw = fs.readFileSync(dataFile)
	const data = JSON.parse(raw)

	const gamesData = data.games
	for (var key in gamesData) {
		const gameData = gamesgameData
		const user = client.users.get(key)		// key is user id
		const game = new Game(user)

		game.xp = gameData.xp
		if (game.mob != undefined) {
			game.mob = new Mob(0, 0)
			game.mob.maxHP = gameData.mob.maxHP
			game.mob.hp = gameData.mob.hp
			game.mob.xp = gameData.mob.xp
		} else {
			game.spawnMob()
		}
		game.logger = new Log(dm(user, gameData.logger.contents))

		games.push(game)
	}
}

function save() {
	var data = {
		games: {}
	}
	for (var game in games) {
		var gameData = {
			xp: game.xp,
			logger: {
				contents: game.logger.contents
			}
		}
		if (game.mob != undefined) {
			gameData.mob = {
				maxHP: game.mob.maxHP,
				hp: game.mob.hp,
				xp: game.mob.xp
			}
		}
		data.games[game.user.id] = gameData
	}
	fs.writeFileSync(dataFile, JSON.stringify(data))
}

function cleanup() {
	save()
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

class Log {
	constructor(promise) {
		this.ready = false		// necessary because logs may be made before promise is resolved
		promise.then((message) => {
			this.msg = message
			this.contents = message.content.split('\n')
			this.ready = true
		}).catch()
	}

	log(line) {
		if (!this.ready) {
			return
		}
		this.contents.push(line)
	}

	update() {
		if (!this.ready) {
			return
		}
		const size = this.contents.length
		const start = (size > 40 ? size - 40 : 0)
		this.msg.edit(this.contents.slice(start, size).join('\n'))
	}
}

class Game {
	constructor(user) {
		this.user = user
		this.xp = 0
	}

	init() {		// should only be run when new game is created, not when loading a game
		this.logger = new Log(dm(this.user, 'Welcome to IdleRPG!'))
	}

	log(msg) {
		this.logger.log(msg)
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
		if (!this.mob) {
			this.mob = this.spawnMob()
		}
		var dmg = randI(2, 4)

		this.mob.hurt(dmg,
			(mob) => {
				this.log('' + dmg + 'dmg [' + mob.hp + 'hp]')
			},
			(mob) => {
				this.gainXp(mob.xp)
				this.mob = null
			})
	}
}

/********* runs on boot ***********/
load()

client.on('message', message => {
	if (message.channel instanceof Discord.TextChannel) {
		if (message.content.startsWith('.new')) {
			newGame(message.author)
		} else if (message.content.startsWith('.del')) {
			if (message.author.dmChannel != null) {
				message.author.deleteDM()
			}
		} 
	}
})

setInterval(() => {
	for (var key in games) {
		const game = games[key]
		game.tick()
	}
}, 2500)

setInterval(() => {
	for (var key in games) {
		const game = games[key]
		game.logger.update()
	}
}, 2500)

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
