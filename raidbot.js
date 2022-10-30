/* jshint esversion: 6 */
require("dotenv").config();
/* require envs:
  RAIDBOT_TOKEN
  DB_FILE
  CONFIG_FILE
*/

const RaidBot = require("./structures/client");
const client = new RaidBot(`Bot ${process.env.RAIDBOT_TOKEN}`, {
    getAllUsers: true,
    intents: ["guilds", "guildMembers", "guildMessages"]
});

client.on("ready", () => {
    console.log("Logged in as %s#%s, serving %d guilds", client.user.username, client.user.discriminator, client.guilds.size);
    client.editStatus(undefined, {
        name: "Helping moderators"
    });
});

client.connect();
