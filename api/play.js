const axios = require('axios');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

    let { url } = req.query;
    if (!url) return res.status(400).json({ error: 'Falta URL' });

    try {
        // 1. CONVERSÃO AUTOMÁTICA: Se for link normal, vira embed
        // Ex: /video-NI5Ue1NkMEY/ -> /embed/NI5Ue1NkMEY
        if (url.includes('/video-')) {
            const idMatch = url.match(/video-([a-zA-Z0-9]+)/);
            if (idMatch) {
                url = `https://www.eporner.com/embed/${idMatch[1]}`;
            }
        }

        const response = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const html = response.data.replace(/\\/g, ''); // Limpa as barras invertidas

        // 2. BUSCA DO M3U8 (No embed ele costuma estar no flashvars ou num script de config)
        const regexM3u8 = /https?[:][^"']+\.m3u8[^"']*/i;
        const match = html.match(regexM3u8);

        if (match) {
            let urlCapturada = match[0];

            // 3. SUA LÓGICA DE QUALIDADE (Ajustando para o seu padrão do App)
            if (urlCapturada.includes("/hls/")) {
                const hlsPos = urlCapturada.indexOf("/hls/");
                const baseUrl = urlCapturada.substring(0, hlsPos + 5);
                const rest = urlCapturada.substring(baseUrl.length);
                const videoId = rest.split("-")[0].split(",")[0].split("/")[0];
                const params = urlCapturada.includes("?") ? urlCapturada.substring(urlCapturada.indexOf("?")) : "";
                
                // Forçamos a qualidade alta
                const qualidade = urlCapturada.includes("1440p") ? "1440p" : "1080p";
                const linkFinal = `${baseUrl}${videoId}-${qualidade}.mp4/index-v1-a1.m3u8${params}`;

                return res.json({ link: linkFinal, sucesso: true, extraidoDe: "embed" });
            }
            
            return res.json({ link: urlCapturada, sucesso: true });
        }

        res.status(404).json({ error: 'Link m3u8 não encontrado no embed.' });

    } catch (error) {
        res.status(500).json({ error: 'Erro ao acessar o embed' });
    }
};
