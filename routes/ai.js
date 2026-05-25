const express = require('express');
const router = express.Router();
const { verifyApiKey } = require('../middleware/authMiddleware');
const { askGemini, askGroq } = require('../services/aiService');

router.use(verifyApiKey);

router.post('/chat', async (req, res) => {
    try {
        const { provider, prompt, systemPrompt, model } = req.body;

        if (!prompt) {
            return res.status(400).json({ success: false, error: "O prompt (mensagem) é obrigatório." });
        }

        let responseText = "";

        if (provider === 'gemini') {
            responseText = await askGemini(prompt, systemPrompt, process.env.GEMINI_API_KEY);
        } else if (provider === 'groq') {
            responseText = await askGroq(prompt, systemPrompt, model || "llama3-8b-8192", process.env.GROQ_API_KEY);
        } else {
            return res.status(400).json({ success: false, error: "Provider não suportado ou não especificado. Use 'gemini' ou 'groq'." });
        }

        return res.json({
            success: true,
            response: responseText,
            provider: provider
        });

    } catch (error) {
        console.error("[AI Route Error]", error.message);
        return res.status(500).json({
            success: false,
            error: error.message || "Falha ao processar a requisição de IA."
        });
    }
});

module.exports = router;
