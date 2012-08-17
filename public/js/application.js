/*FUNCTIONS IN ALPHABETICAL ORDER
 * accordion effect
 * background color  
 * login popup
 * masonry
 * miniColors
 * slider 
 * */

window.BOXY = window.BOXY || {};

$(function () {

    /*accordion*/

    $('#editMoodle h3').click(function (e) {
        e.preventDefault();
        $('.moodleSection').removeClass("visible"),
            $(this).next().addClass("visible");
    })

    /*background color*/
    BOXY.backgroundColor = "#4c5764";
//    $("body").css("background-color", BOXY.backgroundColor);

    $('#groutColorPicker').on("change", function () {
        $("body").css("background-color", $("#groutColorPicker").miniColors("value"));
    });

    /*login popup*/
    $("#logInSignUpButton").on("click", function () {
        $("#editMoodle").css("display", "none"); //hides edit moodle when login popup is displayed
        $(".front").removeClass("beingEdited"); //removes edit highlight from moodle's target since moodle is closed
        $("#pageDimmer").css("display", "block");
        $("#logInSignUp").css("display", "block");
    });

    $("#pageDimmer").on("click", function () {
        $("#logInSignUp").css("display", "none");
        $("#pageDimmer").css("display", "none");
    });

//    $("#logIn").on("click", function () {
//        $("#logInSignUp").css("display", "none");
//        $("#pageDimmer").css("display", "none");
//        $("#loginForm").submit();
//    });

//    $("#signUp").on("click", function () {
//        $("#logInSignUp").css("display", "none");
//        $("#pageDimmer").css("display", "none");
//    });

    /*form validation and ajax*/

    BOXY.emailDomains = ['hotmail.com', 'gmail.com', 'aol.com', "mac.com", "msn.com"];
    BOXY.topLevelDomains = ["com", "net", "org"];


    $("input[type=email]").on("blur", function (e) {
        $(this).mailcheck({
            domains:BOXY.emailDomains,
            topLevelDomains:BOXY.topLevelDomains,
            suggested:function (el, suggestion) {
                $(el).parent().attr("data-warning", "Did you mean " + suggestion.full + "?");
                $(el).parent().addClass("warning");
            },
            empty:function (el) {
                $(el).parent().removeClass("warning");
            }
        });
    });

    $("form").on("submit", function (e) {
        e.preventDefault();
        e.stopPropagation();

        $this = $(this);

        //Validate
        var inputs = $this.find("input");
        var errors = 0;
        for (var i = 0; i < inputs.length; i++) {
            var $input = $(inputs[i]);
            if ($input.data("validate-required") === true) {
                if ($input.val() == "") {
                    $input.parent().addClass("error");
                    $input.parent().attr("data-error", "Required");
                    errors++;
                } else {
                    $input.parent().removeClass("error");
                    $input.parent().attr("data-error", "");
                }
            }
            if ($input.data("validate-match") != "" && $("#" + $input.data("validate-match")).length > 0) {
                if ($input.val() != $("#" + $input.data("validate-match")).val()) {
                    $input.parent().addClass("error");
                    $input.parent().attr("data-error", "Must match");
                    errors++;
                } else {
                    $input.parent().removeClass("error");
                    $input.parent().attr("data-error", "");
                }
            }
        }

        if (errors > 0) return;

        //Submit

        $.post($this.attr("action"), $this.serialize()
        ).success(function (resp) {
                console.log(resp);
                if (resp.redirect) location.href = location.origin + resp.redirect;
            }
        ).error(function (resp) {
                console.log(resp);
                alert(resp.responseText);
            });

    });

    /*masonry*/
    $('#container').masonry({
        itemSelector:'.box',
        animationOptions:{
            duration:400
        },
        isAnimated:true,
        columnWidth:0,
        gutterWidth:10
    });

    /*miniColors*/
    $("#groutColorPicker").val(BOXY.backgroundColor);
    $(".color-picker").miniColors({
        letterCase:'uppercase',        
        change:function (hex, rgb) {
            $("input.color-picker").trigger("change");
        }
    });


    /*slider*/
    $("#widthSlider").slider({
        value:1,
        min:70,
        max:710,
        step:80,
        slide:function (event, ui) {
            $("#widthValue").val(ui.value);
            //$(".box").width(ui.value);
        }
    });

    $("#widthValue").val($("#widthSlider").slider("value"));

    $("#heightSlider").slider({
        value:1,
        min:70,
        max:710,
        step:80,
        slide:function (event, ui) {
            $("#heightValue").val(ui.value);
            //$(".box").height(ui.value);
        }
    });

    $("#heightValue").val($("#heightSlider").slider("value"));


});