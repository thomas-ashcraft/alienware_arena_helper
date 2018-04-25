// ==UserScript==
// @name         Alienware Arena helper
// @namespace    https://github.com/thomas-ashcraft
// @version      0.5.6
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
	var version = "0.5.6";
	var DEBUG = false; // Developer option. Default: false

	var statusMessageDelayDefault	= 5000;
	var actionsDelayMinDefault		= 1000;
	var actionsDelayMaxDefault		= 5000;
	var showKeyOnMarkedGiveawaysDefault = "true";

	var actionsDelayMin		= parseInt(localStorage.getItem("awah_actions_delay_min"), 10) || actionsDelayMinDefault;
	var actionsDelayMax		= parseInt(localStorage.getItem("awah_actions_delay_max"), 10) || actionsDelayMaxDefault;
	localStorage.removeItem("awah_tot_add_votes_min"); // fix legacy
	localStorage.removeItem("awah_tot_add_votes_max"); // fix legacy
	var showKeyOnMarkedGiveaways = localStorage.getItem("awah_show_key_on_marked_giveaways") || showKeyOnMarkedGiveawaysDefault;
	showKeyOnMarkedGiveaways = (showKeyOnMarkedGiveaways === "true");
	var statusMessageDelay = parseInt(localStorage.getItem("awah_status_message_delay"), 10) || statusMessageDelayDefault;
	var votedContentCache = new Set(JSON.parse(localStorage.getItem("awahVotedContentCache")));

	var url = window.location.href;
	var path = window.location.pathname;
	path = path.replace(/\/+/g, "/");

	// ARP points initial readings
	let readPoints = /Vote on Content(?:.|\n)*>(\d+) of (\d+)<\/td>/.exec($("head").html());
	var currentContentVotes = parseInt(readPoints[1], 10);
	var maximumContentVotes = parseInt(readPoints[2], 10);
	var contentVotingInAction = false;
	var contentVotingURL = "";
	var contentToVote = [];
	var contentToCheck = [];
	var contentGettingPage = 1;
	var votingDown = false;
	var saveOptionsTimer;

	// Embed style
	var helperStyle = `
		/* script buttons */
		.awah-btn-cons,
		.awah-btn-cons:hover {color: gold;}
		.list-group-item > .awah-btn-cons {width: 50%;}
		.list-profile-actions > li > .awah-btn-cons {width: 50%; border-color: rgba(0, 0, 0, .6);}
		.awah-btn-cons.disabled::before {content: ''; width: 100%; height: 100%; position: absolute; top: 0; left: 0; background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACAQMAAABIeJ9nAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABlBMVEUAAAAAAAClZ7nPAAAAAXRSTlMAQObYZgAAAAFiS0dEAIgFHUgAAAAJcEhZcwAACxIAAAsSAdLdfvwAAAAMSURBVAjXY2hgYAAAAYQAgSjdetcAAAAASUVORK5CYII=');}
		.awah-panel {margin: 20px 0;}

		[data-awah-tooltip] {position: relative;}
		[data-awah-tooltip]:after {content: attr(data-awah-tooltip); pointer-events: none; padding: 4px 8px; color: white; position: absolute; left: 0; bottom: 0%; opacity: 0; font-weight: normal; text-transform: none; font-size: smaller; white-space: pre; box-shadow: 0px 0px 3px 0px #54bbdb; background-color: #0e0e0e; transition: opacity 0.25s ease-out, bottom 0.25s ease-out; z-index: 1000;}
		[data-awah-tooltip]:hover:after {bottom: 115%; opacity: 1;}

		/* script GUI */
		#arp-toast .toast-header {overflow: visible !important;}
		.awah-ui-overlay {clear: both; font-size: smaller !important; pointer-events: none; position: absolute; bottom: 102%; right: 0; min-width: 100%; padding: inherit; text-shadow: 2px 2px 2px rgb(0, 0, 0), -1px -1px 2px rgb(0, 0, 0), 2px 2px 5px rgb(0, 0, 0), -1px -1px 5px rgb(0, 0, 0), 0px 0px 10px rgb(0, 0, 0); text-align: right; background: rgba(0, 0, 0, 0) linear-gradient(to right bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.85) 85%, rgba(0, 0, 0, 0.85) 100%) no-repeat scroll 0 0;}
		.awah-arp-status {float: right; clear: both; white-space: nowrap; border-bottom: 1px solid #1c1e22;}
		.awah-arp-status > div {clear: both; position: relative; animation: awah-slide-from-bottom 0.25s ease-out 1 forwards;}
		.awah-arp-pts {clear: both; width: 100%}
		.awah-arp-pts > div {clear: both; width: 100%; background-position: 50% 50%; background-repeat: no-repeat; background-size: 100% 14px;}
		.awah-arp-pts > div::after {content: ""; display: block; height: 0; clear: both;}
		.awah-grey {color: #767676;}
		.awah-casper-out {overflow: hidden !important; animation: awah-casper-out 0.6s ease-in !important;}

		.awah-daily-reset-timer {min-width: 22%;}
		.toast-body table tbody > :nth-child(2n) {background: #090909}

		/* script options */
		.awah-options-btn {float: left; padding-left: 16px; cursor: pointer; transition: text-shadow 0.25s ease-in-out;}
		.awah-options-btn:hover {text-shadow: 0px 0px 3px rgba(75, 201, 239, 1), 0px 0px 12px rgba(75, 201, 239, 1); /* animation: awah-breathing-text-neon 2s ease 0s infinite alternate; */}
		.awah-options-overlay {overflow: auto; float: left; clear: both; position: absolute; bottom: 0; right: calc(100% + 1px); height: 100%; width: 100%; padding: 0 11px; text-shadow: 2px 2px 2px rgb(0, 0, 0), -1px -1px 2px rgb(0, 0, 0); text-align: right; background: rgba(0, 0, 0, 0.85) repeat scroll 0 0; box-shadow: 0px 0px 3px 0px #54bbdb;}
		.awah-options-title {font-size: 16px; padding: 11px 0;}
		.awah-option {border-bottom: 1px solid #1c1e22; margin: 11px 0;}
		.awah-option::after {content: ""; display: block; height: 0; clear: both;}
		.awah-option label {width: 100%; margin: 0; position: relative;}
		.awah-option > * {clear: both;}
		.awah-opt-title {float: left; /* line-height: 38px; */}
		.awah-opt-input {float: right; width: 24%; text-align: right; padding: 0 5px; height: auto; background: transparent; color: white; border-width: 0px 1px 1px 0px;}
		.awah-opt-desc {float: right; font-size: smaller;}
		.awah-option > .btn-danger {width: 100%;}
		input.awah-opt-input[type="checkbox"] {/* display: none; */ position: absolute; right: 0; opacity: 0;}
		input.awah-opt-input[type="checkbox"]:focus + div {border-color: #66afe9; outline: 0; -webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075), 0 0 8px rgba(102, 175, 233, 0.6); box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075), 0 0 8px rgba(102, 175, 233, 0.6);}
		.awah-opt-input[type="checkbox"] + div {transition: 0.25s all ease; position: relative; overflow: hidden;}
		.awah-opt-input[type="checkbox"] + div > div {transition: 0.25s all ease; background-color: #428bca; width: 50%; position: absolute; left: 0;}
		input.awah-opt-input[type="checkbox"]:checked + div {background-color: rgb(66, 139, 202, 0.4);}
		input.awah-opt-input[type="checkbox"]:checked + div > div {left: calc(100% - 50%);}
		.awah-opt-input[type="checkbox"] + div > div::before {content: 'ON'; position: absolute; right: 120%;}
		.awah-opt-input[type="checkbox"] + div > div::after {content: 'OFF'; color: #767676; position: absolute; left: 120%;}

		/* Giveaways page */
		div.tile-content.awah-giveaway-taken a.Giveaway::before {content: attr(awahlabel); font-family: inherit; font-weight: 700; white-space: pre; overflow: hidden; width: 100%; height: 100%; text-shadow: 2px 2px 2px rgb(0, 0, 0), -1px -1px 2px rgb(0, 0, 0), 2px 2px 5px rgb(0, 0, 0), -1px -1px 5px rgb(0, 0, 0), 0px 0px 10px rgb(0, 0, 0); background-color: rgba(0, 0, 0, 0); background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACAQMAAABIeJ9nAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABlBMVEUAAAAAAAClZ7nPAAAAAXRSTlMAQObYZgAAAAFiS0dEAIgFHUgAAAAJcEhZcwAACxIAAAsSAdLdfvwAAAAMSURBVAjXY2hgYAAAAYQAgSjdetcAAAAASUVORK5CYII=');}
		div.tile-content.awah-giveaway-taken:not(:hover) {opacity: 0.2; transition: opacity 0.25s ease-in-out;}

		/* comments */
		.insignia-label::before {
			content: attr(data-arp-level);
			font-size: 10px;
			width: 35px; /* 30 for master */
			line-height: 30px; /* 26 for master */
			position: absolute;
			text-align: center;
			pointer-events: none;
		}

		@keyframes awah-slide-from-bottom {
			from {opacity: 0.5; bottom: -90px; max-height: 0px;}
			to {opacity: 1; bottom: 0px; max-height: 50px;}
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
	document.head.appendChild(document.createElement("style")).textContent = helperStyle;

	function pointsStatusUpdate() {
		$(".awah-arp-pts-con").html("CON: " + currentContentVotes + " / " + maximumContentVotes);
		if (currentContentVotes >= maximumContentVotes && !contentVotingInAction) {
			$(".awah-arp-pts-con").addClass("awah-grey");
		}
		if (contentVotingInAction) {
			$(".awah-con-check-queue-length").text(contentToCheck.length);
			$(".awah-con-votes-queue-length").text(contentToVote.length);
			var progressBarBackground = "linear-gradient(90deg, rgb(0, 160, 240) " +
				((currentContentVotes / maximumContentVotes) * 100) +
				"%, rgba(0, 160, 240, 0.2) 0%, rgba(0, 160, 240, 0.2) " +
				(((currentContentVotes + contentToVote.length) / maximumContentVotes) * 100) +
				"%, rgb(255, 255, 255) 0%, rgb(255, 255, 255) " +
				((((currentContentVotes + contentToVote.length) / maximumContentVotes) * 100) + 1 ) +
				"%, rgba(0, 160, 240, 0.2) 0%, rgba(0, 160, 240, 0.2) " +
				(((currentContentVotes + contentToVote.length + contentToCheck.length) / maximumContentVotes) * 100) +
				"%, rgb(40, 37, 36) 0%)";
			progressBarBackground = progressBarBackground.replace(/(\d{3}|\d{3}\.\d{1,})%/g, "100%"); // values greater than 100% can cause incorrect rendering
			$(".awah-arp-pts-con").css("background-image", progressBarBackground);
		}
	}

	function newStatusMessage(statusMessageText) {
		var statusMessageObj = $("<div>" + statusMessageText + "</div>");
		statusMessageObj.appendTo(".awah-arp-status")
			.delay(statusMessageDelay).queue(function() {
				$(this).addClass("awah-casper-out").dequeue();
			});
		return statusMessageObj;
	}

	function saveOptions() {
		actionsDelayMin = parseInt($("#awah_actions_delay_min").val(), 10);
		actionsDelayMax = parseInt($("#awah_actions_delay_max").val(), 10);
		showKeyOnMarkedGiveaways = $("#awah_show_key_on_marked_giveaways").prop("checked");
		// trick to apply showKeyOnMarkedGiveaways on the fly
		if (path == "/ucf/Giveaway") {
			awahTemp = $('<div class="tile-chunk"></div>');
			awahTemp.appendTo(".awah-options-overlay").delay(250).queue(function() {
				$(this).remove().dequeue();
			});
		}
		statusMessageDelay = parseInt($("#awah_status_message_delay").val(), 10);

		try {
			localStorage.setItem('awah_actions_delay_min', actionsDelayMin);
			localStorage.setItem('awah_actions_delay_max', actionsDelayMax);
			localStorage.setItem('awah_show_key_on_marked_giveaways', showKeyOnMarkedGiveaways.toString());
			localStorage.setItem('awah_status_message_delay', statusMessageDelay);
			newStatusMessage('Settings saved! <span class="fa fa-fw fa-floppy-o"></span>');
		} catch (e) {
			if (e == QUOTA_EXCEEDED_ERR) {
				newStatusMessage('localStorage quota exceeded! <span class="fa fa-fw fa-exclamation-triangle"></span>');
			}
		}
	}

	function saveVotedContentCache() {
		try {
			localStorage.setItem('awahVotedContentCache', JSON.stringify([...votedContentCache]));
			$("#awah_voted_content_cache_size").text(votedContentCache.size);
		} catch (e) {
			if (e == QUOTA_EXCEEDED_ERR) {
				newStatusMessage('localStorage quota exceeded! <span class="fa fa-fw fa-exclamation-triangle"></span>');
			}
		}
	}

	function showDailyResetTimer() {
		var awahDateNow = new Date();
		var awahDayEnd = new Date(awahDateNow.getTime());
		awahDayEnd.setUTCHours(23,59,59,999);
		var awahDayRemains = (awahDayEnd.getTime() - awahDateNow.getTime());

		awahDayRemains = Math.floor(awahDayRemains / 1000);

		$(".toast-body table:eq(1) tbody").append('<tr><td><span class="fa fa-fw fa-clock-o"></span> Daily reset</td><td class="text-center awah-daily-reset-timer">hh:mm:ss</td><td class="pull-right"></td></tr>');

		awahDayRemainsInterval = setInterval(function() {
			awahDayRemains--;
			//var secs = Math.floor(awahDayRemains / 1000);
			var secs = awahDayRemains;
			var hours = Math.floor(secs / 3600);
			secs -= hours * (3600);
			var mins = Math.floor(secs / 60);
			secs -= mins * (60);
			if (mins < 10) mins = "0" + mins;
			if (secs < 10) secs = "0" + secs;
			$(".awah-daily-reset-timer").text(hours + ":" + mins + ":" + secs);

			if (awahDayRemains < 1) {
				clearInterval(awahDayRemainsInterval);
			}
		}, 1000);
	}

	// initialize UI
	setTimeout(function() {
		$("div.toast-header").append('<div class="awah-ui-overlay"><div class="awah-arp-status awah-grey"></div><div class="awah-arp-pts"><div class="awah-arp-pts-con"></div></div></div>');
		if (currentContentVotes < maximumContentVotes) {
			$('<div class="awah-con-check-queue" style="display: none;">content to check: <span class="awah-con-check-queue-length">' + contentToCheck.length + '</span> <span class="fa fa-fw fa-search"></span></div>').appendTo(".awah-arp-status");
			$('<div class="awah-con-votes-queue" style="display: none;">content to vote: <span class="awah-con-votes-queue-length">' + contentToVote.length + '</span> <span class="fa fa-fw fa-upload"></span></div>').appendTo(".awah-arp-status");
		}
		pointsStatusUpdate();
		$("div.toast-body > p.text-center").css({ "float": "right", "padding-right": "16px" });
		$("div.toast-body").append('<p class="awah-options-btn"><span class="fa fa-fw fa-cog"></span> HELPER OPTIONS</p>');
		$("div.toast-body").prepend('<div class="awah-options-overlay" style="display: none; bottom: -102%;"><div class="awah-option"><span class="awah-opt-desc awah-grey">AWA helper v<b>' + version + '</b></span></div>' +
			'<div class="awah-option">' +
			'<label><span class="awah-opt-title">actionsDelayMin</span><input id="awah_actions_delay_min" class="form-control awah-opt-input" type="text" value="' + actionsDelayMin + '"></label>' +
			'<label><span class="awah-opt-title">actionsDelayMax</span><input id="awah_actions_delay_max" class="form-control awah-opt-input" type="text" value="' + actionsDelayMax + '"></label>' +
			'<span class="awah-opt-desc awah-grey">Minimum and maximum random delay time between net actions. (in milliseconds)<br>Default minimum: ' + actionsDelayMinDefault + ' || Default maximum: ' + actionsDelayMaxDefault + '</span></div>' +

			'<div class="awah-option">' +
			'<label><span class="awah-opt-title">showKeyOnMarkedGiveaways</span><input id="awah_show_key_on_marked_giveaways" class="form-control awah-opt-input" type="checkbox" ' + (showKeyOnMarkedGiveaways ? 'checked' : '') + '><div class="form-control awah-opt-input"><div>&nbsp;</div>&nbsp;</div></label>' +
			'<span class="awah-opt-desc awah-grey">At Giveaways page. Default: ' + (showKeyOnMarkedGiveawaysDefault === "true" ? 'ON' : 'OFF') + '</span></div>' +

			'<div class="awah-option">' +
			'<label><span class="awah-opt-title">statusMessageDelay</span><input id="awah_status_message_delay" class="form-control awah-opt-input" type="text" value="' + statusMessageDelay + '"></label>' +
			'<span class="awah-opt-desc awah-grey">How long the status messages will be displayed before they disappear. (in milliseconds, 1000 = 1 second)<br>Default: ' + statusMessageDelayDefault + '</span></div>' +

			'<div class="awah-option">' +
			'<button id="awah_restore_default" class="btn btn-danger"><span class="fa fa-exclamation-triangle"></span> Restore default</button>' +
			'<span class="awah-opt-desc awah-grey">Restore default settings.</span></div>' +

			'<div class="awah-option">' +
			'<label><span class="awah-opt-title">Voted content cahed</span><span id="awah_voted_content_cache_size" class="form-control awah-opt-input">' + votedContentCache.size + '</span></label>' +
			'<button id="awah_clear_voted_content_cache" class="btn btn-danger"><span class="fa fa-exclamation-triangle"></span> Clear voted content cache</button>' +
			'<span class="awah-opt-desc awah-grey">Use only in case of emergency.</span></div>' +
			'</div>');
		showDailyResetTimer();

		document.addEventListener('animationend', function(event) {
			if (event.animationName === "awah-casper-out") {
				$(event.target).remove();
			}
		}, false);

		$('input.awah-opt-input[type="text"]').on("input", function() {
			this.value=this.value.replace(/[^\d]/,'');
			this.value=this.value.slice(0, 5);
		});

		$("input.awah-opt-input").on("change", function() {
			clearTimeout(saveOptionsTimer);
			saveOptionsTimer = setTimeout(function() {
				saveOptions();
			}, 400);
		});

		$("#awah_restore_default").on("click", function() {
			$("#awah_actions_delay_min").val(actionsDelayMinDefault);
			$("#awah_actions_delay_max").val(actionsDelayMaxDefault);
			$("#awah_show_key_on_marked_giveaways").prop("checked", (showKeyOnMarkedGiveawaysDefault === "true"));
			$("#awah_status_message_delay").val(statusMessageDelayDefault);
			newStatusMessage('Default options settings restored!');
			saveOptions();
		});

		$("#awah_clear_voted_content_cache").on("click", function() {
			votedContentCache.clear();
			saveVotedContentCache();
			newStatusMessage('Voted content cache cleared!');
		});

		$(".awah-options-btn").on("click", function() {
			var awahOptions = $(".awah-options-overlay");
			if(awahOptions.css("display") === "none") {
				awahOptions.show();
				awahOptions.stop().animate({bottom: "0%"}, 250);
			} else {
				awahOptions.stop().animate({bottom: "-102%"}, 250, function() {
					$(this).hide();
				});
			}
		});

		newStatusMessage("Alienware Arena helper v<b>" + version + "</b></span>");
	}, 1);

	// ARP points watchdog
	$.ajaxPrefilter(function(options, originalOptions, jqXHR) {
		if (options.url.indexOf("vote") >= 0) {
			var originalSuccess = options.success;
			options.success = function(data) {
				/* ajaxBeforeSuccess functionality */
				var contentId = parseInt(this.url.replace(/\/ucf\/vote\/(?:up|down)\/(\d*)/g, "$1"), 10);
				if (data.votedForContent === true) {
					currentContentVotes++;
					votedContentCache.add(contentId);
					saveVotedContentCache();
				} else if (data.votedForContent === false) {
					currentContentVotes--;
					votedContentCache.delete(contentId);
					saveVotedContentCache();
				} else if (data.message.indexOf("already voted") >= 0) {
					votedContentCache.add(contentId);
					saveVotedContentCache();
				}
				if (!contentVotingInAction) {
					newStatusMessage(data.message);
					if (typeof data.upVotes !== 'undefined') {
						newStatusMessage('up: ' + data.upVotes + ' | down: ' + data.downVotes + (typeof data.voteTotal !== 'undefined' ? ' | total: ' + data.voteTotal : ''));
					}
				}
				pointsStatusUpdate();
				/* ajaxBeforeSuccess functionality END */
				if (typeof originalSuccess === "function") {
					originalSuccess(data);
				}
			};
		}
	});

	function scrl(target) {
		$('html, body').animate({scrollTop: target.offset().top-100}, 800);
		//target.effect("highlight", "800");
	}

	function getRandomInt(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	// CON votes section
	function applyContentVoting() {
		var contentId = contentToVote.shift();
		var url = "/ucf/vote/" + (votingDown ? 'down' : 'up') + "/" + contentId;

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
				pointsStatusUpdate();
				if (currentContentVotes < maximumContentVotes) {
					if (contentToVote.length > 0) {
						setTimeout(() => applyContentVoting(), getRandomInt(actionsDelayMin, actionsDelayMax)); // recursion!
					} else {
						if (contentToCheck.length > 0) {
							setTimeout(() => checkVotingContent(), getRandomInt(actionsDelayMin, actionsDelayMax)); // to the check!
						} else {
							newStatusMessage('Going to look for more content <span class="fa fa-fw fa-eye"></span>');
							setTimeout(() => getVotingContentPage(), getRandomInt(actionsDelayMin, actionsDelayMax)); // to the beginning!
						}
					}
				} else {
					contentVotingInAction = false;
					setTimeout(() => {
						$(".awah-con-check-queue").addClass("awah-casper-out");
						$(".awah-con-votes-queue").addClass("awah-casper-out");
						$(".awah-arp-pts-con").css("background-image", "");
						$(".awah-arp-pts-con").addClass("awah-grey");
					}, statusMessageDelay);
				}
			});
	}

	function checkVotingContent() {
		var contentItem = contentToCheck.shift();
		var contentId = contentItem.id;
		$.get("/ucf/show/" + contentId)
			.done(function(response) {
				var votedOnContent = /var votedOnContent = (.+);/.exec(response);
				if (votedOnContent) {
					votedOnContent = JSON.parse(votedOnContent[1]);
					if (DEBUG) console.log("votedOnContent", votedOnContent);
					if (votedOnContent.downVote === false && votedOnContent.upVote === false) {
						contentToVote.push(contentId);
					} else if (votedOnContent.downVote === true || votedOnContent.upVote === true) {
						votedContentCache.add(contentId);
						saveVotedContentCache();
					}
				} else {
					newStatusMessage('Failed to parse status of ' + contentId + '! <span class="fa fa-fw fa-exclamation-triangle"></span>');
				}
			})
			.fail(function() {
				newStatusMessage('Failed to get status of ' + contentId + '! <span class="fa fa-fw fa-exclamation-triangle"></span>');
			})
			.always(function() {
				pointsStatusUpdate();
				if (contentToCheck.length == 0 && contentToVote.length == 0) {
					newStatusMessage('Going to look for more content <span class="fa fa-fw fa-eye"></span>');
					setTimeout(() => getVotingContentPage(), getRandomInt(actionsDelayMin, actionsDelayMax)); // to the beginning!
				} else if (contentToVote.length >= (maximumContentVotes - currentContentVotes) ||
					(contentToVote.length > 0 && contentToCheck.length == 0)) {
					newStatusMessage('Going to vote <span class="fa fa-fw fa-forward"></span>');
					setTimeout(() => applyContentVoting(), getRandomInt(actionsDelayMin, actionsDelayMax)); // go to the next block!
				} else if (contentToCheck.length > 0) {
					setTimeout(() => checkVotingContent(), getRandomInt(actionsDelayMin, actionsDelayMax)); // recursion!
				}
			});
	}

	function getVotingContentPage(failCounter = 0) {
		var statusMessage = newStatusMessage(`Getting page ${contentGettingPage} <span class="fa fa-fw fa-circle-o-notch fa-spin"></span>`);
		statusMessage.clearQueue();
		$.get(contentVotingURL + contentGettingPage)
			.done(function(response) {
				failCounter = 0;
				statusMessage.children("span").attr('class', 'fa fa-fw fa-check-circle');
				statusMessage.delay(statusMessageDelay).queue(function() {
					$(this).addClass("awah-casper-out");
				});
				if (response.data.length == 0) {
					newStatusMessage(`No more content pages left in this section <span class="fa fa-fw fa-times-circle"></span>`);
				} else {
					contentGettingPage++;
					contentToCheck.push(...response.data);
					contentToCheck = contentToCheck.filter(f => !votedContentCache.has(f.id));
					if (DEBUG) console.log("contentToCheck", contentToCheck);
				}
			})
			.fail(function() {
				failCounter++;
				statusMessage.children("span").attr('class', 'fa fa-fw fa-exclamation-triangle');
				statusMessage.delay(statusMessageDelay).queue(function() {
					$(this).addClass("awah-casper-out");
				});
			})
			.always(function(response, textStatus) {
				pointsStatusUpdate();
				// .fail
				if (failCounter > 0 && failCounter < 5) {
					newStatusMessage(`Failed to get content page! Trying again${failCounter > 1 ? ` (${failCounter})` : '...'} <span class="fa fa-fw fa-exclamation-triangle"></span>`);
					setTimeout(() => getVotingContentPage(failCounter), getRandomInt(actionsDelayMin, actionsDelayMax)); // recursion!
				} else {
					if (failCounter > 0) {
						newStatusMessage(`Failed to get content page after ${failCounter} tries! <span class="fa fa-fw fa-exclamation-triangle"></span>`);
					}
					// .done
					if (contentToCheck.length >= (maximumContentVotes - currentContentVotes) ||
						((textStatus == "error" ? true : response.data.length == 0) && contentToCheck.length > 0)) {
						newStatusMessage('Going to check content <span class="fa fa-fw fa-forward"></span>');
						setTimeout(() => checkVotingContent(), getRandomInt(actionsDelayMin, actionsDelayMax)); // go to the next block!
					} else if (failCounter == 0 && (textStatus == "error" ? true : response.data.length > 0)) {
						setTimeout(() => getVotingContentPage(), getRandomInt(actionsDelayMin, actionsDelayMax)); // recursion!
					} else {
						newStatusMessage(`Voting stopped!`);
						contentVotingInAction = false;
					}
				}
			});
	}

	function startContentVotingAlgorithm() {
		$(".awah-con-check-queue").show();
		$(".awah-con-votes-queue").show();
		contentVotingInAction = true;
		getVotingContentPage();
	}

	function registerContentVotingButtons() {
		if (currentContentVotes >= maximumContentVotes) {
			$(".awah-btn-cons").addClass("disabled");
			return;
		}
		$(".awah-btn-cons").on("click", function() {
			$(".awah-btn-cons").addClass("disabled");
			if ($(this).data('awah-voting-direction') == "up") {
				votingDown = false;
			} else if ($(this).data('awah-voting-direction') == "down") {
				votingDown = true;
			}
			if ($(this).data('awah-content-url') != "") {
				contentVotingURL = $(this).data('awah-content-url');
			} else {
				newStatusMessage('No content URL specified! Voting is impossible! <span class="fa fa-fw fa-exclamation-triangle"></span>');
				return;
			}
			startContentVotingAlgorithm();
		});
	}

	function showFeaturedContentVotingButtons(content_type = 'Image') {
		$('<div class="panel panel-default awah-panel">' +
			'<div class="panel-heading"><h3 class="panel-title"><i class="fa fa-wrench"></i> Alienware Arena helper</h3></div>' +
			'<div class="list-group">' +

			'<div class="list-group-item">' +
			'<div class="list-group-item-heading" data-awah-tooltip="The ones you see right here">Vote for featured ' + content_type + (content_type != 'News'  ? 's' : '') + '</div>' +
			'<a class="btn btn-default awah-btn-cons" href="javascript:void(0);" data-awah-tooltip="Automatic voting" data-awah-voting-direction="up" ' +
			'data-awah-content-url="/esi/featured-tile-data/' + content_type + '/">' +
			'<i class="fa fa-arrow-up"></i> <span class="hidden-xs">UP-votes</span></a>' +
			'<a class="btn btn-default awah-btn-cons" href="javascript:void(0);" data-awah-tooltip="Automatic voting" data-awah-voting-direction="down" ' +
			'data-awah-content-url="/esi/featured-tile-data/' + content_type + '/">' +
			'<i class="fa fa-arrow-down"></i> <span class="hidden-xs">DOWN-votes</span></a>' +
			'</div>' +

			'<div class="list-group-item"' + (content_type == 'News' ? 'style="display: none;"' : '') + '>' +
			'<div class="list-group-item-heading" data-awah-tooltip="Every ' + content_type + ' which uploaded to the Alienware Arena.\nExcluding ones that moved to \'featured\' list.\nSorting from fresh ones to old ones.">Vote for newly uploaded ' + content_type + (content_type != 'News'  ? 's' : '') + '</div>' +
			'<a class="btn btn-default awah-btn-cons" href="javascript:void(0);" data-awah-tooltip="Automatic voting" data-awah-voting-direction="up" ' +
			'data-awah-content-url="/esi/tile-data/' + content_type + '/">' +
			'<i class="fa fa-arrow-up"></i> <span class="hidden-xs">UP-votes</span></a>' +
			'<a class="btn btn-default awah-btn-cons" href="javascript:void(0);" data-awah-tooltip="Automatic voting" data-awah-voting-direction="down" ' +
			'data-awah-content-url="/esi/tile-data/' + content_type + '/">' +
			'<i class="fa fa-arrow-down"></i> <span class="hidden-xs">DOWN-votes</span></a>' +
			'</div>' +

			'</div>').insertAfter("div:has(.panel-default) > a:last-of-type");
		registerContentVotingButtons();

		if(DEBUG) $('<div class="list-group-item">' +
			'<a class="btn btn-default awah-btn-test" href="javascript:void(0);" data-awah-tooltip="At your own risk!">' +
			'<i class="fa fa-terminal"></i> <span class="hidden-xs">Make test</span></a></div>').appendTo(".awah-panel > .list-group");
		if(DEBUG) $(".awah-btn-test").on("click", function() {
			currentContentVotes = getRandomInt(5, 15);
			contentVotingInAction = true;
			contentToCheck = new Array(currentContentVotes);
			contentToVote = new Array(currentContentVotes);
			pointsStatusUpdate();
			contentVotingInAction = false;
			contentToCheck = new Array();
			contentToVote = new Array();
		});
	}

	function showProfileContentVotingButtons() {
		$('<li>' +
			'<a class="btn btn-default awah-btn-cons" href="javascript:void(0);" data-awah-tooltip="Automatic voting" data-awah-voting-direction="up" ' +
			'data-awah-content-url="/esi/recent-activity-data/user/' + profileData.profile.id + '/">' +
			'<i class="fa fa-arrow-up"></i> <span class="hidden-xs">UP-votes</span></a>' +
			'<a class="btn btn-default awah-btn-cons" href="javascript:void(0);" data-awah-tooltip="Automatic voting" data-awah-voting-direction="down" ' +
			'data-awah-content-url="/esi/recent-activity-data/user/' + profileData.profile.id + '/">' +
			'<i class="fa fa-arrow-down"></i> <span class="hidden-xs">DOWN-votes</span></a>' +
			'</div>' +
			'</li>').appendTo(".list-profile-actions");
		registerContentVotingButtons();
	}

	// USER profile functions
	function showUserSteamProfileLink() {
		if (profileData.profile.steamId) {
			$('<li><a class="btn btn-default btn-block" href="//steamcommunity.com/profiles/' + profileData.profile.steamId + '" target="_blank" data-awah-tooltip="Open user\'s Steam profile in new tab"><span class="fa fa-fw fa-steam"></span> Open Steam profile</a></li>').appendTo(".list-profile-actions");
		}
	}

	// GIVEAWAY functions
	function showAvailableKeys() {
		//output prependTo(".content-container");
		//div#get-key-actions span.key-count
		if (typeof countryKeys !== 'undefined') {
			var keysLeft = 0;
			var userCountryKeys = countryKeys[user_country];
			if (typeof userCountryKeys === "number") {
				keysLeft = userCountryKeys;
			} else if (typeof userCountryKeys === "object") {
				for (var level in userCountryKeys) {
					if (userCountryKeys[level] > 0) {
						keysLeft += userCountryKeys[level];
					}
				}
			}
			$("#giveaway-flash-message").after('<div class="well well-sm"><b>' + keysLeft + '</b> keys left for <b>' + user_country + '</b> country</div>');
			setTimeout(function() {
				$('<div><b>' + keysLeft + '</b> keys left for <b>' + user_country + '</b> country <span class="fa fa-fw fa-key"></span></div>').appendTo(".awah-arp-status");
			}, 1);
		}
	}

	function getTakenGiveaways() {
		document.head.appendChild(document.createElement('style')).innerHTML = ".tile-content:not(.awah-giveaway-taken) {box-shadow: 0px 0px 2px 1px rgb(0,160,240);}";
		// TODO: isnt it supposed to be attached only if keys data received ?

		var statusMessage = $('<div>Getting your giveaways info <span class="fa fa-fw fa-circle-o-notch fa-spin"></span></div>');
		statusMessage.delay(3000).queue(function() {
			$(this).appendTo(".awah-arp-status").dequeue();
		});

		$.getJSON("/giveaways/keys", function(data) {
			statusMessage.clearQueue()
				.html('<div>Getting your giveaways info <span class="fa fa-fw fa-check-circle"></span></div>')
				.delay(statusMessageDelay).queue(function() {
					$(this).addClass("awah-casper-out");
				});
			var awahGiveawayKeys = [];
			$.each(data, function(index, value) {
				awahGiveawayKeys[value.giveaway_id] = value;
			});
			if (DEBUG) console.log("awahGiveawayKeys", awahGiveawayKeys);
			markTakenGiveaways(awahGiveawayKeys); // sometimes first giveaways page loaded before event registered
			document.addEventListener('animationstart', function(event) {
				if (event.animationName == "awah-new-tile-chunk-appears") {
					markTakenGiveaways(awahGiveawayKeys);
				}
			}, false);
		}).fail(function() {
			statusMessage.html('<div>Getting your giveaways info <span class="fa fa-fw fa-exclamation-triangle"></span></div>')
				.delay(statusMessageDelay).queue(function() {
					$(this).addClass("awah-casper-out").dequeue();
				});
		});
	}

	function markTakenGiveaways(awahGiveawayKeys) {
		$("a.Giveaway").each(function() {
			var awahGiveawayID = /\/ucf\/show\/([\d]+)/.exec($(this).prop("href"));
			awahGiveawayID = awahGiveawayID[1];
			if (typeof awahGiveawayKeys[awahGiveawayID] === "object") {
				$(this).parent().addClass("awah-giveaway-taken");
				awahlabel = '✔\nTAKEN AT: ' + awahGiveawayKeys[awahGiveawayID].assigned_at;
				if (showKeyOnMarkedGiveaways) awahlabel += '\n            KEY: ' + awahGiveawayKeys[awahGiveawayID].value;
				$(this).attr("awahlabel", awahlabel);
			}
		});
	}

	function showUserLevelAtInsignias() {
		function parseUserLevelData() {
			$("div.user-profile-small").each(function(i) {
				$(this).parent().next().find(".insignia-label").attr("data-arp-level", $(this).attr("data-arp-level"));
			});

			// master insignias size fix
			$(".prestige-label").prevAll(".insignia-label").children("img").css({
				"position": "relative",
				"left": "2px",
				"top": "2px"
			});

			// master insignias size fix - alternative variant with using big images
			/* $(".username.text-prestiged").prev(".insignia-label").children("img").each(function(i) {
				$(this).css("width", "35px");
				$(this).attr("src", $(this).attr("src").replace(/\/sm/, '/lg'));
			}); */
		}
		parseUserLevelData();
		$.ajaxPrefilter(function(options, originalOptions, jqXHR) {
			if (options.url.indexOf("ucf/comments/") >= 0) {
				var originalSuccess = options.success;
				options.success = function(data) {
					/* ajaxBeforeSuccess functionality */
					var contentId = parseInt(this.url.replace(/\/ucf\/comments\/(\d*)/g, "$1"), 10);
					//parseUserLevelData();
					setTimeout(() => parseUserLevelData(), 1);
					/* ajaxBeforeSuccess functionality END */
					if (typeof originalSuccess === "function") {
						originalSuccess(data);
					}
				};
			}
		});
	}

	switch (true) {
		case /.*\/ucf\/show\/.*/.test(path):
			if (DEBUG) console.log("SWITCH: Content");
			// <meta property="og:url" content="https://eu.alienwarearena.com/ucf/show/1592462/boards/contest-and-giveaways-global/Giveaway/rising-storm-2-vietnam-closed-beta-key-giveaway" />
			var og_url = $('meta[property="og:url"]').attr("content");
			switch (true) {
				case /.*\/boards\/this-or-that\/.*/.test(path):
				case /.*\/boards\/this-or-that\/.*/.test(og_url):
					if (DEBUG) console.log("SWITCH: This or That");
					// this_or_that_btn();
					break;
				case /^\/ucf\/show\/.*\/Giveaway\//.test(path):
				case /\/ucf\/show\/.*\/Giveaway\//.test(og_url):
					if (DEBUG) console.log("SWITCH: Giveaway");
					showAvailableKeys();
					break;
			}
			showUserLevelAtInsignias();
			break;
		case /^\/ucf\/Giveaway$/.test(path):
			if (DEBUG) console.log("SWITCH: Giveaways list");
			getTakenGiveaways();
			break;
		case /^\/ucf\/Image$/.test(path):
			if (DEBUG) console.log("SWITCH: Featured images page");
			showFeaturedContentVotingButtons('Image');
			break;
		case /^\/ucf\/Video$/.test(path):
			if (DEBUG) console.log("SWITCH: Featured videos page");
			showFeaturedContentVotingButtons('Video');
			break;
		case /^\/ucf\/News$/.test(path):
			if (DEBUG) console.log("SWITCH: Featured news page");
			showFeaturedContentVotingButtons('News');
			break;
		case /^\/member\/.*$/.test(path):
			if (DEBUG) console.log("SWITCH: user profile page");
			showProfileContentVotingButtons();
			showUserSteamProfileLink();
			break;
		case /\/$/.test(url):
			if (DEBUG) console.log("SWITCH: main page");
			break;
	}
}(window));
