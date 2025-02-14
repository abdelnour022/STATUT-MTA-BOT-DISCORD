const Discord = require('discord.js');  // تأكد من استخدام Discord.js الصحيح
const GNMmta = require('gamedig');
const GNMconfig = require('./config.json');

// التأكد من أن النسخة الصحيحة من Intents تم الوصول إليها
const GNMbot = new Discord.Client({ 
    intents: [Discord.Intents.FLAGS.GUILDS]  // تأكد من أن Intents يتم الوصول إليها من Discord
});

const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { config } = require('process');

const commands = [
    new SlashCommandBuilder().setName('server').setDescription('mta server status'),
    new SlashCommandBuilder().setName('player').setDescription('player in game'),
]
    .map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(GNMconfig.token);

GNMbot.once('ready', () => {
    console.log(`Logged in as: ${GNMbot.user.tag}`);
    setInterval(() => {
        GNMmta.query({
            type: 'mtasa',
            host: GNMconfig.server_ip,
            port: GNMconfig.server_port
        }).then((state) => {
            GNMbot.user.setActivity(`Player : ${state.raw.numplayers}/${state.maxplayers}`);
        }).catch(err => {
            console.log(err);
        });
    }, 5000);

    // تسجيل الأوامر عند بدء البوت
    (async () => {
        try {
            await rest.put(
                Routes.applicationGuildCommands(GNMbot.user.id, GNMconfig.guildId),
                { body: commands },
            );

            console.log('Successfully registered application commands.');
        } catch (error) {
            console.error(error);
        }
    })();
});

// التعامل مع التفاعل مع البوت
GNMbot.on('interactionCreate', async GNMmsg => {
    if (!GNMmsg.isCommand()) return;

    const { commandName } = GNMmsg;

    if (commandName === 'server') {
        GNMmta.query({
            type: 'mtasa',
            host: GNMconfig.server_ip,
            port: GNMconfig.server_port
        }).then(async (state) => {
            console.log(state);

            // بناء الرد باستخدام Embed
            const GNMembed = new Discord.MessageEmbed()
                .setTitle(state.name)
                .setColor('BLUE')
                .addField('Map:', `- ${state.map}`, true)
                .addField('Gametype:', `- ${state.raw.gametype}`, true)
                .addField('Developer:', `- ${state.raw.Developer}`, true)
                .addField('Player:', `- ${state.raw.numplayers}/${state.maxplayers}`, true)
                .addField('Ping:', `- ${state.ping}ms`, true)
                .addField('IP:', `- ${state.connect}`, true)
                .setTimestamp()
                .setFooter(`Requested by ${GNMmsg.member.user.tag}`, GNMmsg.member.user.avatarURL());

            await GNMmsg.reply({ embeds: [GNMembed] });
        }).catch(err => {
            console.log(err);
        });
    }
});

// تسجيل الدخول باستخدام التوكن
GNMbot.login(GNMconfig.token);
