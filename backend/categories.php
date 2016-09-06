<?php
/**
 * Created by PhpStorm.
 * User: drKox
 * Date: 06.09.2016
 * Time: 22:36
 */
//if (isset($_GET['request']))
//{
//    if ($_GET['request'] === 'get')
//    {
//        $database = file_get_contents('booked_days.json');
//        // Бесполезные операции в данном случае, но если на входе будет не json файл, то пригодятся.
//        $days = json_decode($database);
//        $json = json_encode($days);
//        echo $json;
//    }
//}

if (isset($_POST['request']))
{
    if ($_POST['request'] === 'send')
    {

        $category = $_POST['category'];

        $database = file_get_contents('../assets/json/category.json');

        $all_category = json_decode($database);

        $new_category = json_decode($category);

        $new_category->id = time();

//        var_dump($new_category);
//
//        var_dump($all_category);

        array_push($all_category->category, $new_category);

//        var_dump($all_category);

        $json = json_encode($all_category, JSON_UNESCAPED_UNICODE);

//        var_dump($json);
        file_put_contents('../assets/json/category.json', $json);
    }
}
else var_dump($_POST);
