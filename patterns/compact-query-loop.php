<?php
/**
 * Title: Compact query loop
 * Slug: peppermint/compact-query-loop
 * Categories: query, posts
 * Description: A compact list of posts with category, linked title, date, no-results message, and pagination.
 * Keywords: query, posts, list, latest, updates, compact
 * Viewport Width: 1280
 * Block Types: core/query
 *
 * @package Peppermint
 */

?>
<!-- wp:group {"tagName":"section","align":"wide","className":"peppermint-pattern-compact-query","layout":{"type":"constrained"}} -->
<section class="wp-block-group alignwide peppermint-pattern-compact-query">
	<!-- wp:heading {"align":"wide","level":2,"style":{"spacing":{"margin":{"top":"0","bottom":"var:preset|spacing|40"}}},"fontSize":"x-large"} -->
	<h2 class="wp-block-heading alignwide has-x-large-font-size" style="margin-top:0;margin-bottom:var(--wp--preset--spacing--40)"><?php esc_html_e( 'Latest updates', 'peppermint' ); ?></h2>
	<!-- /wp:heading -->

	<!-- wp:query {"query":{"perPage":6,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":true,"taxQuery":null,"parents":[]},"align":"wide","layout":{"type":"default"}} -->
	<div class="wp-block-query alignwide">
		<!-- wp:post-template {"style":{"spacing":{"blockGap":"0"}},"layout":{"type":"default"}} -->
			<!-- wp:group {"className":"peppermint-pattern-compact-query__item","style":{"spacing":{"padding":{"top":"var:preset|spacing|30","bottom":"var:preset|spacing|30"}},"border":{"bottom":{"color":"var:preset|color|line","width":"1px"}}},"layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"center"}} -->
			<div class="wp-block-group peppermint-pattern-compact-query__item" style="border-bottom-color:var(--wp--preset--color--line);border-bottom-width:1px;padding-top:var(--wp--preset--spacing--30);padding-bottom:var(--wp--preset--spacing--30)">
				<!-- wp:group {"className":"peppermint-pattern-compact-query__title","layout":{"type":"default"}} -->
				<div class="wp-block-group peppermint-pattern-compact-query__title">
					<!-- wp:post-terms {"term":"category","className":"project-kicker"} /-->
					<!-- wp:post-title {"level":3,"isLink":true,"style":{"spacing":{"margin":{"top":"var:preset|spacing|10","bottom":"0"}}},"fontSize":"large"} /-->
				</div>
				<!-- /wp:group -->

				<!-- wp:post-date {"isLink":true,"className":"post-meta"} /-->
			</div>
			<!-- /wp:group -->
		<!-- /wp:post-template -->

		<!-- wp:query-no-results -->
			<!-- wp:paragraph {"style":{"spacing":{"padding":{"top":"var:preset|spacing|40","bottom":"var:preset|spacing|40"}}},"textColor":"contrast-2"} -->
			<p class="has-contrast-2-color has-text-color" style="padding-top:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40)"><?php esc_html_e( 'No updates were found.', 'peppermint' ); ?></p>
			<!-- /wp:paragraph -->
		<!-- /wp:query-no-results -->

		<!-- wp:query-pagination {"paginationArrow":"arrow","style":{"spacing":{"margin":{"top":"var:preset|spacing|40"}}},"layout":{"type":"flex","justifyContent":"space-between"}} -->
			<!-- wp:query-pagination-previous /-->
			<!-- wp:query-pagination-next /-->
		<!-- /wp:query-pagination -->
	</div>
	<!-- /wp:query -->
</section>
<!-- /wp:group -->
