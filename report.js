const { SlashCommandBuilder } = require('@discordjs/builders');
const { Authflow, Titles } = require('prismarine-auth');
const axios = require('axios');
const fs = require('fs');
const { EmbedBuilder } = require('discord.js');
const { ProxyAgent } = require('proxy-agent');
const usernames = ['test1', 'test2', 'test3', 'test4', 'test5', 'test6', 'test7', 'test8', 'test9', 'test10', 'test11', 'test12', 'test13', 'test14', 'test15', 'test16', 'test17', 'test18', 'test19', 'test20', 'test21', 'test22', 'test23', 'test24', 'test25', 'test26', 'test27', 'test28', 'test29', 'test30', 'test31'];

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('report')
        .setDescription('reports Xbox account')
        .addStringOption(option =>
            option.setName('gamertag')
                .setDescription('The gamertag of the account you want to be reported ')
                .setRequired(true)),

    async execute(interaction) {
        if (!interaction.client || !interaction.client.cooldowns) {
            console.error('Client or client cooldowns are undefined');
            return;
        }

        const { cooldowns } = interaction.client;

        if (!cooldowns.has(this.data.name)) {
            cooldowns.set(this.data.name, new Map());
        }

        const now = Date.now();
        const timestamps = cooldowns.get(this.data.name);
        const cooldownAmount = this.cooldown * 3000;

        if (timestamps.has(interaction.user.id)) {
            const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return interaction.reply(`Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${this.data.name}\` command.`);
            }
        }

        timestamps.set(interaction.user.id, now);
        setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
        let authFlowInstances = [];

        for (let i = 0; i < usernames.length; i++) {
            let userIdentifier = usernames[i];
            let cacheDir = `./accounts/${userIdentifier}`; // Specify a unique cache directory for each user
            let flow = new Authflow(userIdentifier, cacheDir, {
                authTitle: Titles.MinecraftNintendoSwitch,
                deviceType: 'Nintendo',
                flow: 'live'
            });
            authFlowInstances.push(flow);
        }

        const gamertag = interaction.options.getString('gamertag');
        const userId = interaction.user.id; // Define userId

        // Default reply

        // Read the redeemdb.json file
        let rawdata = fs.readFileSync('redeemdb.json');
        let redeemDB = rawdata ? JSON.parse(rawdata) : { keys: [] };

        // Check if the user has redeemed a key
        const hasRedeemedKey = redeemDB.keys.some(keyData => keyData.userId === userId);

        if (hasRedeemedKey) {
            console.log(`User ${userId} has redeemed a key.`);
        } else {
            console.log(`User ${userId} has not redeemed a key.`);
            await interaction.reply("You need to redeem a key first. https://gamerscore.mysellix.io/");
            return;
        }

        Promise.all(authFlowInstances.map(flow =>
            flow.getXboxToken()
                .catch(error => {
                    console.error(error);
                    // Handle the error appropriately here
                    // For example, you might want to remove the problematic account from the array
                    // Or you might want to notify the user about the issue
                })
        ))
            .then(async (tokens) => {
                // Defer the reply
                await interaction.deferReply();
                function getRandomProxy() {
                    let index = Math.floor(Math.random() * proxies.length);
                    return proxies[index];
                }
                // Perform the asynchronous operations
                for (let i = 0; i < tokens.length; i++) {

                    const xbl = tokens[i];
                    const profileUrl = `https://profile.xboxlive.com/users/gt(${gamertag})/profile/settings?settings=Gamertag`;
                    const { data, status } = await axios.get(profileUrl, {
                        headers: {
                            'Authorization': `XBL3.0 x=${xbl.userHash};${xbl.XSTSToken}`,
                            'x-xbl-contract-version': '2'
                        },
                    });

                    const xuid = data.profileUsers[0].id;
                    const textReasons = [
                        "they bullied my brother",
                        "threatened to kill me",
                        "harassed me online",
                        "spread false information about me",
                        "made fun of my appearance",
                        "physically attacked me", // Physical Bullying [0]
                        "verbally taunted me", // Verbal Bullying [0]
                        "destroyed my reputation", // Social Bullying [0]
                        "name-called me online", // Name-calling [1]
                        // Add more reasons as needed
                        "excluded me from social activities", // Exclusion [2]
                        "shared explicit content about me without consent", // Non-consensual Sharing [3]
                        "created fake accounts to harass me", // Fake Account Harassment [4]
                        "spread rumors about me to cause harm", // Rumor Spreading [5]
                        "forced me to participate in harmful activities", // Coercion [6]
                        "used my personal information for harmful purposes", // Misuse of Personal Information [7]
                        "created a hostile environment for me", // Hostile Environment [8]
                        "stalked me online", // Stalking [9]
                        "discriminated against me based on my race, religion, or sexual orientation", // Discrimination [10]
                        "made me feel unwelcome or uncomfortable in my own space", // Unwelcome or Uncomfortable Space [11]
                        "called me the nword on fortnite"
                    ];
                    
                    // Select a random reason from the array
                    const randomIndex = Math.floor(Math.random() * textReasons.length);
                    const randomReason = textReasons[randomIndex];
                    const payload = {
                        "evidenceId": xuid,
                        "feedbackContext": "",
                        "feedbackType": "FairPlayCheater",
                        "textReason": randomReason,
                        "CLUB_CHAT_CONTENT_TYPE": "Chat",
                        "CLUB_COMMENT_CONTENT_TYPE": "Comment",
                        "CLUB_FEED_CONTENT_TYPE": "ActivityFeedItem"
                    };
                    
                    // Define an array of possible text reasons

                    const response1 = await axios.post(`https://reputation.xboxlive.com/users/xuid(${xuid})/feedback`, payload, {
                        headers: {
                            'authorization': `XBL3.0 x=${xbl.userHash};${xbl.XSTSToken}`,
                            'User-Agent': 'okhttp/3.12.1',
                            'X-UserAgent': 'Android/191121000 SM-A715F.AndroidPhone',
                            'x-xbl-contract-version': '101'
                        },

                    });
                }


                // Create the embed after the loop
                const embed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle('Reported account')
                    .setDescription(`Number of Bots: ${usernames.length}\nGamertag: ${gamertag}`)
                    .setTimestamp();

                // Edit the deferred reply
                await interaction.editReply({ embeds: [embed] });
            })
            .catch((error) => {
                console.error(error);
                if (error.response && error.response.status === 404) {
                    interaction.reply('Invalid gamertag. Please check and try again.');
                } else {
                    interaction.reply('An error occurred while processing the command.');
                }
            });
    },
};