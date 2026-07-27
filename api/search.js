import axios from 'axios';

const API_BASE_URL = process.env.SCRIPT_API_URL || 'https://scriptblox.com/api/script/search';

export default async function handler(req, res) {
  const query = (req.query.q || '').toString().trim();

  if (!query) {
    res.status(400).json({ error: 'query kosong' });
    return;
  }

  const results = [];
  let page = 1;

  while (true) {
    try {
      const response = await axios.get(API_BASE_URL, {
        params: {
          q: query,
          page: page,
          max: 20
        },
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        }
      });

      const scripts = response.data.result?.scripts;
      if (!scripts || scripts.length === 0) break;

      for (const script of scripts) {
        results.push({
          title: script.title,
          script: script.script
        });
      }

      page++;

      if (scripts.length < 20) break;
    } catch (error) {
      if (results.length === 0) {
        res.status(502).json({ error: error.message });
        return;
      }
      break;
    }
  }

  res.status(200).json({ result: { scripts: results } });
}
