const play = require('play-dl');

async function testPlay() {
    try {
        const url = "https://www.youtube.com/watch?v=jNQXAC9IVRw";
        const info = await play.video_info(url);
        const format = play.choose_format(info.format, { quality: 2 });
        console.log("Audio URL:", format.url);
    } catch(e) {
        console.error("Erro:", e.message);
    }
}
testPlay();
