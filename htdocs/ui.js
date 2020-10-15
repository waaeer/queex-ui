if(!window.qwx) { window.qwx = {} } 
+function($) {
	var modalStack = [];
	/* ------------------------------------------------------ */

	window.qwx.setJQWidget = function(jqname, constr, methods) {
	    var c; eval('c=function(place,option) { return new ' + constr + '(place, option);}'); /* instead of dynamic constructor call which is implementation-dependent yet */
	    jQuery.fn[jqname] = function(option) {
	        if(!option || typeof(option) == 'object') {
	            this.data('widget', c(this, option || {}));
	        } else {
	            var w = this.data('widget');
	            if(option == 'val') { 
	                return arguments.length == 1 ? w.val() : w.val(arguments[1]);
	            } else if( option == 'widget') {
	                return w;
	            } else if(methods && methods[option]) { 
	                return method[option].apply(this,arguments);
	            } else { 
	                console.log('Unknown method ' + option + ' in ' + jqname);
	            }   
	        }
	        return this;
	    };
	
	};

	var zbase = 1040;
	function modalBox(x,opt) { 
		var level;
		x.one('show.bs.modal', function(ev) { 
			if(ev.target != ev.currentTarget) return; // filter wild events from child elements
			level = modalStack.length;
			modalStack.push(x);
			this.style.zIndex = zbase + 10 * level;
			var backdrops = $('.modal-backdrop');
			// raise previous backdrop; on "shown" return it back:
			var last_backdrop = backdrops[level];
			if(last_backdrop) { 
				last_backdrop.style.zIndex = zbase + 5 + 10 * level;
			}
			ev.stopPropagation();
		});
		x.one('shown.bs.modal', function(ev) { 
			if(ev.target != ev.currentTarget) return; // filter wild events from child elements
			var backdrops = $('.modal-backdrop');
			var prev_backdrop = backdrops[level];
			if(prev_backdrop) { 
				prev_backdrop.style.zIndex = zbase - 5 + 10 * level;
			}
			var last_backdrop = backdrops[level+1];
			if(last_backdrop) {
				last_backdrop.style.zIndex = zbase + 5 + 10 * level;
			}
			x.data('focus_in', document.activeElement);
			var af = $(this).find('[autofocus]');
			$(this).find('.modal-dialog').attr('tabindex', -1); // otherwise div will not get focus
			if(!af[0]) af = $(this).find('input[type=text],textarea');
			if(!af[0]) af = $(this).find('.modal-dialog');
			if(af[0]) af.first().focus(); 
			
			var prev = modalStack.length == 1 ? null : modalStack[modalStack.length-2];
			if(prev) { 
				var kdwh = $._data ? $._data(prev[0],'events') : $.data(prev[0], "events"); //ATTN! Internal jQuery structure, subject to change!

				if(kdwh) kdwh = kdwh.keydown;
				if(kdwh) { 
					x.data('prev_keyha', kdwh[0].handler );
					prev.off('keydown.dismiss.bs.modal');
				}
			}
			if(x.data('hideonshow')) { 
				x.modal('hide');
				x.data('hideonshow', false);
			}
			x.data('isShown', true);
			ev.stopPropagation();
		});
		x.one('hide.bs.modal', function(ev) {
			if(ev.target != ev.currentTarget) return; // filter wild events from child elements
			x.data('hideInProgress', true);
			ev.stopPropagation();
		});
		x.one('hidden.bs.modal', function(ev) { 
			if(ev.target != ev.currentTarget) return; // filter wild events from child elements
			modalStack.pop();
			var backdrops = $('.modal-backdrop');
			var last_backdrop = backdrops[backdrops.length-1];
			//last_backdrop.remove();
			var prev = modalStack.length == 0 ? null : modalStack[modalStack.length-1];
			if(prev) {
				prev.on('keydown.dismiss.bs.modal',x.data('prev_keyha') ); 
				$(x.data('focus_in')).focus();
			}
			x.data('isShown', false);
			x.data('hideInProgress', false);
			ev.stopPropagation();
		});
		x.modal(opt);
	}
	$.fn.modalBox = function(option) { 
		if(!option || typeof(option) == 'object') { 
			modalBox($(this), option);
		} else if (option == 'isShown') {
			return $(this).data('isShown');
		} else if (option == 'hideInProgress') {
			return $(this).data('hideInProgress');
		} else if (option == 'hide') { 
			if ($(this).data('isShown')) { 
				$(this).modal('hide');
			} else { 
				$(this).data('hideonshow', true);
			}
		} else { 
			$(this).modal(option);
		}
		return this;
	}
	$.fn.makeModal = function(option) { 
		var middle = this;
		var width = option && option.width || '60%';

		var modal = $('<div/>');
		modal.addClass('modal fade').html(
' <div class="modal-dialog" style="width:' + width + '; max-width:' + width + ';"><div class="modal-content"><div class="modal-header">' +
'		 <h4 class="modal-title"></h4>' +
(option && option.topClose ? '<button type="button" class="btn btn-light btn-sm" data-dismiss="modal" style="float:right;"><i class="fa fa-times"></i></button>' : '') +
'</div><div class="modal-body"></div><div class="modal-footer">' + 
(option && option.okButton ? 
'		 <button type="button" style="float: left;" class="btn ' + (option.okButtonClass || 'btn-primary') + ' btn-save">' + option.okButton + '</button>' : 
 ( option && option.okButtons ? _.map(option.okButtons, function(x) { return '<button type="button" style="float: left;" class="btn ' +  (_.escape(x.btnClass) || 'btn-primary btn-save') + '">' + x.label + '</button>'} ).join(' ')
   : ''
 )
) + (!option || ! option.topClose ?
'        <button type="button" class="btn btn-default" data-dismiss="modal">' + (option.closeButton || 'Закрыть') + '</button>' : ''
)+
'      </div></div></div></div>'
		).appendTo($('body')).find('.modal-body').append(middle);
		if(option && option.title) modal.find('.modal-title').html(option.title);
		return modal;
	}

} (jQuery);
	


+function() { 
	var messageBoxElement;
	var opQueue = [], closeInProgress = false, showInProgress = false, isShown = false;
	function init() { 
		if(!messageBoxElement) {
			messageBoxElement = $('<div/>').addClass('modal fade messageBox').html(
' <div class="modal-dialog" style="width:300px;"><div class="modal-content"><div class="modal-header">' + 
'		 <h4 class="modal-title"></h4></div><div class="modal-body"> </div><div class="modal-footer">' + 
'		 <button type="button" style="display:none; float: left;" class="btn btn-success">Подтвердить</button>' + 
'        <button type="button" class="btn btn-default" data-dismiss="modal">Закрыть</button>' +
'      </div></div></div></div>'
			).appendTo($('body'));
			messageBoxElement.on('hidden.bs.modal', function(ev) { 
				closeInProgress = false;
				isShown = false;
				var visible_modals = $('.modal:visible'); // get a list of visible modals, after closing this one
				if( visible_modals.length > 0 ) {  // from https://github.com/sbreiler/bootstrap-multi-modals/blob/master/bootstrap-multi-modals.js
                	$('body', document).addClass('modal-open');
				}
				if(opQueue.length>0) { 
					var op = opQueue.shift();
					op();
				}	
										
			});
			messageBoxElement.on('shown.bs.modal', function(ev) { 
				showInProgress = false;
				isShown = true;
				if(opQueue.length>0) { 
					var op = opQueue.shift();
					op();
				}
				
			});
		}
		return messageBoxElement;
	};		
	window.qwx.messageBox = function(title,text,close,style_opt, on_close) {
		var div = init();
		function func() { 
			var h = div.find('.modal-header'), f=div.find('.modal-footer'), b=div.find('.modal-body');
			if(title) {  h.show().find('.modal-title').html(title); } 
			else  h.hide();
			b.html(text);
			if(style_opt && style_opt.match(/wait/))  b.addClass('waiting'); else b.removeClass('waiting');
			if(style_opt && style_opt.match(/error/)) {
				div.addClass('error'); 
				b.prepend('<span class="fa fa-exclamation-circle errorMark" aria-hidden="true"></span>');
			} else {
				div.removeClass('error');
			}
	
			if(close) f.show();
				else  f.hide();
			f.find('.btn-success').hide();
			f.find('.btn-success').off('click');
			div[0].focus();
			f.find('.btn-default').each(function() { this.focus();});
			showInProgress = true;
			div.modalBox({keyboard: close, backdrop: (close ? true: 'static') });h
			if(on_close) { 
				div.on('hide.bs.modal', on_close);			
			}
		}
		if(closeInProgress || showInProgress) { 
			opQueue.push(func);
		} else { 
			func();
		}
	};
	window.qwx.getMessageBox = function() { 
		return init();
	};
	window.qwx.closeMessageBox = function() { 
		if(messageBoxElement && (closeInProgress || showInProgress)) {
			opQueue.push(function() { 
				if(!isShown) return;
				closeInProgress=true; messageBoxElement.modalBox('hide'); 
			});
			return;
		}

		if(!messageBoxElement || closeInProgress || messageBoxElement.css('display') == 'none') { return; }
		closeInProgress=true;
		messageBoxElement.modalBox('hide');
	};
	window.qwx.debugMessageBox = function() { 
		console.log([ messageBoxElement, showInProgress, closeInProgress, opQueue ]);
	};
	window.qwx.confirmBox = function(title,text,action) {
		var div = init();
		var h = div.find('.modal-header'), f=div.find('.modal-footer'), b=div.find('.modal-body');
		if(title) {  h.show().find('.modal-title').html(title); } 
		else  h.hide();
		b.html(text);
		b.prepend('<span class="fa fa-question-circle" aria-hidden="true"></span>');
		f.show();
		f.find('.btn-success').show();
		f.find('.btn-success').one('click', function() { action(); div.modal('hide'); });
		div.modalBox({keyboard: true, backdrop:  'static' });
	};
	window.qwxTemplateCache = {};
	window.qwx.t = function(template,vars) { 
		if(template.substr(0,1) == '#') { 
			var id = template.substr(1);
			var t = window.qwxTemplateCache[id];
			if(!t) {
				var el = document.getElementById(id);
				if(el) { 
					t = window.qwxTemplateCache[id] = _.template(el.innerHTML);
				} else { 
					console.log('No element ', id);
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
			var id = template.substr(1);
			var el = document.getElementById(id); 
			if(el) { 
				return _.template(el.innerHTML);
			} else { 
				console.log('No element ', id);
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
	window.qwx.args.prototype.args = function() {
		return this.data;
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
	window.qwx.replaceState = function(name, args, changeArgs) {
		var cur_args = qwx.getArgs();
		args = (args===null) ? cur_args: new qwx.args(args);
		history.replaceState(cur_args.data, name, "?" + args.modify(changeArgs).serialize() );
	}
	window.qwx.checkbox_wrap = function(sel, false_null) { 
		return new qwx.checkBoxWrapper(sel, false_null);		
	}
	window.qwx.scrollTo = function(el, speed, complete) {
		var el=$(el);
		if(el.length>0) {
			$('html, body').animate({
    		    scrollTop: el.offset().top
    		}, speed || 2000, 'swing', complete);
		}
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
window.qwx.tr = function(msg) { 
	return window.tr && window.tr[msg] ? window.tr[msg] : msg;
}
window.qwx.ajax = function(opt) { 
	if(opt.block) { 
		if(typeof opt.block == 'function') {
			opt.block();
		} else {
			qwx.messageBox(null, (opt.block.message ? opt.block.message : qwx.tr('Подождите...')), false, 'wait');
		}
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
					if(opt.block) qwx.closeMessageBox();
					opt.error(r);
				} else if(window.ajaxErrorHandler) { 
					if(opt.block) qwx.closeMessageBox();
					window.ajaxErrorHandler(r);
				} else { 					// toDo: format error messages of known types
					qwx.messageBox(qwx.tr('Ошибка'), r.error, true, 'error');
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
				if(opt.block) qwx.closeMessageBox();
			}

		}, 
		error: function(r) { 
			qwx.closeMessageBox();
			if(opt.error) { 
				opt.error(r);
			} else if(window.ajaxErrorHandler) { 
				window.ajaxErrorHandler(r);
			} else { 
				qwx.messageBox(qwx.tr('Ошибка'), qwx.tr('Ошибка на сервере'), true, 'error');
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
	if(place) {
		place.data('widget',this);
		place.attr('role', 'widget');
	}
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
	this.pager_place	= opt.pagerPlace     || opt.pager_place;
	this.cid			= opt.cid;
	this.query			= opt.query          || {};
	this.apiMethod      = opt.apiMethod      || 'mget';
	this.row_template 	= opt.rowTemplate    || opt.row_template   || '#row_template';
	this.pager_template = opt.pagerTemplate  || opt.pager_template || '#pager_template';
	this.page_size		= opt.pageSize       || opt.page_size || 1000;
	this.pager_opt		= opt.pagerOpt || opt.pager_opt ? _.extend({width:5,nav:15},opt.pagerOpt || opt.pager_opt) : {width:5,nav:15};
	this.data_prepare_opt   = opt.dataPrepareOpt || opt.data_prepare_opt;
	this.preDisplayList = opt.preDisplayList;
	this.postDisplayRow = opt.postDisplayRow;
	this.filterSetBack	= opt.filterSetBack || {};
	this.filterModifier = {};
	this.filterSet      = {};
	this.enableEditor	= opt.enableEditor;
	this.remove         = opt.remove;
	this.editDialog     = opt.editDialog;
	this.postprocessQuery = opt.postprocessQuery;
	this.onBeforeDisplayList = opt.onBeforeDisplayList;
	this.getList        = opt.getList; // function for use instead of default api
	this.ignoreState    = opt.ignoreState; // disable pushState/onPopState on list navigation
	this.ignoreArgs     = opt.ignoreArgs;  // disable taking initial filter and pages from page args
	this.data           = opt.data; // simply load data for custom methods and templates	
	this.deleteCid      = opt.deleteCid; //  if main cid is e.g. a view 

	this.defaultFilter = {};
	if(opt.filters) { 
		for(var i=0,l=opt.filters.length;i<l;i++) this.registerFilter.apply(this, opt.filters[i]);
	}
	var page_arg   = this.page_arg		= opt.page_arg    ? opt.page_arg : 'page';
	var filter_arg = this.filter_arg	= opt.filter_arg  ? opt.filter_arg : 'F';	
	var edit_arg   = this.edit_arg	 	= opt.edit_arg; // if not defined, editing does not change url

	var list = this;
    if(!this.ignoreState) {
	   $(window).on('popstate', function(ev)  {
		   var state = ev.originalEvent.state;
		   if(state==null) state = qwx.initialArgs.data;
		   list.displayList(state[page_arg], list.json2filter(state[filter_arg]), true );
		   if(list.editDialog && edit_arg && state[edit_arg]) 
				var id=state[edit_arg];
				if(id=='undefined') id=undefined;
				list.openEditDialog(id);
	   });
    }
	
	if (this.editDialog) { 
		this.postDisplayRow  =  function(el,o) { 
			list.enableRowButtons(el,o);
			if(opt.postDisplayRow) opt.postDisplayRow.call(list, el, o);
		};
		this.enableEditor = function(place,o,success_cb) {
			return list.openEditDialog(o.id, success_cb);
		}
	}
	if(opt.withRowSelection) { 
		this.makeRowSelectable = function(html,obj) {
			var clickable = _.isString(opt.withRowSelection) ? html.find(opt.withRowSelection) : html; // withRowSelection может быть строкой - тогда это селектор внутри строки списка
			clickable.on('click', function(ev) {
				var clicked = ev.originalEvent.target, $clicked = $(clicked);
				if($clicked.hasClass('dropdown-toggle') || clicked.tagName == 'A' || $clicked.closest('a').length>0 ) return;
				html.toggleClass('selected');
				list.place.trigger('selectionChange', html, obj);
			});
		};
	}
	if(this.ignoreArgs) { 
		this.displayList(1, this.defaultFilter, true);	
	} else { 
		var args = qwx.getArgs();
		if(this.editDialog && edit_arg ) { 
			var id=args.arg(edit_arg);
			if(id) { 
				if(id=='undefined') id=undefined;
				this.openEditDialog(id);
			}
		}  
		this.displayList(args.arg(page_arg), args.arg(filter_arg) ? this.json2filter(args.arg(filter_arg)) : this.defaultFilter, true);	
	}
}

window.qwx.list.prototype = Object.create(window.qwx.widget.prototype);
window.qwx.list.prototype.constructor = window.qwx.list;

window.qwx.list.prototype.openEditDialog = function(obj_id, success_cb, opt) { 
	var self = this;
	if(this.edit_arg && ! this.ignoreState) { 
		qwx.replaceState("edit " ,  null, [ this.edit_arg, obj_id]);
	}
	return new qwx.editDialog(obj_id, _.extend({
		cid      : this.cid,
		apiCall  : this.apiCall,
		getAfterSave: 1,
		template : '#edit_dialog_template',
		data_prepare_view_opt: this.data_prepare_opt,
		called_in_list: this,
		afterSave: function(o) { 
			if(success_cb) {
				success_cb.call(o);
			} else { 
				self.setObject(o,{ifnot: self.editDialog.actionAfterSaveNew || 'reload'});
			}
			self.place.trigger('afterSave', [self, o]);
		},
		onClose: function() {
			if(!self.ignoreState && self.edit_arg) qwx.replaceState("edit " ,  null, [ self.edit_arg, null]);
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
	this.place.trigger('getData', [this, query, page]);
	var self = this;
	var modcb = function(res) { 
		self.place.trigger('gotData', [this, res]);
		if(cb) cb(res);
	};
	if(query.__dont_get_data) { 
		modcb({list:[],n:0});
	} else { 
		if(this.getList) { 
			this.getList(query, page, modcb);
		} else { 
			this.apiCall( this.apiMethod, [ this.cid, query, page, this.page_size, this.data_prepare_opt ], null, modcb );
		}
	}
}	

window.qwx.list.prototype.displayList = function(page,filter, filter_set_back) {
	if(!page) page = 1;
	var list = this;
	var postDisplayRow = this.postDisplayRow;
	list.filter = _.extend({},filter);
	if(filter_set_back) list.setBackFilters();
	if(this.paused) return; 

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
			if(list.makeRowSelectable) list.makeRowSelectable(html, r.list[i]);
			if(postDisplayRow) { 
				postDisplayRow.call(list, html, r.list[i]);
			}
		}
		if(list.pager_place && list.pager_template) { 
			var p = $(list.pager_place).html(qwx.t(list.pager_template, _.extend({ page_size: list.page_size, page: page, page_arg: list.page_arg, n: r.n},list.pager_opt)));
			p.find('a').on('click', function()  {
				var page = this.getAttribute('page');
				if(!list.ignoreState) {
					qwx.pushState("page " + page,  null, [ list.page_arg, page, list.filter_arg, JSON.stringify(filter)]);
				}
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
	if(!this.ignoreState) {
		qwx.pushState("filter " ,  null, [ this.page_arg, 1, this.filter_arg, JSON.stringify(filter)]);
	}
	this.displayList(1, filter);
};
window.qwx.list.prototype.setBackFilters = function() {
	for(var fld in this.filterSetBack) { 
 		this.filterSetBack[fld](this.filter[fld]);
	}
};
window.qwx.list.prototype.setAllFilters = function() { 
	for(var fld in this.filterSet) { 
 		this.filterSet[fld]();
	}
};


window.qwx.list.prototype.registerFilter = function(fld, filter_fld, modifier, default_value) { 
	// filter_fld should be an object with "val" getter/setter method, and with .on('change',cb) method
	var list = this;

	if(filter_fld[0] && filter_fld[0].tagName =='INPUT' && filter_fld[0].getAttribute('type') == 'checkbox') { //special case of checkbox: process "click" event instead of "change"
		var setter = this.filterSet[fld] =  function() { list.setFilter(fld, filter_fld[0].checked ? 1 : 0);  };
		filter_fld.on('click', setter);
		this.filterSetBack[fld] = function() {
        	var val = list.filter[fld]; 
			if(list.filter.length==0  && default_value !== undefined) val=list.filter[fld]=default_value;
			filter_fld[0].checked = (val && val > 0 );
		};
	} else { 
		var setter = this.filterSet[fld] =  function() { list.setFilter(fld, filter_fld.val()); };
		filter_fld.on('change', setter);
		this.filterSetBack[fld] = function() { 
			var val = list.filter[fld]; 
			if(list.filter.length==0 && default_value !== undefined) val=list.filter[fld]=default_value;
			filter_fld.val(val); 
		} ;	
	}
	list.defaultFilter[fld] = default_value;
	if(modifier) this.filterModifier[fld] = modifier;
};
window.qwx.list.prototype.reload = function() { 
	this.displayList(this.page, this.filter);
};
window.qwx.list.prototype.reloadObject = function(id) { 
	var self = this;
	self.getData(1,{id:id}, function(list) { 
		self.setObject(list.list[0]);
	});
};
window.qwx.list.prototype.setObject = function(obj, opt) { 

	var place = document.getElementById('row-' + obj.id);
	if(!place) place = this.place.find('[data-id=' + obj.id + ']')[0];

	if(place) { 
		var new_row = $(qwx.t(this.row_template, { o: obj, list: this }));
		$(place).replaceWith(new_row); 
		if(this.makeRowSelectable) this.makeRowSelectable(new_row, obj);
		if(this.postDisplayRow) { 
			this.postDisplayRow.call(this, new_row, obj );
		}	
		return true;
	} else if (opt && opt.ifnot == 'reload') {
		this.reload();	
	} else {
		var new_row = $(qwx.t(this.row_template, { o: obj, list: this }));
		if(opt && opt.ifnot == 'top') {
			new_row.prependTo(this.place);
		} else {
			new_row.appendTo(this.place);
		}
		if(this.makeRowSelectable) this.makeRowSelectable(new_row, obj);
		if(this.postDisplayRow) {
			this.postDisplayRow.call(this, new_row, obj );
		}
		return true;
	}

	return false;
};
window.qwx.list.prototype.enableRowButtons = function(el, obj) { 
	var self = this;
	el.find('[role=editButton],.editButton').first().on('click', function(e) { 
		e.stopPropagation();
		self.enableEditor(el,obj);
		return false;
	});
	if(!self.remove) { self.remove = {}; } 
	el.find('[role=deleteButton],.deleteButton').on('click', function(e) {
		e.stopPropagation();
		self.deleteObject(el,obj);
	});

};
window.qwx.list.prototype.deleteObject = function(row, obj) { 
	if(!row) {
		var r = document.getElementById('row-' + obj.id);
		row = r ? $(r) : this.place.find('[data-id=' + obj.id + ']');
	}
	var self = this;
	if(confirm(this.remove.question || 'Delete object?')) { 
		self.apiCall ('delete', [this.deleteCid || this.cid, obj.id], { message: this.remove.message ||'Deleting...' }, function() { 
			row.addClass('deleted-row');
			row.slideUp();
			if(self.postDeleteRow) self.postDeleteRow(row);
			self.place.trigger('afterDeleteRow', { el: row, list: self });
			return true;
		}); 	
	}
};

window.qwx.list.prototype.pause = function() {
	this.paused = true;
};
window.qwx.list.prototype.resume = function() {
    this.paused = false;
};


+function($) {

	function methods(option) { 
		var list = this.data('widget');
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
		} else if(option == 'setAllFilters') {
			list.setAllFilters();	 
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
    };
	
}(jQuery);

window.qwx.selectWidget = function(place,opt) { 
	qwx.widget.call(this, place, opt);
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
		sel.on('change', function(ev) {
			var option = sel[0].options[sel[0].selectedIndex];
			var id = option.value; 
			place.trigger('change', id && id != '' ? {id:id, text:option.text} : null);
			ev.stopPropagation();
			return true;
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
window.qwx.selectWidget.prototype.object_val = function() {
	if(arguments.length==1) {
		var v = arguments[0];
		if(_.isObject(v)) v = v.id;
		return this.sel.val(v);
	} else {
		var sel = this.sel[0];
		return { id: sel.options[sel.selectedIndex].value, text: sel.options[sel.selectedIndex].text };
	}
};
window.qwx.selectWidget.prototype.focus = function() {
    this.sel[0].focus();
};

+function($) { 
	$.fn.qwxSelectWidget = function(option) { 
		if(!option || typeof(option) == 'object') { 
			this.data('widget', new qwx.selectWidget(this, option));
		} else {
			var w = this.data('widget');
			if (option == 'val') {		
				return arguments.length == 1 ? w.val() : w.val(arguments[1]);
			} else if (option == 'object_val') {
				return arguments.length == 1 ? w.object_val() : w.object_val(arguments[1]);
			} else if(option == 'widget') { 
				return w ? w : null;
			} else if(option == 'focus') {
				w.focus();
			} else {
				console.log('Method ' + option + ' does not exist in SelectWidget');
			}
		}
		return this;
	}
}(jQuery);

window.qwx.pseudoSelectWidget = function(place,opt) { 
	qwx.widget.call(this, place, opt);
	var sel;
	this.nullText = opt.nullText;
	this.getData  = opt.getData;
	var base = $('<div class="dropdown" data-dropdown="dropdown"/>').appendTo(place.html(''));
	var btn  = $('<button class="btn dropdown-toggle" type="button" data-toggle="dropdown" >/').addClass(opt.buttonClass || 'btn-default').appendTo(base);
	var selected = $('<span class="selected-option-text"/>').html(opt.nullText).appendTo(btn);
	$('<span class="caret"/>').appendTo(btn);
	var menu = $('<ul class="dropdown-menu pseudo-select"/>').appendTo(base);
	if(opt.menuClass) menu.addClass(opt.menuClass);
	this.menu = menu;
	this.btn  = btn;
	var self = this;
	
	self.fillMenu = function(val, onload) { 
		self.obyid = {};
		if(opt.getData) {
			opt.getData(function(data) {
				self.gotData = true;
				menu.html(qwx.t(opt.template, { list: data , el: self}));
				for(var i=0;i<data.length;i++) self.obyid[data[i].id] = data[i];
				setmenuhandlers(menu.find('li'));
				select_current(val);
				if(onload) onload();
				place.trigger('menuLoaded');
			});
		}
	};
	function setmenuhandlers(items) {
		items.on('click', function(ev) {
			if(!$(this).hasClass('not-selectable')) {
				self.value = val = this.getAttribute('data-id');
				if(self.value == '') self.value = val =  null;
				menu.find('li').removeClass('selected');
				var txt = $(this).addClass('selected').find('label').html();
				selected.html( txt );
				place.trigger('change', { id: self.value, el: this, text: txt });
//				base.dropdown('toggle');
			}
		});
	}
	function select_current(val) {
		menu.find('li').removeClass('selected');
		if(val) {
			menu.find('li[data-id="' + val + '"]').addClass('selected');
		}
	}

	if(opt.data) { 
		menu.html(qwx.t(opt.template, { list: opt.data , el: this})); 
		setmenuhandlers(menu.find('li'));
		select_current(opt.val);
		if(onload) onload();
	} else {
		base.on('show.bs.dropdown',function() {
			self.fillMenu(opt.val);
		});
	}
	
};
window.qwx.pseudoSelectWidget.prototype = Object.create(window.qwx.widget.prototype);
window.qwx.pseudoSelectWidget.prototype.constructor = window.qwx.pseudoSelectWidget;

window.qwx.pseudoSelectWidget.prototype.val = function() { 
	if(arguments.length==1) {
		var v = arguments[0];
		if(_.isObject(v)) v = v.id;
		this.value = v;
		var self = this;
		function set_value() { 
			var is_set = false;
			var btn = self.btn;
			self.menu.find('li[data-id]').each(function() { 
				if (this.getAttribute('data-id')==v) { 
					btn.find('span.selected-option-text').html( $(this).addClass('selected').find('label').html() );
					is_set = true;
				} else {
					$(this).removeClass('selected'); 
				}
			});
			if(!is_set || v===null) btn.find('span.selected-option-text').html(self.nullText);
		};
		if(this.getData && !this.gotData) { 
			this.fillMenu(v, set_value);
		} else { 
			set_value();
		}

	} else { 
		return this.value;
	}
};
window.qwx.pseudoSelectWidget.prototype.objectVal = function() { 
	return this.value ? this.obyid[this.value] : null;
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

qwx.setJQWidget('qwxPseudoSelectWidget', 'qwx.pseudoSelectWidget');

window.qwx.autocompleteWidget = function(place,opt) { // requires typeahead.jquery.js
	qwx.widget.call(this, place, opt); 
	var val = opt.val;
	this.onSelect   = opt.onSelect;
	this.displayKey = opt.displayKey;
	var sel = this.inp = sel = $('<input type="text" value=""/>', opt.attr).css('width', '100%').appendTo(place.html(''));
    if(opt.inputClassName) sel.addClass(opt.inputClassName);

	sel.typeahead({
		minLength: (opt.minLength || 1), 
		highlight: true, 
		hint: (opt.hint ===null ? true: opt.hint)
		// updater: function (item) {
		 /* do whatever you want with the selected item */
		// 	alert("selected "+item);
		//}
	}, { 
		name : 'autocomplete-' + (opt.name || ''),
		displayKey: (opt.displayKey || 'title'),
		limit: (opt.limit || 5),
		source: function(q,sync_cb,async_cb) { 			
			if(opt.search) { 
				opt.search(q, async_cb);
			} else { 
				var args = [q];
				if(opt.preprocessQuery) { args = opt.preprocessQuery(args); }
				qwx.ajax({url: opt.url , data: args, success: function(r) {
					if(opt.preprocessList) { r.list = opt.preprocessList(q, r.list); }
					async_cb(r.list);
				}});
			}
		},
		templates: {
			suggestion: opt.suggestionHTML
		},
		preprocessQueryForHighlight: opt.preprocessQueryForHighlight
	});

	var state = this.state = null;
	var before;
		
	place.find('input.tt-input').on('change', function(ev) { 
		ev.stopPropagation(); 
		return true; 
	});
	sel.on('typeahead:autocomplete', function(e,d,s,x) { 
	});
	sel.on('typeahead:active', function(e,d,s,x) { 
		state = 'working';
		before = [sel.attr('class'), place.attr('data-value'), sel.val()];
		if(opt.onActivate) opt.onActivate();
	});

	sel.on('typeahead:close', function(e,d,s,x) { 
		if(state != 'selected') { 
			sel.attr('class', before[0]);
			sel.val(before[2]);
			place.attr('data-value', before[1]);
			if(opt.onFail) opt.onFail();
		}
		this.state = '';
	});

	sel.on('typeahead:change', function(e,d,s,x) { 
	});

	sel.on('change', function(e,d,s,x) { 

	});

	sel.on('typeahead:select', function(e,d) { 
		state = 'selected';
		sel.removeClass('autocomplete-bad').addClass('autocomplete-ok');
		place.attr('data-value', d.id);
		place.data('object', d);
		if(opt.onSelect) opt.onSelect(d);
		place.trigger('change', d);
	});
	sel.on('typeahead:querychange', function(e,d,s,x) { 	
		state = 'working';
		sel.removeClass('autocomplete-ok').addClass('autocomplete-bad');
		place.attr('data-value', '');
		place.data('object', null);
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
		this.inp.val(o ? (this.displayKey ? (_.isFunction(this.displayKey) ? this.displayKey(o) : o[this.displayKey] ) : o.title) : '');
		this.inp.typeahead('val', o ? (this.displayKey ? (_.isFunction(this.displayKey) ? this.displayKey(o) : o[this.displayKey] ) : o.title) : '');
		this.inp.removeClass('autocomplete-bad').addClass('autocomplete-ok');
		this.place.attr('data-value', o ? o.id : null); 
		if(this.onSelect) this.onSelect(o);
	}
};
window.qwx.autocompleteWidget.prototype.objectVal = function() { 
	return this.place.data('object');
};
window.qwx.autocompleteWidget.prototype.close = function() {
	this.inp.typeahead('close');
};
window.qwx.autocompleteWidget.prototype.focus = function() {
    this.inp[0].focus();
};


+function($) { 
	$.fn.qwxAutocompleteWidget = function(option) { 
		if(!option || typeof(option) == 'object') { 
			var w = new qwx.autocompleteWidget(this, option);
			this.data('widget', w);
		} else {
			var w = this.data('widget');
			if (option == 'val') {		
				return arguments.length == 1 ? w.val() : w.val(arguments[1]);
			} else if(option == 'widget') {
				return w ? w : null;
			} else if(option == 'focus') {
				w.focus();
			} else {
				console.log('Method ' + option + ' does not exist in AutocompleteWidget');
			}
		}
		return this;
	}
}(jQuery);



window.qwx.labelsWidget = function(place, opt) { 
	qwx.widget.call(this, place, opt); 
	var val     = opt.val;
	this.cid    = opt.cid;
	this.label_fld = opt.label_fld || 'title';
	var w = this.addWidget = opt.addWidget;
	var self = this;
	this.labelplace = $('<div class="labels-list"/>').css('position','relative').appendTo(place.html(''));
	this.deleteStyle = opt.deleteStyle; // default or reversible
	this.val(val, function() { 
    	if(w && w == 'embedded') { 
	    	var addplace = self.embeddedAutocomplete = $('<span class="labels-list-add" style="display: inline-block;"/>').appendTo(self.labelplace);
		    addplace.qwxAutocompleteWidget({
				displayKey: self.label_fld, 
		    	name: _.uniqueId('labelplace_'),
				url: opt.autocompleteURL,
				hint: false,
				preprocessList: function(value, list) {
					if(opt.canCreateNew) { 
						if(!_.some(list, function(x) { return(x[self.label_fld]==value); })) { 
							var newl = {id:'__new__' + _.uniqueId('label_new_'), __label: value, isNew: true};
							newl [ self.label_fld ] = 'Новая метка: ' + value; 				
							list.push(newl);
						}
					}

					var already_selected = self.val(), isSelected = {}, newlist = [];
					for(var i=0,l=already_selected.length;i<l;i++) isSelected[already_selected[i]] = true;
					for(var i=0,l=list.length;i<l;i++) if(!isSelected[list[i].id]) newlist.push(list[i]);
					return newlist;
				}
			});
			w = addplace.qwxAutocompleteWidget('widget');
			self.labelplace.on('resize', function(ev) { 
				addplace.css('width', 0);
				var width = parseInt(self.labelplace.width() - addplace.position().left - 4);
				if(width < 30) { width = 100; }
				addplace.css('width', width + 'px');
				ev.stopPropagation();
			});
			self.labelplace.trigger('resize');
			$(window).on('resize', function() { self.labelplace.trigger('resize'); } ); // toDo: remove this handler in destructor
		}
	 	if(w) { 
			w.place.on('change', function(ev,val) { 
				if(val) self.addValue(val.id, val [ val.isNew ?  '__label' : self.label_fld]);
				w.val(null);	w.close();
				self.labelplace.trigger('resize');
			});
		}
	});
}

window.qwx.labelsWidget.prototype = Object.create(window.qwx.widget.prototype);
window.qwx.labelsWidget.prototype.constructor = window.qwx.labelsWidget;

window.qwx.labelsWidget.prototype.addValue = function(id,text) { 
	var item = $('<div class="labels-item"/>').attr('data-id',id) ;
	if(this.embeddedAutocomplete) item.insertBefore(this.embeddedAutocomplete); else item.appendTo(this.labelplace);
	var self = this;
	$('<span class="labels-item-delete fa fa-trash" title="Delete"/>').on('click',function() { 
		if(self.deleteStyle == 'reversible') { 
			item.toggleClass('deleted');
		} else {
			item.fadeOut(400, function() {
				item.remove(); self.labelplace.trigger('resize'); 
			} ); 
		}
	}).appendTo(item);
	item.append(text);
}
window.qwx.labelsWidget.prototype.newLabels = function() { 
	var val = [];
	var self = this;
	$('.labels-item',this.labelplace).each(function() { 
		var id = this.getAttribute('data-id');
		if(id.match(/^__new__/)) { 
			var o = { id: id }; 
			o[self.label_fld] = $(this).text().replace(/^\s+|\s+$/,''); 
			val.push(o); 
		}
	});
	return val;
}
window.qwx.labelsWidget.prototype.labels = function() { 
	var val = [];
	var self = this;
	$('.labels-item',this.labelplace).each(function() { 
		var id = this.getAttribute('data-id');
		var o = { id: id }; 
		if(id.match(/^__new__/)) { 
			o.isNew = 1;
		}
		o[self.label_fld] = $(this).text().replace(/^\s+|\s+$/,''); 
		val.push(o); 
	});
	return val;
}
window.qwx.labelsWidget.prototype.val = function() { 
	var place = this.labelplace;
	if(arguments.length==0) { 
		var val = [];
		$('.labels-item',place).each(function() { if(!$(this).hasClass('deleted')) val.push(this.getAttribute('data-id')); });
		return val;
	} else { 
		var val = arguments[0];
		var cb  = arguments[1];
		place.html('');
		if(val) { 
			var dict = {};
			for(var i=0,l=val.length;i<l;i++) { // todo: check uniqueness
				if (!_.isObject(val[i])) { 
					dict[val[i]] = null;
				}
			}	
			var self = this;
			var setVals = function(arr) { 
				for(var i=0,l=arr.length;i<l;i++) { // todo: check uniqueness
					self.addValue(arr[i].id, arr[i][self.label_fld] );
				}
				if(cb) cb(); 
			};
			if(_.size(dict)>0) { 
				this.apiCall('mget', [ this.cid, { id: { any: _.keys(dict) } }, 1, null, this.data_prepare_opt ], null, function(r) { 
					var list = r.list;
					for(var i=0,l=list.length;i<l;i++) dict[list[i].id] = list[i][self.label_fld];
					var newval = _.filter(_.map(val, function(item) { 
						if (!_.isObject(item)) { 
							if(dict[item]) { 
								var newitem = {id:item};
								newitem[ self.label_fld ] = dict[item];
								return newitem;
							} else {
								return null;
							}
						} else { 
							return item;
						}
					}), function(item) { return !!item });
					setVals(newval);					
				});			
			} else {
				setVals(val);
			}
			
		} else { 
			if(cb) cb();
		}
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
			} else if (option == 'newLabels') {
				return w.newLabels();
			} else if (option == 'labels') {
				return w.labels();
			} else if(option == 'widget') { 
				return w ? w : null;
			}
		}
		return this;
	}
}(jQuery);

window.qwx.formatDate = function(isodate) { 
	if(isodate) { 
		var m = isodate.match(/^(\d\d\d\d)-(\d\d)-(\d\d)(.*)$/); 
		if(m) { 
			var n = m[4]? m[4].match(/[T\s](\d+):(\d\d):(\d\d)/) : null;
			if(!n) n = [0,0,0,0];
			var d = new Date(m[1],m[2]-1,m[3],n[1],n[2],n[3]);
			if(d) return d.toLocaleString();
		}
	}
	return '';
};
window.qwx.checkbox = function(name,value) { 
	return '<input type="checkbox" name="' + _.escape(name) + '" value="1" ' 
		+ ((value && (typeof(value) != 'object' || value.id  > 0)) ? 'checked' : '' ) 
		+ '>';
};
window.qwx.fillSelect = function(el,items, value, label, postProcessOption) {
    var label_is_func = label && _.isFunction(label) ;
    for(var i=0,l=items.length;i<l;i++) { 
        var opt = $('<option/>').attr('value', items[i].id).html(label_is_func ? label(items[i]) : items[i][label || 'title']).appendTo(el);
        if(items[i].id == value) { opt.attr('selected', true); } 
        if(postProcessOption) { postProcessOption(opt, items[i]); } 
    }
};

window.qwx.imageWidget = function(place, opt) { 
	qwx.widget.call(this, place, opt);
	var name      = this.name      = opt.name;
	var uploadURI = this.uploadURI = opt.uploadURI;
	var postUploadURI = opt.postUploadURI || uploadURI;
	this.fsRoot   = opt.fsRoot;
	place.html('<span role="edit-image" data-field="' + name + '"><span class="imgplace"></span><button class="btn-upload">Загрузить</button></span>');
	var btn = place.find('button.btn-upload');
	btn.uploadButton();
	var self = this;

	btn.on('postUpload', function(event, data) {
		btn.parent().find('.imgplace').html('').append($('<img/>').attr({ src:postUploadURI + data.path }));
		self.uploadData = data;
	});
};
window.qwx.imageWidget.prototype = Object.create(window.qwx.widget.prototype);
window.qwx.imageWidget.prototype.constructor = window.qwx.imageWidget;

window.qwx.imageWidget.prototype.val = function() { 
	if(arguments.length==0) {	
		var f = $('input[role=f]', this.place);
		if(f[0]) { 
			var n = $('input[role=n]', this.place);
			return [f.val(), n.val(), this.uploadData];
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


qwx.setJQWidget('qwxImageWidget', 'qwx.imageWidget');

window.qwx.deepScan = function (top, selector, exclude, cb) {
	var children = top.find('>*').not(exclude);
	children.filter(selector).each(cb);
	if(children.length > 0) 
		window.qwx.deepScan(children, selector, exclude, cb);
};
/* -- editDialog -- */
window.qwx.new_id_counter = 0;

window.qwx.editDialog = function (id, opt) { 
	qwx.widget.call(this, null, opt);
	this.cid = opt.cid;
	this.data_prepare_opt = opt.data_prepare_opt;
	this.data_prepare_view_opt = opt.data_prepare_view_opt || opt.data_prepare_opt;
	this.getData          = opt.getData;
	this.fillDialog       = opt.fillDialog;
	this.collectData	  = opt.collectData;
	this.afterSave		  = opt.afterSave;
	this.template         = opt.template;
	this.getAfterSave	  = opt.getAfterSave;
	this.templateOpt      = opt.templateOpt;
	this.validator        = opt.validator;
    this.apiMethod        = opt.apiMethod      || 'get';
	this.saveCid		  = opt.saveCid        || this.cid;
	var preEditCalls      = opt.preEditCalls;
	var onClose           = opt.onClose;
	var preClose          = opt.beforeClose;
	this.save             = opt.saveObject || this.save;
	this.called_in_list   = opt.called_in_list;
	var self = this;

	var openModal = function(obj, add_data) { 
		var dialogOpt = opt.dialogOpt || {};
		if(dialogOpt.constructor.name == 'Function') dialogOpt = dialogOpt(obj);
		var modal = qwx.$t(self.template, {opt:self.templateOpt, o: obj, add_data: add_data});
		if(!modal.find('.modal-dialog')[0]) { 
			modal = modal.makeModal(_.extend({okButtonClass: opt.saveButtonClass, 
				okButton:'<span class="fa fa-download"></span>&nbsp;Сохранить', 
				title: opt.title, 
				width: opt.width }, dialogOpt ));
		}

		var dialog = modal.find('.modal-dialog');
		self.obj = obj;
		self.modal = modal;
		modal.modalBox({backdrop: 'static', keyboard: false});
		
		dialog.find('input[type=text],input[type=number],textarea').each(function() { var n = this.name; if(n) this.value = obj[n] ? obj[n] : ''; });
		dialog.find('select').each(function() { if(this.name) { var v = obj[this.name];  $(this).val( v && (typeof v == 'object' ? v.id: v )); }});
		dialog.find('input[type=checkbox]').each(function() { if(this.name) { var v = obj[this.name]; if(v) v = (typeof v == 'object' ? v.id : v); this.checked = (v=='t' || v > 0); }});
		dialog.find('input[type=radio]').each(function() {  if(this.name) { var v = obj[this.name]; if(v) this.checked = ((typeof v == 'object' ? v.id : v) == this.value) }});
		dialog.find('[role=widget]').each(function() { var name = this.getAttribute('name'); if(name) $(this).data('widget').val(obj[name]); });

		if(self.fillDialog) self.fillDialog(dialog, obj, add_data, self);
		dialog.find('[autofocus]').focus();
		dialog.data('id', obj.id);
		if(preClose) modal.on('hide.bs.modal', function() { preClose(self); });
		modal.one('hidden.bs.modal', function() { modal.remove(); if(onClose) onClose(); });
		modal.find('.btn-save,[role=saveButton]').on('click', function() {
			self.saveDialog(this );
		});
	}

	if(preEditCalls && preEditCalls.constructor.name == 'Function') { 
		preEditCalls = preEditCalls(id ? { id: id } : null);
	}
	function get_new_object_id() { 
		return '__id_new' + qwx.new_id_counter++; 
	}
	if(preEditCalls && preEditCalls.length) { 
		if(id) { 
			var calls = [[this.apiMethod,  this.cid, id, this.data_prepare_opt]];
			calls = calls.concat(preEditCalls);
			this.apiCall('txn', calls, null, function(r) { 
				var res = r.result.shift();
				openModal(res.obj,  r.result);
			});
		} else { 
			this.apiCall('txn', preEditCalls, null, function(r) { 
				openModal(_.extend({ id: get_new_object_id(), __is_new: true}, (opt.defaults || {})), r.result);
			});
		}
	} else { 
		if(id) {
			if(this.getData)
				this.getData(id, function(obj) { openModal(obj) });
			else
				this.apiCall(this.apiMethod, [ this.cid, id, this.data_prepare_opt], null, function(r) {openModal(r.obj);});
		} else { 	
			openModal(_.extend({ id: get_new_object_id(), __is_new: true}, (opt.defaults || {})));
		}		
	}
	this.saveDialog = function(btn) { 
		var form = this.modal.find('.modal-dialog');
		var attr = opt.addData || {};
		if(self.getAfterSave && self.getAfterSave != 'final' ) {
			attr.__return =  self.data_prepare_view_opt || 1;
		}
		var postponed_radio_validation = {}, empty_fields = [];
		window.qwx.deepScan(form, 'input,textarea,select,[role=widget]', '[nosave]', function() {
			var el   = this;
			var name = this.getAttribute('name');
			var type = this.getAttribute('type');
			if(name) { 
				var empty = null;
				if((el.tagName == 'INPUT' && (type == 'text' || type == 'number')) || el.tagName == 'TEXTAREA') { 
					attr[name] = this.value;
					if(el.hasAttribute('validate-filled')) { 
						empty = !this.value.match(/\S/);
					}
				} else if (el.tagName == 'SELECT') { 
					attr[name] = this.selectedIndex !== null && this.options[this.selectedIndex] ?  this.options[this.selectedIndex].value: null;
					if(el.hasAttribute('validate-selected')) {	
						var v= $(el).val();
						empty = (v === null || v==='');
					}
				} else if(el.tagName == 'INPUT') { 
					if(type == 'checkbox')   attr[name] = this.checked ? 1 : 0;
					else if(type == 'radio' && this.checked) attr[name] = this.value;
					if(el.hasAttribute('validate-selected')) {
						if(type == 'radio') postponed_radio_validation[name] = el.title;
						else empty = !attr[name];
					}
				} else if(el.getAttribute('role') == 'widget') { 
					attr[name] = $(this).data('widget').val();
					if(el.hasAttribute('validate-selected')) {
						empty = !attr[name];
					}
				}

				if(empty!==null) 
					if(empty) { 
						$(el).addClass('not-filled'); has_err = true; empty_fields.push(el.title || name);
					} else { 	
						$(el).removeClass('not-filled');
					}
			}
		});
		for(var name in postponed_radio_validation) { 
			if(!attr[name]) { 
				empty_fields.push(postponed_radio_validation[name] || name);
			}
		}
		if(empty_fields.length>0) { 
			window.qwx.messageBox('Ошибка', (empty_fields.length==1 ? 'Не заполнено поле ' : 'Не заполнены поля ') + empty_fields.join(', '), true, 'error');
		}
		if(empty_fields.length>0 || (self.validator &&  !self.validator(form, attr))) { 
			return false;
		}
		var id = form.data('id');
		var ops = [
			[	'save', self.saveCid,   id, attr ],
		];
			
		if (self.collectData) { 
			try { self.collectData(form, attr, ops, btn); } catch(err) { qwx.messageBox('Ошибка', err, true, 'error'); return false; } 
		}
		if (self.getAfterSave && self.getAfterSave == 'final') ops.push([this.apiMethod, self.cid, id, self.data_prepare_view_opt ]);
		self.save(form, ops, function(r) {
			self.afterSave(self.getAfterSave == 'final' ? r.result[r.result.length-1].obj : r.result[0].obj);
			var modal = form.closest('.modal');
			if(!modal.modalBox('hideInProgress')) { modal.modalBox('hide'); }
			window.qwx.closeMessageBox();

		});
	};
	return false;
};
window.qwx.editDialog.prototype = Object.create(window.qwx.widget.prototype);
window.qwx.editDialog.prototype.constructor = window.qwx.editDialog;
window.qwx.editDialog.prototype.save = function(form, ops, cb) { 
	this.apiCall("txn" , ops,  { message: self.saveMessage || 'Saving...' }, function(r) {
		cb(r);
		return true;
	});
}
window.qwx.editDialog.prototype.close = function() { 
		this.modal.modal('hide');
}
/*-- checkboxarray -- */
window.qwx.checkBoxArray = function(place, opt) {
	qwx.widget.call(this, place, opt);
	var el = $('<div class="btn-group" data-toggle="buttons"/>').appendTo(place);
	this.value = [];
	var self = this;
	if(opt.values) {
		for(var i=0;i<opt.values.length;i++) { var s = opt.values[i];
			var b = $('<label class="btn btn-default"/>').append( 
				$('<input type="checkbox"/>').prop('value',s.id).on('change', function(ev){ ev.stopPropagation();} )
			).append('&nbsp;'+s.title);
			b.appendTo(el);
			if(s.checked) { self.value.push(s.id); b.addClass('active'); } 
		}
	}
	el.on('click', function() {
		setTimeout(function() { 
			el.find('.btn').removeClass('focus');
			el.find('input[type=checkbox]').each(function() { this.checked = false; });
			self.value = []; 
			el.find('.btn.active input').each(function() { self.value.push(this.value); this.checked = true;});
			place.trigger('change');
		}, 0 );	
	});
};
window.qwx.checkBoxArray.prototype = Object.create(window.qwx.widget.prototype);
window.qwx.checkBoxArray.prototype.constructor = window.qwx.checkBoxArray;
window.qwx.checkBoxArray.prototype.val = function(x) {
	if(arguments.length==0) {
		return this.value;
	} else { 
		if(x && typeof(x)=='object') {
			this.place.find('label').removeClass('active');
			this.value = [];
			for(var i=0,l=x.length;i<l;i++) { 
				var cbx = this.place.find('input[value=' + x[i] + ']');
				cbx[0].checked = true;
				cbx.parent().addClass('active');
				this.value.push(x[i]);
			}
		}
	}
};

qwx.setJQWidget('qwxCheckBoxArray', 'qwx.checkBoxArray');

/* -- date widget -- */
window.qwx.dateWidget = function(place, opt) { 
    qwx.widget.call(this, place, opt);
    var div = this.div = $('<div class="qwx-calendar"/>').appendTo(place);
	var inp = this.inp = $('<input/>').appendTo(div);
	inp.addClass(opt.inputClass === undefined ? 'form-control qwx-input-date' : opt.inputClass);
    div.datepicker({ 
		inputs  : inp, 
		format  : opt.datepickerFormat || 'dd.mm.yyyy',
		language: opt.language || 'en',
		daysOfWeekHighlighted: opt.daysOfWeekHighlighted || [0,6],
		todayHighlight: true
	});

    div.datepicker().on('changeDate', function(e,m) { 
        inp.datepicker('hide');
    });
};
window.qwx.dateWidget.prototype = Object.create(window.qwx.widget.prototype);
window.qwx.dateWidget.prototype.constructor = window.qwx.dateWidget;
window.qwx.dateWidget.prototype.val = function(v) {
    if (arguments.length == 0 ) {
        return qwx.date2iso(this.inp.datepicker('getDate'));
    } else {
        this.inp.datepicker('setDate', (v instanceof Date) ? v : qwx.iso2date(v) );
        return this;
    }
};
window.qwx.dateWidget.prototype.objectVal = function(v) {
    if (arguments.length == 0 ) {
        return this.inp.datepicker('getDate');
    } else {
        this.val(v);
	}
};

window.qwx.date2iso = function(jsdate) { 
    return jsdate ? sprintf("%04d-%02d-%02d", jsdate.getYear()+1900, jsdate.getMonth()+1, jsdate.getDate()) : null;
};
window.qwx.iso2date = function(isodate) { 
	if(!isodate) return null;
    var m = isodate.match(/^(\d\d\d\d)-(\d\d)-(\d\d)/);
    return m ? new Date(parseInt(m[1]), parseInt(m[2])-1, parseInt(m[3])) : null; 
};
window.qwx.time2iso = function(jsdate) {
    return jsdate ? sprintf("%04d-%02d-%02d %02d:%02d:%02d", jsdate.getYear()+1900, jsdate.getMonth()+1, jsdate.getDate(), jsdate.getHour(), jsdate.getMinute(), jsdate.getSecond() ) : null;
};
window.qwx.iso2time = function(isodate) {
    var m = isodate.match(/^(\d\d\d\d)-(\d\d)-(\d\d)[T\s](\d?\d):(\d\d):(\d\d)/);
    return m ? new Date(parseInt(m[1]), parseInt(m[2])-1, parseInt(m[3]), parseInt(m[4]), parseInt(m[5]), parseInt(m[6])) : qwx.iso2date(isodate);
};

/*----- bicalendar -------*/
window.qwx.biCalendarWidget = function(place, opt) { 
	qwx.widget.call(this, place, opt);
	place.html('<div class="qwx-bicalendar">'+ (opt.wrapOne ? opt.wrapOne[0] : '') + window.qwx.tr('с')  + ' <span><input class="form-control qwx-input-date"></span> ' + (opt.wrapOne ? opt.wrapOne[1] : '')
		                                     + (opt.wrapOne ? opt.wrapOne[0] : '') + window.qwx.tr('по') + ' <span><input class="form-control qwx-input-date"></span>' + (opt.wrapOne ? opt.wrapOne[1] : '')
		     + '</div>');
	var cal1 = $(place.find('input')[0]);
	var cal2 = $(place.find('input')[1]);
	var div = place.find('.qwx-bicalendar');
	this.is_interactive = true;
	var self = this;
	div.datepicker({ 
		inputs  : div.find('input'), 
		format  : opt.datepickerFormat || 'dd.mm.yyyy',
		language: opt.language || 'en'
	});
	cal1.datepicker().on('changeDate', function(e) { 
		if(self.is_interactive) { 
			cal1.datepicker('hide'); cal2.datepicker('show');
//			place.trigger('change');
		}
	});
	cal2.datepicker().on('changeDate',function(e) { 
		if(self.is_interactive) {
			cal2.datepicker('hide');
//			place.trigger('change');
		}
	});
	cal1.on('change', function() { if(self.is_interactive) {place.trigger('change'); }});
	cal2.on('change', function() { if(self.is_interactive) {place.trigger('change'); }});

	place.find('span').on('change', function(ev) { ev.stopPropagation(); });
	this.cal1 = cal1;
	this.cal2 = cal2;
	this.div = div;
};
window.qwx.biCalendarWidget.prototype.val = function(v) {
	if (arguments.length == 0 ) {
		return [qwx.date2iso(this.cal1.datepicker('getDate')), 
		        qwx.date2iso(this.cal2.datepicker('getDate'))];
	} else {
		this.is_interactive = false;
		if(v) { 
			this.cal1.datepicker('setDate', (v[0] instanceof Date) ? v[0] : qwx.iso2date(v[0]) );
			this.cal2.datepicker('setDate', (v[1] instanceof Date) ? v[1] : qwx.iso2date(v[1]) );
		} else { 
			this.cal1.datepicker('setDate', null);
			this.cal2.datepicker('setDate', null);
		}
		this.is_interactive = true;
		return this;
	}
};
/*------------------------------------------------------------------------------------------------------------------*/

qwx.setJQWidget('qwxDateWidget', 'qwx.dateWidget');
qwx.setJQWidget('qwxBiCalendarWidget', 'qwx.biCalendarWidget');

/*-- fileWidget -- */
window.qwx.fileWidget = function(place, opt) { 
	qwx.widget.call(this, place, opt);
	this.file_place    = opt.file_place;
	this.file_template = opt.file_template || '<% if(file.content_type.match("^image/")) { %>'
	 	+ '<div style="display:inline-block;position: relative;"><button class="btn btn-xs btn-delete" style="position: absolute; top:2px;right:2px; z-index:800;"><i class="fa fa-trash"></i></button>'
	 	+ '<img style="max-width:400px;" src="<%- widget.file_prefix %>/<%- file.path %>">'
		+ '<% if(file.width && file.height) { %><div class="c"><%= file.width %>x<%= file.height %>px</div><% } %>'
		+ '</div>'
		+ '	<% } else { %> '
		+ '<a href="<%- widget.file_prefix %>/<%- file.path %>"><%- file.name %></a>'
		+ ' <% } %>';
	this.file          = undefined;
	this.file_prefix   = opt.prefix;
	this.getFileMetadataById = opt.getFileMetadataById;
	if(!this.getFileMetadataById) {
		throw 'getMetadataById is not specified';
	}
	this.debug = opt.debug;
	var self = this;
	this.btn = $('<button class="btn btn-upload"/>').html(opt.uploadButtonText || 'Upload file').appendTo(place);
	this.btn.on('click', function() { 
		window.upload_callback = function() { 
			if(self.debug) console.log('callbackargs',arguments);
			var data = self.callbackArgs2File(arguments);
			self.setFile(data);
			$(self.place).trigger('change');
		};
		$('#upload_form input').click();
	});
};

window.qwx.fileWidget.prototype = Object.create(window.qwx.widget.prototype);
window.qwx.fileWidget.prototype.constructor = window.qwx.fileWidget;

window.qwx.fileWidget.prototype.setFile = function(f) { 
	if(f && !_.isObject(f)) throw 'qwx.FileWidget.setFile argument should be an object'; 
	this.value = f.id;
	var self = this;
	$(this.file_place).html(qwx.t(this.file_template, {file:f, widget:this}));
	$(this.file_place).find('.btn-delete').on('click', function() { self.val(null); });
}
window.qwx.fileWidget.prototype.callbackArgs2File = function(args) { 
	var data = args[0];
	if(_.isArray(data)) data = data[0];
	return data;
}
window.qwx.fileWidget.prototype.val = function() { 
	var self = this;
	if (arguments.length == 0 ) {
		return this.value;
	} else {
		var f_id = this.value = arguments[0];
		if(f_id) { 
			this.getFileMetadataById(f_id, function(obj) { self.setFile(obj);});
		} else { 
			$(this.file_place).html('');
		}
		return self;
	}
}
qwx.setJQWidget('qwxFileWidget', 'qwx.fileWidget');


/* -- end file widget -- */








/* -- val() and w() for widgets ---*/
+function($) { 
	var oldVal = $.fn.val;
	$.fn.val = function(v) { 
		var w = $(this).data('widget');
		if(w && w.val) return w.val.apply(w,arguments); 
		else return oldVal.apply($(this),arguments); 
	};
	$.fn.w = function(v) { 
		return $(this).data('widget');
	};
}(jQuery);




