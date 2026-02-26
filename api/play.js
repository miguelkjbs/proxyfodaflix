const axios = require('axios');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'Falta URL' });

    try {
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36' }
        });

        const html = response.data.replace(/\\/g, '');
        const regex = /https?[:]\/\/[^"']+\.m3u8[^"']*/;
        const match = html.match(regex);

        if (match) {
            return res.json({ link: match[0] });
        } else {
            return res.status(404).json({ error: 'm3u8 não achado' });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Erro no Eporner' });
    }
};
