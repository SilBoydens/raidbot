"use strict";

class Command {
    id;
    aliases     = [];
    guildOnly   = false;
    group       = "user";
    params      = "";
    description = "";
    constructor(props) {
        this.id = props.id;
        if (typeof this.id !== "string") {
            throw new Error("Missing a proper command identifier");
        }
        this.aliases     = [];
        this.guildOnly   = false;
        this.group       = "user";
        this.params      = "";
        this.description = "";

        if (Array.isArray(props.aliases)) {
            this.aliases = props.aliases;
        }
        if (typeof props.guildOnly === "boolean") {
            this.guildOnly = props.guildOnly;
        }
        if (typeof props.group === "string") {
            this.group = props.group;
        }
        if (typeof props.params === "string") {
            this.params = props.params;
        }
        if (typeof props.description === "string") {
            this.description = props.description;
        }
        if (typeof props.execute === "function") {
            this.execute = props.execute;
        }
    }

    get usage() {
        return this.params ? `${this.id} ${this.params}` : this.id;
    }
    
    toString() {
        return `[${this.constructor.name} ${this.id}]`;
    }
}

module.exports = Command;