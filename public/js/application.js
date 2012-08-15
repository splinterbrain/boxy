/*FUNCTIONS IN ALPHABETICAL ORDER
 * accordion effect
 * background color  
 * login popup
 * masonry
 * miniColors
 * slider 
 * */

window.BOXY = window.BOXY || {};

$(function(){

/*accordion*/

$('#editMoodle h3').click(function(){
	$('.moodleSection').removeClass("visible"),
	$(this).next().addClass("visible");
})
	
/*background color*/
BOXY.backgroundColor = "#FFF";
$("body").css("background-color", BOXY.backgroundColor);

$('#groutColorPicker').on("change", function(){
	$("body").css("background-color", $("#groutColorPicker").miniColors("value"));
});
	
/*login popup*/
$("#logInSignUpButton").on("click", function(){
	$("#editMoodle").css("display", "none"); //hides edit moodle when login popup is displayed
	$(".front").removeClass("beingEdited"); //removes edit highlight from moodle's target since moodle is closed
	$("#pageDimmer").css("display", "block");
	$("#logInSignUp").css("display", "block");
});

$("#pageDimmer").on("click", function(){
	$("#logInSignUp").css("display", "none");
	$("#pageDimmer").css("display", "none");
});

$("#logIn").on("click", function(){
	$("#logInSignUp").css("display", "none");
	$("#pageDimmer").css("display", "none");
    $("#loginForm").submit();
});


$("#signUp").on("click", function(){
	$("#logInSignUp").css("display", "none");
	$("#pageDimmer").css("display", "none");
});

/*masonry*/
$('#container').masonry({
   	itemSelector : '.box',
   	animationOptions: {
   		duration: 400
 	},
  	isAnimated: true,
    columnWidth : 0,
    gutterWidth: 10
  });
  	
/*miniColors*/
$(".color-picker").miniColors({
	letterCase: 'uppercase',
	change: function(hex, rgb) {
		$("input.color-picker").trigger("change");
	}
});


	
/*slider*/
$("#widthSlider" ).slider({	
	value:1,
	min: 70,
	max: 710,
	step: 80,
	slide: function( event, ui ) {
		$( "#widthValue" ).val(ui.value);
		//$(".box").width(ui.value);
		}
	});
	
$("#widthValue" ).val($( "#widthSlider" ).slider("value"));

$("#heightSlider" ).slider({	
	value:1,
	min: 70,
	max: 710,
	step: 80,
	slide: function( event, ui ) {
		$( "#heightValue" ).val(ui.value);
		//$(".box").height(ui.value);
	}	
	});
	
$("#heightValue" ).val($( "#heightSlider" ).slider("value"));


	 
});