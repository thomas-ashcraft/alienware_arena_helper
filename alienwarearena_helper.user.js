// ==UserScript==
// @name         Alienware Arena helper
// @namespace    https://github.com/thomas-ashcraft
// @version      0.5.1
// @description  Earn daily ARP easily
// @author       Thomas Ashcraft
// @match        *://*.alienwarearena.com/*
// @match        *://*.alienwarearena.com//*
// @license      GPL-2.0+; http://www.gnu.org/licenses/gpl-2.0.txt
// @icon         https://www.alienwarearena.com/favicon.ico
// @grant        none
// @noframes
// ==/UserScript==

(function() {
	// You can configure options through the user interface. It is not recommended to edit the script for these purposes.
	var version = "0.5.1";
	var DEBUG = false; // Developer option. Default: false

	var status_message_delay_default	= 5000;
	var actions_delay_min_default		= 1000;
	var actions_delay_max_default		= 5000;
	var show_key_on_marked_giveaways_default = "true";

	var actions_delay_min		= parseInt(localStorage.getItem('awah_actions_delay_min'), 10) || actions_delay_min_default;
	var actions_delay_max		= parseInt(localStorage.getItem('awah_actions_delay_max'), 10) || actions_delay_max_default;
	localStorage.removeItem('awah_tot_add_votes_min'); // fix legacy
	localStorage.removeItem('awah_tot_add_votes_max'); // fix legacy
	var show_key_on_marked_giveaways	= localStorage.getItem('awah_show_key_on_marked_giveaways') || show_key_on_marked_giveaways_default;
	show_key_on_marked_giveaways = (show_key_on_marked_giveaways === "true");
	var status_message_delay	= parseInt(localStorage.getItem('awah_status_message_delay'), 10) || status_message_delay_default;

	var url = window.location.href;
	var path = window.location.pathname;
	path = path.replace(/\/+/g, "/");

	// Embed style
	var helper_style = `
		.awah-btn-cons,
		.awah-btn-cons:hover {color: gold;}
		.list-group-item > .awah-btn-cons {width: 50%;}
		.list-profile-actions > li > .awah-btn-cons {width: 50%; border-color: rgba(0, 0, 0, .6);}
		.awah-btn-cons.disabled::before {content: ''; width: 100%; height: 100%; position: absolute; top: 0; left: 0; background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACAQMAAABIeJ9nAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABlBMVEUAAAAAAAClZ7nPAAAAAXRSTlMAQObYZgAAAAFiS0dEAIgFHUgAAAAJcEhZcwAACxIAAAsSAdLdfvwAAAAMSURBVAjXY2hgYAAAAYQAgSjdetcAAAAASUVORK5CYII=');}

		.awah-grey {color: #767676;}
		.awah-casper-out {overflow: hidden !important; animation: awah-casper-out 0.6s ease-in !important;}
		[data-awah-tooltip] {position: relative;}
		[data-awah-tooltip]:after {content: attr(data-awah-tooltip); pointer-events: none; padding: 4px 8px; color: white; position: absolute; left: 0; bottom: 0%; opacity: 0; font-weight: normal; text-transform: none; font-size: smaller; white-space: pre; box-shadow: 0px 0px 3px 0px #54bbdb; background-color: #0e0e0e; transition: opacity 0.25s ease-out, bottom 0.25s ease-out; z-index: 1000;}
		[data-awah-tooltip]:hover:after {bottom: 115%; opacity: 1;}
		.awah-panel {margin: 20px 0;}

		#arp-toast .toast-header {overflow: visible !important;}
		.awah-ui-overlay {clear: both; font-size: smaller !important; pointer-events: none; position: absolute; bottom: 102%; right: 0; min-width: 100%; padding: inherit; text-shadow: 2px 2px 2px rgb(0, 0, 0), -1px -1px 2px rgb(0, 0, 0), 2px 2px 5px rgb(0, 0, 0), -1px -1px 5px rgb(0, 0, 0), 0px 0px 10px rgb(0, 0, 0); text-align: right; background: rgba(0, 0, 0, 0) linear-gradient(to right bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.85) 85%, rgba(0, 0, 0, 0.85) 100%) no-repeat scroll 0 0;}
		.awah-arp-status {float: right; clear: both; white-space: nowrap; border-bottom: 1px solid #1c1e22;}
		.awah-arp-status > div {clear: both; position: relative; animation: awah-slide-from-bottom 0.25s ease-out 1 forwards;}
		.awah-arp-pts {clear: both; width: 100%}
		.awah-arp-pts > div {clear: both; width: 100%; background-position: 50% 50%; background-repeat: no-repeat; background-size: 100% 12px;}
		.awah-arp-pts > div::after {content: ""; display: block; height: 0; clear: both;}

		.awah-daily-reset-timer {min-width: 22%;}
		.toast-body table tbody > :nth-child(2n) {background: #090909}

		.awah-options-btn {float: left; padding-left: 16px; cursor: pointer; transition: text-shadow 0.25s ease-in-out;}
		.awah-options-btn:hover {text-shadow: 0px 0px 3px rgba(75, 201, 239, 1), 0px 0px 12px rgba(75, 201, 239, 1); /* animation: awah-breathing-text-neon 2s ease 0s infinite alternate; */}
		.awah-options-overlay {overflow: auto; float: left; clear: both; position: absolute; bottom: 0; right: calc(100% + 1px); height: 100%; width: 100%; padding: 0 11px; text-shadow: 2px 2px 2px rgb(0, 0, 0), -1px -1px 2px rgb(0, 0, 0); text-align: right; background: rgba(0, 0, 0, 0.85) repeat scroll 0 0; box-shadow: 0px 0px 3px 0px #54bbdb;}
		.awah-options-title {font-size: 16px; padding: 11px 0;}
		.awah-option {border-bottom: 1px solid #1c1e22; margin: 11px 0;}
		.awah-option::after {content: ""; display: block; height: 0; clear: both;}
		.awah-option label {width: 100%; margin: 0; position: relative;}
		.awah-option > * {clear: both;}
		.awah-opt-title {float: left; /* line-height: 38px; */}
		.awah-opt-input {float: right; width: 24%; text-align: right; padding: 0 5px; height: auto; background: transparent; color: white; border-width: 0px 0px 1px 0px;}
		.awah-opt-desc {float: right; font-size: smaller;}
		#awah_restore_default {width: 100%;}
		input.awah-opt-input[type="checkbox"] {/* display: none; */ position: absolute; right: 0; opacity: 0;}
		input.awah-opt-input[type="checkbox"]:focus + div {border-color: #66afe9; outline: 0; -webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075), 0 0 8px rgba(102, 175, 233, 0.6); box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075), 0 0 8px rgba(102, 175, 233, 0.6);}
		.awah-opt-input[type="checkbox"] + div {transition: 0.25s all ease; position: relative; overflow: hidden;}
		.awah-opt-input[type="checkbox"] + div > div {transition: 0.25s all ease; background-color: #428bca; width: 50%; position: absolute; left: 0;}
		input.awah-opt-input[type="checkbox"]:checked + div {background-color: rgb(66, 139, 202, 0.4);}
		input.awah-opt-input[type="checkbox"]:checked + div > div {left: calc(100% - 50%);}
		.awah-opt-input[type="checkbox"] + div > div::before {content: 'ON'; position: absolute; right: 120%;}
		.awah-opt-input[type="checkbox"] + div > div::after {content: 'OFF'; color: #767676; position: absolute; left: 120%;}

		.account-settings-steam div.steam {background-color: #171a21; border-radius: 100px;}

		div.tile-content.awah-giveaway-taken a.Giveaway::before {content: attr(awahlabel); font-family: inherit; font-weight: 700; white-space: pre; overflow: hidden; width: 100%; height: 100%; text-shadow: 2px 2px 2px rgb(0, 0, 0), -1px -1px 2px rgb(0, 0, 0), 2px 2px 5px rgb(0, 0, 0), -1px -1px 5px rgb(0, 0, 0), 0px 0px 10px rgb(0, 0, 0); background-color: rgba(0, 0, 0, 0); background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACAQMAAABIeJ9nAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABlBMVEUAAAAAAAClZ7nPAAAAAXRSTlMAQObYZgAAAAFiS0dEAIgFHUgAAAAJcEhZcwAACxIAAAsSAdLdfvwAAAAMSURBVAjXY2hgYAAAAYQAgSjdetcAAAAASUVORK5CYII=');}
		div.tile-content.awah-giveaway-taken:not(:hover) {opacity: 0.2; transition: opacity 0.25s ease-in-out;}

		.awah-progress-bar-back {background-color: rgb(40, 37, 36); height: 12px;}
		.awah-progress-bar-front {background-color: #00a0f0;}
		.awah-progress-bar-simple {background-image: linear-gradient(90deg, #00a0f0 38%, rgb(40, 37, 36) 0%, rgb(40, 37, 36) 68%, rgba(40, 37, 36, 0) 0%);}
		.awah-progress-bar {background-image: linear-gradient(90deg, rgb(0, 160, 240) 38%, rgba(0, 160, 240, 0.2) 0%, rgba(0, 160, 240, 0.2) 47%, rgb(0, 160, 240) 48%, rgb(40, 37, 36) 0%);}

		@keyframes awah-slide-from-bottom {
			from {opacity: 0.5; bottom: -90px;}
			to {opacity: 1; bottom: 0px;}
		}
		@keyframes awah-casper-out {
			0%		{filter: blur(0px); max-height: 50px;}
			100%	{filter: blur(15px); max-height: 0px;}
		}
		@keyframes awah-breathing-text-neon {
			from {text-shadow: 0px 0px 3px rgba(75, 201, 239, 0.25), 0px 0px 12px rgba(75, 201, 239, 0.25);}
			to {text-shadow: 0px 0px 3px rgba(75, 201, 239, 1), 0px 0px 12px rgba(75, 201, 239, 1);}
		}
		@keyframes awah-new-tile-chunk-appears {
			from {opacity: 0.99;}
			to {opacity: 1;}
		}
		.tile-chunk {animation-duration: 0.001s; animation-name: awah-new-tile-chunk-appears;}
		`;
	document.head.appendChild(document.createElement('style')).innerHTML=helper_style.replace(/([\s\S]*?return;){2}([\s\S]*)}/,'$2');

	// ARP points initial readings
	var pm_counter = /Vote on Content(?:.|\n)*>(\d+) of (\d+)<\/td>/.exec($("head").html());
	votes_content_cur = parseInt(pm_counter[1], 10);
	votes_content_max = parseInt(pm_counter[2], 10);
	votes_content_promised = 0;
	votes_content_action = false;
	votes_content_url = '';
	var content_to_vote = [];
	var content_to_check = [];
	var content_page = 1;
	var voting_down = false;
	var options_save_apply_timer;

	function newStatusMessage(statusMessageText) {
		var statusMessageObj = $('<div>' + statusMessageText + '</div>');
		statusMessageObj.appendTo(".awah-arp-status")
			.delay(status_message_delay).queue(function() {
				$(this).addClass("awah-casper-out").dequeue();
			});
		return statusMessageObj;
	}

	// initialize UI
	setTimeout(function() {
		$("div.toast-header").append('<div class="awah-ui-overlay"><div class="awah-arp-status awah-grey"></div><div class="awah-arp-pts"><div class="awah-arp-pts-con"></div></div></div>');
		if (votes_content_cur < votes_content_max) {
			$('<div class="awah-con-check-queue" style="display: none;">content to check: <span class="awah-con-check-queue-length">' + content_to_check.length + '</span> <span class="fa fa-fw fa-search"></span></div>').appendTo(".awah-arp-status");
			$('<div class="awah-con-votes-queue" style="display: none;">content to vote: <span class="awah-con-votes-queue-length">' + content_to_vote.length + '</span> <span class="fa fa-fw fa-upload"></span></div>').appendTo(".awah-arp-status");
		}
		arp_pts_status_update();
		$("div.toast-body > p.text-center").css({ "float": "right", "padding-right": "16px" });
		$("div.toast-body").append('<p class="awah-options-btn"><span class="fa fa-fw fa-cog"></span> HELPER OPTIONS</p>');
		$("div.toast-body").prepend('<div class="awah-options-overlay" style="display: none; bottom: -102%;"><div class="awah-option"><span class="awah-opt-desc awah-grey">AWA helper v<b>' + version + '</b></span></div>' +
			'<div class="awah-option">' +
			'<label><span class="awah-opt-title">actions_delay_min</span><input id="awah_actions_delay_min" class="form-control awah-opt-input" type="text" value="' + actions_delay_min + '"></label>' +
			'<label><span class="awah-opt-title">actions_delay_max</span><input id="awah_actions_delay_max" class="form-control awah-opt-input" type="text" value="' + actions_delay_max + '"></label>' +
			'<span class="awah-opt-desc awah-grey">Minimum and maximum random delay time between net actions. (in milliseconds)<br>Default minimum: ' + actions_delay_min_default + ' || Default maximum: ' + actions_delay_max_default + '</span></div>' +

			'<div class="awah-option">' +
			'<label><span class="awah-opt-title">show_key_on_marked_giveaways</span><input id="awah_show_key_on_marked_giveaways" class="form-control awah-opt-input" type="checkbox" ' + (show_key_on_marked_giveaways ? 'checked' : '') + '><div class="form-control awah-opt-input"><div>&nbsp;</div>&nbsp;</div></label>' +
			'<span class="awah-opt-desc awah-grey">At Giveaways page. Default: ' + (show_key_on_marked_giveaways_default === "true" ? 'ON' : 'OFF') + '</span></div>' +

			'<div class="awah-option">' +
			'<label><span class="awah-opt-title">status_message_delay</span><input id="awah_status_message_delay" class="form-control awah-opt-input" type="text" value="' + status_message_delay + '"></label>' +
			'<span class="awah-opt-desc awah-grey">How long the status messages will be displayed before they disappear. (in milliseconds, 1000 = 1 second)<br>Default: ' + status_message_delay_default + '</span></div>' +

			'<div class="awah-option">' +
			'<button id="awah_restore_default" class="btn btn-danger"><span class="fa fa-exclamation-triangle"></span> Restore default</button>' +
			'<span class="awah-opt-desc awah-grey">Restore default settings</span></div>' +
			'</div>');
		show_daily_reset_timer();

		document.addEventListener('animationend', function(event) {
			if (event.animationName == "awah-casper-out") {
				$(event.target).remove();
			}
		}, false);

		$('input.awah-opt-input[type="text"]').on("input", function() {
			this.value=this.value.replace(/[^\d]/,'');
			this.value=this.value.slice(0, 5);
		});

		$("input.awah-opt-input").on("change", function() {
			clearTimeout(options_save_apply_timer);
			options_save_apply_timer = setTimeout(function() {
				options_save_apply();
			}, 400);
		});

		$("#awah_restore_default").on("click", function() {
			$("#awah_actions_delay_min").val(actions_delay_min_default);
			$("#awah_actions_delay_max").val(actions_delay_max_default);
			$("#awah_show_key_on_marked_giveaways").prop("checked", (show_key_on_marked_giveaways_default === "true"));// true);
			$("#awah_status_message_delay").val(status_message_delay_default);
			newStatusMessage('Default options settings restored!');
			options_save_apply();
		});

		$(".awah-options-btn").on("click", function() {
			//$( ".block" ).animate({ left: "+=100px" }, 2000 );
			var awah_options = $(".awah-options-overlay");
			if(awah_options.css('display') == 'none') {
				awah_options.show();
				awah_options.stop().animate({bottom: "0%"}, 250);
			} else {
				awah_options.stop().animate({bottom: "-102%"}, 250, function() {
					$(this).hide();
				});
			}
		});

		newStatusMessage("Alienware Arena helper v<b>" + version + "</b></span>");
	}, 1);

	function options_save_apply() {
		actions_delay_min = parseInt($("#awah_actions_delay_min").val(), 10);
		actions_delay_max = parseInt($("#awah_actions_delay_max").val(), 10);
		show_key_on_marked_giveaways = $("#awah_show_key_on_marked_giveaways").prop("checked");
		// trick to apply show_key_on_marked_giveaways on the fly
		if (path == "/ucf/Giveaway") {
			awahTemp = $('<div class="tile-chunk"></div>');
			awahTemp.appendTo(".awah-options-overlay").delay(250).queue(function() {
				$(this).remove().dequeue();
			});
		}
		status_message_delay = parseInt($("#awah_status_message_delay").val(), 10);

		try {
			localStorage.setItem('awah_actions_delay_min', actions_delay_min);
			localStorage.setItem('awah_actions_delay_max', actions_delay_max);
			localStorage.setItem('awah_show_key_on_marked_giveaways', show_key_on_marked_giveaways.toString());
			localStorage.setItem('awah_status_message_delay', status_message_delay);
			newStatusMessage('Settings saved! <span class="fa fa-fw fa-floppy-o"></span>');
		} catch (e) {
			if (e == QUOTA_EXCEEDED_ERR) {
				newStatusMessage('localStorage quota exceeded! Try to clear browser\'s cache <span class="fa fa-fw fa-exclamation-triangle"></span>');
			}
		}
	}

	// ARP points watchdog
	$.ajaxPrefilter(function(options, originalOptions, jqXHR) {
		if (options.url.indexOf("vote") >= 0) {
			var originalSuccess = options.success;
			options.success = function(data) {
				/* ajaxBeforeSuccess functionality */
				if (data.votedForContent) {
					votes_content_cur++;
				}
				if (data.votedForContent === false) {
					votes_content_cur--;
				}
				if (!votes_content_action) {
					newStatusMessage(data.message);
					if (typeof data.upVotes !== 'undefined') {
						newStatusMessage('up: ' + data.upVotes + ' | down: ' + data.downVotes + (typeof data.voteTotal !== 'undefined' ? ' | total: ' + data.voteTotal : ''));
					}
				}
				arp_pts_status_update();
				/* ajaxBeforeSuccess functionality END */
				if (typeof originalSuccess === "function") {
					originalSuccess(data);
				}
			};
		}
	});

	function arp_pts_status_update() {
		$(".awah-arp-pts-con").html("CON: " + votes_content_cur + " / " + votes_content_max);
		if (votes_content_cur >= votes_content_max) {
			$(".awah-arp-pts-con").addClass("awah-grey");
		}
		if (votes_content_action) {
			$(".awah-con-check-queue-length").text(content_to_check.length);
			$(".awah-con-votes-queue-length").text(content_to_vote.length);
			var progress_bar_background = "linear-gradient(90deg, rgb(0, 160, 240) " +
				((votes_content_cur / votes_content_max) * 100) +
				"%, rgba(0, 160, 240, 0.2) 0%, rgba(0, 160, 240, 0.2) " +
				(((votes_content_cur + content_to_vote.length) / votes_content_max) * 100) +
				"%, rgb(255, 255, 255) 0%, rgb(255, 255, 255) " +
				((((votes_content_cur + content_to_vote.length) / votes_content_max) * 100) + 1 ) +
				"%, rgba(0, 160, 240, 0.2) 0%, rgba(0, 160, 240, 0.2) " +
				(((votes_content_cur + content_to_vote.length + content_to_check.length) / votes_content_max) * 100) +
				"%, rgb(40, 37, 36) 0%)";
			progress_bar_background = progress_bar_background.replace(/(\d{3}|\d{3}\.\d{1,})%/g,'100%'); // values greater than 100% can cause incorrect rendering
			$(".awah-arp-pts-con").css("background-image", progress_bar_background);
		}
	}

	function scrl(target) {
		$('html, body').animate({scrollTop: target.offset().top-100}, 800);
		//target.effect("highlight", "800");
	}

	function getRandomInt(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	function show_daily_reset_timer() {
		var awah_date_now = new Date();
		var awah_day_end = new Date(awah_date_now.getTime());
		awah_day_end.setUTCHours(23,59,59,999);
		var awah_day_remains = (awah_day_end.getTime() - awah_date_now.getTime());

		awah_day_remains = Math.floor(awah_day_remains / 1000);

		$(".toast-body table:eq(1) tbody").append('<tr><td><span class="fa fa-fw fa-clock-o"></span> Daily reset</td><td class="text-center awah-daily-reset-timer">hh:mm:ss</td><td class="pull-right"></td></tr>');

		awah_day_remains_interval = setInterval(function() {
			awah_day_remains--;
			//var secs = Math.floor(awah_day_remains / 1000);
			var secs = awah_day_remains;
			var hours = Math.floor(secs / 3600);
			secs -= hours * (3600);
			var mins = Math.floor(secs / 60);
			secs -= mins * (60);
			if (mins < 10) mins = "0" + mins;
			if (secs < 10) secs = "0" + secs;
			$(".awah-daily-reset-timer").text(hours + ":" + mins + ":" + secs);

			if (awah_day_remains < 1) {
				clearInterval(awah_day_remains_interval);
			}
		}, 1000);
	}

	// CON votes section
	function votes_content_apply() {
		var id = content_to_vote.shift();
		var url = "/ucf/vote/" + (voting_down ? 'down' : 'up') + "/" + id;

		$.ajax({
				url: url,
				type: 'post'
			})
			.done(function(data) {
				if (data.success) {
					// yay!
				}
			})
			.fail(function(data) {
				newStatusMessage('Vote apply failed! <span class="fa fa-fw fa-exclamation-triangle"></span>');
			})
			.always(function() {
				arp_pts_status_update();
				if (votes_content_cur < votes_content_max) {
					if (content_to_vote.length > 0) {
						setTimeout(() => votes_content_apply(), getRandomInt(actions_delay_min, actions_delay_max)); // recursion!
					} else {
						if (content_to_check.length > 0) {
							setTimeout(() => votes_content_is_voted(), getRandomInt(actions_delay_min, actions_delay_max)); // to the check!
						} else {
							setTimeout(() => votes_content_get_page(), getRandomInt(actions_delay_min, actions_delay_max)); // to the beginning!
						}
					}
				} else {
					votes_content_action = false;
					$(".awah-con-check-queue").delay(status_message_delay).queue(function() {
						$(this).addClass("awah-casper-out").dequeue();
					});
					$(".awah-con-votes-queue").delay(status_message_delay).queue(function() {
						$(this).addClass("awah-casper-out").dequeue();
					});
					setTimeout(() => $(".awah-arp-pts-con").css("background-image", ""), status_message_delay);
				}
			});
	}

	function votes_content_is_voted() {
		var content_item = content_to_check.shift();
		var id = content_item.id;
		$.get("/ucf/show/" + id)
			.done(function(response) {
				var votedOnContent = /var votedOnContent = (.+);/.exec(response);
				if (votedOnContent) {
					votedOnContent = JSON.parse(votedOnContent[1]);
					if (DEBUG) console.log("votedOnContent", votedOnContent);
					if (votedOnContent.downVote === false && votedOnContent.upVote === false) {
						content_to_vote.push(id);
					} else if (votedOnContent.downVote === true || votedOnContent.upVote === true) {
						// TODO: cache functions
						// check if cache has this id ()
						// add this id to cache ()
					}
				} else {
					newStatusMessage('Failed to parse status of ' + id + '! <span class="fa fa-fw fa-exclamation-triangle"></span>');
				}
			})
			.fail(function() {
				newStatusMessage('Failed to get status of ' + id + '! <span class="fa fa-fw fa-exclamation-triangle"></span>');
			})
			.always(function() {
				arp_pts_status_update();
				if (content_to_vote.length >= (votes_content_max - votes_content_cur)) {
					setTimeout(() => votes_content_apply(), getRandomInt(actions_delay_min, actions_delay_max)); // go to the next block!
				} else if (content_to_check.length > 0) {
					setTimeout(() => votes_content_is_voted(), getRandomInt(actions_delay_min, actions_delay_max)); // recursion!
				} else if (content_to_vote.length > 0) {
					setTimeout(() => votes_content_apply(), getRandomInt(actions_delay_min, actions_delay_max)); // go to the next block!
				} else {
					setTimeout(() => votes_content_get_page(), getRandomInt(actions_delay_min, actions_delay_max)); // to the beginning!
				}
			});
	}

	function votes_content_get_page(fail_counter = 0) {
		$.get(votes_content_url + content_page)
			.done(function(response) {
				if (response.data.length == 0) {
					//more = false;
					return; // TODO: make proper action stopping for "data.length == 0" case
				}
				content_page++;
				content_to_check.push(...response.data);
				if (DEBUG) console.log("content_to_check", content_to_check);
				if (content_to_check.length >= (votes_content_max - votes_content_cur)) {
					newStatusMessage('Enough content to check <span class="fa fa-fw fa-check-circle"></span>');
					setTimeout(() => votes_content_is_voted(), getRandomInt(actions_delay_min, actions_delay_max)); // go to the next block!
				} else {
					newStatusMessage('Need more content to check <span class="fa fa-fw fa-circle-o-notch fa-spin"></span>');
					setTimeout(() => votes_content_get_page(), getRandomInt(actions_delay_min, actions_delay_max)); // recursion!
				}
			})
			.fail(function() {
				fail_counter++;
				if (fail_counter < 5) {
					newStatusMessage('Failed to get content page! Trying again' + (fail_counter > 1  ? ' (' + fail_counter + ')' : '...') + ' <span class="fa fa-fw fa-exclamation-triangle"></span>');
					votes_content_get_page(fail_counter); // recursion!
				} else {
					newStatusMessage('Failed to get content page after ' + fail_counter + ' tries! Voting stopped! <span class="fa fa-fw fa-exclamation-triangle"></span>');
					votes_content_action = false;
					if (DEBUG) console.log("votes_content_url", votes_content_url, "content_page", content_page);
				}
			})
			.always(function() {
				arp_pts_status_update();
			});
	}

	function votes_content_algorithm() {
		$(".awah-con-check-queue").show();
		$(".awah-con-votes-queue").show();
		votes_content_action = true;
		votes_content_get_page();
	}

	function votes_content_register_buttons() {
		if (votes_content_cur >= votes_content_max) {
			$(".awah-btn-cons").addClass("disabled");
			return;
		}
		$(".awah-btn-cons").on("click", function() {
			$(".awah-btn-cons").addClass("disabled");
			if ($(this).data('awah-voting-direction') == "up") {
				voting_down = false;
			} else if ($(this).data('awah-voting-direction') == "down") {
				voting_down = true;
			}
			if ($(this).data('awah-content-url') != "") {
				votes_content_url = $(this).data('awah-content-url');
			} else {
				newStatusMessage('No content URL specified! Voting is impossible! <span class="fa fa-fw fa-exclamation-triangle"></span>');
				return;
			}
			votes_content_algorithm(); //start algorithm
		});
	}

	function votes_content_btn_featured(content_type = 'Image') {
		$('<div class="panel panel-default awah-panel">' +
			'<div class="panel-heading"><h3 class="panel-title"><i class="fa fa-wrench"></i> Alienware Arena helper</h3></div>' +
			'<div class="list-group">' +

			'<div class="list-group-item">' +
			'<div class="list-group-item-heading" data-awah-tooltip="The ones you see right here">Vote for featured ' + content_type + (content_type != 'News'  ? 's' : '') + '</div>' +
			'<a class="btn btn-default awah-btn-cons" href="javascript:void(0);" data-awah-tooltip="Make CON votes" data-awah-voting-direction="up" ' +
			'data-awah-content-url="/esi/featured-tile-data/' + content_type + '/">' +
			'<i class="fa fa-arrow-up"></i> <span class="hidden-xs">UP-votes</span></a>' +
			'<a class="btn btn-default awah-btn-cons" href="javascript:void(0);" data-awah-tooltip="Make CON votes" data-awah-voting-direction="down" ' +
			'data-awah-content-url="/esi/featured-tile-data/' + content_type + '/">' +
			'<i class="fa fa-arrow-down"></i> <span class="hidden-xs">DOWN-votes</span></a>' +
			'</div>' +

			'<div class="list-group-item"' + (content_type == 'News' ? 'style="display: none;"' : '') + '>' +
			'<div class="list-group-item-heading" data-awah-tooltip="Every ' + content_type + ' which uploaded to the Alienware Arena.\nExcluding ones that moved to \'featured\' list.\nSorting from fresh ones to old ones.">Vote for newly uploaded ' + content_type + (content_type != 'News'  ? 's' : '') + '</div>' +
			'<a class="btn btn-default awah-btn-cons" href="javascript:void(0);" data-awah-tooltip="Make CON votes" data-awah-voting-direction="up" ' +
			'data-awah-content-url="/esi/tile-data/' + content_type + '/">' +
			'<i class="fa fa-arrow-up"></i> <span class="hidden-xs">UP-votes</span></a>' +
			'<a class="btn btn-default awah-btn-cons" href="javascript:void(0);" data-awah-tooltip="Make CON votes" data-awah-voting-direction="down" ' +
			'data-awah-content-url="/esi/tile-data/' + content_type + '/">' +
			'<i class="fa fa-arrow-down"></i> <span class="hidden-xs">DOWN-votes</span></a>' +
			'</div>' +

			'</div>').insertAfter("div:has(.panel-default) > a:last-of-type");
		votes_content_register_buttons();

		if(DEBUG) $('<div class="list-group-item">' +
			'<a class="btn btn-default awah-btn-test" href="javascript:void(0);" data-awah-tooltip="At your own risk!">' +
			'<i class="fa fa-terminal"></i> <span class="hidden-xs">Make test</span></a></div>').appendTo(".awah-panel > .list-group");
		if(DEBUG) $(".awah-btn-test").on("click", function() {
			votes_content_cur = getRandomInt(5, 15);
			votes_content_action = true;
			content_to_check = new Array(votes_content_cur);
			content_to_vote = new Array(votes_content_cur);
			arp_pts_status_update();
			votes_content_action = false;
			content_to_check = new Array();
			content_to_vote = new Array();
		});
	}

	function votes_content_btn_profile() {
		$('<li>' +
			'<a class="btn btn-default awah-btn-cons" href="javascript:void(0);" data-awah-tooltip="Make CON votes" data-awah-voting-direction="up" ' +
			'data-awah-content-url="/esi/recent-activity-data/user/' + profileData.profile.id + '/">' +
			'<i class="fa fa-arrow-up"></i> <span class="hidden-xs">UP-votes</span></a>' +
			'<a class="btn btn-default awah-btn-cons" href="javascript:void(0);" data-awah-tooltip="Make CON votes" data-awah-voting-direction="down" ' +
			'data-awah-content-url="/esi/recent-activity-data/user/' + profileData.profile.id + '/">' +
			'<i class="fa fa-arrow-down"></i> <span class="hidden-xs">DOWN-votes</span></a>' +
			'</div>' +
			'</li>').appendTo(".list-profile-actions");
		votes_content_register_buttons();
	}

	// USER profile functions
	function show_user_steam_profile_link() {
		if (profileData.profile.steamId) {
			$('<li><a class="btn btn-default btn-block" href="//steamcommunity.com/profiles/' + profileData.profile.steamId + '" target="_blank" data-awah-tooltip="Open user\'s Steam profile in new tab"><span class="fa fa-fw fa-steam"></span> Open Steam profile</a></li>').appendTo(".list-profile-actions");
		}
	}

	// GIVEAWAY functions
	function show_available_keys() {
		//output prependTo(".content-container");
		//div#get-key-actions span.key-count
		if (typeof countryKeys !== 'undefined') {
			var keys_left = 0;
			var userCountryKeys = countryKeys[user_country];
			if (typeof userCountryKeys === "number") {
				keys_left = userCountryKeys;
			} else if (typeof userCountryKeys === "object") {
				for (var level in userCountryKeys) {
					if (userCountryKeys[level] > 0) {
						keys_left += userCountryKeys[level];
					}
				}
			}
			$("#giveaway-flash-message").after('<div class="well well-sm"><b>' + keys_left + '</b> keys left for <b>' + user_country + '</b> country</div>');
			setTimeout(function() {
				$('<div><b>' + keys_left + '</b> keys left for <b>' + user_country + '</b> country <span class="fa fa-fw fa-key"></span></div>').appendTo(".awah-arp-status");
			}, 1);
		}
	}

	function get_entered_giveaways() {
		document.head.appendChild(document.createElement('style')).innerHTML = ".tile-content:not(.awah-giveaway-taken) {box-shadow: 0px 0px 2px 1px rgb(0,160,240);}";
		// TODO: isnt it supposed to be attached only if keys data received ?

		var statusMessage = $('<div>Getting your giveaways info <span class="fa fa-fw fa-circle-o-notch fa-spin"></span></div>');
		statusMessage.delay(3000).queue(function() {
			$(this).appendTo(".awah-arp-status").dequeue();
		});

		$.getJSON("/giveaways/keys", function(data) {
			statusMessage.clearQueue()
				.html('<div>Getting your giveaways info <span class="fa fa-fw fa-check-circle"></span></div>')
				.delay(status_message_delay).queue(function() {
					$(this).addClass("awah-casper-out");
				});
			var awahGiveawayKeys = [];
			$.each(data, function(index, value) {
				awahGiveawayKeys[value.giveaway_id] = value;
			});
			if (DEBUG) console.log("awahGiveawayKeys", awahGiveawayKeys);
			mark_entered_giveaways(awahGiveawayKeys); // sometimes first giveaways page loaded before event registered
			document.addEventListener('animationstart', function(event) {
				if (event.animationName == "awah-new-tile-chunk-appears") {
					mark_entered_giveaways(awahGiveawayKeys);
				}
			}, false);
		}).fail(function() {
			statusMessage.html('<div>Getting your giveaways info <span class="fa fa-fw fa-exclamation-triangle"></span></div>')
				.delay(status_message_delay).queue(function() {
					$(this).addClass("awah-casper-out").dequeue();
				});
		});
	}

	function mark_entered_giveaways(awahGiveawayKeys) {
		$("a.Giveaway").each(function() {
			var awahGiveawayID = /\/ucf\/show\/([\d]+)/.exec($(this).prop("href"));
			awahGiveawayID = awahGiveawayID[1];
			if (typeof awahGiveawayKeys[awahGiveawayID] === "object") {
				$(this).parent().addClass("awah-giveaway-taken");
				awahlabel = '✔\nTAKEN AT: ' + awahGiveawayKeys[awahGiveawayID].assigned_at;
				if (show_key_on_marked_giveaways) awahlabel += '\n            KEY: ' + awahGiveawayKeys[awahGiveawayID].value;
				$(this).attr("awahlabel", awahlabel);
			}
		});
	}

	switch (true) {
		case /.*\/ucf\/show\/.*/.test(path):
			if(DEBUG) console.log("SWITCH: Content");
			// <meta property="og:url" content="https://eu.alienwarearena.com/ucf/show/1592462/boards/contest-and-giveaways-global/Giveaway/rising-storm-2-vietnam-closed-beta-key-giveaway" />
			var og_url = $('meta[property="og:url"]').attr("content");
			switch (true) {
				case /.*\/boards\/this-or-that\/.*/.test(path):
				case /.*\/boards\/this-or-that\/.*/.test(og_url):
					if(DEBUG) console.log("SWITCH: This or That");
					// this_or_that_btn();
					break;
				case /^\/ucf\/show\/.*\/Giveaway\//.test(path):
				case /\/ucf\/show\/.*\/Giveaway\//.test(og_url):
					if(DEBUG) console.log("SWITCH: Giveaway");
					show_available_keys();
					break;
			}
			break;
		case /^\/ucf\/Giveaway$/.test(path):
			if(DEBUG) console.log("SWITCH: Giveaways list");
			get_entered_giveaways();
			break;
		case /^\/ucf\/Image$/.test(path):
			if(DEBUG) console.log("SWITCH: Featured images page");
			votes_content_btn_featured('Image');
			break;
		case /^\/ucf\/Video$/.test(path):
			if(DEBUG) console.log("SWITCH: Featured videos page");
			votes_content_btn_featured('Video');
			break;
		case /^\/ucf\/News$/.test(path):
			if(DEBUG) console.log("SWITCH: Featured news page");
			votes_content_btn_featured('News');
			break;
		case /^\/member\/.*$/.test(path):
			if(DEBUG) console.log("SWITCH: user profile page");
			votes_content_btn_profile();
			show_user_steam_profile_link();
			break;
		case /\/$/.test(url):
			if(DEBUG) console.log("SWITCH: main page");
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
