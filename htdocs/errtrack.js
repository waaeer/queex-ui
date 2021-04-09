/*
	tracking javascript errors

		qwx.errtrack.notify		: упрощённое - кладёт сообщение об ошибках в очередь отправки
		qwx.errtrack.pushEvent	: полное - кладёт сообщение об ошибках в очередь отправки
		qwx.errtrack.on			: включает трекинг (включен по умолчанию)

		qwx.errtrack._bind_window_events	: навешивает обработчики событий для отлова ошибок
		qwx.errtrack._watch					: каждые 10 секунд посылает на сервер информацию об ошибках
		qwx.errtrack._renew					: стирает отправленную информацию

*/
(function() {
	var root = this;
	!root.qwx && (root.qwx = {});
	
	/*
		коллекция произошедших событий
	*/
	var clientInfo = {
		'timer'			: null,
		'events'		: [],
		'lastNotified'	: (new Date()).toString()
	};

	var errtrack = function(obj) {
		if (obj instanceof _) return obj;
		if (!(this instanceof _)) return new _(obj);
		this._wrapped = obj;
	};
	root.qwx.errtrack = errtrack;

	root.beforeunload_on = false;
	$(document).on('beforeunload', function() { root.beforeunload_on = true; } );
	
	errtrack.pushEvent = function(type, data) {
		if(! root.beforeunload_on ) {
			clientInfo.events.push({
				'date'		: (new Date()).toString(),
				'qwxtype'	: type,
				'data'		: data
			});
		}
	};
	errtrack.notify = function() {
		var type = 'error', str;
		if (arguments.length > 0) {
			type = arguments[0];
			str = arguments[1];
		} else {
			str = arguments[0];
		}
		if (!str) {
			return;
		}
		return errtrack.pushEvent(type, str);
	};	
	
	errtrack._renew = function(){
		clientInfo.events = [];
		clientInfo.lastNotified = (new Date()).toString();
	};

	// store onerror into clientInfo.events
	errtrack._bind_window_events = function() {
		if (typeof(root.onerror) != "undefined") {
			root.onerror = function (msg, url, line, colno, error) {
				if (url && url.indexOf('chrome://') != 0) {
					errtrack.pushEvent('error', {
						'message'	: msg,
						'url'		: url,
						'doc'		: root.location.toString(),
						'line'		: line,
						'col'       : colno,
						'stack'     : (error ? error.stack : null)
					});
				}
			};
		}
		$(document).ajaxError(function(event, jqXHR, ajaxSettings, thrownError){
			if (jqXHR.statusText != 'abort') {
				errtrack.pushEvent('ajax-error', {
					'message'		: thrownError ? thrownError.toString() : null,
					'url'			: ajaxSettings.url,
					'data'			: ajaxSettings.data,
					'type'			: ajaxSettings.type,
					'dataType'		: ajaxSettings.dataType,
					'status'		: jqXHR.status,
					'statusText'	: jqXHR.statusText,
					'doc'			: root.location.toString()
				});
			}
		});
	};
	
	// every 20sec (default) send clientInfo.events to server (if exists)
	errtrack._watch = function(opts){
		if (clientInfo.timer) {
			return;
		}

		!opts	&& (opts = {});
		interval = opts.interval || 20000;

		var notifier;
		notifier = function () {
			/*	if errors:
					send data:
						success ? clean data
						error: pass
					both: set timeout for next action
				unless errors:
					set timeout for next action
			*/
			if (clientInfo.events.length) {
				$.ajax({
					'type'		  : 'POST',
					'global'	  : false,
					'contentType' : 'application/json',
					'url'		  : opts.path || '/errtrack',
					'data'		  : JSON.stringify({
						'browser'	: root.navigator.userAgent,
						'events'	: clientInfo.events
					})
				})
				.always(function () {
					clientInfo.timer = setTimeout(notifier, interval);
					errtrack._renew(clientInfo.events);
				});
			} else {
				clientInfo.timer = setTimeout(notifier, interval);
			}
		};

		notifier();
	};
	
	errtrack.on = function(opts){
		errtrack._bind_window_events(opts);
		errtrack._watch(opts);
	};
	
}).call(this);


