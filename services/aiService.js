const axios = require('axios');

async function askGemini(prompt, systemPrompt = "", apiKey) {
    if (!apiKey) throw new Error("Gemini API Key não configurada no servidor.");
    
    // Usando gemini-1.5-flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    
    let contents = [];
    if (systemPrompt) {
        contents.push({ role: "user", parts: [{ text: `SYSTEM INSTRUCTION: ${systemPrompt}` }] });
        contents.push({ role: "model", parts: [{ text: "Entendido. Seguirei a instrução." }] });
    }
    contents.push({ role: "user", parts: [{ text: prompt }] });

    const payload = {
        contents: contents,
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
        }
    };

    try {
        const response = await axios.post(url, payload, {
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.data && response.data.candidates && response.data.candidates[0]) {
            return response.data.candidates[0].content.parts[0].text;
        }
        throw new Error("Resposta inválida do Gemini.");
    } catch (error) {
        console.error("Erro Gemini:", error.response?.data || error.message);
        throw new Error("Falha ao comunicar com Gemini API.");
    }
}

async function askGroq(prompt, systemPrompt = "", model = "llama3-8b-8192", apiKey) {
    if (!apiKey) throw new Error("Groq API Key não configurada no servidor.");

    const url = "https://api.groq.com/openai/v1/chat/completions";
    
    const messages = [];
    if (systemPrompt) {
        messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const payload = {
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 2048
    };

    try {
        const response = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.data && response.data.choices && response.data.choices[0]) {
            return response.data.choices[0].message.content;
        }
        throw new Error("Resposta inválida do Groq.");
    } catch (error) {
        console.error("Erro Groq:", error.response?.data || error.message);
        throw new Error("Falha ao comunicar com Groq API.");
    }
}

module.exports = {
    askGemini,
    askGroq
};
