/* Boxy's Models.js file defines: BoxModel, BoxView, BoxCollection, BoxesView */

$(function(){
	
	/*MODELS*/
	var BoxModel = Backbone.Model.extend({
		"defaults":{
			"height": "short",
			"width": "narrow",
			"icon": "Hello",
			"details" : "Info goes here"
		}
	});
	var BoxView = Backbone.View.extend({
		"tagName" : "div",
		"className" : "box",
		"template" : _.template($("#boxViewTemplate").html()),
		"render" : function(){
			this.$el.html(this.template(this.model.toJSON()));
			this.$el.addClass(this.model.get("height"));
			this.$el.addClass(this.model.get("width"));
			return this;
		}
 	});
 	var BoxCollection = Backbone.Collection.extend({
 		"model" : BoxModel
 	});
 	
 	var BoxesView = Backbone.View.extend({
 		"initialize" : function(){
 			var boxes = this.collection;
 			boxes.on("add", this.onAddBox, this);
 		},
 		"render" : function(){
 			this.$el.empty();
 			this.collection.forEach(this.onAddBox,this);
 		},
 		'onAddBox' : function(box){
 			var aBoxView = new BoxView({
 				"model" : box
 			});
 			var renderedBox = aBoxView.render();
 			this.$el.append(renderedBox.el);
 			
 			$("#container").masonry("reload");
 			
 		}
 	});	
 	
 	/*INSTANCES*/
 	
 	var myBoxesCollection = new BoxCollection();
 	
 	var myBoxesView = new BoxesView({
 		'collection' : myBoxesCollection,
 		el : $("#container")
 	});
 	
 	myBoxesView.render();
 	
 	/*APPLICATION*/
 	
 	$("#addSmall").on("click", function(){
		myBoxesCollection.add({height: "short", width:"narrow", icon : $("#specifyTitle").val()});
	    });

	$("#addTall").on("click", function(){
		myBoxesCollection.add({height: "tall", width:"narrow", icon : $("#specifyTitle").val()});
	    });

	$("#addWide").on("click", function(){
		myBoxesCollection.add({height: "short", width:"wide", icon : $("#specifyTitle").val()});
	    });
 	
 	
 	
})


