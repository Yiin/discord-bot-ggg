const path = require('path');
const Discord = require('discord.js');
const XRegExp = require('xregexp');

const db = require('../../database');
const riotApi = require('../../riot-api');

const region = 'euw1';

function getRandomIconId(profileIconId) {
    const availableIcons = [...new Array(29)]
        // populate array with icon ids 0 to 28 (you get these icons after account creation)
        .map((_, index) => index)
        // exclude already set icon in case user uses one of these icons already.
        .filter(icon => icon !== profileIconId);
    
    // pick random icon from available icons
    return availableIcons[Math.floor(Math.random() * availableIcons.length)];
}

function getIcon(iconId) {
    return new Discord.Attachment(path.resolve(__dirname, `icons/${iconId}.jpg`));
}

function register({ args, message }) {
    return new Promise((resolve, reject) => {
        const { author, channel } = message;
        const [summonerName] = args;

        if (!summonerName) {
            reject(new Error('Summoner name is not specified.'));
            return;
        }

        if (!new XRegExp("^[0-9\\p{L} _.]+$").test(summonerName)) {
            reject(new Error('Invalid summoner name.'));
            return;
        }

        riotApi.request(
            region,
            'summoner',
            `/lol/summoner/v4/summoners/by-name/${summonerName}`,
            (err, data) => {
                if (err) {
                    reject(new Error(err));
                    return;
                }

                const registrations = db.get('registrations');
                const summonerRegistration = registrations.find({
                    summoners: [{
                        summonerName,
                        region,
                    }],
                });

                if (summonerRegistration.value()) {
                    reject(new Error('Summoner already registered.'));
                    return;
                }

                const registration = registrations
                    .find({
                        discordUserId: author.id,
                    });
                    
                if (!registration.value()) {
                    registrations.push({
                        discordUserId: author.id,
                        summoners: [],
                    }).write();
                }

                const verificationIconId = getRandomIconId(data.profileIconId);

                registration.get('summoners')
                    .push({
                        id: data.accountId,
                        summonerName,
                        region,
                        verified: false,
                        verificationIconId,
                    }).write();

                registration.assign({
                    lastSummonerIdToVerify: data.accountId,
                }).write();

                channel.send(
                    new Discord.RichEmbed()
                        .setColor('GOLD')
                        .attachFile(getIcon(verificationIconId))
                        .setDescription(`
                            Patvirtinimui, kad čia tikrai tavo accountas,
                            pasikeisk profilio nuotrauką į parodytą aukščiau
                            ir parašyk /verify
                        `.replace(/\n/g, '')),
                );
                resolve();
            }
        );
    });
}

module.exports = register;
