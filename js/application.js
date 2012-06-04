/*FUNCTIONS IN ALPHABETICAL ORDER
 * accordion
 * card flip  
 * masonry
 * miniColors
 * selected icon effect
 * slider 
 * */

$(function(){

/*accordion*/

$('#editMoodle h3').click(function(){
	$('.moodleSection').removeClass("visible"),
	$(this).next().addClass("visible");
})
	
/*card flip*/

$("#container").on("click", ".box", function(e){
	$(this).toggleClass("flipped");
})

	
/*masonry*/
$('#container').masonry({
   	itemSelector : '.box',
   	animationOptions: {
   		duration: 400
 	},
  	isAnimated: true,
    columnWidth : 70,
    gutterWidth: 10
  });
  	
/*miniColors*/
$(".color-picker").miniColors({
	letterCase: 'uppercase',
	change: function(hex, rgb) {
		$("input.color-picker").trigger("change");
	}
});

/*selected icon effect*/
$('.icon').click(function(){
	$('.icon').removeClass("selectedIcon"),
	$(this).addClass("selectedIcon");
})

	
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