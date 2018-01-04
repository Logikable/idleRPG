const fs = require('fs')

const Discord = require('discord.js')
const client = new Discord.Client()

const token = fs.readFileSync('dev_token').toString()
const dev_id = '313850299838365698'

function evl(message) {
	if (message.author.id === dev_id || message.author.id === '183009312975749120') {
		if (message.content.startsWith('```\n!eval')) {
			var lines = message.content.split('\n')
			lines.shift()		// remove first two and last line
			lines.shift()
			lines.pop()
			console.log('********executing:\n' + lines.join('\n') + '\n')
			try {
				eval(lines.join('\n'))
			} catch(e) {
				message.channel.send('Syntax Error (Javascript ES6)')
			}
		}
	}	
}

client.on('message', message => { evl(message) })
client.on('messageUpdate', (oldMessage, newMessage) => { evl(newMessage) })

client.on('ready', () => {
	client.user.setGame('Yee')
})

client.login(token)
