// ==UserScript==
// @name         Alienware Arena helper
// @namespace    https://github.com/thomas-ashcraft
// @version      0.3
// @description  Earn daily ARP easily
// @author       Thomas Ashcraft
// @match        *://*.alienwarearena.com/*
// @match        *://*.alienwarearena.com//*
// @grant        none
// @noframes
// ==/UserScript==

(function() {
	var status_message_delay	= 5000;	// How long the status messages will be displayed before they disappear. (in milliseconds, 1000 = 1 second) Default: 5000
	var actions_delay_min		= 1000;	// Minimum delay time between net actions. (in milliseconds) Default: 1000
	var actions_delay_max		= 5000;	// Maximum delay time between net actions. (in milliseconds) Default: 5000
	var tot_add_votes_min		= 3;	// Minum additional This or That votes. Default: 3
	var tot_add_votes_max		= 7;	// Minum additional This or That votes. Default: 7

	var DEBUG = false; // Developer options. It is highly not recommended to touch this and anything below! Default: false

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
		.awah-arp-pts {float: right; clear: both; width: 100%}
		.awah-arp-status {float: right; clear: both; white-space: nowrap; border-bottom: 1px solid #1c1e22;}
		.awah-arp-status > span {float: right; clear: both; position: relative; animation: awah-slide-from-bottom 0.25s ease-out 1 forwards;}
		#arp-toast .toast-header {overflow: visible !important;}
		.awah-ui-overlay {float: right; clear: both; font-size: smaller !important; pointer-events: none; position: absolute; bottom: 102%; right: 0; min-width: 100%; padding: inherit; text-shadow: 2px 2px 2px rgb(0, 0, 0), -1px -1px 2px rgb(0, 0, 0); text-align: right; background: rgba(0, 0, 0, 0) linear-gradient(to right bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.85) 85%, rgba(0, 0, 0, 0.85) 100%) no-repeat scroll 0 0;}
		.awah-grey {color: #767676;}
		.awah-casper-out {animation: awah-casper-out 0.6s ease-in !important;}
		.awah-arp-pts > span {clear: both; float: right; width: 100%; background-position: 50% 50%; background-repeat: no-repeat; background-size: 100% 12px;}
		.awah-arp-pts > span::after {content: ""; display: block; height: 0; clear: both;}

		.awah-options-overlay {float: left; clear: both; position: absolute; bottom: 0; right: 100%; height: 100%; width: 100%; padding: 0 11px; text-shadow: 2px 2px 2px rgb(0, 0, 0), -1px -1px 2px rgb(0, 0, 0); text-align: right; background: rgba(0, 0, 0, 0) linear-gradient(to right, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.85) 25%, rgba(0, 0, 0, 0.85) 100%) no-repeat scroll -1px 0;}
		.awah-options-overlay::before {content: ""; display: block; position: relative; top: -1px; border-top-width: 1px; border-top-style: solid; border-image: linear-gradient(to right, rgba(0, 0, 0, 0) 0%, #54bbdb 100%) 1; right: -11px;}
		.awah-options-title {font-size: 16px; padding: 11px 0; cursor: pointer;}
		.awah-option {border-bottom: 1px solid #1c1e22; margin-bottom: 11px;}
		.awah-option::after {content: ""; display: block; height: 0; clear: both;}
		.awah-option label {width: 100%; margin: 0;}
		.awah-opt-title {float: left; line-height: 38px;}
		.awah-opt-input {float: right; width: 24%; text-align: right;}
		.awah-opt-desc {float: right; font-size: smaller;}

		.awah-progress-bar-back {background-color: rgb(40, 37, 36); height: 12px;}
		.awah-progress-bar-front {background-color: #00a0f0;}
		.awah-progress-bar-simple {background-image: linear-gradient(90deg, #00a0f0 38%, rgb(40, 37, 36) 0%, rgb(40, 37, 36) 68%, rgba(40, 37, 36, 0) 0%);}
		.awah-progress-bar {background-image: linear-gradient(90deg, rgb(0, 160, 240) 38%, rgba(0, 160, 240, 0.2) 0%, rgba(0, 160, 240, 0.2) 47%, rgb(0, 160, 240) 48%, rgb(40, 37, 36) 0%);}

		@keyframes awah-slide-from-bottom {
			from {opacity: 0.5; bottom: -80px}
			to {opacity: 1; bottom: 0px}
		}
		@keyframes awah-casper-out {
			from {filter: blur(0px);}
			to {filter: blur(20px);}
		}
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
	var tot_add_votes = getRandomInt(tot_add_votes_min, tot_add_votes_max);
	
	// initialize UI
	setTimeout(function() {
		$("div.toast-header").append('<div class="awah-ui-overlay"><span class="awah-arp-status awah-grey"></span><span class="awah-arp-pts"><span class="awah-arp-pts-con"></span><span class="awah-arp-pts-tot"></span></span></div>');
		if (votes_content_cur < votes_content_max) {
			$('<span class="awah-con-queue" style="display: none;">votes queue: <span class="awah-con-queue-length">' + content_to_vote.length + '</span></span>').appendTo(".awah-arp-status");
		}
		if (DEBUG) $("div.toast-body").prepend('<div class="awah-options-overlay"><div class="awah-options-title">Alienware Arena helper options <span class="fa fa-cog"></span></div>' +
			'<div class="awah-option"><label><span class="awah-opt-title">status_message_delay</span>' +
			'<input id="status_message_delay" class="form-control awah-opt-input" type="text"></label>' +
			'<span class="awah-opt-desc awah-grey">How long the status messages will be displayed before they disappear. (in milliseconds, 1000 = 1 second)<br>Default: 5000</span></div>' +

			'<div class="awah-option"><label><span class="awah-opt-title">actions_delay_min</span>' +
			'<input id="actions_delay_min" class="form-control awah-opt-input" type="text"></label>' +
			'<span class="awah-opt-desc awah-grey">Minimum delay time between net actions. (in milliseconds)<br>Default: 1000</span></div>' +

			'<div class="awah-option"><label><span class="awah-opt-title">actions_delay_max</span>' +
			'<input id="actions_delay_max" class="form-control awah-opt-input" type="text"></label>' +
			'<span class="awah-opt-desc awah-grey">Maximum delay time between net actions. (in milliseconds)<br>Default: 5000</span></div>' +
			'</div>');
		document.addEventListener('animationend', function(event) {
			if (event.animationName == "awah-casper-out") {
				$(event.target).remove();
			}
		}, false);
		$(".awah-opt-input").on("keyup", function() {
			this.value=this.value.replace(/[^\d]/,'');
			this.value=this.value.slice(0, 5);
		});
		arp_pts_status_update();
		$('<span>Alienware Arena helper v<b>0.3</b></span>').appendTo(".awah-arp-status")
			.delay(status_message_delay).queue(function() { $(this).addClass("awah-casper-out"); });
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
			if (!votes_content_processing && !votes_content_gathering && 6 == 9) {
				$('<span>' + data.message + '</span>').appendTo(".awah-arp-status")
					.delay(status_message_delay).queue(function() { $(this).addClass("awah-casper-out"); });
				if (typeof data.voteTotal !== 'undefined') {
					$('<span>up: ' + data.upVotes + ' | down: ' + data.downVotes + ' | total: ' + data.voteTotal + '</span>').appendTo(".awah-arp-status")
						.delay(status_message_delay).queue(function() { $(this).addClass("awah-casper-out"); });
				}
			}
			arp_pts_status_update();
		}
	});
	
	function arp_pts_status_update() {
		$(".awah-arp-pts-con").text("CON: " + votes_content_cur + " / " + votes_content_max);
		$(".awah-arp-pts-tot").text("TOT: " + votes_tot_cur  + " / " + votes_tot_max);
		if (votes_content_cur >= votes_content_max) {
			$(".awah-arp-pts-con").addClass("awah-grey");
		}
		if (votes_tot_cur >= votes_tot_max) {
			$(".awah-arp-pts-tot").addClass("awah-grey");
		}
		if (votes_content_gathering || votes_content_processing) {
			$(".awah-arp-pts-con").css("background-image", "linear-gradient(90deg, rgb(0, 160, 240) " +
				((votes_content_cur / votes_content_max) * 100) +
				"%, rgba(0, 160, 240, 0.2) 0%, rgba(0, 160, 240, 0.2) " +
				((((votes_content_cur + content_to_vote.length) / votes_content_max) * 100) - 1) +
				"%, rgb(0, 160, 240) " +
				(((votes_content_cur + content_to_vote.length) / votes_content_max) * 100) +
				"%, rgb(40, 37, 36) 0%)");
		}
	}

	function scrl(target) {
		$('html, body').animate({scrollTop: target.offset().top-100}, 800);
		//target.effect("highlight", "800");
	}

	function getRandomInt(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	// TOT votes section
	function this_or_that_spam() {
		if (!$("a.btn-show-vote").hasClass("hidden")) {
			$("a.btn-show-vote").click(); //turn page into voting mode
		}
		$('<span>Additional This or That votes: ' + tot_add_votes + '</span>').appendTo(".awah-arp-status")
			.delay(status_message_delay).queue(function() { $(this).addClass("awah-casper-out"); });
		//create catch event to click again
		// settings.url == /this-or-that/1516182/create-match
		// where "1516182" is a topic ID
		$(document).ajaxComplete(function(event, xhr, settings) {
			if (settings.url.indexOf("create-match") >=0 && votes_tot_cur < (votes_tot_max + tot_add_votes)) {
				setTimeout(function() {
					var tot_choice = getRandomInt(0, 1);
					$("div.vote-container a.expand").each(function(index) {
						if (index == tot_choice) {
							$(this).trigger("mouseover").delay(1000).queue(function() { $(this).click(); });
						}
					});
				}, (1000 + getRandomInt(actions_delay_min, actions_delay_max)));
			}
		});
		//$("div.vote-container a.expand").filter(":first").click(); //click to launch spam loop
		setTimeout(function() {
		var tot_choice = getRandomInt(0, 1);
			$("div.vote-container a.expand").each(function(index) {
				if (index == tot_choice) {
					$(this).trigger("mouseover").delay(1000).queue(function() { $(this).click(); });
				}
			});
		}, getRandomInt(actions_delay_min, actions_delay_max));
	}

	function this_or_that_btn() {
		$(".btn-show-vote").clone().removeClass("btn-show-vote").addClass("awah-btn-tots").appendTo(".btn-group-sm");
		$(".awah-btn-tots span.hidden-xs").text("Make TOT votes");
		$(".awah-btn-tots").on("click", function() {
			$(".awah-btn-tots").addClass("hidden");
			this_or_that_spam(); //show must go on
			setTimeout(function() {
				scrl($('.this-or-that-container'));
			}, 1);
		});
	}

	// CON votes section
	function votes_content_make() {
		//$('.post-up-vote') on click
		//var postId = $(this).data('post-id');
		votes_content_processing = true;
		var url = content_to_vote.shift();
		$(".awah-con-queue-length").text(content_to_vote.length);
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
				if (content_to_vote.length > 0 && votes_content_cur < votes_content_max) {
					setTimeout(function() {
						votes_content_make();
					}, getRandomInt(actions_delay_min, actions_delay_max));
				} else {
					arp_pts_status_update(); // just in case
					votes_content_processing = false;
					if (!votes_content_gathering) {
						$(".awah-con-queue").delay(status_message_delay).queue(function() { $(this).addClass("awah-casper-out"); });
					}
					setTimeout(function() {
						$(".awah-arp-pts-con").css("background-image", "");
					}, status_message_delay);
					//$(".awah-arp-pts-con").delay(status_message_delay).queue(function() { $(this).css("background-image", ""); });
				}
			},
			error: function(data){
				$('<span>Some vote error!</span>').appendTo(".awah-arp-status")
					.delay(status_message_delay).queue(function() { $(this).addClass("awah-casper-out"); });
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

		$(".awah-con-queue").show();

		// TODO: filter to avoid arrow-down arleady clicked comments
		$("i.fa-arrow-up:not([style='color: gold;'])").each(function( index ) {
			if ((votes_content_cur + content_to_vote.length) < votes_content_max) {
				var url = "/forums/post/up-vote/" + $(this).parent().attr('data-post-id');
				content_to_vote.push(url);
				$(".awah-con-queue-length").text(content_to_vote.length);
				arp_pts_status_update();
			}
			if ((votes_content_cur + content_to_vote.length) >= votes_content_max) {
				votes_content_gathering = false;
				$('<span>Enough votes!</span>').appendTo(".awah-arp-status")
					.delay(status_message_delay).queue(function() { $(this).addClass("awah-casper-out"); });
				return false;
			}
		});
		if (content_to_vote.length > 0 && !votes_content_processing) {
			votes_content_make();
		}
		if (votes_content_gathering) {
			setTimeout(function() {
				votes_content_get_next_page();
			}, getRandomInt(actions_delay_min, actions_delay_max));
		}
	}

	function votes_content_get_next_page() {
		//$('.pagination li a').on('click'
		//e.preventDefault();
		//$ele         = $(this);
		var status_message = $('<span>Getting to the next page <span class="fa fa-circle-o-notch fa-spin"></span></span>');
		status_message.appendTo(".awah-arp-status");
		var href     = $("ul.pagination > li.next:not(.disabled) > a").filter(":first").attr('href');
		var parts    = href.split('/');
		var page     = parts.pop();
		var entityId = parts.pop();

		if (href) {
			$.ajax({
				url: href,
				type: 'get',
				success: function(data) {
					status_message.html('<span>Getting to the next page <span class="fa fa-check-circle"></span></span>');
					status_message.delay(status_message_delay).queue(function() { $(this).addClass("awah-casper-out"); });
					$('#reply-wrapper').empty();
					$('#reply-wrapper').append(data);
					$('.ucf-comments .timeago').timeago();
					votes_content_gather();
				},
				error: function(data) {
					status_message.html('<span>Getting to the next page <span class="fa fa-exclamation-triangle"></span></span>');
					status_message.delay(status_message_delay).queue(function() { $(this).addClass("awah-casper-out"); });
					$(".awah-btn-cons").removeClass("hidden");
				}
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
			votes_content_gather(); //new algorithm
		});
		if (DEBUG) $('<a class="btn btn-default text-uppercase awah-btn-test" href="javascript:void(0);">' +
			'<i class="fa fa-terminal"></i> ' +
			'<span class="hidden-xs">Make test</span></a>').appendTo(".btn-group-sm");
		if (DEBUG) $(".awah-btn-test").on("click", function() {
			votes_content_cur = 48;
			votes_tot_cur = 27;
			arp_pts_status_update();
		});
	}

	// USER profile functions
	function load_user_recent_activity_data() {
		page++;
		loadTiles(page);
		$(document).ajaxComplete(function(event, xhr, settings) {
			if (settings.url.indexOf("recent-activity-data") >=0) {
				// data = JSON.parse(xhr.responseText);
				// if (data.total > 0) {
					// $.each(data.data, function (key, value) {
						// content_to_vote.push(value.id);
					// });
				// }
				if (more) {
					page++;
					loadTiles(page);
				}
			}
		});
	}
	
	function votes_user_gather() {
		var totalPages = Math.ceil(recentActivity.total / 15);
		// gather first page
		//$.each(recentActivity.data, function (key, value) {
		//	content_to_vote.push("/ucf/vote/up/" + value.id);
		//});

		// "https://eu.alienwarearena.com/esi/recent-activity-data/user/" + profileData.profile.id + "/" + pageNumber
		var profileData_profile_id = 3114583;
		totalPages = 15;
		for (i = 1; i <= totalPages; i++) {
			var url = '/esi/recent-activity-data/user/' + profileData_profile_id + '/' + i;
			$.get(url, function (r) {
				$.each(r.data, function (key, value) {
					content_to_vote.push("/ucf/vote/up/" + value.id);
					if (content_to_vote.length == r.total) { //recentActivity.total
						console.log(content_to_vote);
						//votes_user_make();
						$.each(content_to_vote, function (key, value) {
							$.ajax({
								url: value,
								type: 'post',
								success: function(data){
									//if (data.success) {
										console.log("молодец");
									//}
								},
								error: function(data){},
							});
						});
					}
				});
			});
		}
	}

	function votes_user_make() {
		// any non-comment type of content voting url:
		// https://eu.alienwarearena.com/ucf/vote/up/255785
		// recentActivity.total == number of content can be used as var votes_user_max

		//votes_user_processing = true;
		var url = content_to_vote.shift();
		//$(".awah-con-queue-length").text(content_to_vote.length); votes_user

		$.ajax({
			url: url,
			type: 'post',
			success: function(data){
				if (data.success) {
                    // hooray!
                }
				if (content_to_vote.length > 0) {
					setTimeout(function() {
						votes_user_make();
					}, getRandomInt(actions_delay_min, actions_delay_max));
				} else {
					//votes_user_processing = false;
					//$(".awah-con-queue").delay(status_message_delay).queue(function() { $(this).addClass("awah-casper-out"); });
					setTimeout(function() {
						$(".awah-arp-pts-con").css("background-image", "");
					}, status_message_delay);
				}
			},
			error: function(data){
				$('<span>Some vote error!</span>').appendTo(".awah-arp-status")
					.delay(status_message_delay).queue(function() { $(this).addClass("awah-casper-out"); });
				if (content_to_vote.length > 0) {
					votes_user_make();
				} else {
					//votes_user_processing = false;
				}
			},
        });
	}

	function votes_user_btn() {
		$('<a class="btn btn-default text-uppercase awah-btn-cons" href="javascript:void(0);">' +
			'<i class="fa fa-arrow-up" style="color: gold;"></i> ' +
			'<span class="hidden-xs">Make USER votes</span></a>').insertAfter(".profile-send-message");
		$(".awah-btn-cons").on("click", function() {
			$(".awah-btn-cons").addClass("hidden");
			votes_user_gather();
		});
	}

	function show_user_steam_link() {
		// var profileSteamId
		// "http://steamcommunity.com/profiles/" + profileSteamId
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
		case /^\/member\/[\w+]*$/.test(path):
			if(DEBUG) console.log("SWITCH: user profile page");
			if(DEBUG) votes_user_btn();
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
