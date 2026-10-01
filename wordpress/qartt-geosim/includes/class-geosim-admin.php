<?php
/**
 * Página de configurações: cores padrão e referência de shortcodes.
 *
 * @package QarttGeoSim
 */

defined( 'ABSPATH' ) || exit;

final class GeoSim_Admin {

	const PAGE = 'qartt-geosim';

	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'menu' ) );
		add_action( 'admin_init', array( __CLASS__, 'settings' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'assets' ) );
	}

	public static function menu() {
		add_options_page(
			__( 'GeoSim — Simulações Geofísicas', 'qartt-geosim' ),
			__( 'GeoSim', 'qartt-geosim' ),
			'manage_options',
			self::PAGE,
			array( __CLASS__, 'render' )
		);
	}

	public static function assets( $hook ) {
		if ( 'settings_page_' . self::PAGE !== $hook ) {
			return;
		}
		wp_enqueue_style( 'wp-color-picker' );
		wp_enqueue_script( 'wp-color-picker' );
		wp_add_inline_script( 'wp-color-picker', 'jQuery(function($){$(".geosim-color").wpColorPicker();});' );
		wp_add_inline_style( 'wp-color-picker', '.geosim-docs code{font-size:12px}.geosim-docs td,.geosim-docs th{vertical-align:top}.geosim-docs pre{background:#f6f7f7;border:1px solid #dcdcde;padding:10px 12px;overflow:auto;max-width:900px}' );
	}

	public static function settings() {
		register_setting(
			'geosim_group',
			GeoSim_Plugin::OPTION,
			array(
				'type'              => 'array',
				'sanitize_callback' => array( __CLASS__, 'sanitize' ),
				'default'           => array(),
			)
		);
	}

	public static function sanitize( $input ) {
		$input = is_array( $input ) ? $input : array();
		$out   = array();
		$theme = isset( $input['theme'] ) ? sanitize_key( $input['theme'] ) : 'auto';
		$out['theme'] = in_array( $theme, array( 'auto', 'dark', 'light' ), true ) ? $theme : 'auto';
		foreach ( array( 'accent', 'accent2', 'sky', 'bg', 'fg', 'muted' ) as $k ) {
			$val       = isset( $input[ $k ] ) ? sanitize_hex_color( $input[ $k ] ) : '';
			$out[ $k ] = $val ? $val : '';
		}
		$out['radius'] = isset( $input['radius'] ) ? min( 60, absint( $input['radius'] ) ) : 14;
		return $out;
	}

	public static function render() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$o      = GeoSim_Plugin::options();
		$name   = GeoSim_Plugin::OPTION;
		$colors = array(
			'accent'  => __( 'Destaque (curvas, corpos)', 'qartt-geosim' ),
			'accent2' => __( 'Destaque secundário', 'qartt-geosim' ),
			'sky'     => __( 'Azul do subsolo', 'qartt-geosim' ),
			'bg'      => __( 'Fundo', 'qartt-geosim' ),
			'fg'      => __( 'Texto / traços', 'qartt-geosim' ),
			'muted'   => __( 'Texto secundário / grades', 'qartt-geosim' ),
		);
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'GeoSim — Simulações Geofísicas', 'qartt-geosim' ); ?></h1>

			<form method="post" action="options.php">
				<?php settings_fields( 'geosim_group' ); ?>
				<h2><?php esc_html_e( 'Aparência padrão', 'qartt-geosim' ); ?></h2>
				<p><?php esc_html_e( 'Cores em branco usam a paleta do tema escolhido. Qualquer atributo no shortcode sobrescreve estes valores.', 'qartt-geosim' ); ?></p>
				<table class="form-table" role="presentation">
					<tr>
						<th scope="row"><label for="geosim-theme"><?php esc_html_e( 'Tema', 'qartt-geosim' ); ?></label></th>
						<td>
							<select id="geosim-theme" name="<?php echo esc_attr( $name ); ?>[theme]">
								<option value="auto" <?php selected( $o['theme'], 'auto' ); ?>><?php esc_html_e( 'Automático (segue o sistema do visitante)', 'qartt-geosim' ); ?></option>
								<option value="dark" <?php selected( $o['theme'], 'dark' ); ?>><?php esc_html_e( 'Escuro', 'qartt-geosim' ); ?></option>
								<option value="light" <?php selected( $o['theme'], 'light' ); ?>><?php esc_html_e( 'Claro', 'qartt-geosim' ); ?></option>
							</select>
						</td>
					</tr>
					<?php foreach ( $colors as $k => $label ) : ?>
						<tr>
							<th scope="row"><label for="geosim-<?php echo esc_attr( $k ); ?>"><?php echo esc_html( $label ); ?></label></th>
							<td><input type="text" class="geosim-color" id="geosim-<?php echo esc_attr( $k ); ?>" name="<?php echo esc_attr( $name . '[' . $k . ']' ); ?>" value="<?php echo esc_attr( $o[ $k ] ); ?>"></td>
						</tr>
					<?php endforeach; ?>
					<tr>
						<th scope="row"><label for="geosim-radius"><?php esc_html_e( 'Arredondamento (px)', 'qartt-geosim' ); ?></label></th>
						<td><input type="number" min="0" max="60" id="geosim-radius" name="<?php echo esc_attr( $name ); ?>[radius]" value="<?php echo esc_attr( (string) $o['radius'] ); ?>" class="small-text"></td>
					</tr>
				</table>
				<?php submit_button( __( 'Salvar alterações', 'qartt-geosim' ) ); ?>
			</form>

			<hr>
			<div class="geosim-docs">
				<h2><?php esc_html_e( 'Shortcodes', 'qartt-geosim' ); ?></h2>
				<table class="widefat striped" style="max-width:1000px">
					<thead><tr><th><?php esc_html_e( 'Shortcode', 'qartt-geosim' ); ?></th><th><?php esc_html_e( 'O que mostra', 'qartt-geosim' ); ?></th></tr></thead>
					<tbody>
						<?php foreach ( GeoSim_Plugin::method_shortcodes() as $key => $tag ) : ?>
							<tr><td><code>[<?php echo esc_html( $tag ); ?>]</code></td><td><?php echo esc_html( GeoSim_Plugin::method_names()[ $key ] ); ?> — <?php esc_html_e( 'parâmetros:', 'qartt-geosim' ); ?> <code><?php echo esc_html( implode( ', ', array_keys( GeoSim_Plugin::method_params()[ $key ] ) ) ); ?></code></td></tr>
						<?php endforeach; ?>
						<tr><td><code>[geosim metodo="gpr"]</code></td><td><?php esc_html_e( 'Atalho genérico (mag, res, gpr, seis, grav, tdem — aceita também os nomes em português).', 'qartt-geosim' ); ?></td></tr>
						<tr><td><code>[geosim_lab]</code></td><td><?php esc_html_e( 'Painel com botões para alternar entre os métodos, canvas e ficha técnica.', 'qartt-geosim' ); ?></td></tr>
						<tr><td><code>[geosim_cards]</code></td><td><?php esc_html_e( 'Grade de mini simulações. Com alvo="id-do-lab", cada card troca o método do painel.', 'qartt-geosim' ); ?></td></tr>
						<tr><td><code>[geosim_campo]…[/geosim_campo]</code></td><td><?php esc_html_e( 'Mapa de isolinhas magnéticas que segue o mouse. O conteúdo entre as tags vira sobreposição (ideal para hero).', 'qartt-geosim' ); ?></td></tr>
					</tbody>
				</table>

				<h3><?php esc_html_e( 'Atributos comuns', 'qartt-geosim' ); ?></h3>
				<table class="widefat striped" style="max-width:1000px">
					<tbody>
						<tr><td><code>height</code></td><td><?php esc_html_e( 'Altura em px. Padrões: método 360, mini 90, card 70, campo 520, lab automático (height="auto").', 'qartt-geosim' ); ?></td></tr>
						<tr><td><code>theme</code></td><td>auto | dark | light</td></tr>
						<tr><td><code>accent, accent2, sky, bg, fg, muted</code></td><td><?php esc_html_e( 'Cores em hexadecimal, ex.: accent="#73f02c".', 'qartt-geosim' ); ?></td></tr>
						<tr><td><code>radius</code></td><td><?php esc_html_e( 'Arredondamento em px.', 'qartt-geosim' ); ?></td></tr>
						<tr><td><code>labels</code></td><td><?php esc_html_e( 'yes/no — textos dentro do canvas.', 'qartt-geosim' ); ?></td></tr>
						<tr><td><code>animate</code></td><td><?php esc_html_e( 'yes/no — no = quadro estático (também automático com "reduzir movimento" do sistema).', 'qartt-geosim' ); ?></td></tr>
						<tr><td><code>info</code></td><td><?php esc_html_e( 'yes/no — ficha técnica abaixo do canvas (métodos e lab).', 'qartt-geosim' ); ?></td></tr>
						<tr><td><code>controls</code></td><td><?php esc_html_e( 'yes/no — sliders para ajustar os parâmetros do método (métodos e lab).', 'qartt-geosim' ); ?></td></tr>
						<tr><td><code>profundidade, v1, v2, …</code></td><td><?php esc_html_e( 'Valor inicial de cada parâmetro físico. Ex.: [geosim_sismica v1="800" v2="3000" espessura="15"].', 'qartt-geosim' ); ?></td></tr>
						<tr><td><code>mini</code></td><td><?php esc_html_e( 'yes/no — versão compacta sem cenário (métodos).', 'qartt-geosim' ); ?></td></tr>
						<tr><td><code>metodos, inicial</code></td><td><?php esc_html_e( 'Lab e cards: lista e método inicial, ex.: metodos="mag,res,gpr" inicial="res".', 'qartt-geosim' ); ?></td></tr>
						<tr><td><code>alvo, link, colunas</code></td><td><?php esc_html_e( 'Cards: id do lab a controlar, URL de destino, número fixo de colunas.', 'qartt-geosim' ); ?></td></tr>
						<tr><td><code>readout, interativo</code></td><td><?php esc_html_e( 'Campo: mostrar coordenadas/valor e seguir o mouse.', 'qartt-geosim' ); ?></td></tr>
						<tr><td><code>id, class, aria_label</code></td><td><?php esc_html_e( 'Identificação, classes extras e descrição acessível.', 'qartt-geosim' ); ?></td></tr>
					</tbody>
				</table>

				<h3><?php esc_html_e( 'Exemplos', 'qartt-geosim' ); ?></h3>
<pre>[geosim_campo height="560"]
&lt;h1&gt;Enxergamos o subsolo&lt;/h1&gt;
&lt;p&gt;Geofísica aplicada à mineração, água e obras.&lt;/p&gt;
[/geosim_campo]

[geosim_cards alvo="metodos" colunas="3"]
[geosim_lab id="metodos" inicial="mag" controls="yes"]

[geosim_sismica height="420" info="yes" controls="yes" v2="3000"]
[geosim_gpr theme="light" accent="#1a7f3c" labels="no"]</pre>

				<h3><?php esc_html_e( 'Filtros para desenvolvedores', 'qartt-geosim' ); ?></h3>
				<p><code>geosim_texts</code> — <?php esc_html_e( 'altera qualquer texto da biblioteca (methods, params, labels, ui), com a mesma estrutura de GeoSim.TEXTS.', 'qartt-geosim' ); ?></p>
			</div>
		</div>
		<?php
	}
}
