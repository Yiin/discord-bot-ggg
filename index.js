const Discord = require('discord.js');

const client = new Discord.Client();
client.login(process.env.DISCORD_BOT_TOKEN);

const commands = {
    deleteDublicates: require('./commands/deleteDublicates'),
    register: require('./commands/register'),
    verify: require('./commands/verify'),
};

function executeCommand(message) {
    if (message.author.bot) {
        return;
    }

    const command = Object.keys(commands)
        .find(command => new RegExp(`\/${command}`).test(message.content));

    if (!command) {
        return;
    }

    if (!commands[command]) {
        message.reply('I don\'t know this command :(');
        return;
    }

    const args = message.content.slice(1).trim().split(/\s+/g).splice(1);

    commands[command]({ message, command, args })
        .catch(err => console.error(err));
}

client.on('message', executeCommand);
