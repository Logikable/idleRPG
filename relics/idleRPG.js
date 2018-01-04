const _ = require('lodash')
const Engine = require('./engine')

Engine.on('ready', () => {
	Engine.load(IdleRPG)
	Engine.setPlaying('Try ' + Engine._prefix + 'new in chat!')
})

Engine.registerCommand('new', ['text', 'prefixed'], message => {
	if (Engine.getGame(message.author) != null) {
		message.channel.send(message.author.toString() + ' already has a game.')
		return
	}
	try {
		const newGame = new IdleRPG(message.author, { guildID: message.guild.id })
		Engine.addGame(message.author, newGame)
	} catch(e) { console.error }
})

class IdleRPG extends Engine.Game {
	constructor(user, data) {
		super(user, data)

		this.UI = new TutorialUI(data, 'tutorial')
		this.UIs.set(this.UI.name, this.UI)
	}

	tick() {
		super.tick()
	}
}

class TutorialUI extends Engine.UI {
	constructor(data, name) {
		super(data, name)
		if (!this.data.tutorial) {
			this.data.tutorial = {}
			this.data.tutorial.currentSlide = 0
		}

		this.registerCommand('pause', ['unprefixed'], message => {
			if (this.paused()) {
				this.unpause()
			} else {
				this.pause()
			}
		})

		this.slides = [
			'Lyte: Welcome to IdleRPG!',
			'Lyte: This game aims to be the first playable text-based game ayayayayaya',
			'3', '4', '5', '6', '7'
		]
	}

	display() {
		return this.slides.slice(0, this.data.tutorial.currentSlide + 1)
	}

	tick(currentTick) {
		if (currentTick % 5 === 0) {
			if (this.data.tutorial.currentSlide < this.slides.length - 1) {
				this.data.tutorial.currentSlide += 1
			}
		}
	}
}

class CatUI extends Engine.UI {
	constructor(data, name) {
		super(data, name)
		this.cats = [
			'https://i.redd.it/us6msd7rwv8z.jpg',
			'https://i.redd.it/av9l6ouorx8z.jpg',
			'https://i.redd.it/4ny7nnwq6u8z.jpg',
			'https://i.redd.it/9pm3zv069y8z.jpg',
			'https://i.imgur.com/1MZQxqF.jpg',
			'https://i.imgur.com/a2Wd9D2.jpg',
			'https://i.imgur.com/G28EFxe.jpg',
			'https://i.imgur.com/Ig270Aw.jpg',
			'https://i.redd.it/pxz5xellcj8z.jpg',
			'https://i.imgur.com/6DjynNh.jpg',
			'https://i.redd.it/p6k8musu7e8z.jpg',
			'https://i.redd.it/wkk5g8nf9o8z.jpg'
		]
		this.slides = [
			'Lyte: Welcome to IdleRPG!',
			"Lyte: We're still in development.",
			'Lyte: Please check back later.',
			"Lyte: Here's a cat if you're feeling frustrated:",
			this.cats[_.random(0, this.cats.length - 1)]
		]
		if (!this.data.cat) {
			this.data.cat = {}
			this.data.cat.currentSlide = 0
		}
	}

	display() {
		return this.slides.slice(0, this.data.cat.currentSlide + 1)
	}

	tick(currentTick) {
		if (currentTick % 5 === 0) {
			if (this.data.cat.currentSlide < this.slides.length - 1) {
				this.data.cat.currentSlide += 1
			}
		}
	}
}
