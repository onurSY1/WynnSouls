const express = require('express');
const axios = require('axios');

const app = express();

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

const apiLatencySeconds = 75; // Set the API latency to 1 minute and 15 seconds

app.get('/', async (req, res) => {
  const worldsData = await getWorlds();

  if (!worldsData) {
    return res.status(500).send('Error fetching data');
  }

  const nowUnixTime = Math.floor(Date.now() / 1000); // Convert current timestamp to Unix time (in seconds)
  const worlds = [];

  // Extract the worlds and their firstSeen timestamps from the provided data
  for (const [worldName, worldInfo] of Object.entries(worldsData)) {
    const { firstSeen } = worldInfo;
    const timeDifference = Math.abs(nowUnixTime - Math.floor(firstSeen / 1000));
    const excessTime = getExcessTime(timeDifference) - apiLatencySeconds; // Adjust for the API latency

    worlds.push({
      name: worldName,
      excessTime,
    });
  }

  // Sort the worlds based on excessTime from closest to farthest
  worlds.sort((a, b) => a.excessTime - b.excessTime);

  // Generate plain text response with the closest 10 worlds and their excess time
  let responseText = 'Closest Worlds:\n\n';
  worlds.forEach(world => {
    const timeFormatted = formatTime(world.excessTime);
    responseText += `${world.name}: ${timeFormatted}\n`;
  });

  res.set('Content-Type', 'text/plain');
  res.send(responseText);
});

const PORT = 3001; // Change this to the desired port number
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
