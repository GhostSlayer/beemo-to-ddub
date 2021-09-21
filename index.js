const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const axios = require('axios');
const config = require('config').util.toObject();
const mysql = require('@drivet/database')

client.on('ready', () => console.log(`Logged in as ${client.user.tag}! ${process.env.NODE_ENV === 'development' ? '[DEVELOPMENT]' : ''}`));
client.on('error', err => console.log(err));

function detectURLs(message) {
  var urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
  return message.match(urlRegex)
}

client.on('messageCreate', async message => {
  try {
    //&& message.author.id !== '235148962103951360'
    if (message.channel.id !== '875065636039049236' || message.author.id !== '515067662028636170') return
    const beemoUrl = detectURLs(message.embeds[0].description);
    const urlFormatted = beemoUrl[0].replace('**', '')
    console.log(urlFormatted)
  
    const request = await axios.get(urlFormatted).catch(err => { console.error('Failed to fetch Beemo AntiSpam logs.') })
    let users = request.data.toString().substring(request.data.indexOf("Raw IDs:") + 10).replace(/\r\n/g,'\n').split('\n')
    
    message.channel.send('Reporting that ^^')

    if (process.env.NODE_ENV === 'development') {
      for (let id of users) {
        if (id === '') return;
        console.log(`- ${id}`)
      }

      return;
    } else {
      for(let id of users) {
        if (id === '') return;

        console.log(`${new Date()} - ${id}`)
    
        mysql.query('INSERT INTO reports SET ?', { author: '814952115424067664', reported: id, type: 'Spamming', reason: 'Attempted to raid a server', created_at: Date.now() })
    
        await axios.get('https://discord.riverside.rocks/report.json.php', {
          params: {
            id,
            key: config.ddubToken,
            details: `Attempted to raid a server`
          }
        }).catch(err => { console.log(`Failed to report ${id} to DDUB`) })
      }
    }
  } catch (err) {
    console.log(err)
  }
});

client.login(config.bot.token);