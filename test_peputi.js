const axios = require('axios');

async function testPeputi() {
    try {
        const payload = {
            url: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
            isAudioOnly: true,
            vCodec: "h264",
            vQuality: "720",
            aFormat: "mp3",
            filenamePattern: "classic",
            isNoHidden: true
        };

        const response = await axios.post('https://cobalt.peputi.com.ar/api/json', payload, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0'
            },
            timeout: 10000
        });

        console.log("Sucesso Peputi:", response.data);
    } catch (e) {
        console.error("Falha Peputi:", e.response?.data || e.message);
    }
}

testPeputi();
