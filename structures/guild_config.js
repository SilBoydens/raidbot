"use strict";

const housecall = require("housecall");
const fs        = require("fs/promises");
const path      = require("path");

class GuildConfig {
    constructor(filePath) {
        this.path  = path.join(process.cwd(), filePath);
        this.store = require(this.path);
        this.queue = housecall({
            concurrency: 2,
            cooldown: 1000
        });
    }

    get(id) {
        let config = this.store[id];
        if (config === undefined) {
            config = this.store[id] = JSON.parse(JSON.stringify(GuildConfig.Default));
            this.save();
        }
        return config;
    }

    save() {
        this.queue.push(() => fs.writeFile(this.path, JSON.stringify(this.store), "utf8"));
    }

    static Default = {
        raid_lookback: 5,
        raid_idlist: true,
        mod_roles: [],
        logs_channel_id: null,
        changelog_channel_id: null
    };
}

module.exports = GuildConfig;