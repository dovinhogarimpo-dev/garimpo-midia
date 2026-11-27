// Garimpo do Vinho: renderização dos slides do Instagram (1080x1350) em SVG -> PNG.
import { Resvg, initWasm } from "npm:@resvg/resvg-wasm@2.6.2";

export type Slide =
  | { tipo: "capa"; eyebrow: string; linhas: string[]; destaque?: number[]; sub: string }
  | { tipo: "verificado"; kicker: string; nome: string; detalhe: string; preco: number; kit: string;
      anunc: number; real: number; de: number; ref: number; refLbl: string; fonte: string }
  | { tipo: "lista"; titulo: string; sub: string; itens: { nome: string; kit: string; preco: number; anunc: number }[]; nota: string }
  | { tipo: "cta"; linhas: string[]; sub: string; handle: string }
  | { tipo: "destaque"; kicker: string; nome: string; detalhe: string; preco: number; kit: string; selo: string;
      info: string; harmoniza: string[]; premio?: string }
  | { tipo: "texto"; eyebrow: string; titulo: string; paragrafos: string[]; rodape?: string }
  | { tipo: "story_oferta"; kicker: string; nome: string; detalhe: string; preco: number; kit: string; selo: string; cta: string }
  | { tipo: "story_texto"; eyebrow: string; titulo: string; corpo: string; cta: string };

const W = 1080, H = 1350;
const BG = "#120509", GOLD = "#D4B06A", IVORY = "#F4EDE4", MUTED = "#B8A49C", WINE = "#8E1F3B",
  PAPER = "#F4EDE4", INK = "#1E0A11", PMUTED = "#6E5A52", GOOD = "#1F6E45", WARN = "#C0651C";
const SERIF = "Bodoni Moda", SANS = "Instrument Sans";

const MARK = `<g><path d="M12.56,31.00 L51.44,31.00 L32.00,56.00 Z" fill="#8E1F3B"/><g fill="none" stroke="#D4B06A" stroke-width="1.60" stroke-linecap="round" stroke-linejoin="round"><path d="M19.00,7.00 L45.00,7.00 L60.00,20.00 L32.00,56.00 L4.00,20.00 Z"/><line x1="4.00" y1="20.00" x2="60.00" y2="20.00"/><line x1="19.00" y1="7.00" x2="12.00" y2="20.00"/><line x1="45.00" y1="7.00" x2="52.00" y2="20.00"/><line x1="19.00" y1="7.00" x2="32.00" y2="20.00"/><line x1="45.00" y1="7.00" x2="32.00" y2="20.00"/><line x1="12.00" y1="20.00" x2="32.00" y2="56.00"/><line x1="52.00" y1="20.00" x2="32.00" y2="56.00"/><line x1="32.00" y1="20.00" x2="32.00" y2="56.00"/><line x1="32.00" y1="56.00" x2="32.00" y2="86.00"/><path d="M17.00,88.00 Q32.00,83.00 47.00,88.00"/></g><circle cx="32.00" cy="3.00" r="1.40" fill="#D4B06A"/></g>`;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const brl = (v: number) => "R$ " + v.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");

// quebra de linha aproximada (largura média por caractere relativa ao tamanho da fonte)
function wrap(text: string, size: number, maxW: number, factor = 0.5): string[] {
  const max = Math.max(4, Math.floor(maxW / (size * factor)));
  const out: string[] = []; let cur = "";
  for (const w of text.split(/\s+/)) {
    if ((cur + " " + w).trim().length > max && cur) { out.push(cur); cur = w; } else cur = (cur + " " + w).trim();
  }
  if (cur) out.push(cur);
  return out;
}
function textLines(lines: string[], x: number, y: number, size: number, lh: number, attrs: string) {
  return lines.map((l, i) => `<text x="${x}" y="${y + i * lh}" font-size="${size}" ${attrs}>${esc(l)}</text>`).join("");
}

function frame(inner: string, n: number, total: number) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="glow" cx="78%" cy="22%" r="75%"><stop offset="0" stop-color="#4A1225" stop-opacity="0.9"/><stop offset="1" stop-color="${BG}" stop-opacity="0"/></radialGradient>
    <radialGradient id="glow2" cx="0%" cy="100%" r="60%"><stop offset="0" stop-color="#3A0F1D" stop-opacity="0.8"/><stop offset="1" stop-color="${BG}" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${BG}"/><rect width="${W}" height="${H}" fill="url(#glow)"/><rect width="${W}" height="${H}" fill="url(#glow2)"/>
  <g transform="translate(72,64) scale(0.62)">${MARK}</g>
  <text x="124" y="102" font-family="${SERIF}" font-style="italic" font-weight="500" font-size="34" fill="${IVORY}">Garimpo</text>
  <text x="126" y="124" font-family="${SANS}" font-weight="600" font-size="13" letter-spacing="5" fill="${GOLD}">DO VINHO</text>
  <text x="${W - 72}" y="104" text-anchor="end" font-family="${SANS}" font-weight="600" font-size="22" letter-spacing="3" fill="${MUTED}">${n}/${total}</text>
  ${inner}
  <line x1="72" y1="${H - 108}" x2="${W - 72}" y2="${H - 108}" stroke="${GOLD}" stroke-opacity="0.3" stroke-width="1"/>
  <text x="72" y="${H - 66}" font-family="${SANS}" font-weight="600" font-size="22" fill="${IVORY}">@ogarimpodovinho</text>
  <text x="${W - 72}" y="${H - 66}" text-anchor="end" font-family="${SANS}" font-size="19" fill="${MUTED}">Beba com moderação. Proibido para menores de 18 anos.</text>
</svg>`;
}

function capa(s: Extract<Slide, { tipo: "capa" }>) {
  let y = 470;
  const lines = s.linhas.map((l, i) => {
    const hi = (s.destaque || []).includes(i);
    const t = `<text x="72" y="${y}" font-family="${SERIF}" font-weight="${hi ? 500 : 400}" ${hi ? 'font-style="italic"' : ""} font-size="118" fill="${hi ? GOLD : IVORY}">${esc(l)}</text>`;
    y += 128; return t;
  }).join("");
  const sub = textLines(wrap(s.sub, 34, 880, 0.48), 72, y + 40, 34, 48, `font-family="${SANS}" fill="${MUTED}"`);
  return `<line x1="72" y1="300" x2="128" y2="300" stroke="${GOLD}" stroke-width="2"/>
  <text x="146" y="308" font-family="${SANS}" font-weight="600" font-size="24" letter-spacing="6" fill="${GOLD}">${esc(s.eyebrow)}</text>${lines}${sub}`;
}

function verificado(s: Extract<Slide, { tipo: "verificado" }>) {
  // etiqueta de papel
  const x = 92, y = 230, w = W - 184, h = 900;
  const nome = wrap(s.nome, 54, w - 120, 0.47);
  let cy = y + 150;
  const nomeSvg = nome.map((l) => { const t = `<text x="${W / 2}" y="${cy}" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-weight="500" font-size="54" fill="${INK}">${esc(l)}</text>`; cy += 62; return t; }).join("");
  cy += 4;
  const det = `<text x="${W / 2}" y="${cy}" text-anchor="middle" font-family="${SANS}" font-size="26" fill="${PMUTED}">${esc(s.detalhe)}</text>`;
  cy += 140;
  const price = `<text x="${W / 2}" y="${cy}" text-anchor="middle" font-family="${SERIF}" font-weight="500" font-size="128" fill="${INK}">${esc(brl(s.preco))}</text>
    <text x="${W / 2}" y="${cy + 48}" text-anchor="middle" font-family="${SANS}" font-size="26" fill="${PMUTED}">${esc(s.kit)}</text>`;
  cy += 120;
  // dois blocos: anunciado x real
  const bw = (w - 120 - 24) / 2, bx1 = x + 60, bx2 = bx1 + bw + 24;
  const blocks = `
    <rect x="${bx1}" y="${cy}" width="${bw}" height="150" fill="none" stroke="#B8975A" stroke-width="1.5"/>
    <text x="${bx1 + bw / 2}" y="${cy + 46}" text-anchor="middle" font-family="${SANS}" font-weight="600" font-size="20" letter-spacing="3" fill="${PMUTED}">A LOJA ANUNCIA</text>
    <text x="${bx1 + bw / 2}" y="${cy + 120}" text-anchor="middle" font-family="${SERIF}" font-weight="500" font-size="72" fill="${WARN}">−${s.anunc}%</text>
    <rect x="${bx2}" y="${cy}" width="${bw}" height="150" fill="#E3EFE6" stroke="${GOOD}" stroke-width="1.5"/>
    <text x="${bx2 + bw / 2}" y="${cy + 46}" text-anchor="middle" font-family="${SANS}" font-weight="600" font-size="20" letter-spacing="3" fill="${GOOD}">DESCONTO REAL</text>
    <text x="${bx2 + bw / 2}" y="${cy + 120}" text-anchor="middle" font-family="${SERIF}" font-weight="500" font-size="72" fill="${GOOD}">−${s.real}%</text>`;
  cy += 200;
  // barras
  const mx = Math.max(s.de, s.ref, s.preco), bl = x + 60, bwid = w - 120 - 300;
  const row = (lbl: string, v: number, c: string, i: number) => {
    const yy = cy + i * 48;
    return `<text x="${bl}" y="${yy + 8}" font-family="${SANS}" font-size="22" fill="${PMUTED}">${esc(lbl)}</text>
      <rect x="${bl + 190}" y="${yy - 6}" width="${bwid}" height="10" fill="#E6DCD3"/>
      <rect x="${bl + 190}" y="${yy - 6}" width="${(v / mx * bwid).toFixed(1)}" height="10" fill="${c}"/>
      <text x="${x + w - 60}" y="${yy + 8}" text-anchor="end" font-family="${SANS}" font-weight="600" font-size="22" fill="${INK}">${esc(brl(v))}</text>`;
  };
  const bars = row('"De" anunciado', s.de, WARN, 0) + row(s.refLbl, s.ref, "#7A6A62", 1) + row("Hoje", s.preco, WINE, 2);
  const fonte = textLines(wrap(s.fonte, 20, w - 120, 0.5), W / 2, y + h - 70, 20, 26, `text-anchor="middle" font-family="${SANS}" fill="${PMUTED}"`);
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${PAPER}"/>
    <rect x="${x + 14}" y="${y + 14}" width="${w - 28}" height="${h - 28}" fill="none" stroke="#B8975A" stroke-width="1.5"/>
    <rect x="${x + 20}" y="${y + 20}" width="${w - 40}" height="${h - 40}" fill="none" stroke="#B8975A" stroke-opacity="0.5" stroke-width="0.8"/>
    <text x="${W / 2}" y="${y + 80}" text-anchor="middle" font-family="${SANS}" font-weight="600" font-size="22" letter-spacing="7" fill="${WINE}">${esc(s.kicker)}</text>
    ${nomeSvg}${det}${price}${blocks}${bars}${fonte}`;
}

function destaque(s: Extract<Slide, { tipo: "destaque" }>) {
  const x = 92, y = 230, w = W - 184, h = 900;
  const nome = wrap(s.nome, 54, w - 120, 0.47);
  let cy = y + 150;
  const nomeSvg = nome.map((l) => { const t = `<text x="${W / 2}" y="${cy}" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-weight="500" font-size="54" fill="${INK}">${esc(l)}</text>`; cy += 62; return t; }).join("");
  cy += 4;
  const det = `<text x="${W / 2}" y="${cy}" text-anchor="middle" font-family="${SANS}" font-size="26" fill="${PMUTED}">${esc(s.detalhe)}</text>`;
  let premio = "";
  if (s.premio) { cy += 44; premio = `<text x="${W / 2}" y="${cy}" text-anchor="middle" font-family="${SANS}" font-weight="600" font-size="22" letter-spacing="1" fill="#9A7A3A">${esc(s.premio)}</text>`; }
  cy += 150;
  const price = `<text x="${W / 2}" y="${cy}" text-anchor="middle" font-family="${SERIF}" font-weight="500" font-size="140" fill="${INK}">${esc(brl(s.preco))}</text>
    <text x="${W / 2}" y="${cy + 52}" text-anchor="middle" font-family="${SANS}" font-size="27" fill="${PMUTED}">${esc(s.kit)}</text>`;
  cy += 110;
  const sw = 260, sx = W / 2 - sw / 2;
  const selo = `<rect x="${sx}" y="${cy}" width="${sw}" height="64" fill="${WINE}"/>
    <text x="${W / 2}" y="${cy + 43}" text-anchor="middle" font-family="${SANS}" font-weight="600" font-size="28" letter-spacing="4" fill="${PAPER}">${esc(s.selo)}</text>`;
  cy += 130;
  const info = textLines(wrap(s.info, 28, w - 160, 0.5), W / 2, cy, 28, 40, `text-anchor="middle" font-family="${SANS}" fill="${INK}"`);
  const harm = s.harmoniza.length ? `<line x1="${x + 80}" y1="${y + h - 120}" x2="${x + w - 80}" y2="${y + h - 120}" stroke="#B8975A" stroke-opacity="0.6"/>
    <text x="${W / 2}" y="${y + h - 72}" text-anchor="middle" font-family="${SANS}" font-size="24" fill="${PMUTED}">Combina com: ${esc(s.harmoniza.join(" · "))}</text>` : "";
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${PAPER}"/>
    <rect x="${x + 14}" y="${y + 14}" width="${w - 28}" height="${h - 28}" fill="none" stroke="#B8975A" stroke-width="1.5"/>
    <rect x="${x + 20}" y="${y + 20}" width="${w - 40}" height="${h - 40}" fill="none" stroke="#B8975A" stroke-opacity="0.5" stroke-width="0.8"/>
    <text x="${W / 2}" y="${y + 80}" text-anchor="middle" font-family="${SANS}" font-weight="600" font-size="22" letter-spacing="7" fill="${WINE}">${esc(s.kicker)}</text>
    ${nomeSvg}${det}${premio}${price}${selo}${info}${harm}`;
}

function texto(s: Extract<Slide, { tipo: "texto" }>) {
  let y = 300;
  const head = `<line x1="72" y1="${y - 8}" x2="128" y2="${y - 8}" stroke="${GOLD}" stroke-width="2"/>
  <text x="146" y="${y}" font-family="${SANS}" font-weight="600" font-size="24" letter-spacing="6" fill="${GOLD}">${esc(s.eyebrow)}</text>`;
  y += 120;
  const tl = wrap(s.titulo, 80, 940, 0.45);
  const titulo = tl.map((l) => { const t = `<text x="72" y="${y}" font-family="${SERIF}" font-weight="400" font-size="80" fill="${IVORY}">${esc(l)}</text>`; y += 92; return t; }).join("");
  y += 30;
  const paras = s.paragrafos.map((p) => {
    const ls = wrap(p, 34, 930, 0.48);
    const t = textLines(ls, 72, y, 34, 50, `font-family="${SANS}" fill="${IVORY}" fill-opacity="0.88"`);
    y += ls.length * 50 + 30; return t;
  }).join("");
  const rod = s.rodape ? `<text x="72" y="${H - 160}" font-family="${SERIF}" font-style="italic" font-weight="500" font-size="40" fill="${GOLD}">${esc(s.rodape)}</text>` : "";
  return head + titulo + paras + rod;
}

const SH = 1920;
function storyFrame(inner: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${SH}" viewBox="0 0 ${W} ${SH}">
  <defs>
    <radialGradient id="g1" cx="80%" cy="18%" r="70%"><stop offset="0" stop-color="#4A1225" stop-opacity="0.95"/><stop offset="1" stop-color="${BG}" stop-opacity="0"/></radialGradient>
    <radialGradient id="g2" cx="0%" cy="95%" r="60%"><stop offset="0" stop-color="#3A0F1D" stop-opacity="0.85"/><stop offset="1" stop-color="${BG}" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${SH}" fill="${BG}"/><rect width="${W}" height="${SH}" fill="url(#g1)"/><rect width="${W}" height="${SH}" fill="url(#g2)"/>
  <g transform="translate(${W / 2 - 160},250) scale(0.75)">${MARK}</g>
  <text x="${W / 2 - 100}" y="300" font-family="${SERIF}" font-style="italic" font-weight="500" font-size="48" fill="${IVORY}">Garimpo</text>
  <text x="${W / 2 - 97}" y="330" font-family="${SANS}" font-weight="600" font-size="17" letter-spacing="7" fill="${GOLD}">DO VINHO</text>
  ${inner}
  <text x="${W / 2}" y="${SH - 330}" text-anchor="middle" font-family="${SANS}" font-size="22" fill="${MUTED}">Beba com moderação. Proibido para menores de 18 anos.</text>
</svg>`;
}
function storyCta(cta: string, y: number) {
  return `<rect x="${W / 2 - 300}" y="${y}" width="600" height="104" fill="${GOLD}"/>
    <text x="${W / 2}" y="${y + 66}" text-anchor="middle" font-family="${SANS}" font-weight="600" font-size="34" letter-spacing="6" fill="${INK}">${esc(cta)}</text>
    <text x="${W / 2}" y="${y + 170}" text-anchor="middle" font-family="${SANS}" font-weight="600" font-size="30" fill="${IVORY}">@ogarimpodovinho</text>`;
}
function storyOferta(s: Extract<Slide, { tipo: "story_oferta" }>) {
  const x = 90, y = 470, w = W - 180, h = 780;
  let cy = y + 120;
  const nome = wrap(s.nome, 60, w - 120, 0.47);
  const nomeSvg = nome.map((l) => { const t = `<text x="${W / 2}" y="${cy + 40}" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-weight="500" font-size="60" fill="${INK}">${esc(l)}</text>`; cy += 70; return t; }).join("");
  cy += 60;
  const det = `<text x="${W / 2}" y="${cy}" text-anchor="middle" font-family="${SANS}" font-size="30" fill="${PMUTED}">${esc(s.detalhe)}</text>`;
  cy += 190;
  const price = `<text x="${W / 2}" y="${cy}" text-anchor="middle" font-family="${SERIF}" font-weight="500" font-size="170" fill="${INK}">${esc(brl(s.preco))}</text>
    <text x="${W / 2}" y="${cy + 64}" text-anchor="middle" font-family="${SANS}" font-size="32" fill="${PMUTED}">${esc(s.kit)}</text>`;
  cy += 130;
  const selo = `<rect x="${W / 2 - 170}" y="${cy}" width="340" height="80" fill="${WINE}"/>
    <text x="${W / 2}" y="${cy + 54}" text-anchor="middle" font-family="${SANS}" font-weight="600" font-size="36" letter-spacing="5" fill="${PAPER}">${esc(s.selo)}</text>`;
  return storyFrame(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${PAPER}"/>
    <rect x="${x + 16}" y="${y + 16}" width="${w - 32}" height="${h - 32}" fill="none" stroke="#B8975A" stroke-width="1.6"/>
    <text x="${W / 2}" y="${y + 90}" text-anchor="middle" font-family="${SANS}" font-weight="600" font-size="26" letter-spacing="8" fill="${WINE}">${esc(s.kicker)}</text>
    ${nomeSvg}${det}${price}${selo}${storyCta(s.cta, y + h + 80)}`);
}
function storyTexto(s: Extract<Slide, { tipo: "story_texto" }>) {
  let y = 560;
  const head = `<text x="${W / 2}" y="${y}" text-anchor="middle" font-family="${SANS}" font-weight="600" font-size="28" letter-spacing="8" fill="${GOLD}">${esc(s.eyebrow)}</text>`;
  y += 130;
  const tl = wrap(s.titulo, 96, 920, 0.45);
  const titulo = tl.map((l) => { const t = `<text x="${W / 2}" y="${y}" text-anchor="middle" font-family="${SERIF}" font-weight="400" font-size="96" fill="${IVORY}">${esc(l)}</text>`; y += 110; return t; }).join("");
  y += 50;
  const cl = wrap(s.corpo, 40, 900, 0.48);
  const corpo = textLines(cl, W / 2, y, 40, 60, `text-anchor="middle" font-family="${SANS}" fill="${IVORY}" fill-opacity="0.88"`);
  return storyFrame(head + titulo + corpo + storyCta(s.cta, SH - 560));
}

function lista(s: Extract<Slide, { tipo: "lista" }>) {
  const tl = wrap(s.titulo, 72, 960, 0.44);
  let y = 290;
  const titulo = tl.map((l) => { const t = `<text x="72" y="${y}" font-family="${SERIF}" font-weight="400" font-size="72" fill="${IVORY}">${esc(l)}</text>`; y += 84; return t; }).join("");
  const sub = `<text x="72" y="${y + 8}" font-family="${SANS}" font-size="28" fill="${MUTED}">${esc(s.sub)}</text>`;
  y += 90;
  const itens = s.itens.map((it, i) => {
    const yy = y + i * 150;
    const nome = wrap(it.nome, 40, 640, 0.48).slice(0, 2);
    return `<line x1="72" y1="${yy}" x2="${W - 72}" y2="${yy}" stroke="${GOLD}" stroke-opacity="0.3"/>
      ${textLines(nome, 72, yy + 58, 40, 46, `font-family="${SERIF}" font-weight="500" fill="${IVORY}"`)}
      <text x="72" y="${yy + 58 + nome.length * 46 + 6}" font-family="${SANS}" font-size="24" fill="${MUTED}">${esc(it.kit)} · ${it.anunc}% OFF na loja</text>
      <text x="${W - 72}" y="${yy + 74}" text-anchor="end" font-family="${SERIF}" font-weight="500" font-size="64" fill="${GOLD}">${esc(brl(it.preco))}</text>
      <text x="${W - 72}" y="${yy + 110}" text-anchor="end" font-family="${SANS}" font-size="22" fill="${MUTED}">a garrafa</text>`;
  }).join("");
  const nota = textLines(wrap(s.nota, 22, 930, 0.5), 72, y + s.itens.length * 150 + 56, 22, 30, `font-family="${SANS}" fill="${MUTED}"`);
  return titulo + sub + itens + nota;
}

function cta(s: Extract<Slide, { tipo: "cta" }>) {
  let y = 520;
  const lines = s.linhas.map((l, i) => { const t = `<text x="${W / 2}" y="${y}" text-anchor="middle" font-family="${SERIF}" ${i === s.linhas.length - 1 ? `font-style="italic" fill="${GOLD}"` : `fill="${IVORY}"`} font-weight="400" font-size="96">${esc(l)}</text>`; y += 110; return t; }).join("");
  const sub = textLines(wrap(s.sub, 32, 820, 0.48), W / 2, y + 30, 32, 46, `text-anchor="middle" font-family="${SANS}" fill="${MUTED}"`);
  return `<g transform="translate(${W / 2 - 52},260) scale(1.62)">${MARK}</g>${lines}${sub}
    <rect x="${W / 2 - 230}" y="${H - 330}" width="460" height="84" fill="${GOLD}"/>
    <text x="${W / 2}" y="${H - 276}" text-anchor="middle" font-family="${SANS}" font-weight="600" font-size="28" letter-spacing="5" fill="${INK}">${esc(s.handle)}</text>`;
}

export function svgFor(s: Slide, n: number, total: number) {
  if (s.tipo === "story_oferta") return storyOferta(s);
  if (s.tipo === "story_texto") return storyTexto(s);
  if (s.tipo === "texto") return frame(texto(s), n, total);
  const inner = s.tipo === "capa" ? capa(s) : s.tipo === "verificado" ? verificado(s) : s.tipo === "destaque" ? destaque(s) : s.tipo === "lista" ? lista(s) : cta(s);
  return frame(inner, n, total);
}

let ready: Promise<void> | null = null;
export function ensureWasm(load: () => Promise<Response | ArrayBuffer | Uint8Array>) {
  if (!ready) ready = load().then((w) => initWasm(w as any));
  return ready;
}
export function toPng(svg: string, fonts: Uint8Array[]) {
  const r = new Resvg(svg, { fitTo: { mode: "width", value: W }, font: { fontBuffers: fonts, loadSystemFonts: false, defaultFontFamily: SANS } });
  return r.render().asPng();
}
