# GeoSim

**Simulações geofísicas didáticas para a web.** Seis métodos (magnetometria, gravimetria, eletrorresistividade, georadar, sísmica de refração e TDEM) como Web Components em um único arquivo JavaScript, sem dependências, com parâmetros ajustáveis e fórmulas de livro-texto.

[Demonstração](https://qartt.github.io/geosim/) · [Como usar](#como-usar) · [A física](#a-física) · [Contribuir](CONTRIBUTING.md)

```html
<script src="https://cdn.jsdelivr.net/gh/qartt/geosim@1/dist/geosim.min.js"></script>

<geo-sim metodo="seis" controls info></geo-sim>
```

Arraste a velocidade da segunda camada e veja a distância crítica se mover. Aprofunde um corpo denso e veja a anomalia gravimétrica alargar. Essa é a ideia: deixar o comportamento de cada método visível para quem está aprendendo.

> As simulações são **modelos diretos simplificados para ensino**. Não substituem software de processamento, modelagem ou inversão.

## Por que existe

Quase todo material didático de geofísica em português é estático: figuras de livro, slides, PDFs. O GeoSim foi feito para professores, estudantes, empresas de geofísica e blogs técnicos que querem mostrar o método funcionando, com uma tag HTML e nada mais.

## Como usar

### CDN

```html
<script src="https://cdn.jsdelivr.net/gh/qartt/geosim@1/dist/geosim.min.js"></script>
```

### npm

```bash
npm i geosim-br
```

```js
import 'geosim-br';                    // registra as tags
import { setTexts, registerMethod } from 'geosim-br';
```

### WordPress

A pasta [`wordpress/qartt-geosim`](wordpress/qartt-geosim) é um plugin pronto, com shortcodes para cada componente. Compacte a pasta em ZIP e instale em *Plugins → Adicionar novo*.

## Componentes

### `<geo-sim>`

Um método isolado.

```html
<geo-sim metodo="grav" profundidade="120" contraste="0.8" controls></geo-sim>
```

| Atributo | Valores | Padrão |
|---|---|---|
| `metodo` | `mag`, `grav`, `res`, `gpr`, `seis`, `tdem` | `mag` |
| `height` | altura em px, ou `auto` | `360` (mini: `90`) |
| `theme` | `auto`, `dark`, `light` | `auto` |
| `controls` | mostra sliders dos parâmetros | desligado |
| `info` | mostra ficha técnica abaixo | desligado |
| `mini` | versão compacta, sem cenário | desligado |
| `labels="no"` | esconde textos no canvas | ligados |
| `animate="no"` | quadro estático | animado |

Atributos booleanos aceitam presença simples (`controls`) ou `"no"`, `"false"`, `"0"` para desligar.

**Parâmetros físicos** (também viram atributos):

| Método | Parâmetro | Faixa | Padrão |
|---|---|---|---|
| `mag` | `profundidade` (m) | 20–200 | 90 |
| | `inclinacao` (°) | −90–90 | −30 |
| | `susceptibilidade` (SI) | 0,001–0,2 | 0,05 |
| `grav` | `profundidade` (m) | 20–200 | 80 |
| | `contraste` (g/cm³) | 0,1–2 | 0,6 |
| `seis` | `v1` (m/s) | 300–1500 | 600 |
| | `v2` (m/s) | 800–5000 | 2400 |
| | `espessura` (m) | 2–30 | 12 |
| `res` | `profundidade` do alvo (m) | 5–40 | 22 |
| | `rho` do alvo (Ω·m) | 1–2000 | 10 |
| `gpr` | `permissividade` (εr) | 3–30 | 9 |
| | `profundidade` do tubo (m) | 0,3–2,5 | 1 |
| `tdem` | `profundidade` da camada (m) | 20–300 | 120 |

**API do elemento**

```js
const sim = document.querySelector('geo-sim');
sim.metodo = 'gpr';
sim.setParam('permissividade', 16);
sim.params;   // { permissividade: 16, profundidade: 1 }
sim.reset();

sim.addEventListener('geosim-change', (e) => console.log(e.detail));
// { metodo: 'gpr', params: { ... } }
```

### `<geo-sim-lab>`

Painel com seletor de métodos, simulação e ficha técnica.

```html
<geo-sim-lab id="lab" metodos="mag,grav,seis" inicial="seis" controls></geo-sim-lab>
```

Aceita `metodos`, `inicial`, `controls`, `info="no"`, `height`, `theme`, `labels`, `animate`. Emite `geosim-method` ao trocar de método; `lab.metodo = 'res'` troca por código.

### `<geo-sim-cards>`

Grade de miniaturas. Com `alvo`, cada card troca o método do lab com aquele id.

```html
<geo-sim-cards alvo="lab" colunas="3"></geo-sim-cards>
```

### `<geo-sim-field>`

Mapa de anomalia com isolinhas que seguem o cursor. O conteúdo da tag vira sobreposição, então serve como hero.

```html
<geo-sim-field height="560">
  <h1>Enxergamos o subsolo</h1>
</geo-sim-field>
```

Aceita `height`, `theme`, `readout="no"`, `interativo="no"`, `animate`.

## Cores e tema

Defina as variáveis no próprio componente ou em qualquer ancestral:

```css
geo-sim, geo-sim-lab, geo-sim-cards, geo-sim-field {
  --gs-accent: #e8742c;
  --gs-bg: #101820;
}
```

Variáveis: `--gs-bg`, `--gs-bg2`, `--gs-fg`, `--gs-muted`, `--gs-accent`, `--gs-accent2`, `--gs-sky`, `--gs-line`, `--gs-radius`, `--gs-mono`, `--gs-font`. Partes estilizáveis com `::part()`: `stage`, `canvas`, `controls`, `info`, `nav`, `sim`, `grid`, `overlay`, `readout`.

## Textos e tradução

Tudo em português por padrão. Para trocar qualquer texto:

```js
GeoSim.setTexts({
  locale: 'en-US',
  methods: { seis: { name: 'Seismic refraction' } },
  params: { v1: 'Layer 1 velocity' },
  ui: { reset: 'Reset' }
});
```

Ou antes de carregar o script: `window.GeoSimConfig = { texts: { ... } }`.

## Criar um método novo

Cada método é um objeto com parâmetros e uma função `draw(S, t)`. O núcleo cuida de canvas, densidade de pixels, redimensionamento, pausa fora da tela, tema e sliders.

```js
GeoSim.registerMethod({
  id: 'ip',
  params: [{ key: 'cargabilidade', unit: 'mV/V', min: 1, max: 100, step: 1, value: 20 }],
  draw(S, t) {
    const { ctx, w, h, C, p } = S;     // contexto, tamanho, cores, parâmetros
    ctx.strokeStyle = C.accent;
    GeoSim.draw.plot(ctx, 0, w, 4, (x) => h / 2 - Math.sin(x / 40 + t) * p.cargabilidade);
  }
});
```

```html
<geo-sim metodo="ip" controls></geo-sim>
```

Os textos do método novo entram via `setTexts({ methods: { ip: { ... } }, params: { cargabilidade: '...' } })`. Veja [CONTRIBUTING.md](CONTRIBUTING.md) para enviar o método ao projeto.

## A física

| Método | Modelo | Fórmula |
|---|---|---|
| Sísmica de refração | duas camadas planas | `t = min(x/V1, x/V2 + 2h·cos(ic)/V1)`, `sen(ic) = V1/V2` |
| Gravimetria | esfera, R = 40 m | `Δg = G·M·z / (x² + z²)^(3/2)` |
| Magnetometria | esfera induzida, perfil no meridiano magnético | `ΔT = R³·k·F / (3z³) · [(2−u²)sen²I + (2u²−1)cos²I − 3u·sen2I] / (1+u²)^(5/2)` |
| GPR | difratores pontuais e refletores | `v = c/√εr`, `t = 2√(d² + x²)/v` |
| Eletrorresistividade | pseudosseção ilustrativa | fundo + alvo de ρ e profundidade ajustáveis |
| TDEM | curva de decaimento ilustrativa | ombro em tempos maiores para camadas mais profundas |

Referências: Telford, Geldart & Sheriff, *Applied Geophysics*; Kearey, Brooks & Hill, *An Introduction to Geophysical Exploration*.

## Acessibilidade e desempenho

- Cada canvas tem `role="img"` e descrição; o lab navega pelas setas do teclado.
- Com "reduzir movimento" ligado no sistema, tudo vira quadro estático.
- A animação pausa quando o componente sai da tela.
- Cerca de 37 kB minificado, sem dependências.

## Desenvolvimento

```bash
npm install
npm run build   # gera dist/ e copia para docs/ e wordpress/
npm test        # testes dos modelos físicos e do desenho
npm run dev     # build + servidor local da demo
```

## Projetos relacionados

O GeoSim não inventou a ideia de simulação geofísica interativa. Ele se apoia em um formato diferente: componente embutível, sem instalação e em português. Se você precisa de mais profundidade, conheça:

- [GeoSci.xyz](https://geosci.xyz) (UBC): notebooks Jupyter interativos sobre SimPEG, referência em ensino de geofísica aplicada.
- [Environmental Geophysics](https://github.com/geohang/environmental-geophysics) (University of Iowa): curso aberto com dezenas de páginas interativas em HTML/JS, exercícios e dados reais de campo.
- [SimPEG](https://simpeg.xyz) e [pyGIMLi](https://www.pygimli.org): bibliotecas Python de modelagem e inversão para pesquisa.

## Roadmap

- [ ] IP (polarização induzida) e MT (magnetotelúrico)
- [ ] Sísmica de reflexão e sísmica multicamadas
- [ ] Bloco Gutenberg nativo
- [ ] Modo "exercício" (aluno estima V1, V2 e h a partir da dromocrônica)
- [ ] Leitura de perfis reais (CSV) com coordenadas SIRGAS 2000 / UTM

## Licença

Biblioteca sob [MIT](LICENSE). O plugin WordPress em `wordpress/` é distribuído sob GPL-2.0-or-later, como exige o ecossistema WordPress.

Criado por [João Cabral](https://qartt.com.br) — Qartt Tecnologia, Belo Horizonte.
