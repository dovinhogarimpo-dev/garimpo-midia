# garimpo-midia

Mídia pública do **Garimpo do Vinho** (@ogarimpodovinho): gerador de Reels e vídeos publicados.

## Gerar um Reel

```bash
pip install --break-system-packages playwright   # se faltar; usa /usr/bin/google-chrome e ffmpeg
python3 gerador/render_reel.py gerador/exemplo.json reels/AAAAMMDD-reel.mp4
```

Formato: 1080x1920, 30 fps, H.264 + AAC (trilha ambiente sintetizada no próprio script, sem direitos de terceiros).
Dica: 12 a 18 s no total; textos curtos.

### Cenas (campo `cenas`, na ordem)
- `gancho` {dur, eyebrow, titulo, sub}: no título, uma palavra começando com `*` fica em dourado itálico (ex.: `"Tinto por *R$ 28,90?"`).
- `uva` {dur, eyebrow, uva, fatos[] (até 3, curtos)}: cacho de uva ilustrado se desenhando.
- `oferta` {dur, kicker, nome, detalhe, preco (number), kit, selo}: cartão com o preço "caindo" até o valor.
- `cta` {dur, linhas[] (a última em dourado), sub, botao}.
- `bf` {dur, topo ("BLACK FRIDAY"), selo ("É HOJE"), titulo, sub}: abertura de data especial com faixas correndo ao fundo. Use `*` em cada palavra que deve ficar dourada.
- `top` {dur (5–6 s), eyebrow, titulo, itens[{nome, detalhe, preco (number), kit?}] (até 3)}: ranking com os preços aparecendo um a um.

## URL pública (para o Metricool)

`https://raw.githubusercontent.com/dovinhogarimpo-dev/garimpo-midia/main/reels/<arquivo>.mp4`

## Carrossel (slides em arquivos estáticos)

Desde 27/11, os carrosséis são publicados a partir de JPGs no GitHub. Servir as imagens pela função do Supabase gerava, às vezes, uma imagem cinza/corrompida quando o Metricool baixava as 8 ao mesmo tempo.

```bash
bash gerador/slides/render_slides.sh slides.json posts/AAAAMMDD-feed
# gera posts/AAAAMMDD-feed/1.jpg ... N.jpg (1080x1350)
```

- Formato do JSON: lista de slides, nos tipos capa, texto, destaque, lista e cta. É o mesmo formato da tabela post_slides.
- URL pública: `https://raw.githubusercontent.com/dovinhogarimpo-dev/garimpo-midia/main/posts/AAAAMMDD-feed/N.jpg`
- Confira 2 ou 3 slides (Read) antes de publicar.
