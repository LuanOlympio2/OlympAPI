const express = require('express');
const router = express.Router();
const { verifyApiKey } = require('../middleware/authMiddleware');
const { yta, ytv } = require('api-dylux');

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
        
        console.log(`[Dylux API] Extraindo ${isAudio ? 'áudio' : 'vídeo'} de: ${url}`);
        
        let result;
        if (isAudio) {
            result = await yta(url);
        } else {
            result = await ytv(url);
        }

        if (result && result.dl_url) {
            return res.json({
                success: true,
                url: result.dl_url,
                title: result.title || 'Mídia',
                type: isAudio ? 'audio' : 'video'
            });
        }

        throw new Error("Não foi possível obter a URL direta através da API proxy Dylux.");

    } catch (error) {
        console.error("[Download Route Error]", error.message);
        
        return res.status(500).json({
            success: false,
            error: error.message || "Falha ao processar a extração."
        });
    }
});

module.exports = router;
