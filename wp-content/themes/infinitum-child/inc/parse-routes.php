<?php

add_action('rest_api_init', 'parserRegisterRoute');

function parserRegisterRoute()
{
//    register_rest_route('parse/v1', 'search', array(
//        'methods' => WP_REST_SERVER::READABLE,
//        'callback' => 'parseResult',
//    ));
    register_rest_route('parse/v1', 'insert', array(
        'methods' => WP_REST_SERVER::CREATABLE,
        'callback' => 'insertResult',
    ));
}

function insertResult($request)
{
    try {
        $json_parsed = $request->get_json_params();
        if (empty($json_parsed)) {
            wp_send_json(false);
            return;
        }
        $attach_id = null;
        $main_post_id = null;
        $posts = [];
        $category = [
            'uk' => [],
            'en' => [],
            'ru' => [],
            'da' => [],
            'nb' => [],
        ];
        if (!empty($json_parsed['uk']['categories'])) {
            require_once(ABSPATH . '/wp-admin/includes/taxonomy.php');
            for ($i = 0; $i < count($json_parsed['uk']['categories']); $i++) {
                $catUk = wp_insert_category([
                    'cat_name' => $json_parsed['uk']['categories'][$i],
                    'category_parent' => pll_get_term(46, 'uk'), //Denmark-46,  nb_NO NO - 3911
                ]);
                $category['uk'][] = $catUk;

                $catEn = wp_insert_category([
                    'cat_name' => $json_parsed['en']['categories'][$i],
                    'category_parent' => pll_get_term(46, 'en'), //Denmark-46,  nb_NO NO - 3911
                ]);
                $category['en'][] = $catEn;

                $catRu = wp_insert_category([
                    'cat_name' => $json_parsed['ru']['categories'][$i],
                    'category_parent' => pll_get_term(46, 'ru'), //Denmark-46,  nb_NO NO - 3911
                ]);
                $category['ru'][] = $catRu;

                if (!empty($json_parsed['da'])) {
                    $catDa = wp_insert_category([
                        'cat_name' => $json_parsed['da']['categories'][$i],
                        'category_parent' => pll_get_term(46, 'da'), //Denmark-46,  nb_NO NO - 3911
                    ]);
                    $category['da'][] = $catDa;
                }
                if (!empty($json_parsed['nb'])) {
                    $catNb = wp_insert_category([
                        'cat_name' => $json_parsed['nb']['categories'][$i],
                        'category_parent' => pll_get_term(46, 'nb'), //Denmark-46,  nb_NO NO - 3911
                    ]);
                    $category['nb'][] = $catNb;
                }

                $arrSave = [];
                $arrSave['uk'] = $catUk;
                $arrSave['en'] = $catEn;
                $arrSave['ru'] = $catRu;
                if($catDa) {
                    $arrSave['da'] = $catDa;
                }
                if($catNb) {
                    $arrSave['nb'] = $catNb;
                }
                pll_save_term_translations($arrSave);
            }
        };
        foreach ($json_parsed as $lang => $item) {
            if (empty($attach_id)) {
                $attach_id = !empty($item['image']['guid']) ? create_attachment($item['image']) : 315; //default
            }
            $post_id = createPost($item, in_array($lang, ['da', 'nb']), $category[$lang]);
            set_post_thumbnail($post_id, $attach_id);
            pll_set_post_language($post_id, $lang);
//            if ($lang !== 'da' || $lang !== 'nb') {
                $posts[$lang] = $post_id;
//            } else {
//                $main_post_id = $post_id;
//            }
        }
        pll_save_post_translations($posts);
        wp_send_json(true);
    } catch (Exception $e) {
        wp_send_json(false);
    }
}

function parseResult($request)
{
    $parameters = $request->get_query_params();
    $mydb = new wpdb('mysql191993', '&Jwh3;~rB6ZR', 'mysql191993', 'mysql191993.mysql.sysedata.no');
    $rowcount = $mydb->get_var("SELECT COUNT(*) FROM wp_posts WHERE post_type='post' AND post_status='publish'");
//    $result = $mydb->get_results("
//SELECT * FROM wp_posts LEFT JOIN wp_postmeta ON wp_postmeta.post_id = wp_posts.ID AND wp_postmeta.meta_key = '_thumbnail_id' LEFT JOIN wp_posts AS image ON image.ID = wp_postmeta.meta_value
//WHERE wp_posts.post_type='post' AND wp_posts.post_status='publish' LIMIT 100");
    $result = $mydb->get_results("
SELECT * FROM wp_posts LEFT JOIN wp_postmeta ON wp_postmeta.post_id = wp_posts.ID AND wp_postmeta.meta_key = '_thumbnail_id'
WHERE wp_posts.post_type='post' AND wp_posts.post_status='publish' LIMIT 2");
    var_dump($rowcount);
    include_once(ABSPATH . 'wp-admin/includes/image.php');
    foreach ($result as $item) {
        $resultImage = $mydb->get_row("SELECT * FROM wp_posts WHERE ID ='" . $item->meta_value . "'");

        $post_id = wp_insert_post(array(
            'post_type' => 'post',
            'post_title' => $item->post_title,
            'post_content' => $item->post_content,
            'post_date_gmt' => $item->post_date_gmt,
            'post_excerpt' => $item->post_excerpt,
//	'post_name'      => <the name>,
            'post_status' => 'publish',
            'post_category' => array(1),
            'tags_input' => array('tag'),
        ));


//        $attachment_id = media_handle_upload('image', $post_id);
//        set_post_thumbnail( $post_id, $attachment_id );


        $imageurl = $resultImage->guid;
        $imagetype = end(explode('/', getimagesize($imageurl)['mime']));
//        $uniq_name = date('dmY').''.(int) microtime(true);
        $filename = $resultImage->post_title . '.' . $imagetype;
        $uploaddir = wp_upload_dir();
        $uploadfile = $uploaddir['path'] . '/' . $filename;
        $contents = file_get_contents($imageurl);
        if (file_exists($uploadfile)) {
            $filename = $resultImage->post_title . date('dmY') . '.' . $imagetype;
            $uploadfile = $uploaddir['path'] . '/' . $filename;
        }
        $savefile = fopen($uploadfile, 'w');
        fwrite($savefile, $contents);
        fclose($savefile);
        $wp_filetype = wp_check_filetype(basename($filename), null);
        $attachment = array(
//            'guid' => $uploaddir . '/' . basename( $filename ),
            'post_mime_type' => $wp_filetype['type'],
            'post_title' => $filename,
            'post_content' => '',
            'post_status' => 'inherit'
        );
        $attach_id = wp_insert_attachment($attachment, $uploadfile);
        $imagenew = get_post($attach_id);
        $fullsizepath = get_attached_file($imagenew->ID);
        $attach_data = wp_generate_attachment_metadata($attach_id, $fullsizepath);
        wp_update_attachment_metadata($attach_id, $attach_data);


        set_post_thumbnail($post_id, $attach_id);
        pll_set_post_language($post_id, 'da');

    }

}
