// keep-awake.js (for each service)
const fetch = require("node-fetch");

async function pingService(url) {
  try {
    const response = await fetch(url);
    console.log(`${url} pinged at ${new Date().toISOString()}`);
  } catch (error) {
    console.error(`Failed to ping ${url}:`, error.message);
  }
}

// Ping every 14 minutes (Render sleeps after 15 min)
setInterval(() => {
  pingService("https://snowguard-api-gateway.onrender.com/actuator/health");
  pingService("https://snowguard-user-service.onrender.com/actuator/health");
  pingService("https://snowguard-hazard-service.onrender.com/actuator/health");
  pingService("https://snowguard-ai-service.onrender.com/health");
}, 14 * 60 * 1000);
