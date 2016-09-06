$(window).ready(function () {

    // Инициализация timepicker
    var cooking_time = $('#cooking-time').timepicker({
        'timeFormat': 'H:i',
        'minTime': '00:00',
        'maxTime': '12:00',
        'step': 5
    });

    // Инициализация counterfield
   var difficulty = $('#difficulty').raty({
       starType : 'i',
       half: true
   });

    init();

    var btn_save = $("#save-btn");
    var btn_cancel = $("#cancel-btn");
    var selects;
    var checkbox;
    var photo;
    var title;
    var select_multiple;

    var all_ingredients = [];

    var cook_categories = {};
    var dish = {}; //блюдо

    function init() {
        //Запрос Категорий блюд
        $.ajax({
            url: "/assets/json/category.json",
            type: "POST",
            dataType: "json",
            success: function (data) {
                cook_categories.categories = data.category;
                $('[for="category"]').after(make_select_from_categories(get_categories(null)));
                initTags();
            }
        });

        function initTags() {
            //Запрос Тегов
            $.ajax({
                url: "/assets/json/tags.json",
                type: "POST",
                dataType: "json",
                success: function (data) {
                    createSelectTags(data);
                    initIngredients(0);     //Ajax запрос ингредиентов
                }
            });
        }

        function initIngredients(i) {
            i++;
            $.ajax({
                url: "/assets/ingridients/" + i + ".txt",
                type: "POST",
                dataType: "text",
                success: function (data) {
                    var ingredient = {};
                    ingredient.id = i;
                    ingredient.title = data;
                    all_ingredients[all_ingredients.length] = ingredient;
                    initIngredients(i)
                },
                error: function () {
                    //Как только файлы на сервере закончились, начиаем обрабатывать полученные файлы. Создаем палитру блюд.
                    createPalette();
                }
            });
        }
    }

    btn_save.click(function () {
        var dish_ingredients = [];

        selects = $("#select-container select");
        checkbox = $("#visibility");
        photo = $("#photo-url");
        title = $("#title");

        $(".ingredient-amount").each(function (i, item) {

            var ingredient = {};
            ingredient.id = $(item).data("id");
            ingredient.title = $(item).data("title");
            ingredient.amount = $(item).val();
            dish_ingredients[i] = ingredient;
        });

        dish.photo = photo.val();
        dish.title = title.val();
        dish.category = (selects.last().val() > 0) ? selects.last().val() : selects.last().prev().val(); //Если категория последнего select - "Без категорий", берем из предпоследнего select
        dish.visibility = checkbox.is(":checked");
        dish.difficulty = difficulty.raty('score');
        dish.tags = select_multiple.val();
        dish.ingredients = dish_ingredients;
        dish.time = cooking_time.timepicker('getSecondsFromMidnight')/60;     //Время приготовления в минутах.

        var dish_json = JSON.stringify(dish);

        $("#json").empty().append(
            $("<kbd/>", {text: dish_json})
        );

    });

    btn_cancel.click(function () {

        selects = $("#select-container select");
        checkbox = $("#visibility");
        photo = $("#photo-url");
        title = $("#title");

        photo.val("");
        title.val("");
        checkbox.prop('checked', false);
        select_multiple.val("");
        counterfield.currentValue = 1;

        //Очистка селек категорий
        selects.first().val(-1);
        while (selects.first().next().length)
        {
            selects.first().next().remove();
        }

        //Оичтска ингредиентов
        $(".close").each(function (i, item) {
           item.click();
        });

        $("#json").empty();
    });

    function createPalette() {
        //TODO проверка на пустой массив

        var palette_container = $("#palette");
        $.each(all_ingredients, function (i, item) {
            palette_container.append(
                $("<div/>", {class: "thumbnail-container"}).append(
                    $("<div/>", {class: "image-cropper"}).append(
                        $("<a/>", {class: "link", "data-id": item.id, "data-title": item.title}).click(function () {
                            createDishIngredient.call(this)
                        }).append(
                            $("<img/>", {src: "/assets/ingridients/" + item.id + ".jpg", alt: item.title})
                        )
                    )
                ).append(
                    $("<p/>", {text: item.title, class: "text-capitalize text-center"})
                )
            );

        });
    }

    function createDishIngredient() {
        var ingredient_id = $(this).data("id");
        var ingredient_title = $(this).data("title");

        var link = $(this);

        //Hide ingredient in palette
        $(link).parent().parent().hide(400);

        var dish_ingridients_container = $("#dish-ingridients");

        var ingredient_panel = $("<div/>", {class: "col-md-3 col-sm-4 col-xs-12"}).append(
            $("<div/>", {class: "panel panel-primary"}).append(
                $("<div/>", {class: "panel-heading text-capitalize", text: ingredient_title}).append(
                    $("<button/>", {class: "close", type: "button", "aria-label": "close" }).click(function () {closeButton()}
                    ).append(
                        $("<span/>", {class: "glyphicon glyphicon-remove"})
                    )
                )
            ).append(
                $("<div/>", {class: "panel-body"}).append(
                    $("<input>", {type: "text", placeholder: "Количество", "data-id": ingredient_id, "data-title": ingredient_title, class: "ingredient-amount form-control"})
                )
            )
        );

        dish_ingridients_container.append(ingredient_panel);

        function closeButton() {
            link.parent().parent().show(400);
            ingredient_panel.remove();
        }
    }
    
    function get_categories(parent)
    {
        var result = [];
        $.each(cook_categories.categories, function(i, item)
        {
            if (parent === null) {
                result[0] = {id: -1, parent_id: parent, title: "Без категорий"};
                if (item.parent_id === parent)
                {
                    result[result.length] = item;
                }
            }
            else
            {
                result[0] = {id: -1, parent_id: parent, title: "Без подкатегорий"};
                if (item.parent_id === +parent)
                {
                    result[result.length] = item;
                }
            }

        });
        return result;
    }

    function make_select_from_categories(data)
    {
        if (data.length > 1)
        {
            var select = $("<select/>").addClass("form-control");
            $.each(data, function(i, item){
                select.append($("<option/>",{text: item.title, value: item.id, "data-parent": item.parent_id}));
            });

            select.change(
                function() {
                    while($(this).next().length)
                    {
                        $(this).next().remove();
                    }
                    $(this).after(make_select_from_categories(get_categories($(this).val())));
                }
            );

            return select;
        }
    }

    function createSelectTags(data) {
        select_multiple = $("#tags");

        var tags = $.map(data.tags, function (obj) {
            obj.text = obj.text || obj.title; // replace name with the property used for the text
            return obj;
        });

        select_multiple.select2({
            data: tags,
            placeholder: "Выберите или добавьте теги",
            tags: true,
            allowClear: true
        });
    }

    $("#photo-url").change(
        function(event) {
            $(".food-photo").prop("src",$(this).val());
        }
    );
});