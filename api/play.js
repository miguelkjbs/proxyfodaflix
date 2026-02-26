const axios = require('axios');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'Falta URL' });

    try {
        const response = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36' 
            }
        });

        // 1. Pega o HTML e limpa as barras invertidas (Igual o App faz internamente)
        const htmlLimpo = response.data.replace(/\\/g, '');

        // 2. Procura por links que contenham cdn.eporner.com e .m3u8 (Igual seu if no Java)
        // Buscamos o master.m3u8 ou .urlset conforme seu código
        const regexCapturador = /https?:\/\/cdn\.eporner\.com\/[^"']+\.m3u8[^"']*/i;
        const match = htmlLimpo.match(regexCapturador);

        if (match) {
            let urlCapturada = match[0];

            // 3. LOGICA DO SEU APP (Substring e Split)
            try {
                if (urlCapturada.includes("/hls/")) {
                    // Pega a base até /hls/
                    const baseUrl = urlCapturada.substring(0, urlCapturada.lastIndexOf("/hls/") + 5);
                    
                    // Extrai o ID
                    const rest = urlCapturada.substring(baseUrl.length);
                    const videoId = rest.split("-")[0].split(",")[0].split("/")[0];
                    
                    // Pega os parâmetros (?hash=...)
                    const params = urlCapturada.includes("?") ? urlCapturada.substring(urlCapturada.indexOf("?")) : "";
                    
                    // Define a qualidade (Prioridade 1440p)
                    const qualidadeAlvo = urlCapturada.includes("1440p") ? "1440p" : "1080p";
                    
                    // Monta a URL Final idêntica ao seu cleanUrl do Java
                    const cleanUrl = baseUrl + videoId + "-" + qualidadeAlvo + ".mp4/index-v1-a1.m3u8" + params;

                    return res.json({ 
                        link: cleanUrl,
                        qualidade: qualidadeAlvo,
                        sucesso: true 
                    });
                }
            } catch (e) {
                // Se o split falhar, retorna a url capturada original
                return res.json({ link: urlCapturada, sucesso: true });
            }
        }

        res.status(404).json({ error: 'CDN m3u8 não encontrado no HTML' });

    } catch (error) {
        res.status(500).json({ error: 'Erro ao acessar o Eporner' });
    }
};
