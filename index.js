const axios = require('axios');
const { WebhookClient } = require('discord.js');
const moment = require('moment');

const webhookClient = new WebhookClient({ id: "1130070823835807785" , token: "NHLU_LlO2_NvsJFkNNRJKrJPo9fyAEBNIf0h9IGuFGxgVN1kn-KmcFrOkd_T0gOO-kyL" });

async function getWorlds(callback) {
  try {
    let response = await axios.get('https://athena.wynntils.com/cache/get/serverList');
    return response.data.servers;
  } catch (error) {
    console.error('Error fetching data:', error.message);
    return null;
  }
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes} mins ${remainingSeconds} seconds`;
}

function getExcessTime(seconds) {
  const remainder = seconds % (20 * 60); // Find the remainder when dividing by 20 minutes (in seconds)
  return 20 * 60 - remainder; // Subtract the remainder from 20 minutes to get the excess time (in seconds)
}

async function updateWorldsData() {
  const worldsData = await getWorlds();

  if (!worldsData) {
    console.error('Error fetching data');
    return;
  }

  const nowUnixTime = Math.floor(Date.now() / 1000);
  const worlds = [];

  // Extract the worlds and their firstSeen timestamps from the provided data
  for (const [worldName, worldInfo] of Object.entries(worldsData)) {
    const { firstSeen } = worldInfo;
    const timeDifference = Math.abs(nowUnixTime - Math.floor(firstSeen / 1000));
    const excessTime = getExcessTime(timeDifference);

    worlds.push({
      name: worldName,
      excessTime,
    });
  }

  // Sort the worlds based on excessTime from closest to farthest
  worlds.sort((a, b) => a.excessTime - b.excessTime);

  let message = 'Closest Worlds:\n\n';

  worlds.slice(0, 20).forEach(world => {
    const timeFormatted = formatTime(world.excessTime);
    message += `${world.name}: ${timeFormatted}\n`;
  });

  const timestamp = moment().unix(); // Get the current timestamp in Unix time
  message += `\n\nUpdated <t:${timestamp}:R> ago\n`; // Add the timestamp to the message content using the <t:{timestamp}> format

  webhookClient.editMessage('1130077104655048784', {
    content: message,
    username: "Wynnsouls",
  });
}

// Fetch data initially when the script starts
updateWorldsData();

// Set interval to refresh data every 2 seconds (you can change this to your desired interval)
const refreshIntervalSeconds = 2;
setInterval(updateWorldsData, refreshIntervalSeconds * 1000);
