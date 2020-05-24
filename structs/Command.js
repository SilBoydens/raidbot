"use strict";

const assert = require("assert");

class Command {
    id;
    aliases     = [];
    guildOnly   = false;
    group       = "user";
    params      = "";
    description = "";
    constructor(props) {
        assert(typeof props.id === "string", "Must specify a command identifier as a string");
        this.id = props.id;

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

        assert(typeof props.execute === "function");
        Object.defineProperty(this, "execute", {
            value: props.execute
        });
    }

    get usage() {
        return this.params ? `${this.id} ${this.params}` : this.id;
    }
    
    toString() {
        return `[${this.constructor.name} ${this.id}]`;
    }
}

module.exports = Command;
