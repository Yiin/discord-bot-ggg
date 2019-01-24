const db = require('../../database');
const riotApi = require('../../riot-api');

const region = 'euw1';

function verify({ args, message }) {
    return new Promise((resolve, reject) => {
        const [summonerNameToVerify] = args;
        const { author } = message;

        const registrations = db.get('registrations');
        const registration = registrations.find({
            discordUserId: author.id,
        });

        if (!registration.value()) {
            message.reply('nesi užregistravęs jokio summoner.');
            return resolve();
        }

        let summonerToVerify;
        
        if (summonerNameToVerify) {
            const summoner = registration.get('summoners').find({
                summonerName: summonerNameToVerify
            });

            if (!summoner.value()) {
                message.reply('neturi užregistravęs tokio summoner name.');
                return resolve();
            }

            summonerToVerify = summoner;
        } else {
            const { lastSummonerIdToVerify } = registration.value();
            
            if (!lastSummonerIdToVerify) {
                message.reply('nesi užregistravęs jokio naujo summoner.');
                return resolve();
            }

            const summoner = registration.get('summoners').find({
                id: lastSummonerIdToVerify,
            });

            if (!summoner.value()) {
                message.reply('tokio summoner name nesi užregistravęs');
                return resolve();
            }

            summonerToVerify = summoner;
        }

        const { id, verificationIconId } = summonerToVerify.value();
        
        riotApi.request(
            region,
            'summoner',
            `/lol/summoner/v4/summoners/by-account/${id}`,
            (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }

                const { profileIconId } = data;

                if (profileIconId === verificationIconId) {
                    summonerToVerify
                        .assign({
                            verified: true,
                        })
                        .write();

                    if (author.username === 'apolas') {
                        message.reply('tu mldc! :)');
                    } else {
                        message.reply('patvirtinimas pavyko! :)');
                    }
                } else {
                    message.reply('profilio nuotrauka nesutampa su prašoma uždėti.');
                }
                resolve();
            }
        )
    });
}

module.exports = verify;
