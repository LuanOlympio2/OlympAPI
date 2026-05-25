const express = require('express');
const router = express.Router();
const { verifyApiKey } = require('../middleware/authMiddleware');
const ytdl = require('@distube/ytdl-core');

// Todas as rotas protegidas pela API Key
router.use(verifyApiKey);

/**
 * POST /download
 * Body: { url: "...", type: "video" | "audio" }
 */
router.post('/', async (req, res) => {
    try {
        const { url, type } = req.body;

        if (!url) {
            return res.status(400).json({ success: false, error: "URL é obrigatória" });
        }

        const isAudio = type === 'audio';

        console.log(`[YTDL-Core] Extraindo ${isAudio ? 'áudio' : 'vídeo'} de: ${url}`);
        
        // Faz o request da info com um User-Agent limpo para enganar detecções simples
        const info = await ytdl.getInfo(url, {
            requestOptions: {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
                }
            }
        });

        let format;
        if (isAudio) {
            // Pegar o melhor formato de áudio nativo (m4a, webm) sem precisar de FFmpeg
            format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' });
        } else {
            // Pegar um formato que já tenha vídeo E áudio embutido (720p no máximo geralmente)
            format = ytdl.chooseFormat(info.formats, { quality: 'highest', filter: 'videoandaudio' });
        }

        if (format && format.url) {
            return res.json({
                success: true,
                url: format.url,
                title: info.videoDetails?.title || 'Video',
                type: isAudio ? 'audio' : 'video'
            });
        }

        throw new Error("Não foi possível extrair um formato nativo da mídia.");

    } catch (error) {
        console.error("[Download Route Error]", error.message);
        
        // Verifica se deu 429 mesmo dentro do Railway
        let errorMsg = error.message;
        if (errorMsg.includes('429')) {
            errorMsg = "Servidor do YouTube rejeitou a conexão por limite de tráfego. (429)";
        }

        return res.status(500).json({
            success: false,
            error: errorMsg
        });
    }
});

module.exports = router;
