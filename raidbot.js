/* jshint esversion: 6 */
require("dotenv").config();
/* require envs:
  RAIDBOT_TOKEN
  DB_FILE
  CONFIG_FILE
*/

const RaidBot = require("./structs/RaidBot"), client = new RaidBot(process.env.RAIDBOT_TOKEN, {
    getAllUsers: true,
    defaultImageSize: 512,
    defaultImageFormat: "png",
    restMode: true
}, {
    dbFile: process.env.DB_FILE,
    configFile: process.env.CONFIG_FILE,
    logsWebhook: process.env.LOGS_WEBHOOK
});

client.on("ready", () => {
    console.log("Logged in as %s#%s!", client.user.username, client.user.discriminator);
    console.log("Serving %d guilds:", client.guilds.size);

    for (let [, guild] of client.guilds) {
        client.createTable(guild.id);
        console.log("* %s", guild.name);
    }
    
    client.editStatus(void(0), {
        name: "Helping moderators"
    });
    // clean the sqlite db every hour
    setInterval(client.flushDB, 3600000);
});

client.connect();
