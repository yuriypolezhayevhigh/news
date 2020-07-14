<?php

require get_theme_file_path('/inc/parse-routes.php');

function createPost ($post, $private = false) {
    $post_id =  wp_insert_post(array(
        'post_type' => 'post',
        'post_title' => $post['post_title'],
        'post_content' =>  html_entity_decode($post['post_content']),
        'post_date_gmt' => $post['post_date_gmt'],
        'post_excerpt' => $post['post_excerpt'],
//	'post_name'      => <the name>,
        'post_status' => $private ? 'draft' : 'publish',
        'post_category' => $post['categories'],
        'tags_input' => $post['tags'],
    ));
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