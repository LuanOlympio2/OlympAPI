const youtubedl = require('youtube-dl-exec');

/**
 * Extrai o link direto de mídias usando yt-dlp via youtube-dl-exec
 * @param {string} url - URL do vídeo/música
 * @param {boolean} isAudio - Se deve extrair apenas áudio
 * @returns {Promise<string>} - Retorna a URL direta
 */
async function extractDirectLink(url, isAudio = false) {
    try {
        const formatInfo = isAudio ? 'bestaudio[ext=m4a]/bestaudio/best' : 'best[ext=mp4]/bestvideo[height<=720]+bestaudio/best[height<=720]';

        const output = await youtubedl(url, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            format: formatInfo,
        });

        // O youtube-dl-exec retorna um JSON enorme. 
        // A chave `url` direta é disponibilizada caso o formato seja único e mesclado.
        if (output.url) {
            return output.url;
        }

        // Se a url raiz não estiver presente, buscamos nos formatos retornados
        if (output.formats && output.formats.length > 0) {
            // Se for áudio, pegamos o melhor formato de áudio (m4a preferencialmente)
            if (isAudio) {
                const audioFormat = output.formats.reverse().find(f => f.vcodec === 'none' && f.acodec !== 'none');
                if (audioFormat && audioFormat.url) return audioFormat.url;
            } else {
                // Se for vídeo, pegamos o formato com vídeo e áudio juntos (mp4)
                const videoFormat = output.formats.reverse().find(f => f.vcodec !== 'none' && f.acodec !== 'none' && f.ext === 'mp4');
                if (videoFormat && videoFormat.url) return videoFormat.url;
            }
            
            // Fallback para o último formato disponível
            const fallback = output.formats[output.formats.length - 1];
            if (fallback && fallback.url) return fallback.url;
        }

        throw new Error("Não foi possível extrair a URL direta.");
    } catch (error) {
        console.error("Erro no youtube-dl-exec:", error.message);
        throw new Error(error.message || "Erro na extração do link direto");
    }
}

module.exports = { extractDirectLink };
