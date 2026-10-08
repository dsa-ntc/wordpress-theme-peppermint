<?php
/**
 * Title: Team and person grid
 * Slug: peppermint/team-person-grid
 * Categories: team, about
 * Description: A three-person team grid with names, roles, biographies, and areas of focus.
 * Keywords: team, people, staff, members, biographies
 * Viewport Width: 1280
 *
 * @package Peppermint
 */

?>
<!-- wp:group {"tagName":"section","align":"wide","className":"peppermint-pattern-team-grid","style":{"spacing":{"padding":{"top":"var:preset|spacing|50","bottom":"var:preset|spacing|50"}}},"layout":{"type":"constrained"}} -->
<section class="wp-block-group alignwide peppermint-pattern-team-grid" style="padding-top:var(--wp--preset--spacing--50);padding-bottom:var(--wp--preset--spacing--50)">
	<!-- wp:group {"align":"wide","layout":{"type":"constrained","contentSize":"52rem","justifyContent":"left"}} -->
	<div class="wp-block-group alignwide">
		<!-- wp:paragraph {"className":"eyebrow","textColor":"accent"} -->
		<p class="eyebrow has-accent-color has-text-color"><?php esc_html_e( 'Our team', 'peppermint' ); ?></p>
		<!-- /wp:paragraph -->

		<!-- wp:heading {"level":2,"style":{"spacing":{"margin":{"top":"0"}}},"fontSize":"x-large"} -->
		<h2 class="wp-block-heading has-x-large-font-size" style="margin-top:0"><?php esc_html_e( 'Meet the people doing the work.', 'peppermint' ); ?></h2>
		<!-- /wp:heading -->

		<!-- wp:paragraph {"textColor":"contrast-2"} -->
		<p class="has-contrast-2-color has-text-color"><?php esc_html_e( 'Introduce the members responsible for the project and make their areas of focus easy to understand.', 'peppermint' ); ?></p>
		<!-- /wp:paragraph -->
	</div>
	<!-- /wp:group -->

	<!-- wp:columns {"align":"wide","style":{"spacing":{"margin":{"top":"var:preset|spacing|40"},"blockGap":{"left":"var:preset|spacing|30"}}}} -->
	<div class="wp-block-columns alignwide" style="margin-top:var(--wp--preset--spacing--40)">
		<!-- wp:column -->
		<div class="wp-block-column">
			<!-- wp:group {"className":"team-member-card peppermint-pattern-person-card","style":{"spacing":{"padding":{"top":"var:preset|spacing|40","right":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40"}},"border":{"top":{"color":"var:preset|color|accent","width":"0.25rem"},"right":{"color":"var:preset|color|line","width":"1px"},"bottom":{"color":"var:preset|color|line","width":"1px"},"left":{"color":"var:preset|color|line","width":"1px"}}},"backgroundColor":"base-2","layout":{"type":"default"}} -->
			<div class="wp-block-group team-member-card peppermint-pattern-person-card has-base-2-background-color has-background" style="border-top-color:var(--wp--preset--color--accent);border-top-width:0.25rem;border-right-color:var(--wp--preset--color--line);border-right-width:1px;border-bottom-color:var(--wp--preset--color--line);border-bottom-width:1px;border-left-color:var(--wp--preset--color--line);border-left-width:1px;padding-top:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40);padding-left:var(--wp--preset--spacing--40)">
				<!-- wp:paragraph {"className":"eyebrow","textColor":"accent"} -->
				<p class="eyebrow has-accent-color has-text-color"><?php esc_html_e( 'Project lead', 'peppermint' ); ?></p>
				<!-- /wp:paragraph -->
				<!-- wp:heading {"level":3,"style":{"spacing":{"margin":{"top":"0"}}},"fontSize":"large"} -->
				<h3 class="wp-block-heading has-large-font-size" style="margin-top:0"><?php esc_html_e( 'Alex Morgan', 'peppermint' ); ?></h3>
				<!-- /wp:heading -->
				<!-- wp:paragraph -->
				<p><?php esc_html_e( 'Alex coordinates the roadmap and keeps the project accountable to member needs.', 'peppermint' ); ?></p>
				<!-- /wp:paragraph -->
				<!-- wp:paragraph {"textColor":"contrast-2","fontSize":"small"} -->
				<p class="has-contrast-2-color has-text-color has-small-font-size"><?php esc_html_e( 'Focus: strategy and facilitation', 'peppermint' ); ?></p>
				<!-- /wp:paragraph -->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column -->
		<div class="wp-block-column">
			<!-- wp:group {"className":"team-member-card peppermint-pattern-person-card","style":{"spacing":{"padding":{"top":"var:preset|spacing|40","right":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40"}},"border":{"top":{"color":"var:preset|color|accent","width":"0.25rem"},"right":{"color":"var:preset|color|line","width":"1px"},"bottom":{"color":"var:preset|color|line","width":"1px"},"left":{"color":"var:preset|color|line","width":"1px"}}},"backgroundColor":"base-2","layout":{"type":"default"}} -->
			<div class="wp-block-group team-member-card peppermint-pattern-person-card has-base-2-background-color has-background" style="border-top-color:var(--wp--preset--color--accent);border-top-width:0.25rem;border-right-color:var(--wp--preset--color--line);border-right-width:1px;border-bottom-color:var(--wp--preset--color--line);border-bottom-width:1px;border-left-color:var(--wp--preset--color--line);border-left-width:1px;padding-top:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40);padding-left:var(--wp--preset--spacing--40)">
				<!-- wp:paragraph {"className":"eyebrow","textColor":"accent"} -->
				<p class="eyebrow has-accent-color has-text-color"><?php esc_html_e( 'Design lead', 'peppermint' ); ?></p>
				<!-- /wp:paragraph -->
				<!-- wp:heading {"level":3,"style":{"spacing":{"margin":{"top":"0"}}},"fontSize":"large"} -->
				<h3 class="wp-block-heading has-large-font-size" style="margin-top:0"><?php esc_html_e( 'Jordan Rivera', 'peppermint' ); ?></h3>
				<!-- /wp:heading -->
				<!-- wp:paragraph -->
				<p><?php esc_html_e( 'Jordan turns research into clear, accessible experiences that work across devices.', 'peppermint' ); ?></p>
				<!-- /wp:paragraph -->
				<!-- wp:paragraph {"textColor":"contrast-2","fontSize":"small"} -->
				<p class="has-contrast-2-color has-text-color has-small-font-size"><?php esc_html_e( 'Focus: research and accessibility', 'peppermint' ); ?></p>
				<!-- /wp:paragraph -->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column -->
		<div class="wp-block-column">
			<!-- wp:group {"className":"team-member-card peppermint-pattern-person-card","style":{"spacing":{"padding":{"top":"var:preset|spacing|40","right":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40"}},"border":{"top":{"color":"var:preset|color|accent","width":"0.25rem"},"right":{"color":"var:preset|color|line","width":"1px"},"bottom":{"color":"var:preset|color|line","width":"1px"},"left":{"color":"var:preset|color|line","width":"1px"}}},"backgroundColor":"base-2","layout":{"type":"default"}} -->
			<div class="wp-block-group team-member-card peppermint-pattern-person-card has-base-2-background-color has-background" style="border-top-color:var(--wp--preset--color--accent);border-top-width:0.25rem;border-right-color:var(--wp--preset--color--line);border-right-width:1px;border-bottom-color:var(--wp--preset--color--line);border-bottom-width:1px;border-left-color:var(--wp--preset--color--line);border-left-width:1px;padding-top:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40);padding-left:var(--wp--preset--spacing--40)">
				<!-- wp:paragraph {"className":"eyebrow","textColor":"accent"} -->
				<p class="eyebrow has-accent-color has-text-color"><?php esc_html_e( 'Engineering lead', 'peppermint' ); ?></p>
				<!-- /wp:paragraph -->
				<!-- wp:heading {"level":3,"style":{"spacing":{"margin":{"top":"0"}}},"fontSize":"large"} -->
				<h3 class="wp-block-heading has-large-font-size" style="margin-top:0"><?php esc_html_e( 'Sam Kim', 'peppermint' ); ?></h3>
				<!-- /wp:heading -->
				<!-- wp:paragraph -->
				<p><?php esc_html_e( 'Sam builds maintainable systems and helps contributors ship improvements with confidence.', 'peppermint' ); ?></p>
				<!-- /wp:paragraph -->
				<!-- wp:paragraph {"textColor":"contrast-2","fontSize":"small"} -->
				<p class="has-contrast-2-color has-text-color has-small-font-size"><?php esc_html_e( 'Focus: architecture and mentoring', 'peppermint' ); ?></p>
				<!-- /wp:paragraph -->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:column -->
	</div>
	<!-- /wp:columns -->
</section>
<!-- /wp:group -->
