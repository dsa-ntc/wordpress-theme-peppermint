<?php
/**
 * Title: Project landing page starter
 * Slug: peppermint/project-landing-page
 * Categories: featured, text, call-to-action
 * Description: A complete project page starter with an introduction, approach, outcomes, and next step.
 * Keywords: project, landing page, starter, campaign, page
 * Viewport Width: 1280
 * Block Types: core/post-content
 * Post Types: page
 *
 * @package Peppermint
 */

?>
<!-- wp:group {"tagName":"section","align":"wide","className":"peppermint-pattern-project-page","layout":{"type":"constrained"}} -->
<section class="wp-block-group alignwide peppermint-pattern-project-page">
	<!-- wp:group {"align":"wide","style":{"spacing":{"padding":{"top":"var:preset|spacing|50","bottom":"var:preset|spacing|50"}},"border":{"top":{"color":"var:preset|color|accent","width":"0.5rem"}}},"layout":{"type":"constrained","contentSize":"52rem","justifyContent":"left"}} -->
	<div class="wp-block-group alignwide" style="border-top-color:var(--wp--preset--color--accent);border-top-width:0.5rem;padding-top:var(--wp--preset--spacing--50);padding-bottom:var(--wp--preset--spacing--50)">
		<!-- wp:paragraph {"className":"eyebrow","textColor":"accent"} -->
		<p class="eyebrow has-accent-color has-text-color"><?php esc_html_e( 'Project overview', 'peppermint' ); ?></p>
		<!-- /wp:paragraph -->

		<!-- wp:heading {"level":1,"style":{"spacing":{"margin":{"top":"0"}}},"fontSize":"display"} -->
		<h1 class="wp-block-heading has-display-font-size" style="margin-top:0"><?php esc_html_e( 'Build power with practical technology.', 'peppermint' ); ?></h1>
		<!-- /wp:heading -->

		<!-- wp:paragraph {"textColor":"contrast-2","fontSize":"large"} -->
		<p class="has-contrast-2-color has-text-color has-large-font-size"><?php esc_html_e( 'State the project goal, the people it supports, and the change you are working to make.', 'peppermint' ); ?></p>
		<!-- /wp:paragraph -->

		<!-- wp:buttons -->
		<div class="wp-block-buttons">
			<!-- wp:button -->
			<div class="wp-block-button"><a class="wp-block-button__link wp-element-button"><?php esc_html_e( 'Join the project', 'peppermint' ); ?></a></div>
			<!-- /wp:button -->
		</div>
		<!-- /wp:buttons -->
	</div>
	<!-- /wp:group -->

	<!-- wp:separator {"align":"wide","backgroundColor":"line","className":"is-style-wide"} -->
	<hr class="wp-block-separator alignwide has-text-color has-line-color has-alpha-channel-opacity has-line-background-color has-background is-style-wide"/>
	<!-- /wp:separator -->

	<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"var:preset|spacing|50"},"margin":{"top":"var:preset|spacing|50","bottom":"var:preset|spacing|50"}}}} -->
	<div class="wp-block-columns alignwide" style="margin-top:var(--wp--preset--spacing--50);margin-bottom:var(--wp--preset--spacing--50)">
		<!-- wp:column -->
		<div class="wp-block-column">
			<!-- wp:heading {"level":3,"style":{"spacing":{"margin":{"top":"0"}}},"fontSize":"x-large"} -->
			<h3 class="wp-block-heading has-x-large-font-size" style="margin-top:0"><?php esc_html_e( 'The challenge', 'peppermint' ); ?></h3>
			<!-- /wp:heading -->

			<!-- wp:paragraph -->
			<p><?php esc_html_e( 'Describe the problem in concrete terms. Include who is affected and why the current situation needs to change.', 'peppermint' ); ?></p>
			<!-- /wp:paragraph -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column -->
		<div class="wp-block-column">
			<!-- wp:heading {"level":3,"style":{"spacing":{"margin":{"top":"0"}}},"fontSize":"x-large"} -->
			<h3 class="wp-block-heading has-x-large-font-size" style="margin-top:0"><?php esc_html_e( 'Our approach', 'peppermint' ); ?></h3>
			<!-- /wp:heading -->

			<!-- wp:paragraph -->
			<p><?php esc_html_e( 'Explain the strategy, the work already underway, and how members or partners shape the project.', 'peppermint' ); ?></p>
			<!-- /wp:paragraph -->
		</div>
		<!-- /wp:column -->
	</div>
	<!-- /wp:columns -->

	<!-- wp:group {"align":"wide","className":"peppermint-pattern-project-page__outcomes","style":{"spacing":{"padding":{"top":"var:preset|spacing|50","right":"var:preset|spacing|40","bottom":"var:preset|spacing|50","left":"var:preset|spacing|40"}}},"backgroundColor":"base-2","layout":{"type":"constrained"}} -->
	<div class="wp-block-group alignwide peppermint-pattern-project-page__outcomes has-base-2-background-color has-background" style="padding-top:var(--wp--preset--spacing--50);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--50);padding-left:var(--wp--preset--spacing--40)">
		<!-- wp:heading {"level":2,"style":{"spacing":{"margin":{"top":"0"}}},"fontSize":"x-large"} -->
		<h2 class="wp-block-heading has-x-large-font-size" style="margin-top:0"><?php esc_html_e( 'What this project delivers', 'peppermint' ); ?></h2>
		<!-- /wp:heading -->

		<!-- wp:columns {"align":"wide"} -->
		<div class="wp-block-columns alignwide">
			<!-- wp:column -->
			<div class="wp-block-column">
				<!-- wp:heading {"level":3,"fontSize":"large"} -->
				<h3 class="wp-block-heading has-large-font-size"><?php esc_html_e( 'Useful resources', 'peppermint' ); ?></h3>
				<!-- /wp:heading -->
				<!-- wp:paragraph -->
				<p><?php esc_html_e( 'Name a concrete tool, service, or resource people can use.', 'peppermint' ); ?></p>
				<!-- /wp:paragraph -->
			</div>
			<!-- /wp:column -->

			<!-- wp:column -->
			<div class="wp-block-column">
				<!-- wp:heading {"level":3,"fontSize":"large"} -->
				<h3 class="wp-block-heading has-large-font-size"><?php esc_html_e( 'Shared knowledge', 'peppermint' ); ?></h3>
				<!-- /wp:heading -->
				<!-- wp:paragraph -->
				<p><?php esc_html_e( 'Show how the work helps people learn from one another.', 'peppermint' ); ?></p>
				<!-- /wp:paragraph -->
			</div>
			<!-- /wp:column -->

			<!-- wp:column -->
			<div class="wp-block-column">
				<!-- wp:heading {"level":3,"fontSize":"large"} -->
				<h3 class="wp-block-heading has-large-font-size"><?php esc_html_e( 'Lasting capacity', 'peppermint' ); ?></h3>
				<!-- /wp:heading -->
				<!-- wp:paragraph -->
				<p><?php esc_html_e( 'Describe the skills, systems, or relationships the project builds.', 'peppermint' ); ?></p>
				<!-- /wp:paragraph -->
			</div>
			<!-- /wp:column -->
		</div>
		<!-- /wp:columns -->
	</div>
	<!-- /wp:group -->

	<!-- wp:group {"align":"wide","className":"peppermint-pattern-project-page__next-step","style":{"spacing":{"margin":{"top":"var:preset|spacing|50"},"padding":{"top":"var:preset|spacing|40","right":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40"}}},"backgroundColor":"accent","textColor":"accent-contrast","layout":{"type":"constrained","contentSize":"52rem","justifyContent":"left"}} -->
	<div class="wp-block-group alignwide peppermint-pattern-project-page__next-step has-accent-contrast-color has-accent-background-color has-text-color has-background" style="margin-top:var(--wp--preset--spacing--50);padding-top:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40);padding-left:var(--wp--preset--spacing--40)">
		<!-- wp:heading {"level":2,"style":{"spacing":{"margin":{"top":"0"}}},"fontSize":"x-large"} -->
		<h2 class="wp-block-heading has-x-large-font-size" style="margin-top:0"><?php esc_html_e( 'Ready to contribute?', 'peppermint' ); ?></h2>
		<!-- /wp:heading -->

		<!-- wp:paragraph -->
		<p><?php esc_html_e( 'Give readers one clear next step and tell them what to expect after they respond.', 'peppermint' ); ?></p>
		<!-- /wp:paragraph -->

		<!-- wp:buttons -->
		<div class="wp-block-buttons">
			<!-- wp:button {"backgroundColor":"base","textColor":"contrast"} -->
			<div class="wp-block-button"><a class="wp-block-button__link has-contrast-color has-base-background-color has-text-color has-background wp-element-button"><?php esc_html_e( 'Contact the project team', 'peppermint' ); ?></a></div>
			<!-- /wp:button -->
		</div>
		<!-- /wp:buttons -->
	</div>
	<!-- /wp:group -->
</section>
<!-- /wp:group -->
