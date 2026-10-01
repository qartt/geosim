# Como contribuir

Obrigado por querer ajudar. O GeoSim é feito para ensinar geofísica, então contribuições de quem é da área (geólogos, geofísicos, professores) valem tanto quanto código.

## Formas de ajudar

- **Revisar a física.** Encontrou uma curva com comportamento errado ou uma simplificação enganosa? Abra uma issue com a referência bibliográfica.
- **Novo método.** IP, MT, sísmica de reflexão, perfilagem de poço… Use o modelo de issue "Novo método" antes de começar, para combinarmos o modelo físico.
- **Tradução.** Os textos ficam em `src/core/texts.js`.
- **Usar em aula** e contar como foi. Exemplos reais ajudam a priorizar o roadmap.

## Ambiente

```bash
npm install
npm run build
npm test
npm run dev   # abre a demo em http://localhost:3000
```

Requer Node 18 ou superior. A única dependência de desenvolvimento é o esbuild.

## Estrutura

```
src/
  core/       canvas, cores, textos, estilos, motor de animação
  methods/    um arquivo por método (mag.js, seis.js, …)
  elements/   Web Components (<geo-sim>, <geo-sim-lab>, …)
test/         testes dos modelos e do desenho (node:test)
docs/         demo publicada no GitHub Pages
wordpress/    plugin WordPress que usa o bundle
```

## Adicionando um método

1. Crie `src/methods/<id>.js` exportando `{ id, params, draw(S, t) }`. Exporte também as funções físicas puras (como `firstArrival` em `seis.js`) para poderem ser testadas.
2. Registre em `src/methods/index.js`.
3. Adicione os textos em `src/core/texts.js` (`methods`, `params`, `labels`).
4. Escreva testes em `test/`: pelo menos um que confira a fórmula e o teste de desenho já cobre coordenadas inválidas automaticamente.
5. `npm run build && npm test`.

### Regras para `draw(S, t)`

- `S` traz `ctx`, `w`, `h`, `C` (cores), `p` (parâmetros), `mini`, `labels`, `still` e `user`.
- Com `S.still`, desenhe um quadro final representativo, sem depender de `t`.
- Com `S.mini`, desenhe só a assinatura do método, sem textos nem cenário.
- Use `txt()` para textos: ele já respeita `labels` e `mini`.
- Fórmula real quando existir; quando o modelo for ilustrativo, diga isso no comentário e na descrição.

## Pull requests

- Um assunto por PR.
- Rode `npm run build` e inclua o `dist/` atualizado (a CI confere).
- Descreva o que mudou na física, se mudou, com referência.

## Conduta

Seja gentil e paciente. Muita gente aqui está aprendendo, seja geofísica, seja programação.
