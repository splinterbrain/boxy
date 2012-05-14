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
$( ".ui-slider" ).slider({step: 10}); //{ step: 110 } as argument in slider

});