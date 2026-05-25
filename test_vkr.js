const axios = require('axios');

async function testVkr() {
    try {
        const url = "https://www.youtube.com/watch?v=jNQXAC9IVRw";
        const res = await axios.get(`https://vkrdownloader.vercel.app/server?vkr=${url}`);
        console.log("VKR Data:", res.data);
    } catch(e) {
        console.error("Erro VKR:", e.message);
    }
}
testVkr();
