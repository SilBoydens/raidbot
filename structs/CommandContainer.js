"use strict";

const Command = require("./Command");

class CommandContainer extends Map {
    set(commandName, props) {
        return super.set(commandName, new Command(props));
    }
    find(func) {
        for (let value of this.values()) {
            if (func(value)) {
                return value;
            }
        }
    }
    filter(func) {
        let satisfied = [];
        for (let value of this.values()) {
            if (func(value)) {
                satisfied.push(value);
            }
        }
        return satisfied;
    }
    map(func) {
        let wrapped = [];
        for (let value of this.values()) {
            wrapped.push(func(value));
        }
        return wrapped;
    }
    some(func) {
        for (let value of this.values()) {
            if (func(value)) {
                return true;
            }
        }
        return false;
    }
    every(func) {
        for (let value of this.values()) {
            if (!func(value)) {
                return false;
            }
        }
        return true;
    }
    toString() {
        return `[${this.constructor.name}]`;
    }
    toJSON() {
        let json = {};
        for (let [key, value] of this.entries()) {
            json[key] = value;
        }
        return json;
    }
};

module.exports = CommandContainer;
