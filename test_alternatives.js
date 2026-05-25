const axios = require('axios');

async function testAlternatives() {
    const url = "https://www.youtube.com/watch?v=jNQXAC9IVRw";
    
    console.log("Testando AEMT...");
    try {
        const res1 = await axios.get(`https://aemt.me/youtube?url=${url}`, { timeout: 10000 });
        console.log("AEMT:", res1.data);
    } catch(e) { console.log("AEMT error"); }

    console.log("\nTestando API do Dark (aemt/ryzend)...");
    try {
        const res2 = await axios.get(`https://api.ryzendesu.vip/api/downloader/ytmp4?url=${url}`, { timeout: 10000 });
        console.log("Ryzend:", res2.data);
    } catch(e) { console.log("Ryzend error"); }
}

testAlternatives();
