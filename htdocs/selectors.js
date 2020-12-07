window.qwx.basicSelector = function(place, opt) {
	qwx.widget.call(this, place, opt);
	this.sel = $('<select/>').appendTo(place);
	if(opt.withNull)
		$('<option value=""/>').appendTo(this.sel).html(opt.withNull);
	for(var i in opt.list) {
		$('<option/>').appendTo(this.sel).attr('value', opt.list[i].id).html(qwx.t(opt.template, { o: opt.list[i]} ));
	}
}

window.qwx.basicSelector.prototype = Object.create(window.qwx.widget.prototype);
window.qwx.basicSelector.prototype.constructor = window.qwx.basicSelector;
window.qwx.basicSelector.prototype.val = function(v) {
	if(arguments.length>0) {
		this.sel.val(v);
	} else {
		return this.sel.val();
	}
}

window.qwx.singleObjectSelector  = function(place, opt) {
	qwx.widget.call(this, place, opt);
	this.cid             = opt.cid;
	this.query           = opt.query || opt.selector_query;
	this.object_template = opt.object_template ? qwx.template(opt.object_template) : null;
	this.object_query    = opt.object_query || {};  // для получения объектов по id
	this.disabled        = opt.disabled;
	this.data            = opt.data;

	if(! this.cid) {
		//throw('cid not specified for singleObjectsSelector');
	}
	this.draw(opt);
};
window.qwx.singleObjectSelector.prototype = Object.create(window.qwx.widget.prototype);
window.qwx.singleObjectSelector.prototype.constructor = window.qwx.singleObjectSelector;

window.qwx.singleObjectSelector.prototype.open = function() {
	var self = this;
	if(self.opened) return false;
	self.opened = true;

	var d = this.openDialog(function(node) {
		self.val(node);
		self.place.trigger('change');
	});
	if(d && d.addClass) d.addClass('object-selector');
	d.closest('.modal').on('hide.bs.modal', function(){ self.opened = false; });

}
window.qwx.singleObjectSelector.prototype.val = function(v) {
	var self = this;
	if (arguments.length == 0 ) {
		return this.value;
	} else {
		var val = arguments[0];
		if(val) {
			if(_.isObject(val)) {
				this.setObject(val);
			} else {
				window.api('get', [this.cid, val, self.object_query], false, function(r) {
					self.setObject(r.obj);
				});
			}
		} else {
			self.setObject(null);
		}
		return self;
	}
}
window.qwx.singleObjectSelector.prototype.setObject = function(s) {
	var place = this.object_place;
	if(s) {
		place.html(this.object_template ? this.object_template({o:s, list: { disabled: this.disabled, data:_.extend({disabled:this.disabled},this.data)}}) : s.title);
		this.value = s.id;
		if(this.label) this.label.addClass('high');

	} else {
		this.value = null;
		place.html('');
		if(this.label) this.label.removeClass('high');
	}
}
window.qwx.singleObjectSelector.prototype.isDisabled = function() {
	return this.disabled;
}
window.qwx.singleObjectSelector.prototype.setDisabled = function(disabled) {
	qwx.widget.prototype.setDisabled.call(this, disabled);
	this.btn[0].disabled = 	disabled;
	if(disabled) this.btn.hide(); else this.btn.show();
}
/*--------------------*/

window.qwx.simpleSingleSelector = function(place, opt) {
	qwx.singleObjectSelector.call(this, place, _.extend({
		object_template  : '<%- o.title %>'
	}, opt));


	var selector_template = opt.row_template || '<%- o.title %>';
	if(selector_template.substr(0,1)=='#') {  // do not wrap such templates
		this.row_template = selector_template ;
	} else {
		this.row_template = '<div class="object hover selectable" data-id="<%= o.id %>">' + selector_template + '</div>';
	}
	this.page_size = opt.page_size || 40;
	this.title     = opt.title     || 'Выбор ....';
	this.withSearch = opt.withSearch;
	this.textSearchField    = opt.textSearchField;
	this.textSearchModifier = opt.textSearchModifier;
	this.add                = opt.add;
	this.newObjectAttr      = opt.newObjectAttr;
	place.addClass('simple-selector');
}
window.qwx.simpleSingleSelector.prototype = Object.create(window.qwx.singleObjectSelector.prototype);
window.qwx.simpleSingleSelector.prototype.constructor = window.qwx.simpleSingleSelector;
window.qwx.simpleSingleSelector.prototype.draw = function(opt) {
	var place = this.place;
	place.html('<span></span><div class="btn-group"><button class="btn btn-secondary btn-selector"><i class="fa fa-search" aria-hidden="true"></i></button>' +
		(opt.with_reset ? 	'<button class="btn btn-secondary btn-reset ml-2"><i class="fa fa-times"></i></button>' : '') + '</div>'
	);
	var title = opt.label || place.attr('title');
	if(title) {
		this.label = $('<label/>').html(title).prependTo(place);
	}
	this.btn = place.find('button.btn-selector');
	this.object_place = place.find('span');

	var self = this;
	var reset_btn = this.reset_btn = place.find('button.btn-reset').on('click', function(ev) { if(self.disabled) return; self.val(null); place.trigger('change'); ev.stopPropagation()});
	if(this.disabled) {
		this.btn[0].disabled = true;
		this.btn.hide();
		reset_btn[0].disabled = true;
		reset_btn.hide();
	}

	self.opened = false;
	place.on('click', function() {
		if(!self.disabled) {
			self.open();
		}
	});
}

window.qwx.textSearchContains = function(x) {
	 return x && x.match(/\S/) ? { contains: x } : undefined;
}

window.qwx.simpleSingleSelector.prototype.openDialog = function(cb) {
	var d = $('<div/>');
	var m = d.makeModal({title: this.title, topClose: true, width:'80%'});
	m.modalBox();
	d.html('<div class="row" style="justify-content: space-between;">'
		+ (this.withSearch ? '<div class="col-some"><input class="selector-search-field" name="qq"><button type="button" class="btn"><i class="fa fa-search"></i></button></div>' : '')
		+ (this.add ? '<div class="col-some"><button class="btn btn-secondary" role="create">' + (this.add.title || 'Add') + '</div>' : '')
		+ '</div><div class="list"></div><div class="pager"></div>');
	var self = this;
	//setTimeout(function() {
	var listOpt = {
		apiCall       : window.api,
		apiMethod     : 'mget',
		cid           : self.cid,
		query		  : self.query,
		page_size     : self.page_size,
		pager_place   : d.find('.pager'),
		row_template  : self.row_template  ,
		ignoreState   : true,
		ignoreArgs    : true,
		postDisplayRow: function(el,o) {
			el.on('click', function() {
				m.modal('hide');
				cb(o);
			});
		},
		filters: [
			[ self.textSearchField || 'title', d.find('[name=qq]'), self.textSearchModifier || (self.textSearchField ? null : qwx.textSearchContains) ]
		]
	};
	if(this.add) {
		d.find('button[role=create]').on('click', function() {
			d.find('.list').w().openEditDialog(null, null, {addData: self.newObjectAttr } );
		});
		listOpt.editDialog = {
			template     : self.add.template, getAfterSave: 'final', title: self.add.title,
			fillDialog   : self.add.fillDialog, 		data_prepare_view_opt: self.object_query
		};
		d.find('.list').on('afterSave', function(ev, list, obj) {
			m.modal('hide');				
			cb(obj);
		});
	}

	d.find('.list').qwxList(listOpt);
	return d;
//	}, 2000);

}
window.qwx.simpleSingleSelector.prototype.setDisabled = function(s) {
	qwx.singleObjectSelector.prototype.setDisabled.call(this, s);
	this.btn[0].disabled = s;
	if(s) { this.btn.hide(); this.reset_btn.hide(); } else { this.btn.show(); this.reset_btn.show();  }
	
	
}
qwx.setJQWidget('simpleSingleSelector', 'qwx.simpleSingleSelector');



/*-------------------------------------*/

window.qwx.complexSingleSelector = function(place, opt) {

	qwx.singleObjectSelector.call(this, place, _.extend({
		button           : '<i class="fa fa-search" aria-hidden="true"></i>',
		object_template  : '<%- o.title %>'
	}, opt));

	this.row_template = opt.row_template || '<div class="hover" style="cursor:pointer;" data-id="<%= o.id %>"><%- o.title %></div>';
	this.page_size = opt.page_size || 40;
	this.title     = opt.title     || 'Выбор ....';
	this.add                = opt.add;
	this.newObjectAttr      = opt.newObjectAttr;
	this.editDialog         = opt.editDialog;
	this.editAfterSelect    = opt.editAfterSelect;
	place.addClass('complex-selector');
}
window.qwx.complexSingleSelector.prototype = Object.create(window.qwx.singleObjectSelector.prototype);
window.qwx.complexSingleSelector.prototype.constructor = window.qwx.complexSingleSelector;
window.qwx.complexSingleSelector.prototype.draw = function(opt) {
	var place = this.place;
	var inplace = $('<div class="data-block"/>').appendTo(place);
	this.object_place = $('<div></div>').appendTo(inplace);
	var c = this.btnContainer = $('<div class="btn-container"/>').appendTo(inplace);
	var self = this;
	if(!this.disabled) {
		this.btn_select_new   = $('<button class="btn btn-secondary btn-selector"/>').appendTo(c).html(opt.selectButtonText || 'Add').on('click', function() {
			self.open();
		});
		this.btn_select_other = $('<button class="btn btn-secondary btn-selector"/>').appendTo(c).html(opt.changeButtonText || 'Select other').hide().on('click', function() {
			self.open();
		});
	//	this.btn_edit         = $('<button class="btn btn-secondary btn-edit"/>'    ).appendTo(c).html(opt.editButtonText   || 'Edit').hide();
	}


};


window.qwx.complexSingleSelector.prototype.openDialog = function(cb) {
	var d = $('<div/>');
	var m = d.makeModal({title: this.title, topClose: true, width:'80%'});
	m.modalBox();
	d.html('<div class="row" style="justify-content: space-between;">'
		+ (this.add ? '<div class="col-some"><button class="btn btn-secondary" role="create">' + (this.add.title || 'Add') + '</div>' : '')
		+ '</div><div class="list"></div><div class="pager"></div>');
	var self = this;

	var listOpt = {
		apiCall       : window.api,
		apiMethod     : 'mget',
		cid           : self.cid,
		query		  : self.query,
		page_size     : self.page_size,
		pager_place   : d.find('.pager'),
		row_template  : self.row_template  ,
		ignoreState   : true,
		ignoreArgs    : true,
		postDisplayRow: function(el,o) {
			el.addClass('selectable');
			
			var qwxlist = this;
			el.on('click', function() {
				if(!self.editAfterSelect) {
					m.modal('hide');
					return cb(o);
				}
				qwxlist.openEditDialog(o.id, function() {
					m.modal('hide');
					cb(o);
				});		
			});
		},
		editDialog : this.editDialog,
		filters: [
			[ self.textSearchField || 'title', d.find('[name=qq]'), self.textSearchModifier || function(x) { return x && x.match(/\S/) ? { contains: x } : undefined; } ]
		]
	};
	if(this.add) {
		d.find('button[role=create]').on('click', function() {
			d.find('.list').w().openEditDialog(null, null, {addData:self.newObjectAttr} );
		});
		d.find('.list').on('afterSave', function(ev, list, obj) {
			m.modal('hide');				
			cb(obj);
		});
	}

	d.find('.list').qwxList(listOpt);
	return d;
}


window.qwx.complexSingleSelector.prototype.setObject = function(s) {
	window.qwx.singleObjectSelector.prototype.setObject.call(this,s);
	if(s) {
		var self = this;
		if(this.btn_select_new) this.btn_select_new.hide();
		if(this.btn_select_other) this.btn_select_other.show();
		this.object_place.find('[role=editButton]').on('click', function() {
			new qwx.editDialog(s.id, _.extend( {
				disabled : self.disabled,
				afterSave: function(o) {
					self.setObject(o);
				}
			}, self.editDialog));
		});
	} else {
		if(this.btn_select_new) this.btn_select_new.show();
		if(this.btn_select_other) this.btn_select_other.hide();
	}
}

qwx.setJQWidget('complexSingleSelector', 'qwx.complexSingleSelector');

/*-------------------------------------*/
window.qwx.multipleObjectSelector  = function(place, opt) {
	qwx.widget.call(this, place, opt);
	this.cid             = opt.cid;
	this.title           = opt.title;
	this.selector_query  = opt.selector_query;
	this.selector_page_size    = opt.selector_page_size;
	this.object_wrapped  = false;
	if(opt.object_template.substr(0,1)=='#') { // do not wrap such templates
		this.object_template   = opt.object_template;
	} else {
		this.object_wrapped  = true;
		this.object_template   = (opt.sortable ? '<li' : '<div' ) + ' class="object hover" data-id="<%= o.id %>">' + opt.object_template + '</' + (opt.sortable ? 'li>' : 'div>' );
	}
	this.object_template_opt = opt.object_template_opt;
	var selector_template = opt.selector_row_template || opt.object_template;
	if(selector_template.substr(0,1)=='#') {  // do not wrap such templates
		this.selector_row_template = selector_template ;
	} else {
		this.selector_row_template = '<div class="object hover selectable" data-id="<%= o.id %>">' + selector_template + '</div>';
	}
	this.edit_template         = opt.edit_template;
	this.fill_edit_dialog      = opt.fill_edit_dialog;
	this.collect_edit_dialog   = opt.collect_edit_dialog;
	this.edit_dialog_title     = opt.edit_dialog_title;
	this.edit_dialog_data_opt  = opt.edit_dialog_data_opt;
	this.edit_dialog_opt       = opt.edit_dialog_opt;
	this.editDialog       = opt.editDialog;
	this.object_query     = opt.object_query || {};  // для получения объектов по id
	this.add              = opt.add;
	this.newObjectAttr    = opt.newObjectAttr || {};
	this.sortable         = opt.sortable;
	this.editButton       = opt.editButton;
	this.editAfterSelect  = opt.editAfterSelect;
	this.with_detail_btn  = opt.with_detail_btn;


	if(! this.cid) {
		throw('cid not specified for multipleObjectsSelector');
	}

	var self =this;
	this.ww         = $((opt.sortable ? '<ol class="sortable ' : '<div class="' ) + 'multiple-selector-list"/>').appendTo(place);
	if(!opt.disabled) {
		this.add_btn    = $('<button class="btn btn-secondary"/>').attr('type','button').html(_common.add_new)
			.appendTo($('<div class="multiple-selector-add-btn"/>').appendTo(place))
			.on('click', function() {
				self.openDialog();
			});
	}
	
};

window.qwx.multipleObjectSelector.prototype.val = function(v) {
	if(arguments.length==0) {
		var v = [];
		this.ww.find('.object').each(function() { v.push(this.getAttribute('data-id')); });
		return v;
	} else {
		var self = this;
		this.ww.qwxList({
			cid			  : this.cid,
			query         : _.extend({}, this.object_query, {id: v || [] }),
			apiCall       : window.api,
			page_size     : 1000,
			row_template  : this.object_template,
			data          : { row_template_opt: this.object_template_opt, disabled: this.disabled },
			ignoreState   : true,
			ignoreArgs    : true,
			disabled      : self.disabled,
			editDialog    : ( self.editDialog ? _.extend({},self.editDialog) : {
				template     : self.edit_template, getAfterSave: 'final',
				fillDialog   : self.fill_edit_dialog, title: self.edit_dialog_title,
				collectData  : self.collect_edit_dialog,
				data_prepare_opt: self.edit_dialog_data_opt,
				dialogOpt    : self.edit_dialog_opt
			}),
			postDisplayRow: function(el,obj) {
				if(self.disabled) {
					if(self.object_wrapped && self.with_detail_btn) {
				       $('<div class="btn btn-link detail-link"/>').appendTo( $('<div/>').appendTo(el)  ).html('подробнее')
						.on('click', function() { self.ww.w().enableEditor(el,obj); });
					}
				} else {
					if(self.object_wrapped) {
					  $('<button class="btn btn-secondary btn-xs" style="margin-right:5px;"/>').attr('title', _common["edit"]).html('<i class="fa fa-edit"></i>').prependTo(el)
					  .on('click', function() { self.ww.w().enableEditor(el,obj); });
					  $('<button class="btn btn-secondary btn-xs" style="margin-right:5px;"/>').attr('title', _common["delete"]).html('<i class="fa fa-times"></i>').prependTo(el)
					  .on('click', function() { el.fadeOut(400, function() { el.remove(); self.place.trigger('change'); }) });
					} else {
					  el.find('[role=unselect]').on('click',function() { el.fadeOut(400, function() {
						el.remove();
						self.place.trigger('change');
						self.place.trigger('unselected', obj.id);
					  }) });
					}
				}
			}
		});
		if(!self.disabled) this.ww.sortable({});
	}
}

window.qwx.multipleObjectSelector.prototype.openDialog = function(v) {
	var d = $('<div/>');
	var m = d.makeModal({title: this.title, topClose: true, width:'80%'});
	m.modalBox();
	d.html('<div class="row" style="justify-content: space-between;">'
		+ (this.withSearch ? '<div class="col-some"><input class="selector-search-field" name="qq"><button type="button" class="btn"><i class="fa fa-search"></i></button></div>' : '')
		+ (this.add ? '<div class="col-some"><button class="btn btn-secondary" role="create">' + _common.add + '</div>' : '')
		+ '</div><div class="list"></div><div class="pager"></div>');
	var self = this;
	function openNewObjectDialog() {
		d.find('.list').w().openEditDialog(null, null, {addData:self.newObjectAttr} );
	}
	function cb(o) {
		self.ww.w().setObject(o);
		self.place.trigger('change');
	}
	//setTimeout(function() {
	var listOpt = {
		apiCall       : window.api,
		cid           : self.cid,
		query		  : _.extend({}, self.selector_query, {id:{not:self.val()}} ),
		page_size     : self.selector_page_size,
		pager_place   : d.find('.pager'),
		row_template  : self.selector_row_template  ,
		ignoreState   : true,
		ignoreArgs    : true,
		postDisplayRow: function(el,o) {
			el.addClass('selectable');
			
			var qwxlist = this;
			el.on('click', function() {
				if(!self.editAfterSelect) {
					m.modal('hide');
					return cb(o);
				}
				qwxlist.openEditDialog(o.id, function() {
					m.modal('hide');
					cb(o);
				});		
			});
		},		

		preDisplayList: function(r) {
			if(r.n==0 && self.add ) { // nothing found: automatically open AddDialog
				openNewObjectDialog();
				return false;
			}
			return true;
		},
		filters: [
			[ 'search', d.find('[name=qq]') ]
		],
		data: { disabled: this.disabled }
	};
	if(this.add) {
		d.find('button[role=create]').on('click', function() {
			openNewObjectDialog();
		});
		listOpt.editDialog = self.editDialog || {
			template     : self.edit_template, getAfterSave: 'final', title: self.add.title,
			fillDialog   : self.fill_edit_dialog, collectData  : self.collect_edit_dialog,
		};
		d.find('.list').on('afterSave', function(ev, list, obj) {
			m.modal('hide');				
			cb(obj);
		});
	}

	d.find('.list').qwxList(listOpt);
	return d;
//	}, 2000);

}
qwx.setJQWidget('multipleObjectSelector', 'qwx.multipleObjectSelector');

/*-------------------------------------*/
window.qwx.multipleCheckBoxSelector  = function(place, opt) {
	qwx.widget.call(this, place, opt);
	this.cid             = opt.cid;
	this.title           = opt.title;
	this.query           = opt.query || { _order: 'pos'};
	this.disabled = opt.disabled;
	this.cbxById = {};
	this.ready   = false;

	if(! this.cid) {
		throw('cid not specified for multipleCheckboxSelector');
	}
	var self =this;
	window.api('mget', [this.cid, this.query ], false, function(r) {
		var byId={},top=[];
		if(opt.tree) {
			for(var i in r.list) {
				var o = r.list[i];
				byId[o.id] = o;
			}
			for(var i in r.list) {
				var o = r.list[i];
				if(o.parent) {
					var p = byId[o.parent];
					if(p) {
						if(!p.children) { p.children=[];}
						p.children.push(o);
					} else {
						console.log('No parent ',o.parent);
					}
				} else {
					top.push(o);
				}
			}
		}

		for(var i in r.list) {
			(function(v) {
				if(opt.tree && opt.select_terminal && v.children) {
					$('<label class="checkbox-selector non-terminal hover"/>').addClass('level-' + v._pos_path.length).css('margin-left',(10+20*v._pos_path.length) + 'px').appendTo(place).append($('<span/>').html( v.title ));
					return;
				}
				var cbx=$('<input type="checkbox"/>').attr('value', v.id);
				if(self.disabled) cbx.prop('disabled', true);
				var lbl=$('<label class="checkbox-selector hover"/>').addClass('level-' + (opt.tree ? v._pos_path.length: 0)).appendTo(place).append(cbx).append($('<span/>').html( v.title ));
				if(opt.tree) {
					lbl.css('margin-left', (20*v._pos_path.length) + 'px');
					if(v.children) lbl.addClass('non-terminal');
				}
				self.cbxById[v.id] = cbx;
				if(v.is_other && opt.other) {
					if(!self.disabled) cbx.on('click', function() {
						if(this.checked) opt.other.show(); else opt.other.hide();
						self.place.trigger('change');
					});
					cbx.on('set-val', function() {
						if(this.checked) opt.other.show(); else opt.other.hide();
					});
				} else {
					cbx.on('click', function() {
						self.place.trigger('change');
					});
				}
				cbx.on('change', function(ev) { ev.stopPropagation(); });
			})(r.list[i]);
		}			
		self.is_loaded  = true;
		self.place.trigger('options-loaded');
	});
	
}

window.qwx.multipleCheckBoxSelector.prototype.val = function(v) {
	if(arguments.length==0) {
		var v = [];
		this.place.find('input[type=checkbox]:checked').each(function() { v.push(this.getAttribute('value')); });
		return v;
	} else {
		var self = this;
		var v = arguments[0];
		function setVal() {
			for(var i in v) {
				var cb=self.cbxById[v[i]];
				if(cb) {
					cb[0].checked =true;
					cb.trigger('set-val');
				}
			}
		}
		if(self.is_loaded) setVal();
		else self.place.one('options-loaded', function() { setVal(); } );
	}
}

qwx.setJQWidget('multipleCheckBoxSelector', 'qwx.multipleCheckBoxSelector');


