const { ytdl } = require('api-dylux');

async function testDylux() {
    const url = "https://www.youtube.com/watch?v=jNQXAC9IVRw";
    console.log("Baixando:", url);
    try {
        const res = await ytdl(url);
        console.log("Resultado:");
        console.log("Video:", res.videoUrl);
        console.log("Audio:", res.audioUrl);
    } catch(e) {
        console.error("Erro dylux:", e.message);
    }
}
testDylux();
