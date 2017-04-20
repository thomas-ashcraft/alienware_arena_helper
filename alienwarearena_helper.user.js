// ==UserScript==
// @name         Alienware Arena helper
// @namespace    https://github.com/thomas-ashcraft
// @version      0.2.0
// @description  Earn daily ARP easily
// @author       Thomas Ashcraft
// @match        *://*.alienwarearena.com/*
// @match        *://*.alienwarearena.com//*
// @grant        none
// @noframes
// ==/UserScript==

(function() {
	var DEBUG = false;

	var url = window.location.href;
	if(DEBUG) console.log("🐾 url: " + url);

	var path = window.location.pathname;
	path = path.replace(/\/+/g, "/");
	if(DEBUG) console.log("🐾 path: " + path);

	// Embed style
	var helper_style = `
		#background {}
		.awah-btn-tots {background-color: #f05000;}
		.awah-btn-cons {color: gold;}
		.awah-arp-pts {float: left; clear: both; font-size: smaller !important;}
		.awah-arp-status {float: left; clear: both; font-size: smaller !important;}
		`;
	document.head.appendChild(document.createElement('style')).innerHTML=helper_style.replace(/([\s\S]*?return;){2}([\s\S]*)}/,'$2');

	// ARP points initial readings
	var pm_counter = /Vote on Content(?:.|\n)*>(\d+) of (\d+)<\/td>(?:.|\n)*Vote on This or That(?:.|\n)*>(\d+) of (\d+)<\/td>/.exec($("head").html());
	votes_content_cur = parseInt(pm_counter[1], 10);
	votes_content_max = parseInt(pm_counter[2], 10);
	votes_tot_cur = parseInt(pm_counter[3], 10);
	votes_tot_max = parseInt(pm_counter[4], 10);
	votes_content_promised = 0;
	votes_content_action = false;
	votes_content_processing = false;
	votes_content_gathering = false;
	content_to_vote = [];
	setTimeout(function() {
		$("div.toast-header").append('<span class="toast-title awah-arp-pts"></span><span class="toast-title awah-arp-status"></span>');
		arp_pts_status_update();
	}, 1);

	// ARP points watchdog
	$(document).ajaxComplete(function(event, xhr, settings) {
		if (settings.url.indexOf("this-or-that/vote") >=0) {
			votes_tot_cur++;
			arp_pts_status_update();
		} else if (settings.url.indexOf("vote") >=0) {
			data = JSON.parse(xhr.responseText);
			if (data.votedForContent) {
				votes_content_cur++;
			}
			if (data.votedForContent === false) {
				votes_content_cur--;
			}
			arp_pts_status_update();
		}
	});
	
	function arp_pts_status_update() {
		$(".awah-arp-pts").html("CON: " + votes_content_cur + " / " + votes_content_max + " <br> TOT: " + votes_tot_cur  + " / " + votes_tot_max);
	}

	function scrl (target) {
		$('html, body').animate({scrollTop: target.offset().top-100}, 800);
		//target.effect("highlight", "800");
	}

	function all_feeds_functions() {
		//fix_gleam_url();
		fix_links();

		$(document).ajaxComplete(function(event, xhr, settings) {
			if (settings.url.indexOf("twitmode=1") >=0) {
				fix_links();
			}
		});
	}

	function this_or_that_spam() {
		if (!$("a.btn-show-vote").hasClass("hidden")) {
			$("a.btn-show-vote").click(); //turn page into voting mode
		}
		//create catch event to click again
		// settings.url == /this-or-that/1516182/create-match
		// where "1516182" is a topic ID
		$(document).ajaxComplete(function(event, xhr, settings) {
			if (settings.url.indexOf("create-match") >=0 && votes_tot_cur < votes_tot_max) {
				$("div.vote-container a.expand").filter(":first").click();
			}
		});
		$("div.vote-container a.expand").filter(":first").click(); //click to launch spam
	}

	function this_or_that_btn() {
		$(".btn-show-vote").clone().removeClass("btn-show-vote").addClass("awah-btn-tots").appendTo(".btn-group-sm");
		$(".awah-btn-tots span.hidden-xs").text("Make TOT votes");
		$(".awah-btn-tots").on("click", function() {
			$(".awah-btn-tots").addClass("hidden");
			this_or_that_spam(); //show must go on
		});
	}

	function votes_content_spam() {
		// i.fa-arrow-up not style="color: gold;" //comment
		// i.fa-chevron-up not style="color: gold;" //post

		// TODO: filter to avoid arrow-down arleady clicked comments
		$("i.fa-arrow-up:not([style='color: gold;'])").each(function( index ) {
			if ((votes_content_cur + votes_content_promised) < votes_content_max) {
				votes_content_promised++;
				this.click();
				$(".awah-arp-status").text("votes incoming: " + votes_content_promised);
			} else {
				$(".awah-arp-status").html("votes incoming: " + votes_content_promised + " / ENOUGH");
				votes_content_action = false;
				return false;
			}
		});
		if (votes_content_promised == 0 && votes_content_action) {
			$(".awah-arp-status").text("Getting to the next page");
			votes_content_next_page();
		}
	}

	function votes_content_next_page() {
		$("ul.pagination > li.next:not(.disabled) > a").filter(":first").click();
	}

	function votes_content_algorithm() {
		votes_content_action = true;

		//wait for promises complete and go to next content page
		//also wait for next page load
		$(document).ajaxComplete(function(event, xhr, settings) {
			if (votes_content_action) {
				if (settings.url.indexOf("ucf/comments") >=0) {
					votes_content_spam();
				} else if (settings.url.indexOf("vote") >=0) {
					data = JSON.parse(xhr.responseText);
					if (typeof data.votedForContent !== 'undefined') {
						votes_content_promised--;
						if (votes_content_promised == 0) {
							votes_content_next_page();
						}
					}
				}
			}
		});

		votes_content_spam();
	}

	// NEW !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	function votes_content_make() {
		//$('.post-up-vote') on click
		//var postId = $(this).data('post-id');
		votes_content_processing = true;
		var url = content_to_vote.shift();
		//var url    = "/forums/post/up-vote/replaceMe";
		//url        = url.replace('replaceMe', postId);
		var postId = url.replace("/forums/post/up-vote/", "");

		$.ajax({
			url: url,
			type: 'post',
			success: function(data){
				if (data.success) {
                    $('.post-vote-count[data-post-id="'+postId+'"]').html(data['voteTotal']);

                    if (data.votedForContent) {
                        $('#post-'+postId+' .post-up-vote .fa-arrow-up').css('color', 'gold');
                    } else {
                        $('#post-'+postId+' .post-up-vote .fa-arrow-up').css('color', '#c8c8c8');
                    }

                    $('#post-'+postId+' .post-down-vote .fa-arrow-down').css('color', '#c8c8c8');
                }
				if (content_to_vote.length > 0) {
					votes_content_make();
				} else {
					votes_content_processing = false;
				}
			},
			error: function(data){
				if (content_to_vote.length > 0) {
					votes_content_make();
				} else {
					votes_content_processing = false;
				}
			},
        });
	}

	function votes_content_gather() {
		votes_content_gathering = true;

		// TODO: filter to avoid arrow-down arleady clicked comments
		$("i.fa-arrow-up:not([style='color: gold;'])").each(function( index ) {
			if ((votes_content_cur + content_to_vote.length) < votes_content_max) {
				var url = "/forums/post/up-vote/" + $(this).parent().attr('data-post-id');
				content_to_vote.push(url);
				$(".awah-arp-status").text("votes incoming: " + content_to_vote.length);
			} else {
				votes_content_gathering = false;
				$(".awah-arp-status").html("votes incoming: " + content_to_vote.length + " / ENOUGH");
				return false;
			}
		});
		if (content_to_vote.length > 0 && !votes_content_processing) {
			votes_content_make();
		}
		if (votes_content_gathering) {
			$(".awah-arp-status").text("Getting to the next page");
			votes_content_get_next_page();
		}
	}

	function votes_content_get_next_page() {
		//$('.pagination li a').on('click'
		//e.preventDefault();
		//$ele         = $(this);
		var href     = $("ul.pagination > li.next:not(.disabled) > a").filter(":first").attr('href');
		var parts    = href.split('/');
		var page     = parts.pop();
		var entityId = parts.pop();

		if (href) {
			$.ajax({
				url: href,
				type: 'get',
				success: function(data) {
					$('#reply-wrapper').empty();
					$('#reply-wrapper').append(data);
					$('.ucf-comments .timeago').timeago();
					votes_content_gather();
				},
				error: function(data) {}
			});
		} else {
			votes_content_gathering = false;
		}
	}

	function votes_content_btn() {
		$('<a class="btn btn-default text-uppercase awah-btn-cons" href="javascript:void(0);">' +
			'<i class="fa fa-arrow-up" style="color: gold;"></i> ' +
			'<span class="hidden-xs">Make CON votes</span></a>').appendTo(".btn-group-sm");
		$(".awah-btn-cons").on("click", function() {
			$(".awah-btn-cons").addClass("hidden");
			//votes_content_algorithm(); //show must go on
			votes_content_gather(); //new algorithm
		});
	}

	function get_user_recent_activity_data() {
		page++;
		loadTiles(page);
		$(document).ajaxComplete(function(event, xhr, settings) {
			if (settings.url.indexOf("recent-activity-data") >=0) {
				if (more) {
					page++;
					loadTiles(page);
				}
			}
		});
	}

	switch (true) {
		case /.*\/boards\/this-or-that\/.*/.test(path):
			if(DEBUG) console.log("SWITCH: This or That");
			//fix_gleam_url();
			this_or_that_btn();
			//break;
		case /.*\/ucf\/show\/.*/.test(path):
			if(DEBUG) console.log("SWITCH: content");
			votes_content_btn();
			break;
		case /\/$/.test(url):
			if(DEBUG) console.log("SWITCH: 📰 main page");
			//all_feeds_functions();
			break;
	}

	// Embed functions to be called directly from the UI in *-monkey installations
	function embedFunction(s) {
		if(DEBUG) console.log('🔀 embedding: ' + s.name);
		document.body.appendChild(document.createElement('script')).innerHTML=s.toString().replace(/([\s\S]*?return;){2}([\s\S]*)}/,'$2');
	}

	// embed other functions used by UI after loading
	embedFunction(scrl);

}(window));
