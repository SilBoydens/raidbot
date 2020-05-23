"use strict";

const assert = require("assert");
const util   = require("util");

class Logger {
    #client;
    #hook;
    constructor(hookURL, client) {
        this.#client = client;
        this.hook    = hookURL;
    }

    set hook(hookURL) {
        let match = hookURL.match(/^https:\/\/discordapp\.com\/api\/webhooks\/(\d{15,})\/(.+)$/);
        assert(match !== null, "Invalid webhook URL");
        return this.#hook = {
            id: match[1],
            token: match[2]
        };
    }

    send(entry, file) {
        let entryIsStr = true;

        if (typeof entry !== "string") {
            entry = util.inspect(entry);
            entryIsStr = false;
        }

        if (file !== undefined) {
            file = {
                name: `${Date.now()}.txt`,
                file: Buffer.from(file)
            };
        }

        if (entry.length > 2000) {
            let report = {
                name: "report_content_too_large_in_length.txt",
                file: Buffer.from(entry)
            };
            if (file !== undefined) {
                if (!Array.isArray(file)) {
                    file = [file];
                }
                file.push(report);
            } else {
                file = report;
            }
            entry = "";
            entryIsStr = true;
        }

        let avatarURL;
        if (this.#client.ready) {
            avatarURL = this.#client.user.avatarURL.split("?")[0];
        }
        this.#client.executeWebhook(this.#hook.id, this.#hook.token, {
            avatarURL,
            username: `raidbot${this.#client.ready ? "" : " (not logged in)"}`,
            content: entryIsStr ? entry : `\`\`\`js\n${entry}\`\`\``,
            file,
            allowedMentions: {}
        })
        .catch(e => {
            let out = `${this.constructor.name}#send failed\n${e}\nDumping to console...\n${entry}`;
            if (file !== undefined) {
                out += "\n" + Array.isArray(file) ? file.map(f => f.file).join("\n") : "" + file.file;
            }
            console.log(out);
        });
    }
    
    toString() {
        return `[${this.constructor.name}]`;
    }
}

module.exports = Logger;
