/* Boxy's Models.js file defines: BoxModel, BoxView, BoxCollection, BoxesView */

window.BOXY = window.BOXY || {};

$(function() {
	/*MODELS*/

	BOXY.BoxModel = Backbone.Model.extend({//Stores data for individual boxes
		"defaults" : {
			'height' : '150',
			'width' : '150',
			'color' : '#242C35',
			'icon' : '',
			'title' : '',
			'details' : '',
			'link' : ''
		},
        
        "idAttribute" : "_id"
	});

	BOXY.BoxCollection = Backbone.Collection.extend({//Stores boxes as a collection
		"model" : BOXY.BoxModel,
        "url" : location.href + "/tiles" //Collection is relative to current user
	});

	/*VIEWS*/

	BOXY.BoxView = Backbone.View.extend({//Governs box appearance
		'tagName' : 'div',
		'className' : 'box',
		'template' : _.template($("#boxViewTemplate").html()),
		'initialize' : function() {
			this.model.on("change", this.onChange, this);
			this.model.view=this; //So view can be grabbed later with model.view
		},
		'render' : function() {
			this.$el.html(this.template(this.model.toJSON()));
            if(this.model.get("link") !== ''){
                this.$el.find(".link > a").html(" <button class='miniButton'><i class='icon-external-link'></i></button> ");
            }

            this.$el.css({
				'width' : this.model.get("width") + "px",
				'height' : this.model.get("height") + "px",
				'background-color' : this.model.get("color")
			});
			
			this.$el.on("click", $.proxy(function(e) { //Governs 3d transform aka card flipping
				if($(e.currentTarget).hasClass("flipped")){
					this.$el.removeClass("flipped");
					return;
				}else{
				$(".box").removeClass("flipped");
				this.$el.toggleClass("flipped");
				}}, this));
			
            if(BOXY.isOwner){
                this.$el.find(".editButton").on("click", $.proxy(function(e) {
                    e.stopPropagation(); //So card doesn't flip when edit button is clicked
                    $(".front").removeClass("beingEdited");//Remove highlighting from whichever box was edited previously
                    this.$el.find(".front").addClass("beingEdited");//Highlight the box currently targetted by the edit moodle
                    BOXY.aBoxEditor.$el.css("display", "block"); //Unhides edit moodle
                    BOXY.aBoxEditor.model = this.model; //Makes this box the target of the edit moodle
                    BOXY.aBoxEditor.render(); //Updates edit moodle to reflect this box's parameters
                }, this));
            }else{
                this.$el.find(".editButton").hide();                
            }
			return this;
		},
		'onChange' : function() { //So view changes with model in real time. 
			this.$el.find(".title").html(this.model.get("title"));
			this.$el.find(".details").html(this.model.get("details"));
			
			if(this.model.get("link") !== ''){
				this.$el.find(".link > a").attr("href", this.model.get("link"));
				this.$el.find(".link > a").html(" <button class='miniButton'><i class='icon-external-link'></i></button> ");
			}
			
			/* CODE INTENDED TO CHECK FOR HTTP:// AT FRONT OF LINK STRING. BUGGY.
			if(this.model.get("link") !== ''){
				if(this.model.get("link").contains("http://")){
					}else{
						this.model.set({
							link: "http://" + this.model.get("link");
						});
					}
				this.$el.find(".link > a").attr("href", this.model.get("link"));
				this.$el.find(".link > a").html(" <button class='miniButton floatRight externalLink'><i class='icon-external-link'></i></button> ");
			};*/
			
			this.$el.find(".tileIcon").html(this.model.get("icon") != "" ? "&#x" + this.model.get("icon") + ";" : "");
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
			this.collection.on("add", this.onAdd, this); //What happens when a box is added
			this.collection.on("remove", this.onRemove, this); //What happens when a box is removed
		},
		'onAdd' : function(addedModel) {
			var aBoxView = new BOXY.BoxView({
				model : addedModel
			});
			aBoxView.render();
			this.$el.append(aBoxView.el);

			$("#container").masonry("reload");

            addedModel.isDirty = true;
//            addedModel.save();
            
		},
		'onRemove' : function(removedModel){
			removedModel.view.$el.detach();
			$("#container").masonry("reload");
		}
	});

	BOXY.BoxEditorView = Backbone.View.extend({ //The edit moodle
		'initialize' : function() { 
			this.$el.find("#textOnFront").on("change keyup", $.proxy(this.onChange, this));
			this.$el.find("#textOnBack").on("change keyup", $.proxy(this.onChange, this));
			this.$el.find("#linkOnBack").on("change keyup", $.proxy(this.onChange, this)); 

			this.$el.find(".icon").on("click", $.proxy(function(e) {
				$('.icon').removeClass("selectedIcon"), 
				$(e.currentTarget).addClass("selectedIcon");
				this.onChange(e);
			}, this));

			this.$el.find("#widthSlider").on("slidechange", $.proxy(this.onChange, this));
			this.$el.find("#heightSlider").on("slidechange", $.proxy(this.onChange, this));
			this.$el.find("#boxColorPicker").on("change", $.proxy(this.onChange, this));
		},
		
		'render' : function() { //Edit moodle displays properties of whichever box is its target.
			this.$el.find("#textOnFront").val(this.model.get("title"));
			this.$el.find("#textOnBack").val(this.model.get("details"));
			this.$el.find("#linkOnBack").val(this.model.get("link")); 
			$('.icon').removeClass("selectedIcon"); //removes highlight from all icons 
			$('.icon[data-icon=' + this.model.get("icon") + ']').addClass("selectedIcon");//highlights target's icon
			this.$el.find("#widthSlider").slider("value", this.model.get("width"));
			this.$el.find("#heightSlider").slider("value", this.model.get("height"));
			this.$el.find("#boxColorPicker").miniColors("value", "#" + this.model.get("color"));
			this.$el.find(".closeMoodle").on("click", $.proxy(function() { //Closes (hides) the moodle.
				this.$el.css("display", "none");
				$(".front").removeClass("beingEdited");
			}, this));
			this.$el.find(".removeButton").on("click", $.proxy(function(){ //Deletes a box model.
//				BOXY.aCollection.remove(this.model);
                this.model.destroy({wait:true});
			}, this));
			$('#editMoodle').draggable({handle: "#handle"});
		},
		'onChange' : function(e) {//Confers changes made in the editor to the model. 
			if(e.type == "slidechange" && !e.originalEvent) //Necessary because the slider was causing problems.
				return;
			this.model.set({
				title : this.$el.find("#textOnFront").val()
			});
			this.model.set({
				details : this.$el.find("#textOnBack").val()
			});
			
			this.model.set({
				link : this.$el.find("#linkOnBack").val() 
			});

			this.model.set({
				icon : this.$el.find(".selectedIcon").data("icon")
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
            
            this.model.isDirty = true;
            if(this.model.isSaving) this.model.isSavingDirty = true;
//            this.model.save();
		}
		
	});

	/*INSTANCES*/

	BOXY.aCollection = new BOXY.BoxCollection();
	BOXY.aCollectionView = new BOXY.BoxCollectionView({
		'collection' : BOXY.aCollection,
		el : $("#container")
	});
    
    BOXY.aCollection.fetch({silent : false});

	BOXY.aBoxEditor = new BOXY.BoxEditorView({
		el : $("#editMoodle")
	});

	/*APPLICATION*/

	$("#addBox").on("click", function(e) { 
	//When a boxes is added, it becomes the target of the edit moodle automatically.
		BOXY.aCollection.add({
		});
		$(".front").removeClass("beingEdited");//Remove highlighting from whichever box was edited previously
		BOXY.aCollection.at(BOXY.aCollection.length-1).view.$el.find(".front").addClass("beingEdited");
		BOXY.aBoxEditor.$el.css("display", "block");
		BOXY.aBoxEditor.model = BOXY.aCollection.at(BOXY.aCollection.length-1)
		BOXY.aBoxEditor.render();
	});
    
    //Save at 5 second intervals if changes have happened
    if(BOXY.isOwner){
        setInterval(function(){
            for(var i=0;i<BOXY.aCollection.models.length;i++){
                var model = BOXY.aCollection.at(i);
                if(model.isDirty){
                    $("#saveIndicator").addClass("saving");
                    model.save(null, {success : function(model){
                        model.isDirty = false;
                        if(!_.any(BOXY.aCollection.models, function(m){return m.isDirty;})) $("#saveIndicator").removeClass("saving").removeClass("error");
                        if(model.isSavingDirty){
                            model.isDirty = true;
                            model.isSavingDirty = false;
                        }
                    }, error : function(model, resp){
                        console.error("Error saving model");
                        $("#saveIndicator").addClass("error");
                    }});
                }
            }
        }, 5000);
        //Save all dirty models on window unload
        $(window).on("unload", function(e){
            for(var i=0;i<BOXY.aCollection.models.length;i++){
                var model = BOXY.aCollection.at(i);
                if(model.isDirty || model.isSavingDirty){
                    model.save();
                }
            }
        });
    }
    
})