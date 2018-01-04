const fs = require('fs')

const Discord = require('discord.js')
const client = new Discord.Client()

const dataFile = 'data.txt'
const cfg = JSON.parse(fs.readFileSync('cfg').toString())
const token = cfg.token

client.on('message', message => {
	if (message.content.startsWith('yeeee')) {
		const member = message.guild.members.get(message.author.id)
		if (member.voiceChannel) {
			const voiceChannel = member.voiceChannel
			voiceChannel.join().then(connection => {
				const broadcast = client.createVoiceBroadcast()
				broadcast.playFile('./assets/IntersectThunderbolt.mp3')
				connection.playBroadcast(broadcast)
			})
		}
	}
})

client.on('ready', () => {

})

client.login(token)
