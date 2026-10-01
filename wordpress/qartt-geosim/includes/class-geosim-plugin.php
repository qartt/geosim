<?php
/**
 * Núcleo do plugin: carrega a biblioteca GeoSim e transforma shortcodes em Web Components.
 *
 * @package QarttGeoSim
 */

defined( 'ABSPATH' ) || exit;

final class GeoSim_Plugin {

	const OPTION = 'geosim_options';

	/** @var GeoSim_Plugin|null */
	private static $instance = null;

	/** @var int */
	private static $counter = 0;

	/** @var bool */
	private $registered = false;

	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		add_action( 'init', array( $this, 'register_shortcodes' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'register_assets' ) );
	}

	/* ------------------------------------------------------------------
	 * Dados
	 * ---------------------------------------------------------------- */

	/** @return array<string,string> chave do método => shortcode */
	public static function method_shortcodes() {
		return array(
			'mag'  => 'geosim_magnetometria',
			'res'  => 'geosim_eletrorresistividade',
			'gpr'  => 'geosim_gpr',
			'seis' => 'geosim_sismica',
			'grav' => 'geosim_gravimetria',
			'tdem' => 'geosim_tdem',
		);
	}

	/** Nomes exibidos no admin. */
	public static function method_names() {
		return array(
			'mag'  => __( 'Magnetometria', 'qartt-geosim' ),
			'res'  => __( 'Eletrorresistividade', 'qartt-geosim' ),
			'gpr'  => __( 'Georadar (GPR)', 'qartt-geosim' ),
			'seis' => __( 'Sísmica de refração', 'qartt-geosim' ),
			'grav' => __( 'Gravimetria', 'qartt-geosim' ),
			'tdem' => __( 'TDEM', 'qartt-geosim' ),
		);
	}

	/**
	 * Parâmetros ajustáveis por método (atributo => faixa aceita).
	 *
	 * @return array<string,array<string,array{0:float,1:float}>>
	 */
	public static function method_params() {
		return array(
			'mag'  => array(
				'profundidade'     => array( 20, 200 ),
				'inclinacao'       => array( -90, 90 ),
				'susceptibilidade' => array( 0.001, 0.2 ),
			),
			'res'  => array(
				'profundidade' => array( 5, 40 ),
				'rho'          => array( 1, 2000 ),
			),
			'gpr'  => array(
				'permissividade' => array( 3, 30 ),
				'profundidade'   => array( 0.3, 2.5 ),
			),
			'seis' => array(
				'v1'        => array( 300, 1500 ),
				'v2'        => array( 800, 5000 ),
				'espessura' => array( 2, 30 ),
			),
			'grav' => array(
				'profundidade' => array( 20, 200 ),
				'contraste'    => array( 0.1, 2 ),
			),
			'tdem' => array(
				'profundidade' => array( 20, 300 ),
			),
		);
	}

	public static function options() {
		$defaults = array(
			'theme'   => 'auto',
			'accent'  => '',
			'accent2' => '',
			'sky'     => '',
			'bg'      => '',
			'fg'      => '',
			'muted'   => '',
			'radius'  => 14,
		);
		$saved = get_option( self::OPTION, array() );
		return wp_parse_args( is_array( $saved ) ? $saved : array(), $defaults );
	}

	/** Aceita chave curta ou nome em português. */
	public static function normalize_key( $value ) {
		$value = remove_accents( strtolower( trim( (string) $value ) ) );
		$map   = array(
			'mag'                  => 'mag',
			'magnetometria'        => 'mag',
			'res'                  => 'res',
			'eletrorresistividade' => 'res',
			'resistividade'        => 'res',
			'gpr'                  => 'gpr',
			'georadar'             => 'gpr',
			'seis'                 => 'seis',
			'sismica'              => 'seis',
			'refracao'             => 'seis',
			'grav'                 => 'grav',
			'gravimetria'          => 'grav',
			'tdem'                 => 'tdem',
			'tem'                  => 'tdem',
		);
		return isset( $map[ $value ] ) ? $map[ $value ] : '';
	}

	private static function parse_list( $list ) {
		$out = array();
		foreach ( explode( ',', (string) $list ) as $item ) {
			$key = self::normalize_key( $item );
			if ( $key && ! in_array( $key, $out, true ) ) {
				$out[] = $key;
			}
		}
		return implode( ',', $out );
	}

	private static function bool( $value ) {
		return in_array( strtolower( trim( (string) $value ) ), array( '1', 'yes', 'sim', 'true', 'on' ), true );
	}

	/* ------------------------------------------------------------------
	 * Assets
	 * ---------------------------------------------------------------- */

	public function register_assets() {
		if ( $this->registered ) {
			return;
		}
		$this->registered = true;

		wp_register_script( 'geosim', GEOSIM_URL . 'assets/js/geosim.min.js', array(), GEOSIM_VERSION, true );

		/**
		 * Textos da biblioteca (mesma estrutura de GeoSim.TEXTS): methods, params, labels, ui.
		 * Ex.: add_filter( 'geosim_texts', fn( $t ) => array( 'methods' => array( 'gpr' => array( 'name' => 'GPR' ) ) ) );
		 */
		$texts = apply_filters( 'geosim_texts', array() );
		if ( ! empty( $texts ) && is_array( $texts ) ) {
			wp_add_inline_script( 'geosim', 'window.GeoSimConfig=' . wp_json_encode( array( 'texts' => $texts ) ) . ';', 'before' );
		}
	}

	private function enqueue() {
		if ( ! $this->registered ) {
			$this->register_assets();
		}
		wp_enqueue_script( 'geosim' );
	}

	/* ------------------------------------------------------------------
	 * Helpers de atributos
	 * ---------------------------------------------------------------- */

	private function common_defaults() {
		return array(
			'height'     => '',
			'theme'      => '',
			'accent'     => '',
			'accent2'    => '',
			'sky'        => '',
			'bg'         => '',
			'fg'         => '',
			'muted'      => '',
			'radius'     => '',
			'labels'     => '',
			'animate'    => '',
			'class'      => '',
			'id'         => '',
			'aria_label' => '',
		);
	}

	private function element_id( $custom, $prefix ) {
		$custom = sanitize_html_class( (string) $custom );
		if ( $custom ) {
			return $custom;
		}
		self::$counter++;
		return $prefix . '-' . self::$counter;
	}

	private function theme( $value ) {
		$value = strtolower( trim( (string) $value ) );
		if ( ! in_array( $value, array( 'auto', 'dark', 'light' ), true ) ) {
			$value = self::options()['theme'];
		}
		return in_array( $value, array( 'dark', 'light' ), true ) ? $value : '';
	}

	/** CSS custom properties: atributo do shortcode > opção global > padrão da biblioteca. */
	private function style_vars( array $a ) {
		$opt  = self::options();
		$vars = array();
		foreach ( array( 'accent', 'accent2', 'sky', 'bg', 'fg', 'muted' ) as $k ) {
			$color = sanitize_hex_color( $a[ $k ] );
			if ( ! $color ) {
				$color = sanitize_hex_color( (string) $opt[ $k ] );
			}
			if ( $color ) {
				$vars[] = '--gs-' . $k . ':' . $color;
			}
		}
		$radius = '' !== (string) $a['radius'] ? absint( $a['radius'] ) : absint( $opt['radius'] );
		$vars[] = '--gs-radius:' . min( 60, $radius ) . 'px';
		return implode( ';', $vars );
	}

	/**
	 * Monta a lista de atributos HTML já escapados.
	 *
	 * @param array<string,string|null> $attrs nome => valor (null = atributo booleano sem valor).
	 */
	private function attrs( array $attrs ) {
		$out = '';
		foreach ( $attrs as $name => $value ) {
			if ( false === $value || '' === $value ) {
				continue;
			}
			$out .= null === $value ? ' ' . $name : ' ' . $name . '="' . esc_attr( $value ) . '"';
		}
		return $out;
	}

	private function base_attrs( array $a, $prefix, $class_base ) {
		$classes = array( $class_base );
		foreach ( preg_split( '/\s+/', (string) $a['class'] ) as $c ) {
			$c = sanitize_html_class( $c );
			if ( $c ) {
				$classes[] = $c;
			}
		}
		$out = array(
			'id'    => $this->element_id( $a['id'], $prefix ),
			'class' => implode( ' ', $classes ),
			'theme' => $this->theme( $a['theme'] ),
			'style' => $this->style_vars( $a ),
		);
		if ( '' !== $a['labels'] && ! self::bool( $a['labels'] ) ) {
			$out['labels'] = 'no';
		}
		if ( '' !== $a['animate'] && ! self::bool( $a['animate'] ) ) {
			$out['animate'] = 'no';
		}
		return $out;
	}

	private function height_attr( $value, $allow_auto = false ) {
		$value = strtolower( trim( (string) $value ) );
		if ( $allow_auto && 'auto' === $value ) {
			return 'auto';
		}
		$h = absint( $value );
		return $h ? (string) max( 40, min( 1400, $h ) ) : '';
	}

	/* ------------------------------------------------------------------
	 * Shortcodes
	 * ---------------------------------------------------------------- */

	public function register_shortcodes() {
		foreach ( self::method_shortcodes() as $key => $tag ) {
			add_shortcode(
				$tag,
				function ( $atts ) use ( $key, $tag ) {
					return $this->render_method( $key, (array) $atts, $tag );
				}
			);
		}
		add_shortcode( 'geosim', array( $this, 'shortcode_generic' ) );
		add_shortcode( 'geosim_lab', array( $this, 'shortcode_lab' ) );
		add_shortcode( 'geosim_cards', array( $this, 'shortcode_cards' ) );
		add_shortcode( 'geosim_campo', array( $this, 'shortcode_field' ) );
	}

	public function shortcode_generic( $atts ) {
		$atts = (array) $atts;
		$raw  = isset( $atts['metodo'] ) ? $atts['metodo'] : ( isset( $atts['method'] ) ? $atts['method'] : '' );
		$key  = self::normalize_key( $raw );
		if ( ! $key ) {
			return current_user_can( 'edit_posts' ) ? '<p><em>[geosim] ' . esc_html__( 'informe metodo="mag|res|gpr|seis|grav|tdem".', 'qartt-geosim' ) . '</em></p>' : '';
		}
		unset( $atts['metodo'], $atts['method'] );
		return $this->render_method( $key, $atts, 'geosim' );
	}

	/** <geo-sim> isolado. */
	public function render_method( $key, array $atts, $tag ) {
		$params   = self::method_params();
		$defaults = array_merge(
			$this->common_defaults(),
			array(
				'mini'     => '',
				'info'     => '',
				'controls' => '',
			),
			array_fill_keys( array_keys( $params[ $key ] ), '' )
		);
		$a = shortcode_atts( $defaults, $atts, $tag );
		$this->enqueue();

		$attrs            = $this->base_attrs( $a, 'geosim', 'geosim' );
		$attrs['metodo']  = $key;
		$attrs['height']  = $this->height_attr( $a['height'] );
		$attrs['mini']    = self::bool( $a['mini'] ) ? null : false;
		$attrs['info']    = self::bool( $a['info'] ) ? null : false;
		$attrs['controls'] = self::bool( $a['controls'] ) ? null : false;
		if ( '' !== $a['aria_label'] ) {
			$attrs['aria-label'] = $a['aria_label'];
		}
		foreach ( $params[ $key ] as $p => $range ) {
			if ( '' !== trim( (string) $a[ $p ] ) && is_numeric( $a[ $p ] ) ) {
				$attrs[ $p ] = (string) max( $range[0], min( $range[1], (float) $a[ $p ] ) );
			}
		}

		return '<geo-sim' . $this->attrs( $attrs ) . '></geo-sim>';
	}

	/** <geo-sim-lab> com seletor de métodos. */
	public function shortcode_lab( $atts ) {
		$a = shortcode_atts(
			array_merge(
				$this->common_defaults(),
				array(
					'metodos'  => '',
					'inicial'  => '',
					'info'     => '',
					'controls' => '',
				)
			),
			$atts,
			'geosim_lab'
		);
		$this->enqueue();

		$attrs             = $this->base_attrs( $a, 'geosim-lab', 'geosim-lab' );
		$attrs['metodos']  = self::parse_list( $a['metodos'] );
		$attrs['inicial']  = self::normalize_key( $a['inicial'] );
		$attrs['height']   = $this->height_attr( $a['height'], true );
		$attrs['controls'] = self::bool( $a['controls'] ) ? null : false;
		if ( '' !== $a['info'] && ! self::bool( $a['info'] ) ) {
			$attrs['info'] = 'no';
		}

		return '<geo-sim-lab' . $this->attrs( $attrs ) . '></geo-sim-lab>';
	}

	/** <geo-sim-cards> — grade de mini simulações. */
	public function shortcode_cards( $atts ) {
		$a = shortcode_atts(
			array_merge(
				$this->common_defaults(),
				array(
					'metodos' => '',
					'alvo'    => '',
					'link'    => '',
					'colunas' => '',
				)
			),
			$atts,
			'geosim_cards'
		);
		$this->enqueue();

		$attrs            = $this->base_attrs( $a, 'geosim-cards', 'geosim-cards' );
		$attrs['metodos'] = self::parse_list( $a['metodos'] );
		$attrs['alvo']    = sanitize_html_class( $a['alvo'] );
		$attrs['link']    = '' !== $a['link'] ? esc_url_raw( $a['link'] ) : '';
		$attrs['colunas'] = absint( $a['colunas'] ) ? (string) min( 6, absint( $a['colunas'] ) ) : '';
		$attrs['height']  = $this->height_attr( $a['height'] );

		return '<geo-sim-cards' . $this->attrs( $attrs ) . '></geo-sim-cards>';
	}

	/** <geo-sim-field> — mapa de isolinhas; o conteúdo vira sobreposição. */
	public function shortcode_field( $atts, $content = null ) {
		$a = shortcode_atts(
			array_merge(
				$this->common_defaults(),
				array(
					'readout'    => '',
					'interativo' => '',
				)
			),
			$atts,
			'geosim_campo'
		);
		$this->enqueue();

		$attrs           = $this->base_attrs( $a, 'geosim-campo', 'geosim-campo' );
		$attrs['height'] = $this->height_attr( $a['height'] );
		if ( '' !== $a['readout'] && ! self::bool( $a['readout'] ) ) {
			$attrs['readout'] = 'no';
		}
		if ( '' !== $a['interativo'] && ! self::bool( $a['interativo'] ) ) {
			$attrs['interativo'] = 'no';
		}
		$inner = null !== $content ? do_shortcode( shortcode_unautop( trim( $content ) ) ) : '';

		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- $inner é conteúdo do editor já processado pelo WordPress.
		return '<geo-sim-field' . $this->attrs( $attrs ) . '>' . $inner . '</geo-sim-field>';
	}
}
