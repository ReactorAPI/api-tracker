// SoyChile.cl
// Parser especial

// Make $ available as jQuery
if ( typeof jQuery !== 'undefined' && typeof $ == 'undefined' ) { $=jQuery; }

function rctr_convert_articles(){
	if ( typeof rctr !== 'undefined' && rctr.st.ready == true ) {
		var p = false;

		$('[data-idnoticia]').not('[data-reactor-articleid]').each(function(){
			var id = $(this).attr('data-idnoticia');
			$(this).attr('data-reactor-articleid', id);
			p = true;
		});

		var split_url = location.href.split('/');
		if ( split_url.length == 10 ) {
			if ( split_url[8].length == 6 ) {
				// Asumamos que es un artículo.
				if ( $('#content #note-inside[data-reactor-ismainarticle]').length == 0 ) {
					$('#content #note-inside').attr('data-reactor-articleid', split_url[8]).attr('data-reactor-ismainarticle', 'true');
					p = true;
				}	
			}
		}
		if ( p == true ) {
			rctr.track();
		}
	}

	setTimeout(rctr_convert_articles, 3000);
}

$(document).ready(function(){

	setTimeout(rctr_convert_articles, 3000);

});