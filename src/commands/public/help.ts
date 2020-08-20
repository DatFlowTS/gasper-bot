import { Command, PrefixSupplier } from 'discord-akairo';
import { Message, MessageEmbed } from 'discord.js';
import { stripIndents } from 'common-tags';

export default class HelpCommand extends Command {
    public constructor() {
        super('help', {
            aliases: ['help', 'commands', 'cmdlist'],
            description: {
                content: 'Displays a list of available command, or detailed information for a specific command.',
                usage: '[command]'
            },
            category: 'Public',
            clientPermissions: ['EMBED_LINKS'],
            ratelimit: 2,
            args: [
                {
                    id: 'command',
                    type: 'commandAlias'
                }
            ]
        });
    }

    public async exec(message: Message, { command }: { command: Command }): Promise<Message | Message[]> {
        const prefix = await (this.handler.prefix as PrefixSupplier)(message);
        if (!command) {
            const embed = new MessageEmbed()
                //@ts-ignore
                .setColor(Math.floor(Math.random() * 12777214) + 1)
                .addField('⇒ Commands', stripIndents`A list of available commands.
                    For additional info on a command, type \`${prefix}help <command>\`
                `);

            for (const category of this.handler.categories.values()) {
                embed.addField(`⇒ ${category.id.replace(/(\b\w)/gi, (lc): string => lc.toUpperCase())}`, `${category.filter((cmd): boolean => cmd.aliases.length > 0).map((cmd): string => `\`${cmd.aliases[0]}\``).join(' ')}`);
            }

            return message.util!.send(embed);
        }

        const embed = new MessageEmbed()
            .setColor([155, 200, 200])
            .setTitle(`\`${command.aliases[0]} ${command.description.usage ? command.description.usage : ''}\``)
            .addField('⇒ Description', `${command.description.content ? command.description.content : ''} ${command.description.ownerOnly ? '\n**[Bot-Owner Only]**' : ''}`);

        if (command.aliases.length > 1) embed.addField('⇒ Aliases', `\`${command.aliases.join('` `')}\``, true);
        if (command.description.examples && command.description.examples.length) embed.addField('⇒ Examples', `\`${command.aliases[0]} ${command.description.examples.join(`\`\n\`${command.aliases[0]} `)}\``, true);

        return message.util!.send(embed);
    }
}