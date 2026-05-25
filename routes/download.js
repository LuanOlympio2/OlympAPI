const express = require('express');
const router = express.Router();
const { verifyApiKey } = require('../middleware/authMiddleware');
const { yta, ytv } = require('api-dylux');
const scraper = require('../services/scraperService');

router.use(verifyApiKey);

router.post('/', async (req, res) => {
    try {
        const { url, type } = req.body;

        if (!url) {
            return res.status(400).json({ success: false, error: "URL é obrigatória" });
        }

        const lowerUrl = url.toLowerCase();
        let result;

        if (lowerUrl.includes('tiktok.com')) {
            result = await scraper.scrapeTikTok(url);
        } else if (lowerUrl.includes('instagram.com')) {
            result = await scraper.scrapeInstagram(url);
        } else if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.watch')) {
            result = await scraper.scrapeFacebook(url);
        } else if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
            result = await scraper.scrapeTwitter(url);
        } else if (lowerUrl.includes('reddit.com')) {
            result = await scraper.scrapeReddit(url);
        } else if (lowerUrl.includes('kwai.com') || lowerUrl.includes('kuaishou.com')) {
            result = await scraper.scrapeKwai(url);
        } else {
            const isAudio = type === 'audio';
            const dlResult = isAudio ? await yta(url) : await ytv(url);
            if (dlResult && dlResult.dl_url) {
                result = {
                    success: true,
                    url: dlResult.dl_url,
                    title: dlResult.title || 'Mídia',
                    type: isAudio ? 'audio' : 'video'
                };
            }
        }

        if (result && result.success) {
            return res.json(result);
        }

        throw new Error("Não foi possível obter a URL direta.");

    } catch (error) {
        console.error("[Download Route Error]", error.message);
        return res.status(500).json({
            success: false,
            error: error.message || "Falha ao processar a extração."
        });
    }
});

module.exports = router;
