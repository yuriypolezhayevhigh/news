<?php function newses_scripts() {

	wp_enqueue_style('bootstrap', get_template_directory_uri() . '/css/bootstrap.css');

	wp_enqueue_style('newses-style', get_stylesheet_uri() );

	wp_style_add_data('newses-style', 'rtl', 'replace' );

	wp_enqueue_style('newses-default', get_template_directory_uri() . '/css/colors/default.css');

	wp_enqueue_style('font-awesome',get_template_directory_uri().'/css/font-awesome.css');
	
	wp_enqueue_style('smartmenus',get_template_directory_uri().'/css/jquery.smartmenus.bootstrap.css');	

	wp_enqueue_style('newses-swiper.min',get_template_directory_uri().'/css/swiper.min.css');	

	/* Js script */
	
	wp_enqueue_script('newses-navigation', get_template_directory_uri() . '/js/navigation.js', array('jquery'));

	wp_enqueue_script('bootstrap', get_template_directory_uri() . '/js/bootstrap.js', array('jquery'));

	wp_enqueue_script('smartmenus', get_template_directory_uri() . '/js/jquery.smartmenus.js' , array('jquery'));

	wp_enqueue_script('smartmenus-bootstrap', get_template_directory_uri() . '/js/jquery.smartmenus.bootstrap.js' , array('jquery'));

	wp_enqueue_script('newses-marquee-js', get_template_directory_uri() . '/js/jquery.marquee.js' , array('jquery'));

	wp_enqueue_script('newses-swiper.min.js', get_template_directory_uri() . '/js/swiper.min.js' , array('jquery'));


	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}
}
add_action('wp_enqueue_scripts', 'newses_scripts');

//Custom Color
function newses_custom_js() {
    
	wp_enqueue_script('newses-custom', get_template_directory_uri() . '/js/custom.js' , array('jquery'));	
    
}
add_action('wp_footer','newses_custom_js');


/**
 * Fix skip link focus in IE11.
 *
 * This does not enqueue the script because it is tiny and because it is only for IE11,
 * thus it does not warrant having an entire dedicated blocking script being loaded.
 *
 * @link https://git.io/vWdr2
 */
function newses_skip_link_focus_fix() {
	// The following is minified via `terser --compress --mangle -- js/skip-link-focus-fix.js`.
	?>
	<script>
	/(trident|msie)/i.test(navigator.userAgent)&&document.getElementById&&window.addEventListener&&window.addEventListener("hashchange",function(){var t,e=location.hash.substring(1);/^[A-z0-9_-]+$/.test(e)&&(t=document.getElementById(e))&&(/^(?:a|select|input|button|textarea)$/i.test(t.tagName)||(t.tabIndex=-1),t.focus())},!1);
	</script>
	<?php
}
add_action( 'wp_print_footer_scripts', 'newses_skip_link_focus_fix' );