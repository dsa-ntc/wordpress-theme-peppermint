<?php
/**
 * Server-rendered appearance switcher.
 *
 * @package NTC_Block
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$ntc_block_control_id = wp_unique_id( 'ntc-appearance-' );
?>
<div <?php echo get_block_wrapper_attributes(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?> >
	<button
		class="ntc-theme-switcher"
		type="button"
		aria-label="<?php esc_attr_e( 'Appearance: System', 'ntc-block' ); ?>"
		aria-expanded="false"
		aria-controls="<?php echo esc_attr( $ntc_block_control_id . '-panel' ); ?>"
		data-label-system="<?php esc_attr_e( 'Appearance: System', 'ntc-block' ); ?>"
		data-label-default="<?php esc_attr_e( 'Appearance: Site default', 'ntc-block' ); ?>"
		data-label-light="<?php esc_attr_e( 'Appearance: Light', 'ntc-block' ); ?>"
		data-label-dark="<?php esc_attr_e( 'Appearance: Dark', 'ntc-block' ); ?>"
		data-ntc-theme-switcher
		hidden
	>
		<svg class="ntc-theme-switcher__icon ntc-theme-switcher__icon--moon" aria-hidden="true" width="20" height="20" viewBox="0 0 20 20">
			<path d="M16.25 12.45A6.5 6.5 0 0 1 7.55 3.75 6.5 6.5 0 1 0 16.25 12.45Z" />
		</svg>
		<svg class="ntc-theme-switcher__icon ntc-theme-switcher__icon--sun" aria-hidden="true" width="20" height="20" viewBox="0 0 20 20">
			<circle cx="10" cy="10" r="3.25" />
			<path d="M10 1.5V4M10 16V18.5M1.5 10H4M16 10H18.5M4 4L5.75 5.75M14.25 14.25L16 16M16 4L14.25 5.75M5.75 14.25L4 16" />
		</svg>
	</button>
	<div class="ntc-theme-switcher__panel" id="<?php echo esc_attr( $ntc_block_control_id . '-panel' ); ?>" data-ntc-theme-panel hidden>
		<fieldset class="ntc-theme-switcher__choices" aria-describedby="<?php echo esc_attr( $ntc_block_control_id . '-help' ); ?>">
			<legend><?php esc_html_e( 'Appearance', 'ntc-block' ); ?></legend>
			<label class="ntc-theme-switcher__option">
				<input type="radio" name="<?php echo esc_attr( $ntc_block_control_id ); ?>" value="system" checked />
				<span data-ntc-system-label data-label-system="<?php esc_attr_e( 'System', 'ntc-block' ); ?>" data-label-default="<?php esc_attr_e( 'Site default', 'ntc-block' ); ?>"><?php esc_html_e( 'System', 'ntc-block' ); ?></span>
			</label>
			<label class="ntc-theme-switcher__option">
				<input type="radio" name="<?php echo esc_attr( $ntc_block_control_id ); ?>" value="light" />
				<span><?php esc_html_e( 'Light', 'ntc-block' ); ?></span>
			</label>
			<label class="ntc-theme-switcher__option">
				<input type="radio" name="<?php echo esc_attr( $ntc_block_control_id ); ?>" value="dark" />
				<span><?php esc_html_e( 'Dark', 'ntc-block' ); ?></span>
			</label>
		</fieldset>
		<p class="ntc-theme-switcher__help" id="<?php echo esc_attr( $ntc_block_control_id . '-help' ); ?>" data-ntc-appearance-help data-label-system="<?php esc_attr_e( 'System follows your device setting.', 'ntc-block' ); ?>" data-label-default="<?php esc_attr_e( 'Site default uses the appearance selected for this site.', 'ntc-block' ); ?>"><?php esc_html_e( 'System follows your device setting.', 'ntc-block' ); ?></p>
	</div>
</div>
