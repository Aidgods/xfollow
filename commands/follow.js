const { SlashCommandBuilder } = require('@discordjs/builders');
const { Authflow } = require('prismarine-auth');
const axios = require('axios');
const fs = require('fs');
const { EmbedBuilder } = require('discord.js');
const { ProxyAgent } = require('proxy-agent');
const usernames = ['test1', 'test2','test3', 'test4', 'test5', 'test6', 'test7', 'test8','test9','test10', 'test11', 'test12', 'test13', 'test14', 'test15', 'test16'];

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('follow')
        .setDescription('Adds a friend to Xbox accounts')
        .addStringOption(option => 
            option.setName('gamertag')
                .setDescription('The gamertag of the friend to be added')
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
                    const cooldownAmount = this.cooldown * 1000;
                
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
                        let flow = new Authflow(userIdentifier, cacheDir);
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
                        await interaction.reply("You need to redeem a key first.");
                        return;
                    }
            
                    Promise.all(authFlowInstances.map(flow => 
                        flow.getXboxToken('http://xboxlive.com')
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
                            const proxyAgent = new ProxyAgent(getRandomProxy());
                            const xbl = tokens[i];
                            const profileUrl = `https://profile.xboxlive.com/users/gt(${gamertag})/profile/settings?settings=Gamertag`;
                            const { data, status } = await axios.get(profileUrl, {
                                headers: {
                                    'Authorization': `XBL3.0 x=${xbl.userHash};${xbl.XSTSToken}`,
                                    'x-xbl-contract-version': '2'
                                },
                                httpsAgent: proxyAgent
                            });
            
                            const xuid = data.profileUsers[0].id;
                            const response1 = await axios.put(`https://social.xboxlive.com/users/me/people/xuid(${xuid})`, {}, {
                                headers: {
                                    'authorization': `XBL3.0 x=${xbl.userHash};${xbl.XSTSToken}`,
                                },
                                httpsAgent: proxyAgent
                            });
                        }
            
                        // Create the embed after the loop
                        const embed = new EmbedBuilder()
                        .setColor(0x0099FF)
                        .setTitle('Friend Added')
                        .setDescription(`Number of Usernames: ${usernames.length}\nGamertag: ${gamertag}`)
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