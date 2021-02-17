It was about couple years ago that I took the matter of cleaning up the bot's code into hands, I didn't literally refactore the whole thing I just worked with what's already there and added some stuff of my own too, so if you spot something that looks off or doesn't respect atmosphere of the codebase you're looking at the remnent legacy code. A complete refactor will come later, at the moment the important thing was that I flick the whole thing in a way that it could stand on it's own feet. I agree that the repository is a mess right now.

**So what changed?**

Not taking technical mumbo jumbo into account. (maybe it's at least worth mentioning that we don't use [discord.js](https://discord.js.org/) anymore?)

- First of all, all of the current server configurations were wiped (not intentionally)
- Fix configuration disappearing into oblivion (irrelevant to above)
- Better command logs
- Slowmode command (durations such `2h30m`, `1h` are accepted)
- Help command that lists all the commands that are available to the command user
- There has been a prune of servers; the bot has left servers where most of it's memberbase consisted of bots

Questions? suggestions? you can join my [discord server](https://discord.gg/2qrr8vpYAm) and approach me for them.
