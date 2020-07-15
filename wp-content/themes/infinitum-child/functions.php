<?php

require get_theme_file_path('/inc/parse-routes.php');

function createPost ($post, $category, $private = false) {
    $post_id =  wp_insert_post(array(
        'post_type' => 'post',
        'post_title' => $post['post_title'],
        'post_content' =>  html_entity_decode($post['post_content']),
        'post_date_gmt' => $post['post_date_gmt'],
        'post_excerpt' => $post['post_excerpt'],
//	'post_name'      => <the name>,
        'post_author'   => 2,
        'post_status' => $private ? 'draft' : 'publish',
        'post_category' => $category,
        'tags_input' => $post['tags'],
    ));
//    wp_set_post_categories($post_id, $category);
    wp_set_post_categories($post_id, $post['categories']);
    wp_set_object_terms($post_id, $post['categories'], 'category', true);
//    wp_set_post_terms

    //$attachment_id = media_handle_upload('image', $post_id);
//set_post_thumbnail( $post_id, $attachment_id );
    return $post_id;
}
function create_attachment ($attach) {
    include_once( ABSPATH . 'wp-admin/includes/image.php' );
    $imageurl = $attach['guid'];
    $imagetype = end(explode('/', getimagesize($imageurl)['mime']));
//        $uniq_name = date('dmY').''.(int) microtime(true);
    $filename = $attach['post_title'].'.'.$imagetype;
    $uploaddir = wp_upload_dir();
    $uploadfile = $uploaddir['path'] . '/' . $filename;
    $contents = file_get_contents($imageurl);
    if (file_exists($uploadfile)) {
        $filename = $attach['post_title'] . date('dmY').'.'.$imagetype;
        $uploadfile = $uploaddir['path'] . '/' . $filename;
    }
    $savefile = fopen($uploadfile, 'w');
    fwrite($savefile, $contents);
    fclose($savefile);
    $wp_filetype = wp_check_filetype(basename($filename), null );
    $attachment = array(
//            'guid' => $uploaddir . '/' . basename( $filename ),
        'post_mime_type' => $wp_filetype['type'],
        'post_title' => $filename,
        'post_content' => '',
        'post_status' => 'inherit'
    );
    $attach_id = wp_insert_attachment( $attachment, $uploadfile );
    $imagenew = get_post( $attach_id );
    $fullsizepath = get_attached_file( $imagenew->ID );
    $attach_data = wp_generate_attachment_metadata( $attach_id, $fullsizepath );
    wp_update_attachment_metadata( $attach_id, $attach_data );


    return $attach_id;
}

add_filter( 'avatar_defaults', 'wpb_new_gravatar' );
function wpb_new_gravatar ($avatar_defaults) {
    $myavatar = wp_get_attachment_url(504);
    $avatar_defaults[$myavatar] = "Infinitum Gravatar";
    return $avatar_defaults;
}


// OPTI START
add_filter( 'comment_text', 'remove_html_from_comments' );
function remove_html_from_comments( $comment_text ) {
    return htmlspecialchars($comment_text);
}
function cc_mime_types($mime_types) {
//    $mime_types['svg'] = 'image/svg+xml';
    $mime_types['svg'] = 'image/svg';
    return $mime_types;
}
add_filter('upload_mimes', 'cc_mime_types');

//add_filter('script_loader_tag', 'add_async_attribute', 49, 3);
function add_async_attribute($tag, $handle, $src) {
    if(is_admin()) {return $tag;}
    // добавьте дескрипторы (названия) скриптов в массив ниже
    $scripts_to_async = array('jquery-core');
    foreach($scripts_to_async as $async_script) {
        if ($async_script === $handle) {
            return str_replace(' src', ' src', $tag);
        } else {
            return str_replace(' src', ' defer src', $tag);
        }
    }
    return $tag;
}

//Disable REST API link tag
remove_action('wp_head', 'rest_output_link_wp_head', 10);
//Disable oEmbed Discovery Links
remove_action('wp_head', 'wp_oembed_add_discovery_links', 10);
//Disable REST API link in HTTP headers
remove_action('template_redirect', 'rest_output_link_header', 11, 0);
remove_action('wp_head','feed_links_extra', 3); // убирает ссылки на rss категорий
remove_action('wp_head','feed_links', 2); // минус ссылки на основной rss и комментарии
remove_action('wp_head','rsd_link');  // сервис Really Simple Discovery
remove_action('wp_head','wlwmanifest_link'); // Windows Live Writer
remove_action('wp_head','wp_generator');  // скрыть версию wordpress

add_filter('after_setup_theme', 'remove_redundant_shortlink');
function remove_redundant_shortlink() {
    // remove HTML meta tag
    // <link rel='shortlink' href='http://example.com/?p=25' />
    remove_action('wp_head', 'wp_shortlink_wp_head', 10);

    // remove HTTP header
    // Link: <https://example.com/?p=25>; rel=shortlink
    remove_action( 'template_redirect', 'wp_shortlink_header', 11);
}

add_action( 'after_setup_theme', 'footer_enqueue_scripts' );
function footer_enqueue_scripts() {
    if(is_admin()) {return;}
    remove_action('wp_enqueue_scripts', 'ls_load_google_fonts'); //remove google fonts
    remove_action('admin_enqueue_scripts', 'ls_load_google_fonts'); //remove google fonts


    remove_action('wp_head', 'download_rss_link'); //RRS meta

    remove_action('wp_head', 'wp_print_scripts');
    remove_action('wp_head', 'wp_enqueue_scripts', 2);
//  remove_action('wp_head', 'wp_print_styles',8);
    remove_action('wp_head', 'wp_print_head_scripts', 9);
//    wp_enqueue_style
//    style_loader_tag
    add_action('wp_footer','wp_print_scripts',4);
    add_action('wp_footer','wp_enqueue_scripts',5);
//  add_action('wp_footer','wp_print_styles',6);
    add_action('wp_footer','wp_print_head_scripts',7);

}


// OPTI AND