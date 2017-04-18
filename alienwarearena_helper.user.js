// ==UserScript==
// @name         Alienware Arena helper
// @namespace    https://github.com/thomas-ashcraft
// @version      0.1.0
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

	var referrer = document.referrer;
	if(DEBUG) console.log("🐾 referrer: " + referrer);

	// Embed style
	var helper_style = `
		#background {}
		.awah-btn-tots {background-color: #f05000;}
		.awah-arp-pts {float: left; clear: both; font-size: smaller !important;}
		.awah-btn-cons {color: gold;}
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
	//$("div.toast-header").append('<span class="toast-title awah-arp-pts" style="float: left; clear: both;">asdf</span>');
	//$("head").html($("head").html().replace('<span data-notify="title" class="toast-title">ARP STATUS <span class="odometer" id="arp-status-total"></span></span>',
	//	'<span data-notify="title" class="toast-title">ARP STATUS <span class="odometer" id="arp-status-total"></span></span> <span class="toast-title awah-arp-pts" style="float: left; clear: both;"></span>'));
	//$("div.toast-header").text("CON: " + votes_content_cur + " / " + votes_content_max + " | TOT: " + votes_tot_cur  + " / " + votes_tot_max);
	//$(".awah-arp-pts").html("CON: " + votes_content_cur + " / " + votes_content_max + " <br> TOT: " + votes_tot_cur  + " / " + votes_tot_max);
	setTimeout(function() {
		$("div.toast-header").append('<span class="toast-title awah-arp-pts">asdf</span>');
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
		//$("div.toast-header").text("CON: " + votes_content_cur + " / " + votes_content_max + " | TOT: " + votes_tot_cur  + " / " + votes_tot_max);
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
		$(".awah-btn-tots span.hidden-xs").text("Spam TOT votes");
		$(".awah-btn-tots").on("click", function() {
			$(".awah-btn-tots").addClass("hidden");
			this_or_that_spam(); //show must go on
		});
	}

	function votes_content_spam() {
		// i.fa-arrow-up not style="color: gold;" //comment
		// i.fa-chevron-up not style="color: gold;" //post
		//votes_content_promised = votes_content_cur;

		$("i.fa-arrow-up:not([style='color: gold;'])").each(function( index ) {
			if ((votes_content_cur + votes_content_promised) < votes_content_max) {
				votes_content_promised++;
				this.click();
				$(".awah-arp-pts").text("votes incoming: " + votes_content_promised);
			} else {
				$(".awah-arp-pts").html("votes incoming: " + votes_content_promised + "<br>Enough votes");
				votes_content_action = false;
				return false;
			}
		});
		if (votes_content_promised == 0 && votes_content_action) {
			$(".awah-arp-pts").text("Getting to the next page");
			votes_content_next_page();
		}
	}

	function votes_content_next_page() {
		$("ul.pagination > li.next > a").filter(":first").click();
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

	function votes_content_btn() {
		$('<a class="btn btn-default text-uppercase awah-btn-cons" href="javascript:void(0);">' +
			'<i class="fa fa-arrow-up" style="color: gold;"></i> ' +
			'<span class="hidden-xs">Spam CON votes</span></a>').appendTo(".btn-group-sm");
		$(".awah-btn-cons").on("click", function() {
			$(".awah-btn-cons").addClass("hidden");
			votes_content_algorithm(); //show must go on
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
	//embedFunction(this_or_that_spam);

}(window));
