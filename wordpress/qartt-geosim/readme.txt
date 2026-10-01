=== Qartt GeoSim — Simulações Geofísicas ===
Contributors: qartt
Tags: geofísica, web components, shortcode, educação, mineração
Requires at least: 5.8
Tested up to: 6.8
Requires PHP: 7.4
Stable tag: 2.0.0
License: GPLv2 or later

Shortcodes para a biblioteca open source GeoSim: simulações geofísicas didáticas com parâmetros ajustáveis.

== Shortcodes ==

[geosim_magnetometria]        profundidade, inclinacao, susceptibilidade
[geosim_eletrorresistividade] profundidade, rho
[geosim_gpr]                  permissividade, profundidade
[geosim_sismica]              v1, v2, espessura
[geosim_gravimetria]          profundidade, contraste
[geosim_tdem]                 profundidade
[geosim metodo="gpr"]         atalho genérico
[geosim_lab]                  painel com seletor de métodos
[geosim_cards alvo="id-lab"]  grade de mini simulações
[geosim_campo]...[/geosim_campo]  mapa de isolinhas (hero)

Atributos comuns: height, theme (auto|dark|light), accent, accent2, sky, bg, fg, muted, radius,
labels, animate, controls, info, mini, id, class, aria_label.

Referência completa em Configurações → GeoSim.

== Filtro ==

geosim_texts — altera qualquer texto da biblioteca (methods, params, labels, ui).

== Changelog ==

= 2.0.0 =
* Passa a usar a biblioteca GeoSim (Web Components).
* Parâmetros físicos ajustáveis e controles deslizantes.
* Fórmulas reais em sísmica de refração, gravimetria, magnetometria e GPR.

= 1.0.0 =
* Versão inicial.
