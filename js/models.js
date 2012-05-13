/* Boxy's Models.js file defines: BoxModel, BoxView, BoxCollection, BoxesView */

$(function(){
	var BoxModel = Backbone.Model.extend({
		"defaults":{
			"height": "short",
			"width": "narrow",
			"title": "Hello"
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
 		"onAddBox" : function(box){
 			var aBoxView = new BoxView({
 				"model" : box
 			});
 			var renderedBox = aBoxView.render();
 			this.$e1.append(renderedBox.el);
 		}
 	});	
 
})


