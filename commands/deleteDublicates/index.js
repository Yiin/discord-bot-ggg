function deleteDublicates({ message }) {
    const { guild } = message;

    const map = {};

    for (member of guild.members.array()) {
        const { username } = member.user;
        
        if (!map[username]) {
            map[username] = [];
        }
        if (!member.avatarURL) {
            if (map[username].length) {
                const { discriminator } = member.user;

                console.log(`Kicking ${username}#${discriminator}...`);
                member.kick();
            } else {
                map[username].push(member);
            }
        } else {
            map[username].forEach(({ kick, user: { discriminator } }) => {
                console.log(`Kicking ${username}#${discriminator}...`);
                kick();
            });
            map[username].push(member);
        }
    }
}

module.exports = deleteDublicates;
