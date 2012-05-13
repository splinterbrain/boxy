$(function() {
	var BoxModel = Backbone.Model.extend({
		defaults : {
		    "size" : "large",
		    title : "Hello"
		}
	    });
	var BoxView = Backbone.View.extend({
		tagName : "div",
		className : "box",
		template : _.template($("#boxViewTemplate").html()),
		render : function(){
		    this.$el.html(this.template(this.model.toJSON()));
		    this.$el.addClass(this.model.get("size"));
		    return this;
		}
	    });

	var BoxCollection = Backbone.Collection.extend({
		model : BoxModel		
	    });

	var BoxesView = Backbone.View.extend({
		initialize : function(){
		    var boxes = this.collection;
		    boxes.on("add", this.onAddBox, this);
		},
		render : function(){
		    this.$el.empty();
		    this.collection.forEach(this.onAddBox, this);		    
		},

		onAddBox : function(box){
		    var boxView = new BoxView({
			    model : box
			});
		    var renderedBox = boxView.render();
		    this.$el.append(renderedBox.el);
		}
	    });


	var boxen = [];
	boxen[0] = {title : "I'm a box!"};
	boxen[1] = {"size" : "small"};
	boxen[2] = {};
	var boxenCollection = new BoxCollection(boxen);
	var boxenView = new BoxesView({
		collection : boxenCollection,
		el : $("#container")		
	    });
	boxenView.render();

	$("#addsmall").on("click", function(){
		boxenCollection.add({size : "small", title : $("#title").val()});
	    });

	$("#addlarge").on("click", function(){
		boxenCollection.add({size : "large", title : $("#title").val()});
	    });


});