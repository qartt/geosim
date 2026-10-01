<?php
/**
 * Plugin Name:       Qartt GeoSim — Simulações Geofísicas
 * Plugin URI:        https://github.com/qartt/geosim
 * Description:       Shortcodes para a biblioteca GeoSim (Web Components): simulações didáticas de magnetometria, eletrorresistividade, GPR, sísmica de refração, gravimetria e TDEM, com parâmetros ajustáveis, painel interativo, grade de cards e mapa de isolinhas para hero.
 * Version:           2.0.0
 * Requires at least: 5.8
 * Requires PHP:      7.4
 * Author:            Qartt Tecnologia
 * Author URI:        https://qartt.com.br
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       qartt-geosim
 *
 * @package QarttGeoSim
 */

defined( 'ABSPATH' ) || exit;

define( 'GEOSIM_VERSION', '2.0.0' );
define( 'GEOSIM_FILE', __FILE__ );
define( 'GEOSIM_DIR', plugin_dir_path( __FILE__ ) );
define( 'GEOSIM_URL', plugin_dir_url( __FILE__ ) );

require_once GEOSIM_DIR . 'includes/class-geosim-plugin.php';
require_once GEOSIM_DIR . 'includes/class-geosim-admin.php';

add_action( 'plugins_loaded', array( 'GeoSim_Plugin', 'instance' ) );

if ( is_admin() ) {
	add_action( 'plugins_loaded', array( 'GeoSim_Admin', 'init' ) );
}

add_filter(
	'plugin_action_links_' . plugin_basename( __FILE__ ),
	static function ( $links ) {
		$url = admin_url( 'options-general.php?page=qartt-geosim' );
		array_unshift( $links, '<a href="' . esc_url( $url ) . '">' . esc_html__( 'Configurações', 'qartt-geosim' ) . '</a>' );
		return $links;
	}
);
