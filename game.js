const fs = require('fs')

const Discord = require('discord.js')
const client = new Discord.Client()

const cfg = JSON.parse(fs.readFileSync('cfg').toString())
const token = cfg.token
const prefix = cfg.prefix

const dataFile = 'data.txt'
const adminId = 313850299838365698

const xpTable = [27,46,78,133,227,318,445,623,872,1221,1466,1759,2111,2533,3040,3648,4377,5253,6304,7565,8699,10004,11505,13231,15216,17498,20123,23141,26613,30605,34277,38391,42998,48157,53936,60409,67658,75777,84870,95055,104560,115016,126518,139170,153087,168396,185235,203759,224135,246548,Infinity]
const oreStats = {
	iron: {xp: 2, weighing: 1, name: 'ironOre', displayName: 'iron ore'},
	coal: {xp: 3, weighing: 1, name: 'coalOre', displayName: 'coal ore'}}

let totalWeighing = 0

function xpToLevel(xp) {
	for (let idx in xpTable) {
		if (xp < xpTable[idx]) {
			return parseInt(idx) + 1
		}
	}
	return 1
}

function xpTNL(xp) {
	const lvl = xpToLevel(xp)
	return xpTable[lvl] - xp
}

var games = {}

function load() {
	games = JSON.parse(fs.readFileSync(dataFile))
}

function save() {
	fs.writeFileSync(dataFile, JSON.stringify(games))
}

function send(userId, message) {
	client.fetchUser(userId).then(user => {
		user.send(message)
	})
}

function formatUser(user) {
	return user.username + ' [id: ' + user.id + '].'
}

function clear(user) {
	delete games[user.id]
}

function start(user) {
	if (!(user.id in games)) {
		games[user.id] = {
			userId: user.id,
			ironOre: 0,
			coalOre: 0,
			miningTimer: 0,
			miningXp: 0
		}
	} else {
		user.send('You already have a game! If this is an error, contact @Logikable#6019.')
	}
}

function displayOre(user) {
	const game = games[user.id]
	user.send(['**Iron Ore**: ' + game.ironOre, '**Coal Ore**: ' + game.coalOre])
}

function displayXp(user) {
	const xp = games[user.id].miningXp
	const level = xpToLevel(xp)
	user.send('**Level ' + level + '** [xp: ' + xp + '/' + xpTable[level] + ']')
}

client.on('message', message => {
	if (message.channel instanceof Discord.DMChannel) {
		if (message.author === client.user) {
			return
		}
		const content = message.content.toLowerCase()

		if (message.author.id == adminId) {
			if (content === 'save') {
				save()
				message.author.send('Saved data to disk.')
				console.log('Saved data to disk.')
			} else if (content === 'load') {
				load()
				message.author.send('Loaded data from disk.')
				console.log('Loaded data from disk.')
			} else if (content === 'users') {
				message.author.send('Current users: ' + Object.keys(games))
			}
		}
		if (content === 'clear') {
			clear(message.author)
			message.author.send('Cleared data. Type **start** to start again.')
			console.log('Cleared data from user ' + formatUser(message.author))
		} else if (content === 'start') {
			start(message.author)
			message.author.send('Welcome to IdleRPG!')
			console.log('Started a game for user ' + formatUser(message.author))
		} else if (content === 'ore') {
			displayOre(message.author)
		} else if (content === 'xp' || content === 'level') {
			displayXp(message.author)
		} else if (content === 'stats') {
			displayXp(message.author)
			displayOre(message.author)
		} else if (content === 'ping') {
			message.author.send('pong')
		}
	}
})

function tick() {
	for (let userId in games) {
		const game = games[userId]
		let queuedXp = 0
		if (game.miningTimer > 0 && Math.random() >= 0.8) { // successfully mined ore
			const rand = Math.random()
			let sum = 0
			for (let ore in oreStats) {
				const oreStat = oreStats[ore]
				sum += oreStat.weighing
				if (rand <= sum / totalWeighing) {
					game[oreStat.name]++
					queuedXp += oreStat.xp
					send(game.userId, 'You mined **' + oreStat.displayName + '** *[+' + oreStat.xp + 'xp]*.')
					game.miningTimer = 0
					break
				}
			}
		} else if (game.miningTimer == 0) {
			send(game.userId, 'You ready your pickaxe.')
			game.miningTimer++
		} else {
			game.miningTimer++
		}

		if (queuedXp >= xpTNL(game.miningXp)) {
			send(game.userId, 'Level up! You are now mining level ' + (xpToLevel(game.miningXp) + 1) + '.')
		}
		game.miningXp += queuedXp
	}
}

client.on('ready', () => {
	for (let ore in oreStats) {
		const oreStat = oreStats[ore]
		totalWeighing += oreStat.weighing
	}

	setInterval(tick, 2500)
})

client.login(token)
