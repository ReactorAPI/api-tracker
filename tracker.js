// Make $ available as jQuery
if ( typeof jQuery !== 'undefined' && typeof $ == 'undefined' ) { $=jQuery; }

// jQuery Cookie Plugin
(function(e){if(typeof define==="function"&&define.amd){define(["jquery"],e)}else{e(jQuery)}})(function(e){function n(e){return u.raw?e:encodeURIComponent(e)}function r(e){return u.raw?e:decodeURIComponent(e)}function i(e){return n(u.json?JSON.stringify(e):String(e))}function s(e){if(e.indexOf('"')===0){e=e.slice(1,-1).replace(/\\"/g,'"').replace(/\\\\/g,"\\")}try{e=decodeURIComponent(e.replace(t," "));return u.json?JSON.parse(e):e}catch(n){}}function o(t,n){var r=u.raw?t:s(t);return e.isFunction(n)?n(r):r}var t=/\+/g;var u=e.cookie=function(t,s,a){if(s!==undefined&&!e.isFunction(s)){a=e.extend({},u.defaults,a);if(typeof a.expires==="number"){var f=a.expires,l=a.expires=new Date;l.setTime(+l+f*864e5)}return document.cookie=[n(t),"=",i(s),a.expires?"; expires="+a.expires.toUTCString():"",a.path?"; path="+a.path:"",a.domain?"; domain="+a.domain:"",a.secure?"; secure":""].join("")}var c=t?undefined:{};var h=document.cookie?document.cookie.split("; "):[];for(var p=0,d=h.length;p<d;p++){var v=h[p].split("=");var m=r(v.shift());var g=v.join("=");if(t&&t===m){c=o(g,s);break}if(!t&&(g=o(g))!==undefined){c[m]=g}}return c};u.defaults={};e.removeCookie=function(t,n){if(e.cookie(t)===undefined){return false}e.cookie(t,"",e.extend({},n,{expires:-1}));return!e.cookie(t)}})

rctr = {
	log: function(m){
		if ( rctr.st.debug == true ) {
			console.log(m);
		}
	},
	st: {
		server: 'http://api.reactorapi.com',
		access_token: false,
		user_token: false,
		visit_token: false,
		arts: false,
		reading: false,
		sightings: [],
		renders: [],
		cookieOpt: {path: '/', expires: 1000},
		ready: false,
		debug: false
	},
	mntr: {
		getArticles: function(){
			rctr.st.arts = $('[data-reactor-articleid]');							// Todos los artículos presentes en este momento.
			var rd = rctr.st.arts.filter('[data-reactor-ismainarticle]');				// ¿Hay artículo principal?
			if ( rd.length > 0 ) {
				rctr.st.reading = rd;												// Guardarlo en status.
			}
		},
		checkRenders: function(){
			// Reiniciar renders.
			rctr.st.renders = [];

			// Incluir en array de renders - sólo si no está presente el atributo data-reactor-render											
			rctr.st.arts.each(function(){
				if ( !$(this).is('[data-reactor-render]') ) {
					rctr.st.renders.push($(this));
				}
			});
		},
		updateSightings: function(){
			rctr.st.arts.each(function(){
				if ( !$(this).is('[data-reactor-sight]') && rctr.ut.checkVisible($(this)) ) {
					$(this).attr('data-reactor-sight', 'true');
					rctr.st.sightings.push($(this));
				}
			})
			rctr.log('[rctr] Now updating sightings.');
			rctr.comm.sendData();
		}
	},
	sess: {
		getUser: function(){
			rctr.log('[rctr] Catching user, looking for cookie.');
			// Check for user token.
			if ( $.cookie('ReactorUserToken') ) {
				rctr.st.user_token = $.cookie('ReactorUserToken');
				rctr.log('[rctr] Already found user '+rctr.st.user_token+'');
				rctr.sess.getVisit();
			} else {
				$.get(rctr.st.server+'/users/create?access_token='+rctr.st.access_token, function(d){
					rctr.st.user_token = d.user_token;
					$.cookie('ReactorUserToken', d.user_token, rctr.st.cookieOpt);
					rctr.log('[rctr] Created new user '+rctr.st.user_token+'');
					rctr.sess.getVisit();
				}, 'json');
			}
		},
		getVisit: function(){
			var no_token = true;
			rctr.log('[rctr] Catching visit, looking for cookie.');
			// Check for visit token.
			if ( $.cookie('ReactorVisitToken') ) {
				var visit = $.cookie('ReactorVisitToken').split('.');
				var this_time = Date.now();
				var visit_time = parseInt(visit[1]);
				if ( this_time-visit_time < 600000 ) {		// Si han pasado menos de 10 minutos, continuar visita.
					rctr.st.visit_token = visit[0];
					no_token = false;						// Token encontrado satisfactoriamente, usando.
					var calc = Math.floor((this_time-visit_time)/1000/60);
					rctr.log('[rctr] Already found visit '+rctr.st.visit_token+' - '+calc+' minutes since last request.');
					rctr.st.ready = true;
					rctr.track();
				}
			}

			if ( no_token == true ) {
				$.get(rctr.st.server+'/visits/create?access_token='+rctr.st.access_token+'&user_token='+rctr.st.user_token, function(d){
					rctr.st.visit_token = d.visit_token;
					rctr.log('[rctr] Created new visit '+rctr.st.visit_token);
					$.cookie('ReactorVisitToken', d.visit_token+'.'+Date.now(), rctr.st.cookieOpt);
					rctr.st.ready = true;
					rctr.track();
				}, 'json');
			}
		},
		updateVisitTime: function(){
			// Update last seen of Visit.
			var visit = $.cookie('ReactorVisitToken').split('.');
			visit[1] = Date.now();
			visit = visit.join('.');
			$.cookie('ReactorVisitToken', visit, rctr.st.cookieOpt);
		}
	},
	comm: {
		sendData: function(){
			var renderElements = [];
			var sightingElements = [];

			var renders = [];
			var sightings = [];
			var reading = false;

			var query = [];

			$(rctr.st.renders).each(function(){
				if ( !$(this).attr('data-reactor-renderposted') ) {
					renderElements.push($(this));
					renders.push($(this).attr('data-reactor-articleid'));
				}
			});
			if ( renders.length > 0 ) { query.push('renders='+renders.join(',')); }

			$(rctr.st.sightings).each(function(){
				if ( !$(this).attr('data-reactor-sightposted') ) {
					sightingElements.push($(this));
					sightings.push($(this).attr('data-reactor-articleid'));
				}
			});
			if ( sightings.length > 0 ) { query.push('sightings='+sightings.join(',')); }

			if ( !$(rctr.st.reading).attr('data-reactor-readposted') ) {
				reading = $(rctr.st.reading).attr('data-reactor-articleid');
			}

			if ( reading ) { query.push('reading='+reading); }

			query = query.join('&');

			if ( query != '' ) {
				var query_url = rctr.st.server+'/events/parse?access_token='+rctr.st.access_token+'&user_token='+rctr.st.user_token+'&visit_token='+rctr.st.visit_token+'&'+query;
				rctr.log('[rctr] Sending data. Built query: '+query);
				rctr.log('[rctr] Getting to '+query_url);
				$(renderElements).each(function(){ $(this).attr('data-reactor-renderposted', 'true'); });
				$(sightingElements).each(function(){ $(this).attr('data-reactor-sightposted', 'true'); });
				$(rctr.st.reading).attr('data-reactor-readposted', 'true');
				$.get(query_url, function(d){
					rctr.log('[rctr] Events parsed successfully.');
				}, 'json');
			} else {
				rctr.log('[rctr] No new data to send. Skipping.');
			}

		},
		ping: function(async){
			rctr.log('[rctr] Pinging.')
			if ( rctr.st.ready ) {
				$.ajax({url: rctr.st.server+'/events/ping?access_token='+rctr.st.access_token+'&user_token='+rctr.st.user_token+'&visit_token='+rctr.st.visit_token, async: async});
			}
		}
	},
	ut: {
		checkVisible: function(e){
			if ( ! $(e).is(':visible') ) {
				return false;
			}
			var vpH = $(window).height(),
				st = $(window).scrollTop(),
				y = $(e).offset().top;
			return (y < (vpH + st));
		}
	},
	dbg: {
		killCookies: function(){
			$.removeCookie('ReactorUserToken', rctr.st.cookieOpt);
			$.removeCookie('ReactorVisitToken', rctr.st.cookieOpt);
		}
	},
	track: function(){
		rctr.comm.ping(true);
		rctr.mntr.getArticles();
		rctr.mntr.checkRenders();
		rctr.mntr.updateSightings();
		rctr.comm.sendData();
		rctr.sess.updateVisitTime();
	},
	init: function(){
		if ( typeof rctr_access_token !== 'undefined' ) {
			rctr.st.access_token = rctr_access_token;
		} else {
			rctr.log('[rctr] Access token missing. Can not proceed.');
			return false;
		}

		if ( typeof rctr_debug !== 'undefined' ) {
			rctr.st.debug = rctr_debug;
		}

		rctr.sess.getUser();		// Here it begins

		$(window).scroll(function(){
			clearTimeout($.data(this, 'scrollTimer'));
			$.data(this, 'scrollTimer', setTimeout(function() {
				rctr.mntr.updateSightings();
			}, 250));
		});

		$(window).unload(function(){
			rctr.comm.ping(false);
		});
	}
}

$(document).ready(function(){
	rctr.init();
});