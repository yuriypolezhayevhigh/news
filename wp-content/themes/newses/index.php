    <?php
/**
 * The main template file.
 *
 * This is the most generic template file in a WordPress theme
 * and one of the two required files for a theme (the other being style.css).
 * It is used to display a page when nothing more specific matches a query.
 * E.g., it puts together the home page when no home.php file exists.
 *
 * @package Newses
 */
get_header(); ?>
<!--==================== newses breadcrumb section ====================-->
            <div id="content" class="container home">
                <!--row-->
                <div class="row">
                    <!--col-md-8-->
                    <?php 
                    $newses_content_layout = esc_attr(get_theme_mod('newses_content_layout','align-content-right'));
                    if($newses_content_layout == "align-content-left")
                    { ?>
                    <aside class="col-md-3">
                        <?php get_sidebar();?>
                    </aside>
                    <?php } ?>
                    <?php if($newses_content_layout == "align-content-right"){
                    ?>
                    <div class="col-md-9">
                    <?php } elseif($newses_content_layout == "align-content-left") { ?>
                    <div class="col-md-9">
                    <?php } elseif($newses_content_layout == "full-width-content") { ?>
                     <div class="col-md-12">
                     <?php } get_template_part('content',''); ?>
                    </div>
                    <!--/col-md-8-->
                    <?php if($newses_content_layout == "align-content-right") { ?>
                    <!--col-md-4-->
                    <aside class="col-md-3">
                        <?php get_sidebar();?>
                    </aside>
                    <!--/col-md-4-->
                    <?php } ?>
                </div>
                <!--/row-->
    </div>
<?php
get_footer();
?>