/**
 * Textos da interface (pt-BR por padrão). Tudo pode ser trocado com setTexts().
 */
export const TEXTS = {
	locale: 'pt-BR',
	methods: {
		mag: {
			name: 'Magnetometria',
			unit: 'nT',
			prop: 'Susceptibilidade magnética',
			app: 'Exploração mineral, óleo e gás, estruturas',
			meta: 'Perfil · esfera magnetizada por indução',
			desc: 'O sensor registra pequenas variações do campo magnético da Terra causadas por rochas e minerais magnéticos. A forma da anomalia depende da inclinação do campo local, e a amplitude cai com o cubo da profundidade.'
		},
		res: {
			name: 'Eletrorresistividade',
			unit: 'Ω·m',
			prop: 'Resistividade elétrica',
			app: 'Água subterrânea, barragens, obras, mineração',
			meta: 'Pseudosseção · dipolo-dipolo',
			desc: 'Injeta-se corrente no solo e mede-se a diferença de potencial entre eletrodos. A pseudosseção mostra zonas condutivas, como argila e água, e resistivas, como rocha sã e diques.'
		},
		gpr: {
			name: 'Georadar (GPR)',
			unit: 'ns',
			prop: 'Permissividade dielétrica',
			app: 'Interferências, pavimentos, indústria, fundações',
			meta: 'Radargrama · perfil de 10 m',
			desc: 'Pulsos eletromagnéticos refletem em contrastes do subsolo. Tubulações aparecem como hipérboles, e a velocidade da onda, que depende da permissividade, define a abertura das hipérboles e a profundidade alcançada.'
		},
		seis: {
			name: 'Sísmica de refração',
			unit: 'm/s',
			prop: 'Velocidade da onda P',
			app: 'Topo rochoso, escavabilidade, obras',
			meta: '24 geofones · espaçamento 5 m',
			desc: 'Uma fonte gera ondas que se refratam no contato com a camada mais rápida. Depois da distância crítica, a onda refratada chega antes da direta, e a quebra na curva de tempos revela velocidade e profundidade do refrator.'
		},
		grav: {
			name: 'Gravimetria',
			unit: 'mGal',
			prop: 'Densidade',
			app: 'Bacias, corpos densos, óleo e gás',
			meta: 'Anomalia Bouguer · esfera de 40 m de raio',
			desc: 'Corpos mais densos aumentam levemente a aceleração da gravidade. Quanto mais profundo o corpo, mais larga e suave fica a anomalia medida em superfície.'
		},
		tdem: {
			name: 'TDEM',
			unit: 'V/A·m²',
			prop: 'Condutividade elétrica',
			app: 'Aquíferos profundos, alvos condutivos',
			meta: 'Loop coincidente 100 × 100 m',
			desc: 'A corrente na bobina é cortada de forma abrupta e mede-se o decaimento do campo induzido no subsolo. Tempos mais longos enxergam camadas mais profundas.'
		}
	},
	params: {
		profundidade: 'Profundidade',
		inclinacao: 'Inclinação do campo',
		susceptibilidade: 'Susceptibilidade',
		contraste: 'Contraste de densidade',
		v1: 'Velocidade da camada 1',
		v2: 'Velocidade da camada 2',
		espessura: 'Espessura da camada 1',
		rho: 'Resistividade do alvo',
		permissividade: 'Permissividade relativa'
	},
	labels: {
		surface: 'superfície',
		magBody: 'corpo magnético',
		densBody: 'corpo denso',
		depth: 'z = %s m',
		peak: 'pico ≈ %s',
		magAxis: 'ΔT (nT)',
		gravAxis: 'Δg Bouguer (mGal)',
		electrodes: 'eletrodos · espaçamento 10 m',
		target: 'alvo de %s Ω·m a ~%s m',
		gprTime: 't (ns)',
		gprHint: 'hipérboles = tubulações',
		velocity: 'v = %s m/ns',
		source: 'fonte',
		firstArrival: 'tempo de 1ª chegada',
		v1: 'V1 = %s m/s',
		v2: 'V2 = %s m/s · refrator',
		crossover: 'distância crítica ≈ %s m · intercepto ≈ %s ms',
		noRefraction: 'sem refração: V2 ≤ V1',
		loop: 'loop transmissor',
		dbdt: 'log dB/dt',
		logt: 'log t (µs → ms)',
		conductive: 'camada condutiva ~%s m'
	},
	ui: {
		property: 'Propriedade',
		unit: 'Unidade',
		applications: 'Aplicações',
		methods: 'Métodos geofísicos',
		simulation: 'Simulação ilustrativa',
		reset: 'Restaurar valores'
	}
};

const listeners = new Set();

function isObj(v) {
	return v && typeof v === 'object' && !Array.isArray(v);
}

function merge(target, patch) {
	Object.keys(patch).forEach((k) => {
		if (isObj(patch[k]) && isObj(target[k])) merge(target[k], patch[k]);
		else target[k] = patch[k];
	});
	return target;
}

/** Mescla textos novos e redesenha todos os componentes. */
export function setTexts(patch) {
	if (isObj(patch)) merge(TEXTS, patch);
	listeners.forEach((fn) => fn());
}

export function onTexts(fn) {
	listeners.add(fn);
	return () => listeners.delete(fn);
}

/** Rótulo com substituição sequencial de %s. */
export function lb(key, ...args) {
	let s = TEXTS.labels[key] != null ? String(TEXTS.labels[key]) : key;
	args.forEach((a) => { s = s.replace('%s', a); });
	return s;
}

export function fmt(n, decimals = 0) {
	try {
		return Number(n).toLocaleString(TEXTS.locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
	} catch (e) {
		return Number(n).toFixed(decimals);
	}
}

export function esc(s) {
	return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
