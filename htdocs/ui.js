if(!window.qwx) { window.qwx = {} } 
+function($) {
	var modalStack = [];
	function modalBox(x,opt) { 
		x.one('shown.bs.modal', function() { 
			modalStack.push(x);
			this.style.zIndex = 1040 + 10 * modalStack.length;
			x.data('focus_in', document.activeElement);
			$(this).find('[autofocus]').focus();
			var prev = modalStack.length == 1 ? null : modalStack[modalStack.length-2];
			if(prev) { 
				var kdwh = $.data(prev[0], "events");
				if(kdwh) kdwh = kdwh.keydown;
				if(kdwh) { 
					x.data('prev_keyha', kdwh[0].handler );
					prev.off('keydown.dismiss.bs.modal');
				}
			}
			x.data('isShown', true);
		});
		x.one('hidden.bs.modal', function() { 
			modalStack.pop();
			var prev = modalStack.length == 0 ? null : modalStack[modalStack.length-1];
			if(prev) {
				prev.on('keydown.dismiss.bs.modal',x.data('prev_keyha') ); 
				$(x.data('focus_in')).focus();
			}
			x.data('isShown', false);
		});
		x.modal(opt);
	}
	$.fn.modalBox = function(option) { 
		if(!option || typeof(option) == 'object') { 
			modalBox($(this), option);
		} else if (option == 'isShown') {
			return $(this).data('isShown');
		} else { 
			$(this).modal(option);
		}
		return this;
	}
	$.fn.makeModal = function(option) { 
		var middle = this;
		var width = option && option.width || '60%';
		var modal = $('<div/>');
		modal.addClass('modal fade messageBox').html(
' <div class="modal-dialog" style="width:' + width + ';"><div class="modal-content"><div class="modal-header">' + 
'		 <h4 class="modal-title"></h4></div><div class="modal-body"></div><div class="modal-footer">' + 
(option && option.okButton ? 
'		 <button type="button" style="float: left;" class="btn ' + (option.okButtonClass || 'btn-primary') + ' btn-save">' + option.okButton + '</button>' : 
 ( option && option.okButtons ? _.map(option.okButtons, function(x) { return '<button type="button" style="float: left;" class="btn ' +  (_.escape(x.btnClass) || 'btn-primary btn-save') + '">' + x.label + '</button>'} ).join(' ')
   : ''
 )
) + 
'        <button type="button" class="btn btn-default" data-dismiss="modal">Закрыть</button>' +
'      </div></div></div></div>'
		).appendTo($('body')).find('.modal-body').append(middle);
		if(option && option.title) modal.find('.modal-title').html(option.title);
		return modal;
	}
} (jQuery);
	


+function() { 
	var messageBoxElement;
	function init() { 
		if(!messageBoxElement) 
		messageBoxElement = $('<div/>').addClass('modal fade messageBox').html(
' <div class="modal-dialog" style="width:300px;"><div class="modal-content"><div class="modal-header">' + 
'		 <h4 class="modal-title"></h4></div><div class="modal-body"> </div><div class="modal-footer">' + 
'		 <button type="button" style="display:none; float: left;" class="btn btn-success">Подтвердить</button>' + 
'        <button type="button" class="btn btn-default" data-dismiss="modal">Закрыть</button>' +
'      </div></div></div></div>'
		).appendTo($('body'));
		return messageBoxElement;
	}		
	window.qwx.messageBox = function(title,text,close,style_opt) {
		var div = init();
		var h = div.find('.modal-header'), f=div.find('.modal-footer'), b=div.find('.modal-body');
		if(title) {  h.show().find('.modal-title').html(title); } 
		else  h.hide();
		b.html(text);
		if(style_opt && style_opt.match(/wait/))  b.addClass('waiting'); else b.removeClass('waiting');
		if(style_opt && style_opt.match(/error/)) {
			div.addClass('error'); 
			b.prepend('<span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>');
		} else {
			div.removeClass('error');
		}
	
		if(close) f.show();
			else  f.hide();
		f.find('.btn-success').hide();
		f.find('.btn-success').off('click');
		div.modalBox({keyboard: close, backdrop: (close ? true: 'static') });
	}
	window.qwx.closeMessageBox = function() { 
		init().modal('hide');
	}
	window.qwx.confirmBox = function(title,text,action) {
		var div = init();
		var h = div.find('.modal-header'), f=div.find('.modal-footer'), b=div.find('.modal-body');
		if(title) {  h.show().find('.modal-title').html(title); } 
		else  h.hide();
		b.html(text);
		b.prepend('<span class="glyphicon glyphicon-question-sign" aria-hidden="true"></span>');
		f.show();
		f.find('.btn-success').show();
		f.find('.btn-success').one('click', function() { action(); div.modal('hide'); });
		div.modalBox({keyboard: true, backdrop:  'static' });
	}
	window.qwxTemplateCache = {};
	window.qwx.t = function(template,vars) { 
		if(template.substr(0,1) == '#') { 
			var t = window.qwxTemplateCache[template.substr(1)];
			if(!t) {
				var el = document.getElementById(template.substr(1));
				if(el) { 
					t = window.qwxTemplateCache[template.substr(1)] = _.template(el.innerHTML);
				} else { 
					console.log('No element ', template);
					return '';
				}
			}	
			return t(vars);
		} else { 
			var t =  _.template(template);
			return t(vars);
		}
	}
	window.qwx.template = function(template) { 
		if(template.substr(0,1) == '#') { 
			var el = document.getElementById(template.substr(1));
			if(el) { 
				return _.template(el.innerHTML);
			} else { 
				console.log('No element ', template);
				return '';
			}
		} else { 
			return _.template(template);
		}
	}
	window.qwx.$t = function(template,vars) {
		var $t = $(qwx.t(template,vars));
		
		$t.find('[ontemplate]').add($t.filter('[ontemplate]')).each(function() { var onl = this.getAttribute('ontemplate'); try { eval(onl); } catch(e) {throw(e)}; });
		return $t;
	}
	window.qwx.args = function(str) {
		this.data = {};
		if(_.isString(str)) { 
			if(str.length>0) { 
				str = str.split('&');
				for(var i=0, l=str.length;i<l;i++) {	
					var t = str[i].split('=');
					this.data[decodeURIComponent(t[0])] = decodeURIComponent(t[1]);
				}
			}
		} else { 
			_.extend(this.data,str);
		}
	}
	window.qwx.args.prototype.serialize = function(){
		var ar = [];
		for(var k in this.data) { if (this.data[k]===null) continue; ar.push(encodeURIComponent(k) + "=" + encodeURIComponent(this.data[k])); }
		return ar.join('&');
	}
	window.qwx.args.prototype.modify = function(new_args){
		if(new_args && _.isArray(new_args)) { 
			for(var i=0,l=new_args.length;i<l;i+=2) this.data[new_args[i]]= new_args[i+1];	 
		} else if(new_args) {
			this.data = _.extend(this.data,new_args);
		}
		return this;
	}
	window.qwx.args.prototype.arg = function(key) { 
		return this.data[key];
	}
	window.qwx.getArgs = function() {
		return new qwx.args(window.location.search.substr(1));
	}
	window.qwx.initialArgs = window.qwx.getArgs();
	window.qwx.pushState   = function(name, args, changeArgs) { 
		var cur_args = qwx.getArgs();
		args = (args===null) ? cur_args: new qwx.args(args);
		history.pushState(cur_args.data, name, "?" + args.modify(changeArgs).serialize() );							
	}

	
	window.qwx.checkbox_wrap = function(sel, false_null) { 
		return new qwx.checkBoxWrapper(sel, false_null);		
	}



}();

function formatSize(size) { 
		var k,u;
		if(size>1e9) { k = 1e-7; u = 'G';
		} else if (size>1e6) { k = 1e-4; u = 'M';
		} else if (size>1e3) { k = 0.1; u = 'k';
		} else {   
			return size + 'b';
		}		
		size = 0.01 * parseInt(size * k);
		return ('' + size).replace(/(\.\d\d)\d+$/, "$1") + u + 'b';
}
window.qwx.ajax = function(opt) { 
	if(opt.block) { 
		qwx.messageBox(null, (opt.block.message ? opt.block.message : 'Подождите...'), false, 'wait');
	}
	$.ajax({
		url: opt.url, 
		contentType: 'application/json',
		data: JSON.stringify(opt.data),
		type: 'POST',
		success: function(r) { 
			if(r.error) {
				// toDo: must-authenticate
					if(opt.error) { 
						opt.error(r);
					} else if(window.ajaxErrorHandler) { 
						window.ajaxErrorHandler(r);
					} else { 					// toDo: format error messages of known types
						qwx.messageBox('Ошибка', r.error, true, 'error');
					}
			} else {
					var rc;
					if(opt.success) {
						if(opt.success == 'reload') { 
							document.location.reload();
						// toDo: other standard actions
						} else {
							rc = opt.success(r);
						}
					} else {
						rc = true;
					}
					if(opt.block && rc) { 
						qwx.closeMessageBox();
					}
			}

		}, 
		error: function(r) { 
			if(opt.error) { 
				opt.error(r);
			} else if(window.ajaxErrorHandler) { 
				window.ajaxErrorHandler(r);
			} else { 
				qwx.messageBox('Ошибка', 'Ошибка на сервере', true, 'error');
			}
		}
	});
};




+function($) {
	var upload_id = 1;
	
	function uploadButton(btn, opt) {
		var activeBtn;
		btn.each(function() {
			var thisbtn = $(this);
			var is_multiple = opt && opt.multiple;
			if(!is_multiple) { 
				is_multiple = thisbtn.attr('multiple');
			}
			var fmn = '#upload_faf' + (is_multiple ? 'm' :'');
			var faf = $(fmn); 
			if (faf.length==0 && btn.length>0) { console.log("No form" + fmn); return; } 
			var upload_func = "cbupload_" + (upload_id++);
			var type_check_regex = thisbtn.attr('filetype') ? new RegExp(thisbtn.attr('filetype')) : null;
			var moveAway;
			var this_is_multiple = is_multiple;
			if(!is_multiple) is_multiple = opt
		
			window[upload_func] = function(fileData) { 
				if(is_multiple) { 
					for(var i=0,l=fileData.length; i<l; i++) { 
						if(type_check_regex) { 
							if(!fileData[i].content_type.match(type_check_regex)) { 
								fileData[i].bad_type = true;
							}
						}
					}
					thisbtn.trigger('postUpload', { files: fileData });
				} else { 
					if(type_check_regex) { 
						if(!fileData[0].content_type.match(type_check_regex)) { 
							qwx.messageBox('Ошибка', thisbtn.attr('typemessage') ? thisbtn.attr('typemessage'): 'Неподходящий тип файла', true, 'error');
							console.log('file type ', fileData[0].content_type, 'does not match',  type_check_regex);
							return;		
						}
					}
					thisbtn.html(fileData[0].name + ' (' + formatSize(fileData[0].size) + ') <input type="hidden" role="f" value=""><input type="hidden" role="n">');
					thisbtn.find("input[role=f]").val(fileData[0].path);
					thisbtn.find("input[role=n]").val(fileData[0].name);
					thisbtn.trigger('postUpload', fileData[0]);
				}
			}
			thisbtn.mouseover(function() {
				moveAway = false;
				activeBtn = thisbtn;
				var pos = thisbtn.offset();
				var browser_correction = 0;
				var base = { left: 0, top: 0 };
				faf.parent().find('input[name=cb]').val(upload_func);
				faf.css({
					left: pos.left - base.left + browser_correction + 'px',  top: pos.top - base.top + 'px'
				});
			});
			thisbtn.mouseout(function() { moveAway = true; setTimeout(function() { if(moveAway) { moveAway=false; faf.css({left:'-555px'}); } }, 500); });
			faf.mouseover(function(){ moveAway = false;});
			faf.mouseout( function(){ moveAway = true;  setTimeout(function() { if(moveAway) { moveAway=false; faf.css({left:'-555px'}); } }, 500); });
		});
		$('#upload_faf').css('z-index',2000);
		$('#upload_fafm').css('z-index',2000);
	}
	$.fn.uploadButton = function(option) { 
		if(!option || typeof(option) == 'object') { 
			if(this.attr('multiple')) { if(!option) option = {}; option.multiple = true; }
			uploadButton(this , option);
		} else { 
			console.log('option should be {} for uploadButton');
		}
		return this;
	}	
}(jQuery);


$(function() {
	$('button.btn-upload').uploadButton();
});

window.qwx.checkBoxWrapper = function(cb, false_null) { this.cb = $(cb); this.falsenull = false_null } 
window.qwx.checkBoxWrapper.prototype.val = function() { 
	if(arguments.length==0) {
		var v = this.cb.prop('checked');
		return v ? v : this.falsenull ? null : false;
	} else if(arguments.length==1) {
		this.cb.prop('checked',arguments[0]===undefined ? false : arguments[0]);	
		return this.cb;
	}	
}
window.qwx.checkBoxWrapper.prototype.on = function(evtype,hdlr) { 
	if(evtype=='change') { 
		this.cb.on('click', hdlr);
	} else {
		this.cb.on(evtype, hdlr);
	}
}

window.qwx.widget = function(place,opt) { 
	if(!opt) console.log('qwxWidget call without options');
	this.place   = place;
	this.api     = opt.api     || '/user/api';
	var self = this;
	this.apiCall = opt.apiCall || function(method, args, block, cb) { 
		qwx.ajax({
			url:     self.api + '/' + method,
			data:    args,
			block:   block,
			success: cb
		});
	}
};

window.qwx.list = function(place,opt) { 
	qwx.widget.call(this, place, opt);
	this.pager_place	= opt.pager_place;
	this.cid			= opt.cid;
	this.query			= opt.query          || {};
	this.apiMethod      = opt.apiMethod      || 'mget';
	this.row_template 	= opt.row_template   || '#row_template';
	this.pager_template = opt.pager_template || '#pager_template';
	this.page_size		= opt.page_size || 1000;
	this.pager_opt		= opt.pager_opt ? _.extend({width:5,nav:15},opt.pager_opt) : {width:5,nav:15};
	this.data_prepare_opt   = opt.data_prepare_opt;
	this.preDisplayList = opt.preDisplayList;
	this.postDisplayRow = opt.postDisplayRow;
	this.filterSetBack	= opt.filterSetBack || {};
	this.filterModifier = {};
	this.enableEditor	= opt.enableEditor;
	this.remove         = opt.remove;
	this.editDialog     = opt.editDialog;
	this.postprocessQuery = opt.postprocessQuery;
	this.onBeforeDisplayList = opt.onBeforeDisplayList;
	this.data           = opt.data; // simply load data for custom methods and templates
	if(opt.filters) { 
		for(var i=0,l=opt.filters.length;i<l;i++) this.registerFilter.apply(this, opt.filters[i]);
	}
	var page_arg   = this.page_arg		= opt.page_arg  ? opt.page_arg : 'page';
	var filter_arg = this.filter_arg	= opt.filter_arg  ? opt.filter_arg : 'F';	
	var list = this;
    if(!opt.ignorePopState) // temporary
    {
	   $(window).on('popstate', function(ev)  {
		   var state = ev.originalEvent.state;
		   if(state==null) state = qwx.initialArgs.data;
		   list.displayList(state[page_arg], list.json2filter(state[filter_arg]), true );
	   });
    }
	
	if (this.editDialog) { 
		var d_opt = this.editDialog;
		this.postDisplayRow  =  function(el,o) { 
				list.enableRowButtons(el,o);
				if(d_opt.postDisplayRow) d_opt.postDisplayRow.call(list, el, o);
		};
		this.enableEditor = function(place,o,success_cb) {
			return list.openEditDialog(o.id, success_cb);
		}
	}
	if(opt.withRowSelection) { 
		this.makeRowSelectable = function(html) {
			html.on('click', function() { $(this).toggleClass('selected'); list.place.trigger('selectionChange', html); });
			html.find('a').on('click', function(ev) { ev.stopPropagation(); return true; });
		};
	}
	var args = qwx.getArgs();
	this.displayList(args.arg(page_arg), this.json2filter(args.arg(filter_arg)), true);	

}

window.qwx.list.prototype = Object.create(window.qwx.widget.prototype);
window.qwx.list.prototype.constructor = window.qwx.list;

window.qwx.list.prototype.openEditDialog = function(obj_id, success_cb, opt) { 
	var self = this;
	return new qwx.editDialog(obj_id, _.extend({
		cid      : this.cid,
		apiCall  : this.apiCall,
		getAfterSave: 1,
		template : '#edit_dialog_template',
		data_prepare_view_opt: this.data_prepare_opt,
		afterSave: function(o) { 
			if(success_cb) {
				success_cb.call(o);
			} else { 
				self.setObject(o,{ifnot: 'reload'});
			}
		}
	}, this.editDialog, opt));
}
window.qwx.list.prototype.json2filter = function(f) { 
	return f ? JSON.parse(f) : {};
}
window.qwx.list.prototype.getData = function (page,filter,cb) { 
	var realFilter = {};
	if(filter) for(var fld in filter) {
		var fm = this.filterModifier[fld];
		realFilter[fld] = fm ? fm(filter[fld]): filter[fld];
	}	
	var query = filter ? _.extend({}, this.query, realFilter) : this.query;
	if(this.postprocessQuery)  this.postprocessQuery(query);
	if(query.__dont_get_data) { 
		cb({list:[],n:0});
	} else { 
		this.apiCall( this.apiMethod, [ this.cid, query, page, this.page_size, this.data_prepare_opt ], null, cb);			
	}
}	

window.qwx.list.prototype.displayList = function(page,filter, filter_set_back) {
	if(!page) page = 1;
	var list = this;
	var postDisplayRow = this.postDisplayRow;
	list.filter = _.extend({},filter);
	if(filter_set_back) list.setBackFilters();
    if(list.onBeforeDisplayList) list.onBeforeDisplayList(list);
	list.place.trigger('beforeDisplayList', { page: page, filter: filter });

	this.getData(page, filter,function(r) { 
		if(list.preDisplayList && !list.preDisplayList(r)) return; 
		list.place.trigger('preDisplayList', { r: r })
			.html('')
			.trigger('selectionChange');
		list.page = page; 
		for(var i=0,l=r.list.length;i<l;i++) { 
			var html = qwx.$t(list.row_template, { o: r.list[i], list: list });
			html.appendTo(list.place);
			if(list.makeRowSelectable) list.makeRowSelectable(html);
			if(postDisplayRow) { 
				postDisplayRow.call(list, html, r.list[i]);
			}
		}
		if(list.pager_place && list.pager_template) { 
			var p = $(list.pager_place).html(qwx.t(list.pager_template, _.extend({ page_size: list.page_size, page: page, page_arg: list.page_arg, n: r.n},list.pager_opt)));
			p.find('a').on('click', function()  {
				var page = this.getAttribute('page');
				qwx.pushState("page " + page,  null, [ list.page_arg, page, list.filter_arg, JSON.stringify(filter)]);
				list.displayList(page,filter);
				return false;
			});
		}
		list.place.trigger('afterDisplayList', { items: r.list });

	});
};
window.qwx.list.prototype.setFilter = function(fld,val) {
	var add = {};
	if (_.isObject(fld)) { 
		add = fld;
	} else {
		add[fld]= _.isBoolean(val) ? val : (_.isNumber(val) || _.isObject(val) || (val && val.length>0)) ? val : null;
	}
	var filter_with_nulls = _.extend({},this.filter, add);
	var filter = this.filter =  _.pick(filter_with_nulls, function(v,k,o) { return (v!==null); } );
	qwx.pushState("filter " ,  null, [ this.page_arg, 1, this.filter_arg, JSON.stringify(filter)]);
	this.displayList(1, filter);
};
window.qwx.list.prototype.setBackFilters = function() {
	for(var fld in this.filterSetBack) { 
		this.filterSetBack[fld](this.filter[fld]);
	}
};
window.qwx.list.prototype.registerFilter = function(fld, filter_fld, modifier, default_value) { 
	// filter_fld should be an object with "val" getter/setter method, and with .on('change',cb) method
	var list = this;
	if(filter_fld[0] && filter_fld[0].tagName =='INPUT' && filter_fld[0].getAttribute('type') == 'checkbox') { //special case of checkbox: process "click" event instead of "change"
		filter_fld.on('click', function() { list.setFilter(fld, filter_fld[0].checked ? 1 : 0);  });
		this.filterSetBack[fld] = function() {
        	var val = list.filter[fld]; 
			if(val===undefined && default_value !== undefined) val=list.filter[fld]=default_value;
			filter_fld[0].checked = (val && val > 0 );
		};
	} else { 
		filter_fld.on('change', function() { list.setFilter(fld, filter_fld.val()); });
		this.filterSetBack[fld] = function() { 
			var val = list.filter[fld]; 
			if(val===undefined && default_value !== undefined) val=list.filter[fld]=default_value;
			filter_fld.val(val); 
		} ;	
	}
	if(modifier) this.filterModifier[fld] = modifier;
};
window.qwx.list.prototype.reload = function() { 
	this.displayList(this.page, this.filter);
};
window.qwx.list.prototype.setObject = function(obj, opt) { 
	var place = document.getElementById('row-' + obj.id);
	if(place) { 
		var new_row = $(qwx.t(this.row_template, { o: obj, list: this }));
		$(place).replaceWith(new_row); 
		if(this.makeRowSelectable) this.makeRowSelectable(new_row);
		if(this.postDisplayRow) { 
			this.postDisplayRow.call(this, new_row, obj );
		}	
		return true;
	} else if (opt.ifnot == 'reload') {
		this.reload();	
	}

	return false;
};
window.qwx.list.prototype.enableRowButtons = function(el, obj) { 
	var self = this;
	el.find('[role=editButton]').on('click', function(e) { 
		e.stopPropagation();
		self.enableEditor(el,obj);
	});
	if(!self.remove) { self.remove = {}; } 
	el.find('[role=deleteButton]').on('click', function(e) {
		e.stopPropagation();
		if(confirm(self.remove.question || 'Delete object?')) { 
			self.apiCall ('delete', [self.cid, obj.id], { message: this.remove.message ||'Deleting...' }, function() { 
				el.addClass('deleted-row');
				el.slideUp();
				if(self.postDeleteRow) self.postDeleteRow(el);
				self.place.trigger('afterDeleteRow', { el: el, list: self });
				return true;
			}); 	
		}
	});

};



+function($) {

	function methods(option) { 
		var list = this.data('qwxlist');
		if(option == 'exists') { 
			return list ? true : false; 
		} else if(option == 'widget') { 
			return list ? list : null;
		} 
		if(!list) { console.log("No qwxlist associated with", this); }
		if (option == 'setFilter') {		
			list.setFilter(arguments[1],arguments[2]);
		} else if(option == 'registerFilter') {
			list.registerFilter(arguments[1],arguments[2],arguments[3]);	 
		} else if(option == 'reload') {
			list.reload();	 
		} else if(option == 'setObject') { 
			list.setObject(arguments[1], arguments[2]);
		} else if(option == 'openEditDialog') {
			list.openEditDialog(arguments[1],arguments[2],arguments[3]);
		} else if(option == 'filterSetBack') { 
			list.filterSetBack[arguments[1]] = arguments[2];
		}
		return this;
	}
	$.fn.qwxList = function(option) { 
		if(!option || typeof(option) == 'object') { 
			this.data('qwxlist', new qwx.list(this, option));
		} else {
			return methods.apply(this, arguments);
		}
		return this;
	}
		
}(jQuery);

window.qwx.selectWidget = function(place,opt) { 
	qwx.widget.call(this, place, opt);
	place.attr('role','widget');
	var sel;
	var val = opt.val;
	if(opt.data) {
		this.sel = sel = $('<select/>', opt.attr).appendTo(place.html(''));
		if(opt.null) {
		   $('<option/>',{value:''}).html(opt.null).appendTo(sel);
		}
		for(var i=0,l=opt.data.length;i<l;i++) {
			var d = opt.data[i];
			$('<option/>',{value:d[0],selected:(d[0]==val)}).html(d[1]).appendTo(sel);
		}		
		sel.on('change', function() { 
			var option = sel[0].options[sel[0].selectedIndex];
			var id = option.value; 
			place.trigger('change', id && id != '' ? {id:id, text:option.text} : null); 
		});
	}
};
window.qwx.selectWidget.prototype = Object.create(window.qwx.widget.prototype);
window.qwx.selectWidget.prototype.constructor = window.qwx.selectWidget;

window.qwx.selectWidget.prototype.val = function() { 
	if(arguments.length==1) {
		var v = arguments[0];
		if(_.isObject(v)) v = v.id;
		return this.sel.val(v);
	} else { 
		return this.sel.val();
	}
};

+function($) { 
	$.fn.qwxSelectWidget = function(option) { 
		if(!option || typeof(option) == 'object') { 
			this.data('widget', new qwx.selectWidget(this, option));
		} else {
			var w = this.data('widget');
			if (option == 'val') {		
				return arguments.length == 1 ? w.val() : w.val(arguments[1]);
			} else if(option == 'widget') { 
				return w ? w : null;
			}
		}
		return this;
	}
}(jQuery);

window.qwx.pseudoSelectWidget = function(place,opt) { 
	qwx.widget.call(this, place, opt);
	place.attr('role','widget');
	var sel;
	var val = opt.val;
	this.nullText = opt.nullText;
	var base = $('<div class="dropdown"/>').appendTo(place.html(''));
	var btn  = $('<button class="btn dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">/').addClass(opt.buttonClass || 'btn-default').appendTo(base);
	$('<span class="selected-option-text"/>').html(opt.nullText).appendTo(btn);
	$('<span class="caret"/>').appendTo(btn);
	var menu = $('<ul class="dropdown-menu pseudo-select"/>').appendTo(base);
	this.menu = menu;
	this.btn  = btn;
	if(opt.data) { 
		menu.html(qwx.t(opt.template, { list: opt.data , el: this})); 
	}
	var self = this;
	if(val) { 
		menu.find('li[data-id=' + val + ']').addClass('selected');
	}
	menu.find('li').on('click', function(ev) {
		if(!$(this).hasClass('not-selectable')) {
			self.value = this.getAttribute('data-id');
			if(self.value == '') self.value = null;
			menu.find('li').removeClass('selected');
			var txt = $(this).addClass('selected').find('label').html();
			btn.find('span.selected-option-text').html( txt );
			place.trigger('change', { id: self.value, el: this, text: txt });
		}
			
	});

};
window.qwx.pseudoSelectWidget.prototype = Object.create(window.qwx.widget.prototype);
window.qwx.pseudoSelectWidget.prototype.constructor = window.qwx.pseudoSelectWidget;

window.qwx.pseudoSelectWidget.prototype.val = function() { 
	if(arguments.length==1) {
		var v = arguments[0];
		if(_.isObject(v)) v = v.id;
		this.value = v;
		var is_set = false;
		var btn = this.btn;
		this.menu.find('li[data-id]').each(function() { 
			if (this.getAttribute('data-id')==v) { 
				btn.find('span.selected-option-text').html( $(this).addClass('selected').find('label').html() );
				is_set = true;
			} else {
				$(this).removeClass('selected'); 
			}
		});
		if(!is_set || v===null) this.btn.find('span.selected-option-text').html(this.nullText);
	} else { 
		return this.value;
	}
};

+function($) { 
	$.fn.qwxPseudoSelectWidget = function(option) { 
		if(!option || typeof(option) == 'object') { 
			this.data('widget', new qwx.pseudoSelectWidget(this, option));
		} else {
			var w = this.data('widget');
			if (option == 'val') {		
				return arguments.length == 1 ? w.val() : w.val(arguments[1]);
			} else if(option == 'widget') { 
				return w ? w : null;
			}
		}
		return this;
	}
}(jQuery);

window.qwx.autocompleteWidget = function(place,opt) { 
	qwx.widget.call(this, place, opt); 
	var val = opt.val;
	this.onSelect   = opt.onSelect;
	this.displayKey = opt.displayKey;
	var sel = this.inp = sel = $('<input type="text" value=""/>', opt.attr).css('width', '100%').appendTo(place.html(''));
    if(opt.inputClassName) sel.addClass(opt.inputClassName);

	place.attr('role','widget');
	sel.typeahead({
		minLength: (opt.minLength || 1), 
		highlight: true, 
		// updater: function (item) {
		 /* do whatever you want with the selected item */
		// 	alert("selected "+item);
		//}
	}, { 
		name : 'autocomplete-' + (opt.name || ''),
		displayKey: (opt.displayKey || 'title'),
		limit: (opt.limit || 5),
		source: function(q,sync_cb,async_cb) { 
			qwx.ajax({url: opt.url , data: [ q ], success: function(r) { 
				async_cb(r.list);
			}});
		},
		templates: {
			suggestion: opt.suggestionHTML
		}
	});

	var state = this.state = null;
	var before;
		
	sel.on('typeahead:autocomplete', function(e,d,s,x) { 
//		console.log('aa e=',e, 'd=',d, ' s=',s, 'x=',x);
	});
	sel.on('typeahead:active', function(e,d,s,x) { 
		state = 'working';
		before = [sel.attr('class'), place.attr('data-value'), sel.val()];
		if(opt.onActivate) opt.onActivate();
//		console.log('active val=',sel,sel.val());
	});

	sel.on('typeahead:close', function(e,d,s,x) { 
//		console.log('close e=',e, 'd=',d, ' s=',s, 'x=',x);
		if(state != 'selected') { 
			sel.attr('class', before[0]);
			sel.val(before[2]);
			place.attr('data-value', before[1]);
			if(opt.onFail) opt.onFail();
		}
		this.state = '';
	});

	sel.on('typeahead:select', function(e,d) { 
		state = 'selected';
		sel.removeClass('autocomplete-bad').addClass('autocomplete-ok');
		place.attr('data-value', d.id);
		if(opt.onSelect) opt.onSelect(d);
	});
	sel.on('typeahead:querychange', function(e,d,s,x) { 	
		state = 'working';
//console.log('querychange');
		sel.removeClass('autocomplete-ok').addClass('autocomplete-bad');
		place.attr('data-value', '');
		if(opt.onQueryChanged) opt.onQueryChanged(d);
	});
}
window.qwx.autocompleteWidget.prototype = Object.create(window.qwx.widget.prototype);
window.qwx.autocompleteWidget.prototype.constructor = window.qwx.autocompleteWidget;

window.qwx.autocompleteWidget.prototype.val = function() { 
	if(arguments.length==0) { 
		return this.place.attr('data-value');
	} else { 
		var o = arguments[0];
		this.place.attr('data-value', o ? o.id : null); 
		this.inp.val(o ? (this.displayKey ? (_.isFunction(this.displayKey) ? this.displayKey(o) : o[this.displayKey] ) : o.title) : '');
		this.inp.addClass('autocomplete-ok');
		if(this.onSelect) this.onSelect(o);
	}
};

+function($) { 
	$.fn.qwxAutocompleteWidget = function(option) { 
		if(!option || typeof(option) == 'object') { 
			this.data('widget', new qwx.autocompleteWidget(this, option));
		} else {
			var w = this.data('widget');
			if (option == 'val') {		
				return arguments.length == 1 ? w.val() : w.val(arguments[1]);
			} else if(option == 'widget') { 
				return w ? w : null;
			}
		}
		return this;
	}
}(jQuery);



window.qwx.labelsWidget = function(place, opt) { 
	qwx.widget.call(this, place, opt); 
	var val     = opt.val;
	this.label_fld = opt.label_fld || 'title';
	this.val(val);
	var w = this.addWidget = opt.addWidget;
	var self = this;
	w.place.on('change', function(ev,val) { 
		if(val) self.addValue(val.id, val.text);
		w.val(null);
	});

}
window.qwx.labelsWidget.prototype = Object.create(window.qwx.widget.prototype);
window.qwx.labelsWidget.prototype.constructor = window.qwx.labelsWidget;

window.qwx.labelsWidget.prototype.addValue = function(id,text) { 
	var item = $('<div class="labels-item"/>').attr('data-id',id) .appendTo(this.place);
	$('<span class="labels-item-delete glyphicon glyphicon-remove"/>').on('click',function() { item.fadeOut(400, function() {item.remove();} ); } ).appendTo(item);
	item.append(text);
}
window.qwx.labelsWidget.prototype.val = function() { 
	var place = this.place;
	if(arguments.length==0) { 
		var val = [];
		$('.labels-item',place).each(function() { val.push(this.getAttribute('data-id')); });
		return val;
	} else { 
		var val = arguments[0];
		place.html('');
		if(val) { for(var i=0,l=val.length;i<l;i++) { // todo: check uniqueness
			this.addValue(val[i].id, val[i][this.label_fld] );
		}}
	}
		

};


+function($) { 
	$.fn.qwxLabelsWidget = function(option) { 
		if(!option || typeof(option) == 'object') { 
			this.data('widget', new qwx.labelsWidget(this, option));
		} else {
			var w = this.data('widget');
			if (option == 'val') {		
				return arguments.length == 1 ? w.val() : w.val(arguments[1]);
			} else if(option == 'widget') { 
				return w ? w : null;
			}
		}
		return this;
	}
}(jQuery);

window.qwx.formatDate = function(isodate) { 
	return isodate ? (new Date(isodate.replace(" ","T").replace(/\..*/,'').replace(/\s?\+\d+$/,''))).toLocaleString() : '';
};
window.qwx.checkbox = function(name,value) { 
	return '<input type="checkbox" name="' + _.escape(name) + '" value="1" ' 
		+ ((value && (typeof(value) != 'object' || value.id  > 0)) ? 'checked' : '' ) 
		+ '>';
};

window.qwx.imageWidget = function(place, opt) { 
	qwx.widget.call(this, place, opt);
	var name      = this.name      = opt.name;
	var uploadURI = this.uploadURI = opt.uploadURI;
	this.fsRoot   = opt.fsRoot;
	place.html('<span role="edit-image" data-field="' + name + '"><span class="imgplace"></span><button class="btn-upload">Загрузить</button></span>');
	var btn = place.find('button.btn-upload');
	btn.uploadButton();

	btn.on('postUpload', function(event, data) {
		btn.parent().find('.imgplace').html('').append($('<img/>').attr({ src:opt.uploadURI + data.path }));
	});
	place.attr('role','widget');
};
window.qwx.imageWidget.prototype = Object.create(window.qwx.widget.prototype);
window.qwx.imageWidget.prototype.constructor = window.qwx.imageWidget;

window.qwx.imageWidget.prototype.val = function() { 
	if(arguments.length==0) {	
		var f = $('input[role=f]', this.place);
		if(f[0]) { 
			var n = $('input[role=n]', this.place);
			return [f.val(), n.val()];
		} else { 
			return null;
		}
	} else if(arguments.length==1) {
		var f = arguments[0];
		if(f) { 
			$('<img/>', { src: this.fsRoot + '/' + f.name_in_storage }).appendTo($('.imgplace', this.place));
		}
	}	
};

+function($) { 
	$.fn.qwxImageWidget = function(option) { 
		if(!option || typeof(option) == 'object') { 
			this.data('widget', new qwx.imageWidget(this, option));
		} else {
			var w = this.data('widget');
			if (option == 'val') {		
				return arguments.length == 1 ? w.val() : w.val(arguments[1]);
			} else if(option == 'widget') { 
				return w ? w : null;
			}

		}
		return this;
	}
}(jQuery);

window.qwx.editDialog = function (id, opt) { 
	qwx.widget.call(this, null, opt);
	this.cid = opt.cid;
	this.data_prepare_opt = opt.data_prepare_opt;
	this.data_prepare_view_opt = opt.data_prepare_view_opt || opt.data_prepare_opt;
	this.fillDialog       = opt.fillDialog;
	this.collectData	  = opt.collectData;
	this.afterSave		  = opt.afterSave;
	this.template         = opt.template;
	this.getAfterSave	  = opt.getAfterSave;
	this.templateOpt      = opt.templateOpt;
	this.validator        = opt.validator;
	var self = this;

	var openModal = function(obj) { 

		var modal = qwx.$t(self.template, {opt:self.templateOpt, o: obj});
		if(!modal.find('.modal-dialog')[0]) { 
			modal = modal.makeModal({okButtonClass: opt.saveButtonClass, okButton:'<span class="glyphicon glyphicon-save"></span>&nbsp;Сохранить', title: opt.title, width: opt.width });
		}

		var dialog = modal.find('.modal-dialog');
		self.obj = obj;
		self.modal = modal;
		modal.modalBox({backdrop: false});
		dialog.find('input[type=text],input[type=number],textarea').each(function() { var n = this.name; this.value = obj[n] ? obj[n] : ''; });
		dialog.find('select').each(function() { var n = this.name; if(n) $(this).val(obj[n] && (typeof obj[n]) == 'object' ? obj[n].id: obj[n] ); });
		dialog.find('input[type=checkbox]').each(function() { this.checked = obj[this.name] && obj[this.name].id > 0 });
		dialog.find('[role=widget]').each(function() { var name = this.getAttribute('name'); $(this).data('widget').val(obj[name]); });

		if(self.fillDialog) self.fillDialog(dialog, obj);
		dialog.find('[autofocus]').focus();
		dialog.data('id', obj.id);
		modal.one('hidden.bs.modal', function() { modal.remove();  });
		modal.find('.btn-save,[role=saveButton]').on('click', function() {
			self.saveDialog(this );
		});
	}
	if(id) { 
		this.apiCall('get', [ this.cid, id, this.data_prepare_opt], null, function(r) { 
			openModal(r.obj);				
		});
	} else { 	
		openModal(_.extend({ id:  '__id_new', __is_new: true}, (opt.defaults || {})));
	}		
	this.saveDialog = function(btn) { 
		var form = this.modal.find('.modal-dialog');
		var attr = opt.addData || {};
		if(self.getAfterSave && self.getAfterSave != 'final' ) {
			attr.__return =  self.data_prepare_view_opt || 1;
		}
		form.find('input[type=text],input[type=number],textarea') .each(function() { attr[this.getAttribute('name')] = this.value; });
		form.find('select').each(function() { attr[this.getAttribute('name')] = this.selectedIndex !== null && this.options[this.selectedIndex] ?  this.options[this.selectedIndex].value: null; });
		form.find('input[type=checkbox]').each(function() { attr[this.getAttribute('name')] = this.checked ? 1 : 0; });
		form.find('[role=widget]').each(function() { attr[this.getAttribute('name')] = $(this).data('widget').val(); });

		var has_err = false;
		form.find('input[type=text][validate-filled]').each(function() { if(!this.value.match(/\S/)) { $(this).addClass('not-filled'); has_err = true; window.qwx.messageBox('Ошибка', 'Не заполнено поле ' + (this.title || this.name), true, 'error'); } else { $(this).removeClass('not-filled'); }  });
		form.find('select[validate-selected]').each(function() { if($(this).val() === null) { $(this).addClass('not-filled'); has_err = true; window.qwx.messageBox('Ошибка', 'Не заполнено поле ' + (this.title || this.name), true, 'error'); } else { $(this).removeClass('not-filled'); }  });
		if(has_err || (self.validator &&  !self.validator(form, attr))) { 
			return false;
		}
		var id = form.data('id');
		var ops = [
			[	'save', self.cid,   id, attr ],
		];
			
		if (self.collectData) self.collectData(form, attr, ops);
		if (self.getAfterSave && self.getAfterSave == 'final') ops.push(['get', self.cid, id, self.data_prepare_view_opt ]);
		self.apiCall("txn" , ops,  { message: self.saveMessage || 'Saving...' }, function(r) {
				self.afterSave(self.getAfterSave == 'final' ? r.result[r.result.length-1] : r.result[0]);
				form.closest('.modal').modal('hide');
				return true;
		});
	};
	return false;
};
window.qwx.editDialog.prototype = Object.create(window.qwx.widget.prototype);
window.qwx.editDialog.prototype.constructor = window.qwx.editDialog;
window.qwx.editDialog.prototype.close = function() { 
		this.modal.modal('hide');
}
