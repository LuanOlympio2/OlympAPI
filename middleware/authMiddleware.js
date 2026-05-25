require('dotenv').config();

function verifyApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'] || req.query.api_key;

    if (!apiKey) {
        return res.status(401).json({ success: false, error: "API Key não fornecida." });
    }

    if (apiKey !== process.env.API_KEY) {
        return res.status(403).json({ success: false, error: "API Key inválida." });
    }

    // Se a chave for válida, continua para a rota
    next();
}

module.exports = { verifyApiKey };
