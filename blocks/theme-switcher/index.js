( function ( blocks, blockEditor, element, i18n ) {
	'use strict';

	var el = element.createElement;
	var useBlockProps = blockEditor.useBlockProps;

	function AppearanceIcon( props ) {
		var paths = props.dark ? el( 'path', { d: 'M16.25 12.45A6.5 6.5 0 0 1 7.55 3.75 6.5 6.5 0 1 0 16.25 12.45Z' } ) : [
			el( 'circle', { cx: 10, cy: 10, key: 'circle', r: 3.25 } ),
			el( 'path', { d: 'M10 1.5V4M10 16V18.5M1.5 10H4M16 10H18.5M4 4L5.75 5.75M14.25 14.25L16 16M16 4L14.25 5.75M5.75 14.25L4 16', key: 'rays' } )
		];

		return el(
			'svg',
			{
				'aria-hidden': 'true',
				className: 'ntc-theme-switcher__icon',
				fill: 'none',
				height: 20,
				stroke: 'currentColor',
				strokeWidth: 1.75,
				viewBox: '0 0 20 20',
				width: 20
			},
			paths
		);
	}

	// The editor preview only flips its own icon; visitors keep their own choice.
	function Edit() {
		var darkState = element.useState( false );
		var dark = darkState[ 0 ];
		var setDark = darkState[ 1 ];
		var label = i18n.__( 'Dark mode', 'ntc-block' );

		return el(
			'div',
			useBlockProps(),
			el(
				'button',
				{
					'aria-label': label,
					'aria-pressed': dark,
					className: 'ntc-theme-switcher',
					onClick: function () { setDark( ! dark ); },
					title: label,
					type: 'button'
				},
				el( AppearanceIcon, { dark: dark } )
			)
		);
	}

	blocks.registerBlockType( 'ntc-block/theme-switcher', {
		title: i18n.__( 'Appearance Switcher', 'ntc-block' ),
		description: i18n.__( 'A light/dark toggle that follows the visitor\'s system setting until they choose.', 'ntc-block' ),
		category: 'theme',
		icon: 'admin-appearance',
		supports: {
			align: false,
			html: false,
			multiple: false,
			spacing: { margin: true }
		},
		edit: Edit,
		save: function () {
			return null;
		}
	} );
}( window.wp.blocks, window.wp.blockEditor, window.wp.element, window.wp.i18n ) );
