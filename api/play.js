const axios = require('axios');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'Falta URL' });

    try {
        const response = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 5000
        });

        const responseStr = response.data;
        
        // REGEX EXATA DO SEU APP:
        // Captura o link completo incluindo o v-acctoken
        const regex = /(https?:\/\/[^\s'"]+1080p\.mp4\/?\?v-acctoken=[^\s'"]+)/i;
        const match = responseStr.match(regex);

        if (match) {
            // Retorna o primeiro link encontrado (limpo)
            return res.json({ 
                link: match[0].trim(),
                sucesso: true 
            });
        } else {
            // Tenta uma busca mais genérica caso o 1080p não exista
            const regexGeneric = /(https?:\/\/[^\s'"]+\.mp4\/?\?v-acctoken=[^\s'"]+)/i;
            const matchGeneric = responseStr.match(regexGeneric);
            
            if (matchGeneric) {
                return res.json({ link: matchGeneric[0].trim(), sucesso: true });
            }
        }

        res.status(404).json({ error: 'Nenhum link mp4 com token encontrado.' });

    } catch (error) {
        res.status(500).json({ error: 'Erro ao processar WhoresHub: ' + error.message });
    }
};
