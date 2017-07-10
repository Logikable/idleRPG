const fs = require('fs')

const Discord = require('discord.js')
const client = new Discord.Client()

const token = fs.readFileSync('dev_token').toString()
const dev_id = '313850299838365698'

function msg(message) {
	if (message.author.id === dev_id) {
		if (message.content.startsWith('```\n!eval')) {
			var lines = message.content.split('\n')
			lines.shift()		// remove first two and last line
			lines.shift()
			lines.pop()
			console.log('********executing:\n' + lines.join('\n') + '\n')
			try {
				eval(lines.join('\n'))
			} catch(e) {
				message.channel.send('Syntax Error')
			}
		}
	}	
}

client.on('message', msg)
client.on('messageUpdate', (oldMessage, newMessage) => { msg(newMessage) })

client.login(token)
