const root = document.getElementById('root');

const showHint = (message) => {
  if (!root) return;

  const panel = document.createElement('div');
  panel.style.maxWidth = '760px';
  panel.style.margin = '64px auto';
  panel.style.padding = '20px 24px';
  panel.style.border = '1px solid #e2e8f0';
  panel.style.borderRadius = '16px';
  panel.style.background = '#ffffff';
  panel.style.color = '#0f172a';
  panel.style.fontFamily = 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
  panel.style.lineHeight = '1.7';

  panel.innerHTML = `
    <h2 style="margin:0 0 12px 0;font-size:20px;">Live Server cannot compile TSX source directly</h2>
    <p style="margin:0 0 8px 0;">${message}</p>
    <p style="margin:0;">Use <code>npm run dev</code>, or run <code>npm run build</code> first and refresh this page.</p>
  `;

  root.innerHTML = '';
  root.appendChild(panel);
};

const loadFromDist = async () => {
  const manifestResponse = await fetch('./dist/.vite/manifest.json', { cache: 'no-store' });
  if (!manifestResponse.ok) {
    throw new Error(`manifest missing: ${manifestResponse.status}`);
  }

  const manifest = await manifestResponse.json();
  const entry = manifest['index.html'] || manifest['index.tsx'] || Object.values(manifest).find((item) => item && item.isEntry);

  if (!entry || !entry.file) {
    throw new Error('manifest entry not found');
  }

  (entry.css || []).forEach((cssFile) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `./dist/${cssFile}`;
    document.head.appendChild(link);
  });

  const script = document.createElement('script');
  script.type = 'module';
  script.src = `./dist/${entry.file}`;
  script.onerror = () => showHint('Found dist output, but failed to load static assets.');
  document.body.appendChild(script);
};

import('/index.tsx').catch(async () => {
  try {
    await loadFromDist();
  } catch (error) {
    console.error('[bootstrap] failed to load source and dist fallback', error);
    showHint('TSX source failed and no usable dist build was found.');
  }
});
