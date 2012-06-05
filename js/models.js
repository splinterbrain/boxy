/* Boxy's Models.js file defines: BoxModel, BoxView, BoxCollection, BoxesView */

var BOXY = {};

$(function(){
	/*MODELS*/
	
	BOXY.BoxModel = Backbone.Model.extend({ //Stores data for individual boxes
		"defaults":{
			'height' : '70',
			'width' : '70',
			'title' : '',
			'color': '#242C35', 
			'details' : ''
		}
	});
	
	BOXY.BoxCollection = Backbone.Collection.extend({ //Stores boxes as a collection
 		"model" : BOXY.BoxModel
 	});
	
	/*VIEWS*/
	
	BOXY.BoxView = Backbone.View.extend({
		'tagName' : 'div',
		'className' : 'box',
		'template' : _.template($("#boxViewTemplate").html()),
		'initialize' : function(){
			this.model.on("change", this.onChange, this);
		},
		'render' : function(){
			this.$el.html(this.template(this.model.toJSON()));
			this.$el.css({
				'width' : this.model.get("width") + "px",
				'height': this.model.get("height") + "px",
				'background-color': this.model.get("color")
			})			
			return this;
		},
		'onChange' : function(){
			this.$el.find(".front").html(this.model.get("title"));
			this.$el.css({
				'width': this.model.get("width") + "px",
				'height': this.model.get("height") + "px",
				'background-color': this.model.get("color") 
			})
			$("#container").masonry("reload");
		}
		
	});
 	
 	BOXY.BoxCollectionView = Backbone.View.extend({
 		'initialize' : function(){
 			this.collection.on("add", this.onAdd, this);
 		},
 		
 		'onAdd' : function(addedModel){
 			var aBoxView = new BOXY.BoxView({
 				model:addedModel
 			});
 			aBoxView.render();
 			this.$el.append(aBoxView.el);
 			
 			$("#container").masonry("reload");
 			
 			aBoxView.$el.on("click", function(){
 				BOXY.aBoxEditor.model = addedModel;
 				BOXY.aBoxEditor.render();
 			});
 		}
 	});
 	
 	BOXY.BoxEditorView = Backbone.View.extend({
 		'initialize' : function(){
 			this.$el.find("#specifyTitle").on("change keyup",
 			$.proxy(this.onChange, this));
 			
 			this.$el.find("#widthSlider").on("slidechange",
 			$.proxy(this.onChange, this));
 			
 			this.$el.find("#heightSlider").on("slidechange",
 			$.proxy(this.onChange, this));
 			
 			this.$el.find("#boxColorPicker").on("change",
 			$.proxy(this.onChange, this));
 			
 		},
 		'render' : function(){
 			this.$el.find("#specifyTitle").val(this.model.get("title"));
 			this.$el.find("#widthSlider").slider("value", this.model.get("width"));
 			this.$el.find("#heightSlider").slider("value", this.model.get("height"));
 			this.$el.find("#boxColorPicker").miniColors("value", "#" + this.model.get("color"));
 		},
 		'onChange' : function(e){
 			if(e.type == "slidechange" && !e.originalEvent) return;
 			this.model.set({title : this.$el.find("#specifyTitle").val()});
 			this.model.set({width : this.$el.find("#widthSlider").slider("value")});
 			this.model.set({height : this.$el.find("#heightSlider").slider("value")});
 			this.model.set({color : this.$el.find("#boxColorPicker").miniColors("value")});
 		}
 	});
 		 	
 	/*INSTANCES*/
 	
 	BOXY.aCollection = new BOXY.BoxCollection();
 	BOXY.aCollectionView = new BOXY.BoxCollectionView({
 		'collection' : BOXY.aCollection,
 		el : $("#container")
 	});
 	
 	BOXY.aBoxEditor = new BOXY.BoxEditorView({
 		el : $("#editMoodle")
 	});
 	
 	
 	/*APPLICATION*/
 	
 	$("#addBox").on("click", function(e){
 		
 		console.log($("#heightSlider").val());
 		BOXY.aCollection.add({
 			title : $("#specifyTitle").val()
 			});
 	});
 	
 	
 	
})


