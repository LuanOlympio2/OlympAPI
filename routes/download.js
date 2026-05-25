const express = require('express');
const router = express.Router();
const { verifyApiKey } = require('../middleware/authMiddleware');
const { extractDirectLink } = require('../services/downloadService');

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

        console.log(`[Youtube-dl-exec] Extraindo ${isAudio ? 'áudio' : 'vídeo'} de: ${url}`);
        const directUrl = await extractDirectLink(url, isAudio);

        return res.json({
            success: true,
            url: directUrl,
            type: isAudio ? 'audio' : 'video'
        });

    } catch (error) {
        console.error("[Download Route Error]", error.message);
        return res.status(500).json({
            success: false,
            error: error.message || "Falha ao processar a extração."
        });
    }
});

module.exports = router;
