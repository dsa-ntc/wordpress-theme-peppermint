( function () {
	'use strict';

	var storageKey = 'ntc-color-scheme';
	var root = document.documentElement;
	var media = window.matchMedia ? window.matchMedia( '(prefers-color-scheme: dark)' ) : null;
	var preference = readPreference();
	var controls = [];

	function isScheme( value ) {
		return 'light' === value || 'dark' === value;
	}

	function readPreference() {
		try {
			var value = window.localStorage.getItem( storageKey );
			return isScheme( value ) ? value : '';
		} catch ( error ) {
			return '';
		}
	}

	function writePreference( value ) {
		preference = value;

		try {
			if ( value ) {
				window.localStorage.setItem( storageKey, value );
			} else {
				window.localStorage.removeItem( storageKey );
			}
		} catch ( error ) {
			// If storage is unavailable, keep the choice for this page.
		}
	}

	function applyPreference() {
		if ( preference ) {
			root.setAttribute( 'data-ntc-color-scheme', preference );
		} else {
			root.removeAttribute( 'data-ntc-color-scheme' );
		}
	}

	function getSiteDefault() {
		var override = root.getAttribute( 'data-ntc-color-scheme' );

		// Read the CSS default after styles load, then restore the visitor override.
		// Keep this out of mutation observers to avoid an attribute-change loop.
		root.removeAttribute( 'data-ntc-color-scheme' );
		var declaredScheme = window.getComputedStyle( root ).colorScheme || '';

		if ( null !== override ) {
			root.setAttribute( 'data-ntc-color-scheme', override );
		}

		if ( declaredScheme.includes( 'dark' ) && ! declaredScheme.includes( 'light' ) ) {
			return 'dark';
		}

		if ( declaredScheme.includes( 'light' ) && ! declaredScheme.includes( 'dark' ) ) {
			return 'light';
		}

		return '';
	}

	function updateControls() {
		var siteDefault = getSiteDefault();
		var resolvedScheme = preference || siteDefault || ( media && media.matches ? 'dark' : 'light' );

		root.setAttribute( 'data-ntc-resolved-scheme', resolvedScheme );

		controls.forEach( function ( control ) {
			var labels = control.button.dataset;
			var automaticLabel = siteDefault ? labels.labelDefault : labels.labelSystem;
			var title = preference ? labels[ 'light' === preference ? 'labelLight' : 'labelDark' ] : automaticLabel;
			var systemLabel = control.panel.querySelector( '[data-ntc-system-label]' );
			var help = control.panel.querySelector( '[data-ntc-appearance-help]' );

			control.button.setAttribute( 'aria-label', title );
			control.button.title = title;
			control.button.hidden = false;
			control.panel.querySelectorAll( 'input[type="radio"]' ).forEach( function ( radio ) {
				radio.checked = radio.value === ( preference || 'system' );
			} );

			if ( systemLabel ) {
				systemLabel.textContent = siteDefault ? systemLabel.dataset.labelDefault : systemLabel.dataset.labelSystem;
			}

			if ( help ) {
				help.textContent = siteDefault ? help.dataset.labelDefault : help.dataset.labelSystem;
			}
		} );

		return resolvedScheme;
	}

	function notifyChange() {
		root.dispatchEvent( new CustomEvent( 'ntc:color-scheme-change', {
			detail: { scheme: preference || 'system', resolvedScheme: root.getAttribute( 'data-ntc-resolved-scheme' ) }
		} ) );
	}

	function setPreference( value ) {
		writePreference( isScheme( value ) ? value : '' );
		applyPreference();
		updateControls();
		notifyChange();
	}

	function setExpanded( control, expanded, restoreFocus ) {
		control.button.setAttribute( 'aria-expanded', expanded ? 'true' : 'false' );
		control.panel.hidden = ! expanded;

		if ( expanded ) {
			var checked = control.panel.querySelector( 'input:checked' );
			if ( checked ) {
				checked.focus();
			}
		} else if ( restoreFocus ) {
			control.button.focus();
		}
	}

	function bindControls() {
		document.querySelectorAll( '[data-ntc-theme-switcher]' ).forEach( function ( button ) {
			if ( 'true' === button.dataset.ntcThemeSwitcherBound ) {
				return;
			}

			var panel = document.getElementById( button.getAttribute( 'aria-controls' ) );
			var wrapper = button.closest( '.wp-block-ntc-block-theme-switcher' );

			// Keep incomplete controls hidden.
			if ( ! panel || ! wrapper ) {
				return;
			}

			var control = { button: button, panel: panel, wrapper: wrapper };
			controls.push( control );
			button.dataset.ntcThemeSwitcherBound = 'true';
			button.addEventListener( 'click', function () {
				var expanded = panel.hidden;
				updateControls();
				controls.forEach( function ( other ) {
					if ( other !== control ) {
						setExpanded( other, false, false );
					}
				} );
				setExpanded( control, expanded, false );
			} );

			panel.addEventListener( 'change', function ( event ) {
				if ( event.target.matches( 'input[type="radio"]' ) && event.target.checked ) {
					setPreference( event.target.value );
				}
			} );
		} );

		updateControls();
	}

	// Restore saved Light or Dark before paint; an absent value uses the CSS default.
	applyPreference();
	if ( preference ) {
		root.setAttribute( 'data-ntc-resolved-scheme', preference );
	}

	if ( 'loading' === document.readyState ) {
		document.addEventListener( 'DOMContentLoaded', bindControls, { once: true } );
	} else {
		bindControls();
	}

	if ( media ) {
		var handleMediaChange = function () {
			if ( ! preference ) {
				updateControls();
				notifyChange();
			}
		};

		if ( media.addEventListener ) {
			media.addEventListener( 'change', handleMediaChange );
		} else if ( media.addListener ) {
			media.addListener( handleMediaChange );
		}
	}

	// A label can briefly blur its radio before forwarding the click to it.
	// Dismiss only on a confirmed outside interaction, not that intermediate blur.
	function dismissOutsideControls( event ) {
		controls.forEach( function ( control ) {
			if ( ! control.wrapper.contains( event.target ) ) {
				setExpanded( control, false, false );
			}
		} );
	}

	document.addEventListener( 'pointerdown', dismissOutsideControls );
	document.addEventListener( 'focusin', dismissOutsideControls );

	document.addEventListener( 'keydown', function ( event ) {
		if ( 'Escape' !== event.key ) {
			return;
		}

		controls.forEach( function ( control ) {
			if ( ! control.panel.hidden && control.wrapper.contains( event.target ) ) {
				event.preventDefault();
				setExpanded( control, false, true );
			}
		} );
	} );

	window.addEventListener( 'storage', function ( event ) {
		if ( storageKey !== event.key && null !== event.key ) {
			return;
		}

		preference = null === event.key ? readPreference() : ( isScheme( event.newValue ) ? event.newValue : '' );
		applyPreference();
		updateControls();
		notifyChange();
	} );
}() );
