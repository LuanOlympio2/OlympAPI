const axios = require('axios');

/**
 * Faz requisição para a API do Cobalt para baixar mídias
 * @param {string} url - A URL do vídeo/música
 * @param {boolean} isAudio - Se deve baixar apenas áudio (mp3/m4a)
 * @returns {Promise<string>} - Retorna a URL direta do arquivo de download
 */
async function downloadCobalt(url, isAudio = false) {
    try {
        const payload = {
            url: url,
            isAudioOnly: isAudio,
            vCodec: "h264",
            vQuality: "720", // Pode alterar conforme necessidade
            aFormat: isAudio ? "mp3" : "best", // cobalt aceita "best", "mp3", "ogg", "wav", "opus"
            filenamePattern: "classic",
            isNoHidden: true
        };

        // Usando uma instância pública comunitária do Cobalt, já que a principal desativou a API
        const response = await axios.post('https://cobalt.peputi.com.ar/api/json', payload, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 30000 // 30 segundos
        });

        // O cobalt retorna status: 'redirect', 'stream', 'picker' (para playlists), ou 'error'
        if (response.data && response.data.status === 'error') {
            throw new Error(response.data.text || "Erro desconhecido na API do Cobalt");
        }

        if (response.data && (response.data.status === 'redirect' || response.data.status === 'stream')) {
            return response.data.url;
        }
        
        throw new Error("Resposta não reconhecida ou formato não suportado (ex: playlist Picker).");

    } catch (error) {
        if (error.response && error.response.data) {
            throw new Error(error.response.data.text || `Erro Cobalt: ${error.response.status}`);
        }
        throw error;
    }
}

module.exports = { downloadCobalt };
