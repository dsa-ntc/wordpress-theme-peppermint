/**
 * Show each framed Cover's heading in its editor title bar.
 *
 * functions.php adds the same attribute on the front end. Both use the text
 * of the first Heading block inside the Cover. The attribute exists only in
 * the editor canvas, so saved Cover markup does not change.
 */
( function ( blockEditor, compose, data, element, hooks, richText ) {
	'use strict';

	var el = element.createElement;
	var framed = /(^|\s)is-style-peppermint-(win95|retro|macos)(\s|$)/;

	// Return the first Heading block's text, or null when the tree has none.
	function firstHeadingText( blocks ) {
		for ( var i = 0; i < blocks.length; i++ ) {
			if ( 'core/heading' === blocks[ i ].name ) {
				return richText.create( { html: String( blocks[ i ].attributes.content || '' ) } ).text;
			}
			var nested = firstHeadingText( blocks[ i ].innerBlocks );
			if ( null !== nested ) {
				return nested;
			}
		}
		return null;
	}

	function CoverWithTitle( props ) {
		var BlockListBlock = props.peppermintBlockListBlock;
		var blockProps = Object.assign( {}, props );
		delete blockProps.peppermintBlockListBlock;

		var isFramed = framed.test( props.attributes.className || '' );
		var title = data.useSelect( function ( select ) {
			return isFramed ? firstHeadingText( select( blockEditor.store ).getBlocks( props.clientId ) ) : null;
		}, [ isFramed, props.clientId ] );
		title = ( title || '' ).replace( /\s+/g, ' ' ).trim();

		if ( title ) {
			blockProps.wrapperProps = Object.assign( {}, props.wrapperProps, { 'data-peppermint-window-title': title } );
		}
		return el( BlockListBlock, blockProps );
	}

	// Only Cover blocks subscribe to the block tree.
	var withWindowTitle = compose.createHigherOrderComponent( function ( BlockListBlock ) {
		return function ( props ) {
			return 'core/cover' === props.name
				? el( CoverWithTitle, Object.assign( {}, props, { peppermintBlockListBlock: BlockListBlock } ) )
				: el( BlockListBlock, props );
		};
	}, 'withPeppermintWindowTitle' );

	hooks.addFilter( 'editor.BlockListBlock', 'peppermint/window-titles', withWindowTitle );
}( window.wp.blockEditor, window.wp.compose, window.wp.data, window.wp.element, window.wp.hooks, window.wp.richText ) );
