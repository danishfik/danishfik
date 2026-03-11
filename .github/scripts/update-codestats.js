const https = require('https');
const fs = require('fs');

const USERNAME = 'danishfik';

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Accept': 'application/json' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

const MEDALS = ['🥇', '🥈', '🥉'];
const COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

function xpToLevel(xp) {
  return Math.floor(0.025 * Math.sqrt(xp));
}

function progressBar(xp, total, length = 10) {
  const pct = Math.min(xp / total, 1);
  const filled = Math.round(pct * length);
  return '█'.repeat(filled) + '░'.repeat(length - filled);
}

(async () => {
  const data = await fetch(`https://codestats.net/api/users/${USERNAME}`);
  const langs = data.languages;

  const ranked = Object.entries(langs)
    .map(([name, info]) => ({ name, xp: info.xps, level: xpToLevel(info.xps) }))
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 10);

  const maxXp = ranked[0].xp;

  const rows = ranked.map((lang, i) => {
    const medal = MEDALS[i] ?? `**#${i + 1}**`;
    const bar = progressBar(lang.xp, maxXp, 12);
    const xpStr = lang.xp.toLocaleString();
    return `| ${medal} | \`${lang.name}\` | Lvl **${lang.level}** | \`${bar}\` | ${xpStr} XP |`;
  });

  const totalXp = data.total_xp.toLocaleString();
  const userLevel = xpToLevel(data.total_xp);

  const section = `<!-- CODESTATS:START -->
## 📊 Code::Stats — [@${USERNAME}](https://codestats.net/users/${USERNAME})

> 🏆 Level **${userLevel}** · Total XP: **${totalXp}** · Updated automatically every 6h

| Rank | Language | Level | Progress | XP |
|------|----------|-------|----------|----|
${rows.join('\n')}

<p align="center">
  <img src="https://codestats-readme.wegfan.cn/language-percentage/${USERNAME}?max_languages=8&width=700" />
</p>
<p align="center">
  <img src="https://codestats-readme.wegfan.cn/history-graph/${USERNAME}?bg_color=000000" />
</p>
<!-- CODESTATS:END -->`;

  let readme = fs.readFileSync('README.md', 'utf8');

  if (readme.includes('<!-- CODESTATS:START -->')) {
    readme = readme.replace(
      /<!-- CODESTATS:START -->[\s\S]*?<!-- CODESTATS:END -->/,
      section
    );
  } else {
    readme += '\n\n' + section;
  }

  fs.writeFileSync('README.md', readme);
  console.log('✅ README updated!');
})();