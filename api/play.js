const axios = require('axios');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'Falta URL' });

    try {
        const response = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });

        const html = response.data;

        // 1. O Eporner esconde o link em um JSON dentro de uma tag <script>
        // Vamos buscar qualquer link m3u8, mesmo que esteja codificado
        const regexLinks = /https?[:][^"']+\.m3u8[^"']*/gi;
        let matches = html.match(regexLinks) || [];
        
        // Limpa as barras invertidas de todos os links encontrados
        let linksLimpos = matches.map(l => l.replace(/\\/g, ''));

        // 2. Filtra pelo link que contém 'cdn.eporner.com' (conforme seu App)
        let linkFinal = linksLimpos.find(l => l.includes('cdn.eporner.com'));

        if (linkFinal) {
            // 3. Aplica sua lógica de montagem do App Java
            try {
                if (linkFinal.includes("/hls/")) {
                    const baseUrl = linkFinal.substring(0, linkFinal.lastIndexOf("/hls/") + 5);
                    const rest = linkFinal.substring(baseUrl.length);
                    const videoId = rest.split("-")[0].split(",")[0].split("/")[0];
                    const params = linkFinal.includes("?") ? linkFinal.substring(linkFinal.indexOf("?")) : "";
                    const qualidadeAlvo = linkFinal.includes("1440p") ? "1440p" : "1080p";

                    const cleanUrl = baseUrl + videoId + "-" + qualidadeAlvo + ".mp4/index-v1-a1.m3u8" + params;
                    return res.json({ link: cleanUrl, sucesso: true });
                }
            } catch (e) {
                return res.json({ link: linkFinal, sucesso: true });
            }
        }

        // Se não achou m3u8, vamos tentar buscar o ID do vídeo para reconstruir (Plano B)
        const idMatch = html.match(/vid\s*:\s*["']([^"']+)["']/);
        if (idMatch) {
             return res.json({ error: "Link protegido. Tente outro vídeo.", id: idMatch[1] });
        }

        res.status(404).json({ error: 'Não foi possível extrair o link deste vídeo.' });

    } catch (error) {
        res.status(500).json({ error: 'Erro de conexão' });
    }
};
