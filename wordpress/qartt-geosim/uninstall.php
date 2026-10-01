<?php
/**
 * Remove as opções do plugin ao desinstalar.
 *
 * @package QarttGeoSim
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

delete_option( 'geosim_options' );
