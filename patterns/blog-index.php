<?php
/**
 * Title: Blog index
 * Slug: peppermint/blog-index
 * Categories: posts
 * Inserter: no
 * Template Types: home
 *
 * @package Peppermint
 */

?>
<!-- wp:group {"tagName":"main","className":"project-grid","style":{"spacing":{"padding":{"top":"var:preset|spacing|60","right":"var:preset|spacing|40","bottom":"var:preset|spacing|60","left":"var:preset|spacing|40"}}},"layout":{"type":"constrained"}} -->
<main class="wp-block-group project-grid" style="padding-top:var(--wp--preset--spacing--60);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--60);padding-left:var(--wp--preset--spacing--40)">
	<!-- wp:heading {"level":1,"fontSize":"display"} --><h1 class="wp-block-heading has-display-font-size"><?php esc_html_e( 'Blog', 'peppermint' ); ?></h1><!-- /wp:heading -->
	<!-- wp:query {"query":{"perPage":10,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":true},"align":"wide"} -->
	<div class="wp-block-query alignwide">
		<!-- wp:post-template {"layout":{"type":"grid","columnCount":2}} -->
			<!-- wp:group {"className":"project-card__media","layout":{"type":"default"}} -->
			<div class="wp-block-group project-card__media">
				<!-- wp:post-featured-image {"isLink":true,"aspectRatio":"16/9","sizeSlug":"large"} /-->
			</div>
			<!-- /wp:group -->
			<!-- wp:post-terms {"term":"category","className":"project-kicker"} /-->
			<!-- wp:post-title {"isLink":true,"fontSize":"card-title"} /-->
			<!-- wp:post-excerpt /-->
			<!-- wp:post-date {"className":"post-meta"} /-->
		<!-- /wp:post-template -->
		<!-- wp:query-no-results -->
			<!-- wp:pattern {"slug":"peppermint/no-results"} /-->
		<!-- /wp:query-no-results -->
		<!-- wp:query-pagination {"layout":{"type":"flex","justifyContent":"space-between"}} -->
			<!-- wp:query-pagination-previous /-->
			<!-- wp:query-pagination-numbers /-->
			<!-- wp:query-pagination-next /-->
		<!-- /wp:query-pagination -->
	</div>
	<!-- /wp:query -->
</main>
<!-- /wp:group -->
