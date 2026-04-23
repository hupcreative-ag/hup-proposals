require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'hup2024';
// Em produção o tracking fica num volume persistente (/app/data/)
const DATA_DIR = process.env.DATA_DIR || __dirname;
const TRACKING_FILE = path.join(DATA_DIR, 'tracking.json');
// Garante que o diretório de dados existe
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Static assets — cache por 30 dias no browser
app.use('/assets', express.static(path.join(__dirname, 'assets'), {
  maxAge: '30d',
  etag: true,
  lastModified: true,
}));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─── Helpers ────────────────────────────────────────────────────────────────

const IMAGE_EXTS = /\.(webp|gif|svg|avif)$/i; // apenas WebP otimizados

function readAssets(relDir) {
  const dir = path.join(__dirname, relDir);
  try {
    return fs.readdirSync(dir)
      .filter(f => IMAGE_EXTS.test(f) && !f.startsWith('.'))
      .map(f => '/' + relDir.replace(/\\/g, '/') + '/' + f);
  } catch {
    return [];
  }
}

function readTracking() {
  try {
    return JSON.parse(fs.readFileSync(TRACKING_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeTracking(entries) {
  fs.writeFileSync(TRACKING_FILE, JSON.stringify(entries, null, 2));
}

function readProposal(slug) {
  const file = path.join(__dirname, 'proposals', slug + '.json');
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

// ─── Routes ─────────────────────────────────────────────────────────────────

// Home institucional — acessível em /hup (sem token)
app.get('/hup', (req, res) => {
  const assets = {
    logoHup:                  readAssets('assets/Logo_hup'),
    logosClientes:            readAssets('assets/Logos_clientes'),
    redesSociais:             readAssets('assets/Redes_sociais'),
    ecommerce:                readAssets('assets/Ecommerce'),
    offline:                  readAssets('assets/Offline'),
    audiovisualEventos:       readAssets('assets/Audiovisual/eventos_e_inst'),
    audiovisualRedes:         readAssets('assets/Audiovisual/redes'),
    fotografiaAlimentacao:    readAssets('assets/Fotografia/Alimentacao'),
    fotografiaInstitucional:  readAssets('assets/Fotografia/institucional'),
    fotografiaProduto:        readAssets('assets/Fotografia/Produto'),
    packaging:                readAssets('assets/packaging'),
  };
  res.render('home', { assets });
});

// Proposal page — suporta /:slug e /proposta/:slug
app.get('/proposta/:slug', (req, res) => res.redirect(301, `/${req.params.slug}${req.url.includes('?')?req.url.slice(req.url.indexOf('?')):''}` ));

app.get('/:slug', (req, res) => {
  const { slug } = req.params;
  const { token } = req.query;

  const proposal = readProposal(slug);

  if (!proposal || !token || proposal.token !== token) {
    return res.status(404).send('Not found');
  }

  // Track access
  const entries = readTracking();
  entries.push({
    slug,
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'] || '',
    timestamp: new Date().toISOString(),
  });
  writeTracking(entries);

  // Collect all asset paths
  const assets = {
    logoHup:              readAssets('assets/Logo_hup'),
    logosClientes:        readAssets('assets/Logos_clientes'),
    redesSociais:         readAssets('assets/Redes_sociais'),
    ecommerce:            readAssets('assets/Ecommerce'),
    offline:              readAssets('assets/Offline'),
    audiovisualEventos:   readAssets('assets/Audiovisual/eventos_e_inst'),
    audiovisualRedes:     readAssets('assets/Audiovisual/redes'),
    fotografiaAlimentacao:readAssets('assets/Fotografia/Alimentacao'),
    fotografiaInstitucional: readAssets('assets/Fotografia/institucional'),
    fotografiaProduto:    readAssets('assets/Fotografia/Produto'),
    packaging:            readAssets('assets/packaging'),
  };

  assets.fotografiaTicker = [
    ...assets.fotografiaAlimentacao,
    ...assets.fotografiaInstitucional,
    ...assets.fotografiaProduto,
  ];

  const VIEWS = {
    'branding': 'proposal-branding',
    'branding-compare': 'proposal-branding-compare',
  };
  const view = VIEWS[proposal.type] || 'proposal';
  res.render(view, { proposal, assets });
});

// Admin tracking
app.get('/admin/tracking', (req, res) => {
  if (req.query.password !== ADMIN_PASSWORD) {
    return res.status(401).send('Unauthorized');
  }
  const entries = readTracking();
  const rows = entries
    .slice()
    .reverse()
    .map(e => `
      <tr>
        <td>${e.timestamp}</td>
        <td>${e.slug}</td>
        <td>${e.ip}</td>
        <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e.userAgent}</td>
      </tr>`)
    .join('');

  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>HUP — Tracking</title>
  <style>
    body { font-family: monospace; background: #0a0a0a; color: #fff; padding: 2rem; }
    h1 { color: #00CFFF; margin-bottom: 1.5rem; }
    table { border-collapse: collapse; width: 100%; }
    th { background: #111; color: #888; text-align: left; padding: 8px 12px; font-size: 12px; text-transform: uppercase; letter-spacing: .05em; }
    td { padding: 8px 12px; border-bottom: 1px solid #222; font-size: 13px; }
    tr:hover td { background: #111; }
    .count { color: #888; font-size: 13px; margin-bottom: 1rem; }
  </style>
</head>
<body>
  <h1>HUP Tracking</h1>
  <p class="count">${entries.length} acesso(s) registrado(s)</p>
  <table>
    <thead><tr><th>Timestamp</th><th>Slug</th><th>IP</th><th>User Agent</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`);
});

// ─── Start ───────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`HUP Proposals running at http://localhost:${PORT}`);
});
