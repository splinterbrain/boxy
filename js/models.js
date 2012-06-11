/* Boxy's Models.js file defines: BoxModel, BoxView, BoxCollection, BoxesView */

var BOXY = {};

$(function() {
	/*MODELS*/

	BOXY.BoxModel = Backbone.Model.extend({//Stores data for individual boxes
		"defaults" : {
			'height' : '70',
			'width' : '70',
			'color' : '#242C35',
			'icon' : '',
			'title' : '',
			'details' : ''
		}
	});

	BOXY.BoxCollection = Backbone.Collection.extend({//Stores boxes as a collection
		"model" : BOXY.BoxModel
	});

	/*VIEWS*/

	BOXY.BoxView = Backbone.View.extend({//Governs box appearance
		'tagName' : 'div',
		'className' : 'box',
		'template' : _.template($("#boxViewTemplate").html()),
		'initialize' : function() {
			this.model.on("change", this.onChange, this);
			this.model.view=this;
		},
		'render' : function() {
			this.$el.html(this.template(this.model.toJSON()));
			this.$el.css({
				'width' : this.model.get("width") + "px",
				'height' : this.model.get("height") + "px",
				'background-color' : this.model.get("color")
			});
			
			this.$el.on("click", $.proxy(function(e) {
				this.$el.toggleClass("flipped");
			}, this));
			
			this.$el.find(".editButton").on("click", $.proxy(function(e) {
				e.stopPropagation();
				$(".front").removeClass("beingEdited");//Remove highlighting from whichever box was edited previously
				this.$el.find(".front").addClass("beingEdited");//Highlight the box currently targetted by the edit moodle
				BOXY.aBoxEditor.$el.css("display", "block");
				BOXY.aBoxEditor.model = this.model;
				BOXY.aBoxEditor.render();
			}, this));			
			return this;
		},
		'onChange' : function() { //Real time display of changes made in edit panel.
			this.$el.find(".title").html(this.model.get("title"));
			this.$el.find(".details").html(this.model.get("details"));
			this.$el.find(".tileIcon").text(this.model.get("icon"));
			this.$el.css({
				'width' : this.model.get("width") + "px",
				'height' : this.model.get("height") + "px",
				'background-color' : this.model.get("color")
			})
			$("#container").masonry("reload");
		}
	});

	BOXY.BoxCollectionView = Backbone.View.extend({
		'initialize' : function() {
			this.collection.on("add", this.onAdd, this);
		},
		'onAdd' : function(addedModel) {
			var aBoxView = new BOXY.BoxView({
				model : addedModel
			});
			aBoxView.render();
			this.$el.append(aBoxView.el);

			$("#container").masonry("reload");
		}
	});

	BOXY.BoxEditorView = Backbone.View.extend({
		'initialize' : function() {
			this.$el.find("#textOnFront").on("change keyup", $.proxy(this.onChange, this));
			this.$el.find("#textOnBack").on("change keyup", $.proxy(this.onChange, this));

			this.$el.find(".icon").on("click", $.proxy(function(e) {
				$('.icon').removeClass("selectedIcon"), 
				$(e.currentTarget).addClass("selectedIcon");
				this.onChange(e);
			}, this));

			this.$el.find("#widthSlider").on("slidechange", $.proxy(this.onChange, this));
			this.$el.find("#heightSlider").on("slidechange", $.proxy(this.onChange, this));
			this.$el.find("#boxColorPicker").on("change", $.proxy(this.onChange, this));
		},
		
		'render' : function() {
			this.$el.find("#textOnFront").val(this.model.get("title"));
			this.$el.find("#textOnBack").val(this.model.get("details"));
			$('.icon').removeClass("selectedIcon"); //removes highlight from all icons in preparation for...
			$('.icon[data-icon=' + this.model.get("icon") + ']').addClass("selectedIcon");//highlights active icon
			this.$el.find("#widthSlider").slider("value", this.model.get("width"));
			this.$el.find("#heightSlider").slider("value", this.model.get("height"));
			this.$el.find("#boxColorPicker").miniColors("value", "#" + this.model.get("color"));
			this.$el.find(".closeMoodle").on("click", $.proxy(function() {
				this.$el.css("display", "none")
				$(".front").removeClass("beingEdited");
			}, this));
		},
		'onChange' : function(e) {
			if(e.type == "slidechange" && !e.originalEvent)
				return;
			this.model.set({
				title : this.$el.find("#textOnFront").val()
			});
			this.model.set({
				details : this.$el.find("#textOnBack").val()
			});

			this.model.set({
				icon : this.$el.find(".selectedIcon").text()
			});
			this.model.set({
				width : this.$el.find("#widthSlider").slider("value")
			});
			this.model.set({
				height : this.$el.find("#heightSlider").slider("value")
			});
			this.model.set({
				color : this.$el.find("#boxColorPicker").miniColors("value")
			});
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

	$("#addBox").on("click", function(e) {
		BOXY.aCollection.add({
		});
		$(".front").removeClass("beingEdited");//Remove highlighting from whichever box was edited previously
		BOXY.aCollection.at(BOXY.aCollection.length-1).view.$el.find(".front").addClass("beingEdited");
		BOXY.aBoxEditor.$el.css("display", "block");
		BOXY.aBoxEditor.model = BOXY.aCollection.at(BOXY.aCollection.length-1)
		BOXY.aBoxEditor.render();
	});
})