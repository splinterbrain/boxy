/*FUNCTIONS IN ALPHABETICAL ORDER
 * card flip  
 * masonry
 * slider 
 * */

$(function(){
	
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
    columnWidth : 100,
    gutterWidth: 10
  });
  		
/*slider*/
$("#widthSlider" ).slider({	
	value:1,
	min: 1,
	max: 10,
	step: 1,
	slide: function( event, ui ) {
		$( "#widthValue" ).val(ui.value );
		}
	});
	
$("#widthValue" ).val($( "#widthSlider" ).slider("value"));

$("#heightSlider" ).slider({	
	value:1,
	min: 1,
	max: 10,
	step: 1,
	slide: function( event, ui ) {
		$( "#heightValue" ).val(ui.value );
		}
	});
	
$("#heightValue" ).val($( "#heightSlider" ).slider("value"));


	 
});