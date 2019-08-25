module.exports = {
    guildOnly: true,
    group: 'serverMod',
    execute(client, msg, args) {
        const everyone = msg.guild.roles.get(msg.guild.id);
        if(!args[0]) {
            if(everyone.hasPermission("SEND_MESSAGES")) {
                try {
                    if (!client.zombie) everyone.setPermissions(everyone.permissions - 0x800);
                    const links = [
                        'https://zippy.gfycat.com/CarelessSplendidKiskadee.webm',
                        'https://i.gifer.com/7DUg.mp4'
                    ];
                    msg.reply(`Server locked down\n${links[Math.floor(Math.random()*links.length)]}`);
                } catch(Exception) {
                    msg.reply("Something went wrong while locking down\nhttps://i.gifer.com/8urI.mp4");
                }
            } else {
                msg.reply("Server already in lockdown state");
            }
        } else if (args[0] && args[0].toLowerCase() === 'off') {
            if(!everyone.hasPermission("SEND_MESSAGES")) {
                try {
                    if (!client.zombie) everyone.setPermissions(everyone.permissions + 0x800);
                    msg.reply("Unlocked the server.");
                } catch(Exception) {
                    msg.reply("Something went wrong while unlocking.");
                }
            } else {
                msg.reply("Can not unlock, server is not locked.");
            }
        } else {
            msg.reply(`[lockdown] could not understand "${args[0]}"\nUsage:\n\`@${client.user.tag} lockdown\` locks the server down\n\`@${client.user.tag} lockdown off\` unlocks the server`);
        }
    }
}
