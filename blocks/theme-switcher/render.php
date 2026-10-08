<?php
/**
 * Server-rendered light/dark toggle.
 *
 * The page follows the site or system appearance until a visitor presses the
 * toggle. The script reveals the button and keeps aria-pressed in sync.
 *
 * @package Peppermint
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<div <?php echo get_block_wrapper_attributes(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?> >
	<button
		class="peppermint-theme-switcher"
		type="button"
		aria-pressed="false"
		aria-label="<?php esc_attr_e( 'Dark mode', 'peppermint' ); ?>"
		title="<?php esc_attr_e( 'Dark mode', 'peppermint' ); ?>"
		data-peppermint-theme-switcher
		hidden
	>
		<svg class="peppermint-theme-switcher__icon peppermint-theme-switcher__icon--moon" aria-hidden="true" width="20" height="20" viewBox="0 0 20 20">
			<path d="M16.25 12.45A6.5 6.5 0 0 1 7.55 3.75 6.5 6.5 0 1 0 16.25 12.45Z" />
		</svg>
		<svg class="peppermint-theme-switcher__icon peppermint-theme-switcher__icon--sun" aria-hidden="true" width="20" height="20" viewBox="0 0 20 20">
			<circle cx="10" cy="10" r="3.25" />
			<path d="M10 1.5V4M10 16V18.5M1.5 10H4M16 10H18.5M4 4L5.75 5.75M14.25 14.25L16 16M16 4L14.25 5.75M5.75 14.25L4 16" />
		</svg>
	</button>
</div>
