const fs = require('fs')

const Discord = require('discord.js')
const client = new Discord.Client()

const cfg = JSON.parse(fs.readFileSync('cfg').toString())
const token = cfg.token
const prefix = cfg.prefix

const dataFile = 'data.txt'
const adminId = 313850299838365698

const xpTable = [27,46,78,133,227,318,445,623,872,1221,1466,1759,2111,2533,3040,3648,4377,5253,6304,7565,8699,10004,11505,13231,15216,17498,20123,23141,26613,30605,34277,38391,42998,48157,53936,60409,67658,75777,84870,95055,104560,115016,126518,139170,153087,168396,185235,203759,224135,246548,Infinity]
let oreStats = {}
let ingotStats = {}
let drillStats = {}

const items = {
	0: {type: 'ore', oreType: 'iron', xp: 2, weighing: 1, name: 'ironOre', displayName: 'Iron Ore', level: 1},
	1: {type: 'ore', oreType: 'coal', xp: 3, weighing: 1, name: 'coalOre', displayName: 'Coal Ore', level: 2},
	2: {type: 'ingot', ingotType: 'iron', displayName: 'Iron Ingot', recipe: {ironOre: 2}},
	3: {type: 'ingot', ingotType: 'steel', displayName: 'Steel Ingot', recipe: {ironOre: 2, coalOre: 1}},
	4: {type: 'drill', drillType: 'iron', levelReq: 1, displayName: 'Iron Drill', speed: 1, mineable: ['iron', 'coal'], recipe: {ironIngot: 10}},
	5: {type: 'drill', drillType: 'steel', levelReq: 3, displayName: 'Steel Drill', speed: 1.5, mineable: ['iron', 'coal', 'titanium'], recipe: {steelIngot: 10}},
}

var games = {}
const gameTemplate = {
	userId: 0,
	ironOre: 0,
	coalOre: 0,
	inventory: {},
	miningTimer: 0,
	miningXp: 0,
	drill: 4,
	mute: false,
}

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
	return xpTable[lvl - 1] - xp
}


function load() {
	games = JSON.parse(fs.readFileSync(dataFile))
	// forwards compatibility
	for (let id in games) {
		const game = games[id]
		for (let key in gameTemplate) {
			if (!(key in game)) {
				game[key] = gameTemplate[key]
			}
		}
	}

	for (let id in games) {
		send(id, '**Server reloaded.**')
	}
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
		games[user.id] = gameTemplate
		games[user.id].userId = user.id
	} else {
		user.send('You already have a game! If this is an error, contact @Logikable#6019.')
	}
}

function craft(user, args) {
	for (let key in items) {
		
	}
}

function addItem(game, id, quantity) {
	if (id in game.inventory) {
		game.inventory[id] += quantity
	} else {
		game.inventory[id] = quantity
	}
}

function displayInventory(user) {
	const game = games[user.id]
	let invMessage = []
	for (let id in game.inventory) {
		const item = items[id]
		const quantity = game.inventory[id]
		invMessage.push('**' + item.displayName + '**: ' + quantity)
	}
	user.send(invMessage)
}

function displayXp(user) {
	const xp = games[user.id].miningXp
	const level = xpToLevel(xp)
	user.send('**Level ' + level + '** [xp: ' + xp + '/' + xpTable[level - 1] + ']')
//	user.send('**Level ' + level + '** [xp: ' + xp + '/' + xpTable[level - 1] + '] - *xpTNL: ' + xpTNL(xp) + '*')
}

function toggleMute(user) {
	games[user.id].mute = !games[user.id].mute
	user.send(games[user.id].mute ? 'Muted.' : 'Unmuted.')
}

function displayHelp(user) {
	const help = [
		'**Commands for IdleRPG:**',
		'  *start*: Starts a new game.',
		'  *clear*: Clears your old game. **No confirmation. Be careful.**',
		'  *stats*: Shows your stats.',
		'  *mute*: Mutes the bot, only sending important messages.',
		'  *ping*: Pings the server to test your connection.'
	]
	user.send(help)
}

client.on('message', message => {
	if (message.channel instanceof Discord.DMChannel) {
		if (message.author === client.user) {
			return
		}
		const split = message.content.toLowerCase().split(' ')
		const command = split[0]
		const args = split.slice(1)

		if (message.author.id == adminId) {	// is mee
			if (command === 'save') {
				save()
				message.author.send('Saved data to disk.')
				console.log('Saved data to disk.')
			} else if (command === 'load') {
				load()
				message.author.send('Loaded data from disk.')
				console.log('Loaded data from disk.')
			} else if (command === 'users') {
				message.author.send('Current users: ' + Object.keys(games))
			}
		}

		if (message.author.id in games) {	// has a game
			if (command === 'clear') {
				clear(message.author)
				message.author.send('Cleared data. Type **start** to start again.')
				console.log('Cleared data from user ' + formatUser(message.author))
			} else if (command === 'ore' || command === 'inventory') {
				displayInventory(message.author)
			} else if (command === 'xp' || command === 'level') {
				displayXp(message.author)
			} else if (command === 'stats') {
				displayXp(message.author)
				displayInventory(message.author)
			} else if (command === 'mute' || command === 'silence') {
				toggleMute(message.author)
			} else if (command === 'craft') {
				craft(message.author, args)
			}
		} else if (command === 'start') {	// does not have a game
			start(message.author)
			message.author.send('Welcome to IdleRPG!')
			console.log('Started a game for user ' + formatUser(message.author))
		}

		if (command === 'ping') {
			message.author.send('pong')
		} else if (command === 'help') {
			displayHelp(message.author)
		}
	}
})

function tick() {
	for (let userId in games) {
		const game = games[userId]
		let queuedXp = 0
		if (game.miningTimer > 0 && Math.random() <= drillStats[game.drill].speed / 10) { // successfully mined ore
			const level = xpToLevel(game.miningXp)
			let totalWeighing = 0
			for (let ore in oreStats) { // totalWeighing should only include ores mineable
				const oreStat = oreStats[ore]
				if (oreStat.level <= level) {
					totalWeighing += oreStat.weighing
				}
			}

			const rand = Math.random()
			let sum = 0
			for (let oreId in oreStats) {	// generate a random ore to give
				const oreStat = oreStats[oreId]
				if (oreStat.level > level) {	// only mine ores that can be mined
					continue
				}
				sum += oreStat.weighing
				if (rand <= sum / totalWeighing) {	// successfully mined!
					addItem(game, oreId, 1)
					queuedXp += oreStat.xp
					game.miningTimer = 0
					if (!game.mute) {
						send(game.userId, 'You mined **' + oreStat.displayName + '** *[+' + oreStat.xp + 'xp]*.')
					}
					break
				}
			}
		} else if (game.miningTimer == 0) {
			if (!game.mute) {
				send(game.userId, 'You ready your drill.')
			}
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
	for (let id in items) {
		const item = items[id]
		if (item.type === 'ore') {
			oreStats[id] = item
		} else if (item.type === 'ingot') {
			ingotStats[id] = item
		} else if (item.type === 'drill') {
			drillStats[id] = item
		}
	}

	setInterval(tick, 1000)
})

client.login(token)
