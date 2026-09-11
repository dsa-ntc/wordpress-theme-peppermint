( function ( blocks, blockEditor, element, i18n ) {
	'use strict';

	var el = element.createElement;
	var useBlockProps = blockEditor.useBlockProps;

	function AppearanceIcon( props ) {
		var paths = 'light' === props.scheme ? [
			el( 'circle', { cx: 10, cy: 10, key: 'circle', r: 3.25 } ),
			el( 'path', { d: 'M10 1.5V4M10 16V18.5M1.5 10H4M16 10H18.5M4 4L5.75 5.75M14.25 14.25L16 16M16 4L14.25 5.75M5.75 14.25L4 16', key: 'rays' } )
		] : el( 'path', { d: 'M16.25 12.45A6.5 6.5 0 0 1 7.55 3.75 6.5 6.5 0 1 0 16.25 12.45Z' } );

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

	function Edit( props ) {
		var expandedState = element.useState( false );
		var expanded = expandedState[ 0 ];
		var setExpanded = expandedState[ 1 ];
		var preferenceState = element.useState( 'system' );
		var preference = preferenceState[ 0 ];
		var setPreference = preferenceState[ 1 ];
		var buttonRef = element.useRef( null );
		var panelRef = element.useRef( null );
		var wrapperRef = element.useRef( null );
		var controlId = 'ntc-appearance-preview-' + props.clientId;
		var options = [
			{ value: 'system', label: i18n.__( 'System', 'ntc-block' ) },
			{ value: 'light', label: i18n.__( 'Light', 'ntc-block' ) },
			{ value: 'dark', label: i18n.__( 'Dark', 'ntc-block' ) }
		];

		element.useEffect( function () {
			if ( expanded && panelRef.current ) {
				var checked = panelRef.current.querySelector( 'input:checked' );
				if ( checked ) {
					checked.focus();
				}
			}
		}, [ expanded ] );

		element.useEffect( function () {
			var wrapper = wrapperRef.current;
			if ( ! expanded || ! wrapper ) {
				return;
			}
			// Listen in the canvas document, which may be a Site Editor iframe.
			var ownerDocument = wrapper.ownerDocument;
			var ownerWindow = ownerDocument.defaultView;
			var dismissPreview = function () { setExpanded( false ); };
			var dismissOutside = function ( event ) {
				if ( ! wrapper.contains( event.target ) ) {
					dismissPreview();
				}
			};
			ownerDocument.addEventListener( 'pointerdown', dismissOutside );
			ownerDocument.addEventListener( 'focusin', dismissOutside );
			// Moving from the canvas to the editor sidebar leaves this window.
			if ( ownerWindow ) {
				ownerWindow.addEventListener( 'blur', dismissPreview );
			}
			return function () {
				ownerDocument.removeEventListener( 'pointerdown', dismissOutside );
				ownerDocument.removeEventListener( 'focusin', dismissOutside );
				if ( ownerWindow ) {
					ownerWindow.removeEventListener( 'blur', dismissPreview );
				}
			};
		}, [ expanded ] );

		return el(
			'div',
			useBlockProps( {
				ref: wrapperRef,
				onKeyDown: function ( event ) {
					if ( expanded && 'Escape' === event.key ) {
						event.preventDefault();
						event.stopPropagation();
						setExpanded( false );
						buttonRef.current.focus();
					}
				}
			} ),
			el(
				'button',
				{
					'aria-controls': controlId + '-panel',
					'aria-expanded': expanded,
					'aria-label': i18n.__( 'Preview appearance choices', 'ntc-block' ),
					className: 'ntc-theme-switcher',
					onClick: function () { setExpanded( ! expanded ); },
					ref: buttonRef,
					type: 'button'
				},
				el( AppearanceIcon, { scheme: preference } )
			),
			el(
				'div',
				{ className: 'ntc-theme-switcher__panel', hidden: ! expanded, id: controlId + '-panel', ref: panelRef },
				el(
					'fieldset',
					{ 'aria-describedby': controlId + '-help', className: 'ntc-theme-switcher__choices' },
					el( 'legend', null, i18n.__( 'Appearance', 'ntc-block' ) ),
					options.map( function ( option ) {
						return el(
							'label',
							{ className: 'ntc-theme-switcher__option', key: option.value },
							el( 'input', {
								checked: preference === option.value,
								name: controlId,
								onChange: function () { setPreference( option.value ); },
								type: 'radio',
								value: option.value
							} ),
							el( 'span', null, option.label )
						);
					} )
				),
				el(
					'p',
					{ className: 'ntc-theme-switcher__help', id: controlId + '-help' },
					i18n.__( 'Preview only; visitors choose their own appearance.', 'ntc-block' )
				)
			)
		);
	}

	blocks.registerBlockType( 'ntc-block/theme-switcher', {
		title: i18n.__( 'Appearance Switcher', 'ntc-block' ),
		description: i18n.__( 'A compact visitor control for choosing System, Light, or Dark appearance.', 'ntc-block' ),
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
