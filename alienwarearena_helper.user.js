// ==UserScript==
// @name         Alienware Arena helper
// @namespace    https://github.com/thomas-ashcraft
// @version      1.1.5
// @description  Earn daily ARP easily
// @author       Thomas Ashcraft
// @match        *://*.alienwarearena.com/*
// @match        *://*.alienwarearena.com//*
// @license      GPL-2.0-or-later; http://www.gnu.org/licenses/gpl-2.0.txt
// @icon         https://www.alienwarearena.com/favicon.ico
// @grant        none
// @noframes
// ==/UserScript==

(function() {
	// You can configure options through the user interface or localStorage in browser. It is not recommended to edit the script for these purposes.
	const version = '1.1.5';

	let contentVotingInAction = false;
	let contentVotingURL = '';
	let contentToVote = [];
	let contentToCheck = [];
	let contentGettingPage = 1;
	let votingDown = false;
	let votedContentCache = new Set(JSON.parse(localStorage.getItem('awahVotedContentCache')));
	let saveOptionsTimer;

	// Embed style
	document.head.appendChild(document.createElement('style')).textContent = `
		/* script buttons */
		.awah-btn-cons,
		.awah-btn-cons:hover {color: gold;}
		.list-group-item > .awah-btn-cons {width: 50%;}
		.list-profile-actions > li > .awah-btn-cons {width: 50%;}
		.awah-btn-cons.disabled {position: relative;}
		.awah-btn-quest.disabled::before,
		.awah-btn-cons.disabled::before {content: ''; width: 100%; height: 100%; position: absolute; top: 0; left: 0; background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACAQMAAABIeJ9nAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABlBMVEUAAAAAAAClZ7nPAAAAAXRSTlMAQObYZgAAAAFiS0dEAIgFHUgAAAAJcEhZcwAACxIAAAsSAdLdfvwAAAAMSURBVAjXY2hgYAAAAYQAgSjdetcAAAAASUVORK5CYII=');}
		.awah-btn-quest {padding-left: 0.25rem; padding-right: 0.25rem;}
		.awah-btn-quest.disabled::before {filter: invert(60%)}
		.awah-panel {margin: 20px 0;}
		.awah-activate-steam-key-btn {text-decoration: none !important; padding: 1px 5px; background-color: rgba( 48, 95, 128, 0.9 ); vertical-align: inherit;}
		.awah-activate-steam-key-btn:hover {background: linear-gradient( -60deg, #417a9b 5%,#67c1f5 95%);}

		/* script tooltips */
		.awah-info-btn {cursor: pointer; opacity: 0.4; transition: opacity 0.25s ease-in-out;}
		.awah-info-btn:hover {opacity: 1;}
		[data-awah-tooltip] {position: relative;}
		[data-awah-tooltip]:after {content: attr(data-awah-tooltip); pointer-events: none; padding: 4px 8px; color: white; position: absolute; left: 0; bottom: 100%; opacity: 0; font-weight: normal; text-transform: none; font-size: 0.9rem; white-space: pre; box-shadow: 0px 0px 3px 0px #54bbdb; background-color: #0e0e0e; transition: opacity 0.25s ease-out, bottom 0.25s ease-out; z-index: 1000;}
		[data-awah-tooltip]:hover:after {bottom: -100%; opacity: 1;}

		/* script GUI */
		.awah-ui-overlay {color: white; clear: both; font-size: smaller !important; pointer-events: none; position: fixed; bottom: 0; right: 0; max-width: 40%; min-width: 20%; padding: 1rem 0.5rem 0 0; text-shadow: 2px 2px 2px rgb(0, 0, 0), -1px -1px 2px rgb(0, 0, 0), 2px 2px 5px rgb(0, 0, 0), -1px -1px 5px rgb(0, 0, 0), 0px 0px 10px rgb(0, 0, 0); text-align: right; background: rgba(0, 0, 0, 0) linear-gradient(to right bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.85) 85%, rgba(0, 0, 0, 0.85) 100%) no-repeat scroll 0 0; z-index: 9001;}
		.awah-arp-status {float: right; clear: both; white-space: nowrap; border-bottom: 1px solid #1c1e22;}
		.awah-arp-status > div {clear: both; position: relative; animation: awah-slide-from-bottom 0.25s ease-out 1 forwards;}
		.awah-arp-pts {clear: both; width: 100%}
		.awah-arp-pts > div {clear: both; width: 100%; background-position: 50% 50%; background-repeat: no-repeat; background-size: 100% 14px;}
		.awah-arp-pts > div::after {content: ""; display: block; height: 0; clear: both;}
		.awah-grey {color: #767676;}
		.awah-casper-out {overflow: hidden !important; animation: awah-casper-out 0.6s ease-in !important;}
		.awah-rotating {animation: awah-rotating 2s linear infinite;}

		li.awah-nav-panel {}
		li.awah-nav-panel > a.nav-link {width: 2.5rem; height: 2.5rem; float: left; cursor: pointer;}
		li.awah-nav-panel > a.nav-link > i {font-size: 26px;}

		.awah-daily-reset-timer {min-width: 22%;}
		.toast-body table tbody > :nth-child(2n) {background: #090909}

		/* script options */
		.awah-options-btn {float: left; padding-left: 16px; cursor: pointer; transition: text-shadow 0.25s ease-in-out;}
		.awah-options-btn:hover {text-shadow: 0px 0px 3px rgba(75, 201, 239, 1), 0px 0px 12px rgba(75, 201, 239, 1); /* animation: awah-breathing-text-neon 2s ease 0s infinite alternate; */}
		#awah-options {display: flex; flex-flow: column nowrap; overflow: auto; position: fixed; height: 100vh; width: 30vw; right: calc(-5px - 30vw); padding: 0 11px 2rem 11px; text-shadow: 2px 2px 2px rgb(0, 0, 0), -1px -1px 2px rgb(0, 0, 0); text-align: right; background: rgba(0, 0, 0, 0.85) repeat scroll 0 0; box-shadow: 0px 0px 3px 0px #54bbdb; transition: right 0.3s; z-index: 9000;}
		.awah-option {border-bottom: 1px solid #1c1e22; margin-bottom: 11px;}
		.awah-option label {display: flex; flex-flow: row nowrap; justify-content: space-between; align-items: baseline; color: whitesmoke;}
		#awah-options > :first-child {display: flex; flex-flow: row nowrap; justify-content: space-between; align-items: baseline;}
		.awah-opt-input {width: 24%; text-align: right; padding: 0 5px; height: auto; background: transparent; color: white; border-width: 0px 1px 1px 0px;}
		.awah-opt-desc {font-size: smaller;}
		.awah-option > .btn-danger {width: 100%;}
		#awah-options .dismiss-menu {font-size: 32px;}

		/* custom checkbox */
		input.awah-opt-input[type="checkbox"] {position: absolute; right: 0; opacity: 0;}
		input.awah-opt-input[type="checkbox"]:focus + div {border-color: #66afe9; outline: 0; -webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075), 0 0 8px rgba(102, 175, 233, 0.6); box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075), 0 0 8px rgba(102, 175, 233, 0.6);}
		.awah-opt-input[type="checkbox"] + div {transition: 0.25s all ease; position: relative; overflow: hidden;}
		.awah-opt-input[type="checkbox"] + div > div {transition: 0.25s all ease; background-color: #428bca; width: 50%; height: 100%; position: absolute; left: 0;}
		input.awah-opt-input[type="checkbox"]:checked + div {background-color: rgb(66, 139, 202, 0.4);}
		input.awah-opt-input[type="checkbox"]:checked + div > div {left: calc(100% - 50%);}
		.awah-opt-input[type="checkbox"] + div > div::before {content: 'ON'; position: absolute; right: 120%;}
		.awah-opt-input[type="checkbox"] + div > div::after {content: 'OFF'; color: #767676; position: absolute; left: 120%;}

		/* Giveaways page */
		.awah-giveaway-taken::before {content: attr(awahlabel); display: block; position: absolute; padding: 4rem 2rem; font-family: inherit; font-weight: 700; white-space: pre; overflow: hidden; width: 100%; height: 100%; text-shadow: 2px 2px 2px rgb(0, 0, 0), -1px -1px 2px rgb(0, 0, 0), 2px 2px 5px rgb(0, 0, 0), -1px -1px 5px rgb(0, 0, 0), 0px 0px 10px rgb(0, 0, 0); background-color: rgba(0, 0, 0, 0); background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACAQMAAABIeJ9nAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABlBMVEUAAAAAAAClZ7nPAAAAAXRSTlMAQObYZgAAAAFiS0dEAIgFHUgAAAAJcEhZcwAACxIAAAsSAdLdfvwAAAAMSURBVAjXY2hgYAAAAYQAgSjdetcAAAAASUVORK5CYII=');}
		.awah-giveaway-taken:not(:hover) > * {opacity: 0.1; transition: opacity 0.25s ease-in-out;}

		/* comments */
		.insignia-label::before {content: attr(data-arp-level); font-size: 10px; width: 35px; /* 30 for master */ line-height: 30px; /* 26 for master */ position: absolute; text-align: center; pointer-events: none;}

		/* user profile */
		.awah-sub-recent-activity {text-align: center; font-size: smaller; margin-bottom: 10px; margin-top: -10px;}
		section.um-profile__friends {flex-wrap: wrap;}

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
		@keyframes awah-rotating {
			from {transform: rotate(0deg);}
			to {transform: rotate(360deg);}
		}
		@keyframes awah-element-appears-hook {
			from {opacity: 0.99;}
			to {opacity: 1;}
		}
		.giveaways__listing .row > div {animation-duration: 0.001s; animation-name: awah-element-appears-hook;}
		#giveaway-flash-message {animation-duration: 0.001s; animation-name: awah-element-appears-hook;}
		
		/* Dot Falling */
		.dot-falling {position: relative; display: inline-block; margin: 0 16px; text-align: left; left: -100px; width: 10px; height: 10px; border-radius: 5px; background-color: rgba(0,0,0,0); color: rgba(0,0,0,0); box-shadow: 99px 0 0 0 #00f0f0; animation: dotFalling 1s infinite linear; animation-delay: .1s;}
		.dot-falling::before,
		.dot-falling::after { content: ''; display: inline-block; position: absolute; top: 0;}
		.dot-falling::before { width: 10px; height: 10px; border-radius: 5px; animation: dotFallingBefore 1s infinite linear; animation-delay: 0s;}
		.dot-falling::after { width: 10px; height: 10px; border-radius: 5px; animation: dotFallingAfter 1s infinite linear; animation-delay: .2s;}

		@keyframes dotFalling {
		  0% {box-shadow: 100px -15px 0 0 rgba( 0, 240, 240, 0);}
		  25%,
		  50%,
		  75% {box-shadow: 100px 0 0 0 #00f0f0;}
		  100% {box-shadow: 100px 15px 0 0 rgba( 0, 240, 240, 0);}
		}
		
		@keyframes dotFallingBefore {
		  0% {box-shadow: 85px -15px 0 0 rgba( 0, 240, 240, 0);}
		  25%,
		  50%,
		  75% {box-shadow: 85px 0 0 0 #00f0f0;}
		  100% {box-shadow: 85px 15px 0 0 rgba( 0, 240, 240, 0);}
		}
		
		@keyframes dotFallingAfter {
		  0% {box-shadow: 115px -15px 0 0 rgba( 0, 240, 240, 0);}
		  25%,
		  50%,
		  75% {box-shadow: 115px 0 0 0 #00f0f0;}
		  100% {box-shadow: 115px 15px 0 0 rgba( 0, 240, 240, 0);}
		}

		/* Fix for Alienware Arena design bugs */
		.overlay {position: fixed !important;} /* without it .overlay sticks to top of the site and can be skipped by scrolling */
		.videos__listing .videos__listing-post img {max-height: 299px;} /* videos without thumbnail have bigger height and stretching out of the general row */
		`;

	class Options {
		constructor() {
			this.load();
		}

		default() {
			return {
				statusMessageDelay: 5000,
				actionsDelayMin: 500,
				actionsDelayMax: 2000,
				showKeyOnMarkedGiveaways: true,
				version,
			};
		}

		load() {
			let defaultOptions = this.default();
			Object.keys(defaultOptions).forEach((key) => this[key] = defaultOptions[key]);

			let savedOptions = JSON.parse(localStorage.getItem('AlienwareArenaHelperOptions'));
			if (savedOptions !== null) {
				Object.keys(savedOptions).forEach((key) => this[key] = savedOptions[key]);
			}
		}

		save() {
			this.actionsDelayMin = parseInt($('#awah-actions-delay-min').val(), 10);
			this.actionsDelayMax = parseInt($('#awah-actions-delay-max').val(), 10);
			this.showKeyOnMarkedGiveaways = $('#awah-show-key-on-marked-giveaways').prop('checked');
			this.statusMessageDelay = parseInt($('#awah-status-message-delay').val(), 10);

			// TODO: need to be updated for 10YearsRedesign and as some separate function
			// trick to apply options.showKeyOnMarkedGiveaways on the fly
			// if (path === '/ucf/Giveaway') {
			// 	let awahTemp = $('<div class="tile-chunk"></div>');
			// 	awahTemp.appendTo('#awah-options').delay(250).queue(function() {
			// 		$(this).remove().dequeue();
			// 	});
			// }

			try {
				localStorage.setItem('AlienwareArenaHelperOptions', JSON.stringify(this));
                return true;
			} catch (e) {
				console.warn(e);
                return false;
			}
		}

		clearLegacyData(previousScriptVersion = null) {
			// TODO: should consider to make it global function for some wide range of actions based upon version changing
			switch (previousScriptVersion) {
				default:
					localStorage.removeItem('awah_tot_add_votes_min');
					localStorage.removeItem('awah_tot_add_votes_max');
					localStorage.removeItem('awah_actions_delay_min');
					localStorage.removeItem('awah_actions_delay_max');
					localStorage.removeItem('awah_show_key_on_marked_giveaways');
					localStorage.removeItem('awah_status_message_delay');
				// fallthrough
				case '1.1.3':
				// ok
			}
		}
	}

	let options = new Options();

	class ARPStatus {
		constructor() {
			this.startOfCurrentDay = new Date();
			this.startOfCurrentDay.setUTCHours(0, 0, 0, 0);

			this.initARPWatchdog();

			this.updateFromServer();
		}

		initARPWatchdog() {
			// TODO: remake to fetch and XMLHttpRequest hooks instead of jQuery
			$.ajaxPrefilter(function(options, originalOptions, jqXHR) {
				if (options.url.indexOf('vote') >= 0) {
					let originalSuccess = options.success;
					options.success = function(data) {
						/* ajaxBeforeSuccess functionality */
						let contentId = parseInt(this.url.replace(/\/ucf\/vote\/(?:up|down)\/(\d*)/g, '$1'), 10);
						if (data.votedForContent === true) {
							arpStatus.currentContentVotes++;
							votedContentCache.add(contentId);
						} else if (data.votedForContent === false) {
							arpStatus.currentContentVotes--;
							votedContentCache.delete(contentId);
						} else if (data.message.indexOf('already voted') >= 0) {
							votedContentCache.add(contentId);
						}
						if (!contentVotingInAction) {
							ui.newStatusMessage(data.message);
							if (typeof data.upVotes !== 'undefined') {
								ui.newStatusMessage(`up: ${data.upVotes} | down: ${data.downVotes}${typeof data.voteTotal !== 'undefined' ? ` | total: ${data.voteTotal}` : ''}`);
							}
						}
						saveVotedContentCache();
						ui.pointsStatusUpdate();
						/* ajaxBeforeSuccess functionality END */
						if (typeof originalSuccess === 'function') {
							originalSuccess(data);
						}
					};
				}
			});
		}

		async updateFromServer() {
			const response = await fetch('/api/v1/users/arp/status', {credentials: 'same-origin'})
				.catch((error) => console.error('ARP status update error!', error));
			const status = await response.json();
			console.log('👽 updated status', status);
			if (status.error) {
				console.error('ARP status update error!', status);
				return;
			}

			this.status = status;

			const contentVotes = status.daily_arp[1].status.split(' ');
			this.currentContentVotes = parseInt(contentVotes[0], 10);
			this.maximumContentVotes = parseInt(contentVotes[2], 10);
			if (typeof ui === 'object') {
				ui.pointsStatusUpdate();
			}

			this.dailyQuestEnd = new Date(status.quests[0].end);
		}
	}

	let arpStatus = new ARPStatus();

	class UI {
		constructor() {
			this.fixNavBarBackgroundOnPageLoad(); // yet another site bug fix

			let anchor = document.querySelector('li#notification-dropdown');
			this.navPanel = document.createElement('li');
			this.navPanel.classList.add('nav-item', 'awah-nav-panel');
			anchor.insertAdjacentElement('beforebegin', this.navPanel);

			this.initStatusOverlay();
			this.pointsStatusUpdate();
			this.initOptionsUI();
			showDailyResetTimer();

			document.addEventListener('animationend', function(event) {
				if (event.animationName === 'awah-casper-out') {
					event.target.remove();
				}
			}, false);

			this.newStatusMessage(`Alienware Arena helper v<b>${version}</b></span>`);
		}

		initStatusOverlay() {
			let statusOverlayElement = document.createElement('div');
			statusOverlayElement.id = 'awah-status-overlay';
			statusOverlayElement.classList.add('awah-ui-overlay');
			statusOverlayElement.insertAdjacentHTML('afterbegin', '<div class="awah-arp-status"></div><div class="awah-arp-pts"><div class="awah-arp-pts-con">CON: <div class="dot-falling"></div></div></div>');
			statusOverlayElement.querySelector('.awah-arp-status').insertAdjacentHTML('beforeend', `<div class="awah-con-check-queue" style="display: none;">content to check: <span class="awah-con-check-queue-length">${contentToCheck.length}</span> <span class="fa fa-fw fa-search"></span></div>
				<div class="awah-con-votes-queue" style="display: none;">content to vote: <span class="awah-con-votes-queue-length">${contentToVote.length}</span> <span class="fa fa-fw fa-upload"></span></div>`);
			document.getElementById('content').appendChild(statusOverlayElement);
		}

		initOptionsUI()	{
			this.navPanel.insertAdjacentHTML('beforeend', '<a class="nav-link awah-options-btn" data-awah-tooltip="AWA Helper options"><i aria-hidden="true" class="fa fa-fw fa-cog"></i></a>');

			document.querySelector('div.wrapper').insertAdjacentHTML('beforeend', `<div id="awah-options" style="visibility: hidden;">
				<div class="awah-option">
				<a class="dismiss-menu" data-awah-tooltip="Close options"><i aria-hidden="true" class="fas fa-times"></i></a>
				<span class="awah-opt-desc awah-grey">AWA helper v<b>${version}</b></span>
				</div>

				<div class="awah-option">
				<label><span class="awah-opt-title">actionsDelayMin</span><input id="awah-actions-delay-min" class="form-control awah-opt-input" type="text" value="${options.actionsDelayMin}"></label>
				<label><span class="awah-opt-title">actionsDelayMax</span><input id="awah-actions-delay-max" class="form-control awah-opt-input" type="text" value="${options.actionsDelayMax}"></label>
				<span class="awah-opt-desc awah-grey">Minimum and maximum random delay time between network actions. (milliseconds)<br>Default minimum: ${options.default().actionsDelayMin} || Default maximum: ${options.default().actionsDelayMax}</span>
				</div>

				<div class="awah-option">
				<label><span class="awah-opt-title">showKeyOnMarkedGiveaways</span><input id="awah-show-key-on-marked-giveaways" class="form-control awah-opt-input" type="checkbox" ${options.showKeyOnMarkedGiveaways ? 'checked' : ''}><div class="form-control awah-opt-input"><div>&nbsp;</div>&nbsp;</div></label>
				<span class="awah-opt-desc awah-grey">At Giveaways page. Default: ${options.default().showKeyOnMarkedGiveaways ? 'ON' : 'OFF'}</span>
				</div>

				<div class="awah-option">
				<label><span class="awah-opt-title">statusMessageDelay</span><input id="awah-status-message-delay" class="form-control awah-opt-input" type="text" value="${options.statusMessageDelay}"></label>
				<span class="awah-opt-desc awah-grey">How long the status messages will be displayed before they disappear. (milliseconds)<br>Default: ${options.default().statusMessageDelay}</span>
				</div>

				<div class="awah-option">
				<button id="awah_restore_default" class="btn btn-danger"><span class="fa fa-exclamation-triangle"></span> Restore default</button>
				<span class="awah-opt-desc awah-grey">Restore default settings.</span>
				</div>

				<div class="awah-option">
				<label><span class="awah-opt-title">Voted content cached</span><span id="awah_voted_content_cache_size" class="form-control awah-opt-input">${votedContentCache.size}</span></label>
				<button id="awah_clear_voted_content_cache" class="btn btn-danger"><span class="fa fa-exclamation-triangle"></span> Clear voted content cache</button>
				<span class="awah-opt-desc awah-grey">Use only in case of emergency.</span>
				</div>
				</div>`);

			$('input.awah-opt-input[type="text"]').on('input', function() {
				this.value = this.value.replace(/[^\d]/, '');
				this.value = this.value.slice(0, 5);
			});

			$('input.awah-opt-input').on('change', function() {
				clearTimeout(saveOptionsTimer);
				saveOptionsTimer = setTimeout(function() {
					if (options.save()) {
                        ui.newStatusMessage('Settings saved! <span class="fa fa-fw fa-floppy-o"></span>');
                    } else {
                        ui.newStatusMessage('Error! See console for details. <span class="fa fa-fw fa-exclamation-triangle"></span>');
                    }
				}, 400);
			});

			$('#awah_restore_default').on('click', function() {
				if (!confirm("Are you damn sure about this?!")) return;
				$('#awah-actions-delay-min').val(options.default().actionsDelayMin);
				$('#awah-actions-delay-max').val(options.default().actionsDelayMax);
				$('#awah-show-key-on-marked-giveaways').prop('checked', (options.default().showKeyOnMarkedGiveaways === true));
				$('#awah-status-message-delay').val(options.default().statusMessageDelay);
				ui.newStatusMessage('Default options settings restored!');
				options.save();
			});

			$('#awah_clear_voted_content_cache').on('click', function() {
				if (!confirm("Are you damn sure about this?!")) return;
				votedContentCache.clear();
				saveVotedContentCache();
				ui.newStatusMessage('Voted content cache cleared!');
			});

			document.querySelector('.awah-options-btn').addEventListener('click', this.toggleOptionsDisplay, false);

			// hideOverlay() hook
			if (typeof hideOverlay === 'function') {
				let originalHideOverlay = hideOverlay;
				let awahOptions = document.getElementById('awah-options');
				hideOverlay = function() {
					setTimeout(() => {awahOptions.style.visibility = 'hidden'}, 300);
					awahOptions.style.right = '';
					originalHideOverlay();
				};
			}
		}

		toggleOptionsDisplay() {
			let overlayElement = document.querySelector('.overlay');
			let awahOptions = document.getElementById('awah-options');
			if(awahOptions.style.visibility === 'hidden') {
				overlayElement.classList.add('active');
				awahOptions.style.visibility = 'visible';
				awahOptions.style.right = '0';
			} else {
				hideOverlay();
			}
		}

		newStatusMessage(text) {
			let statusMessageObj = $(`<div>${text}</div>`);
			statusMessageObj.appendTo('.awah-arp-status')
				.delay(options.statusMessageDelay).queue(function() {
				$(this).addClass('awah-casper-out').dequeue();
			});
			return statusMessageObj;
		}

        pointsStatusUpdate() {
			if (typeof arpStatus.maximumContentVotes !== 'number') return;

            $('.awah-arp-pts-con').html(`CON: ${arpStatus.currentContentVotes} / ${arpStatus.maximumContentVotes}`);
            if (arpStatus.currentContentVotes >= arpStatus.maximumContentVotes && !contentVotingInAction) {
                $('.awah-arp-pts-con').addClass('awah-grey');
            }
            if (contentVotingInAction) {
                $('.awah-con-check-queue-length').text(contentToCheck.length);
                $('.awah-con-votes-queue-length').text(contentToVote.length);
                let progressBarBackground = 'linear-gradient(90deg, rgb(0, 240, 240) ' +
                    ((arpStatus.currentContentVotes / arpStatus.maximumContentVotes) * 100) +
                    '%, rgba(0, 160, 240, 0.8) 0%, rgba(0, 160, 240, 0.8) ' +
                    (((arpStatus.currentContentVotes + contentToVote.length) / arpStatus.maximumContentVotes) * 100) +
                    '%, rgb(255, 255, 255) 0%, rgb(255, 255, 255) ' +
                    ((((arpStatus.currentContentVotes + contentToVote.length) / arpStatus.maximumContentVotes) * 100) + 1) +
                    '%, rgba(0, 160, 240, 0.8) 0%, rgba(0, 160, 240, 0.8) ' +
                    (((arpStatus.currentContentVotes + contentToVote.length + contentToCheck.length) / arpStatus.maximumContentVotes) * 100) +
                    '%, rgb(40, 37, 36) 0%)';
                progressBarBackground = progressBarBackground.replace(/(\d{3}|\d{3}\.\d+)%/g, '100%'); // values greater than 100% can cause incorrect rendering
                $('.awah-arp-pts-con').css('background-image', progressBarBackground);
            }
        }

		fixNavBarBackgroundOnPageLoad() {
			let nav = document.querySelector('.navbar-top');
			if (nav !== null && window.scrollY > nav.clientHeight) {
				nav.classList.add('scrolled');
			}
		}
	}

	let ui = new UI();

	function saveVotedContentCache() {
		try {
			localStorage.setItem('awahVotedContentCache', JSON.stringify([...votedContentCache]));
			$('#awah_voted_content_cache_size').text(votedContentCache.size);
		} catch (e) {
			console.warn(e);
			ui.newStatusMessage('localStorage quota exceeded! <span class="fa fa-fw fa-exclamation-triangle"></span>');
		}
	}

	function showDailyResetTimer() {
		let awahDateNow = new Date();
		let awahDayEnd = new Date(awahDateNow.getTime());
		awahDayEnd.setUTCHours(23,59,59,999);
		let awahDayRemains = (awahDayEnd.getTime() - awahDateNow.getTime());

		awahDayRemains = Math.floor(awahDayRemains / 1000);

		$('.toast-body table:eq(1) tbody').append('<tr><td><span class="fa fa-fw fa-clock-o"></span> Daily reset</td><td class="text-center awah-daily-reset-timer">hh:mm:ss</td></tr>');

		let awahDayRemainsInterval = setInterval(function () {
			awahDayRemains--;
			//let secs = Math.floor(awahDayRemains / 1000);
			let secs = awahDayRemains;
			let hours = Math.floor(secs / 3600);
			secs -= hours * (3600);
			let mins = Math.floor(secs / 60);
			secs -= mins * (60);
			if (mins < 10) {
				mins = '0' + mins;
			}
			if (secs < 10) {
				secs = '0' + secs;
			}
			$('.awah-daily-reset-timer').text(`${hours}:${mins}:${secs}`);

			if (awahDayRemains < 1) {
				clearInterval(awahDayRemainsInterval);
			}
		}, 1000);
	}

	function getRandomInt(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	// CON votes section
	function applyContentVoting() {
		let contentId = contentToVote.shift();
		let votingURL = `/ucf/vote/${votingDown ? 'down' : 'up'}/${contentId}`;

		$.ajax({
			url: votingURL,
			type: 'post'
		})
			.done(function(data) {
				if (data.success) {
					// yay!
				}
			})
			.fail(function(data) {
				ui.newStatusMessage('Vote apply failed! <span class="fa fa-fw fa-exclamation-triangle"></span>');
			})
			.always(function() {
				ui.pointsStatusUpdate();
				if (arpStatus.currentContentVotes < arpStatus.maximumContentVotes) {
					if (contentToVote.length > 0) {
						setTimeout(() => applyContentVoting(), getRandomInt(options.actionsDelayMin, options.actionsDelayMax)); // recursion!
					} else {
						if (contentToCheck.length > 0) {
							setTimeout(() => checkVotingContent(), getRandomInt(options.actionsDelayMin, options.actionsDelayMax)); // to the check!
						} else {
							ui.newStatusMessage('Going to look for more content <span class="fa fa-fw fa-eye"></span>');
							setTimeout(() => getVotingContentPage(), getRandomInt(options.actionsDelayMin, options.actionsDelayMax)); // to the beginning!
						}
					}
				} else {
					contentVotingInAction = false;
					setTimeout(() => {
						$('.awah-con-check-queue').addClass('awah-casper-out');
						$('.awah-con-votes-queue').addClass('awah-casper-out');
						$('.awah-arp-pts-con').css('background-image', '');
						$('.awah-arp-pts-con').addClass('awah-grey');
					}, options.statusMessageDelay);
				}
			});
	}

	function checkVotingContent() {
		let contentItem = contentToCheck.shift();
		let contentId = contentItem.id;
		$.get(`/ucf/show/${contentId}`)
			.done(function(response) {
				let votedOnContent = /var votedOnContent = (.+);/.exec(response);
				if (votedOnContent) {
					votedOnContent = JSON.parse(votedOnContent[1]);
					// console.log('👽 votedOnContent', votedOnContent);
					if (votedOnContent.downVote === false && votedOnContent.upVote === false) {
						contentToVote.push(contentId);
					} else if (votedOnContent.downVote === true || votedOnContent.upVote === true) {
						votedContentCache.add(contentId);
						saveVotedContentCache();
					}
				} else {
					ui.newStatusMessage(`Failed to parse status of ${contentId}! <span class="fa fa-fw fa-exclamation-triangle"></span>`);
				}
			})
			.fail(function() {
				ui.newStatusMessage(`Failed to get status of ${contentId}! <span class="fa fa-fw fa-exclamation-triangle"></span>`);
			})
			.always(function() {
				ui.pointsStatusUpdate();
				if (contentToCheck.length === 0 && contentToVote.length === 0) {
					ui.newStatusMessage('Going to look for more content <span class="fa fa-fw fa-eye"></span>');
					setTimeout(() => getVotingContentPage(), getRandomInt(options.actionsDelayMin, options.actionsDelayMax)); // to the beginning!
				} else if (contentToVote.length >= (arpStatus.maximumContentVotes - arpStatus.currentContentVotes) ||
					(contentToVote.length > 0 && contentToCheck.length === 0)) {
					ui.newStatusMessage('Going to vote <span class="fa fa-fw fa-forward"></span>');
					setTimeout(() => applyContentVoting(), getRandomInt(options.actionsDelayMin, options.actionsDelayMax)); // go to the next block!
				} else if (contentToCheck.length > 0) {
					setTimeout(() => checkVotingContent(), getRandomInt(options.actionsDelayMin, options.actionsDelayMax)); // recursion!
				}
			});
	}

	function getVotingContentPage(failCounter = 0) {
		let statusMessage = ui.newStatusMessage(`Getting page ${contentGettingPage} <span class="fa fa-fw fa-circle-o-notch fa-spin"></span>`);
		statusMessage.clearQueue();
		$.get(`${contentVotingURL}${contentGettingPage}`)
			.done(function(response) {
				failCounter = 0;
				statusMessage.children('span').attr('class', 'fa fa-fw fa-check-circle');
				statusMessage.delay(options.statusMessageDelay).queue(function() {
					$(this).addClass('awah-casper-out');
				});
				if (response.data.length === 0) {
					ui.newStatusMessage('No more content pages left in this section <span class="fa fa-fw fa-times-circle"></span>');
				} else {
					contentGettingPage++;
					contentToCheck.push(...response.data);
					contentToCheck = contentToCheck.filter((f) => !votedContentCache.has(f.id));
				}
			})
			.fail(function() {
				failCounter++;
				statusMessage.children('span').attr('class', 'fa fa-fw fa-exclamation-triangle');
				statusMessage.delay(options.statusMessageDelay).queue(function() {
					$(this).addClass('awah-casper-out');
				});
			})
			.always(function(response, textStatus) {
				ui.pointsStatusUpdate();
				// .fail
				if (failCounter > 0 && failCounter < 5) {
					ui.newStatusMessage(`Failed to get content page! Trying again${failCounter > 1 ? ` (${failCounter})` : '...'} <span class="fa fa-fw fa-exclamation-triangle"></span>`);
					setTimeout(() => getVotingContentPage(failCounter), getRandomInt(options.actionsDelayMin, options.actionsDelayMax)); // recursion!
				} else {
					if (failCounter > 0) {
						ui.newStatusMessage(`Failed to get content page after ${failCounter} tries! <span class="fa fa-fw fa-exclamation-triangle"></span>`);
					}
					// .done
					if (contentToCheck.length >= (arpStatus.maximumContentVotes - arpStatus.currentContentVotes) ||
						((textStatus === 'error' ? true : response.data.length === 0) && contentToCheck.length > 0)) {
						ui.newStatusMessage('Going to check content <span class="fa fa-fw fa-forward"></span>');
						setTimeout(() => checkVotingContent(), getRandomInt(options.actionsDelayMin, options.actionsDelayMax)); // go to the next block!
					} else if (failCounter === 0 && (textStatus === 'error' ? true : response.data.length > 0)) {
						setTimeout(() => getVotingContentPage(), getRandomInt(options.actionsDelayMin, options.actionsDelayMax)); // recursion!
					} else {
						ui.newStatusMessage('Voting stopped!');
						contentVotingInAction = false;
					}
				}
			});
	}

	function startContentVotingAlgorithm() {
		$('.awah-con-check-queue').show();
		$('.awah-con-votes-queue').show();
		contentVotingInAction = true;
		ui.pointsStatusUpdate();
		getVotingContentPage();
	}

	function registerContentVotingButtons() {
		// TODO: await arpStatus.update ?
		if (arpStatus.currentContentVotes >= arpStatus.maximumContentVotes) {
			$('.awah-btn-cons').addClass('disabled');
			return;
		}
		$('.awah-btn-cons').on('click', function() {
			$('.awah-btn-cons').addClass('disabled');
			if ($(this).data('awah-voting-direction') === 'up') {
				votingDown = false;
			} else if ($(this).data('awah-voting-direction') === 'down') {
				votingDown = true;
			}
			if ($(this).data('awah-content-url') !== '') {
				contentVotingURL = $(this).data('awah-content-url');
			} else {
				ui.newStatusMessage('No content URL specified! Voting is impossible! <span class="fa fa-fw fa-exclamation-triangle"></span>');
				return;
			}
			startContentVotingAlgorithm();
		});
	}

	function showFeaturedContentVotingButtons(sectionType = 'Image') {
		$(`<div class="panel panel-default awah-panel">
<div class="panel-heading" data-awah-tooltip="by Alienware Arena helper"><h3 class="panel-title"><i class="fa fa-chevron-up"></i> Automatic voting</h3></div>
<div class="list-group">

<div class="list-group-item">
<div class="list-group-item-heading" data-awah-tooltip="The ones you see right here">Vote for featured ${sectionType}${sectionType !== 'News'  ? 's' : ''}</div>
<a class="btn btn-default awah-btn-cons" href="javascript:void(0);" data-awah-voting-direction="up" data-awah-content-url="/esi/featured-tile-data/${sectionType}/">
<i class="fa fa-arrow-up"></i> <span class="hidden-xs">UP-votes</span></a><a class="btn btn-default awah-btn-cons" href="javascript:void(0);" data-awah-voting-direction="down" data-awah-content-url="/esi/featured-tile-data/${sectionType}/">
<i class="fa fa-arrow-down"></i> <span class="hidden-xs">DOWN-votes</span></a>
</div>

<div class="list-group-item"${sectionType === 'News' ? 'style="display: none;"' : ''}>
<div class="list-group-item-heading" data-awah-tooltip="Every ${sectionType} which uploaded to the Alienware Arena.
Excluding ones that moved to \'featured\' list.
Sorting from fresh ones to old ones.">Vote for newly uploaded ${sectionType}${(sectionType !== 'News'  ? 's' : '')}</div>
<a class="btn btn-default awah-btn-cons" href="javascript:void(0);" data-awah-voting-direction="up" data-awah-content-url="/esi/tile-data/${sectionType}/">
<i class="fa fa-arrow-up"></i> <span class="hidden-xs">UP-votes</span></a><a class="btn btn-default awah-btn-cons" href="javascript:void(0);" data-awah-voting-direction="down" data-awah-content-url="/esi/tile-data/${sectionType}/">
<i class="fa fa-arrow-down"></i> <span class="hidden-xs">DOWN-votes</span></a>
</div>
</div>`).insertAfter('div:has(.panel-default) > a:last-of-type');

		ui.navPanel.insertAdjacentHTML('afterbegin', `<a class="nav-link awah-btn-cons" href="javascript:void(0);" data-awah-tooltip="UP-voting" data-awah-voting-direction="up" data-awah-content-url="/esi/featured-tile-data/${sectionType}/"><i aria-hidden="true" class="awicon far fa-caret-square-up"></i></a>
			<a class="nav-link awah-btn-cons" href="javascript:void(0);" data-awah-tooltip="DOWN-voting" data-awah-voting-direction="down" data-awah-content-url="/esi/featured-tile-data/${sectionType}/"><i aria-hidden="true" class="awicon far fa-caret-square-down"></i></a>`);
		registerContentVotingButtons();
	}

	function showProfileContentVotingButtons() {
		$(`<li>
<a class="btn btn-default awah-btn-cons" href="javascript:void(0);" data-awah-tooltip="Automatic voting" data-awah-voting-direction="up" data-awah-content-url="/esi/recent-activity-data/user/${profileData.profile.id}/">
<i class="fa fa-arrow-up"></i> <span class="hidden-xs">UP-votes</span></a><a class="btn btn-default awah-btn-cons" href="javascript:void(0);" data-awah-tooltip="Automatic voting" data-awah-voting-direction="down" data-awah-content-url="/esi/recent-activity-data/user/${profileData.profile.id}/">
<i class="fa fa-arrow-down"></i> <span class="hidden-xs">DOWN-votes</span></a>
</div>
</li>`).appendTo('.list-profile-actions');
		registerContentVotingButtons();
	}

	// Daily Quests
	async function getBorderIdFromImgSrc(borderImgSrc) {
		const response = await fetch('/account/personalization', {credentials: 'same-origin'});
		const personalizationPageText = await response.text();
		let parser = new DOMParser();
		let doc = parser.parseFromString(personalizationPageText, 'text/html');
		let borderImgElement = doc.querySelector(`img.icon.border[src="${borderImgSrc}"]`);
		return borderImgElement.parentElement.dataset.borderId;
	}

	async function getSelectedBorderVar() {
		const response = await fetch('/account/personalization', {credentials: 'same-origin'});
		const personalizationPageText = await response.text();
		const found = personalizationPageText.match(/(?:let|var)\s*selectedBorder\s*=\s*(.*?);/);
		return  parseInt(found[1], 10) || null;
	}

	async function getCurrentBorderId() {
		if (user_border.img !== null) {
			return await getSelectedBorderVar();
		} else {
			return null;
		}
	}

	async function getSelectedBadgesVar() {
		const response = await fetch('/account/personalization', {credentials: 'same-origin'});
		const personalizationPageText = await response.text();
		const found = personalizationPageText.match(/(?:let|var)\s*selectedBadges\s*=\s*(.*?);/);
		return JSON.parse(found[1]);
	}

	async function getCurrentBadgesId() {
		if (user_badges.length === 0) {
			return user_badges;
		} else {
			return await getSelectedBadgesVar();
		}
	}

	function getURL(url) {
		return new Promise((resolve, reject) => {
			$.get(url)
				.done((response) => {
					resolve(response);
				})
				.fail((response) => {
					reject(response);
				});
		});
	}

	function postURL(url, content) {
		return new Promise((resolve, reject) => {
			$.post(url, content)
				.done((response) => {
					resolve(response);
				})
				.fail((response) => {
					reject(response);
				});
		});
	}

	async function dailyQuestDone() {
		await arpStatus.updateFromServer();
		return arpStatus.status.quests[0].completed === true;
	}

	async function alternateSwap(url, content1, content2 = null) {
		try {
			await postURL(url, content1);
			let questCompleted = await dailyQuestDone();
			if (questCompleted) {
				ui.newStatusMessage('Swapped successfully!');
			} else if (content2 !== null) {
				await postURL(url, content2);
				ui.newStatusMessage('Swapped successfully!');
			}
		} catch (e) {
			ui.newStatusMessage('Swapping failed!');
			throw e;
		}
	}

	async function visitNews() {
		try {
			let pagecount = 1;
			let completed = await dailyQuestDone();
			while (!completed) {
				let response = await getURL(`/esi/tile-data/News/${pagecount}`);
				let newscount = 0;
				while (newscount <= 14) {
					try {
						await getURL(response.data[newscount].url);
						await postURL(`/ucf/increment-views/${response.data[newscount].id}`);
						ui.newStatusMessage(`Visited news ${response.data[newscount].id}!`);
					} catch (e) {
						ui.newStatusMessage(`Visiting ${response.data[newscount].id} failed!`);
					}
					completed = await dailyQuestDone();
					if (completed) {
						break;
					}
					newscount++;
				}
				pagecount++;
			}
		} catch (e) {
			ui.newStatusMessage('Visiting news failed!');
			throw e;
		}
	}

	async function shareSocial() {
		try {
			let response = await getURL('/esi/tile-data/News/1');
			await postURL(`/arp/quests/share/${response.data[0].id}`);
			ui.newStatusMessage(`${response.data[0].id} shared successfully!`);
		} catch (e) {
			ui.newStatusMessage('Sharing failed!');
			throw e;
		}
	}

	function registerQuestButtons() {
		$('.awah-btn-quest').on('click', async function() {
			// Automatic stuff
			if ($(this).data('awah-quest') === 'border') {
				let currentBorderId = await getCurrentBorderId();
				let tempBorderId = currentBorderId === 1 ? 2 : 1;
				await alternateSwap('/border/select', JSON.stringify({id: tempBorderId}));
				await postURL('/border/select', JSON.stringify({id: currentBorderId})); // set previous border back
			} else if ($(this).data('awah-quest') === 'badge') {
				let currentBadgesId = await getCurrentBadgesId();
				let tempBadgesId = currentBadgesId === JSON.parse('[1]') ? '[2]' : '[1]';
				await alternateSwap(`/badges/update/${user_id}`, tempBadgesId);
				await postURL(`/badges/update/${user_id}`, JSON.stringify(currentBadgesId)); // set previous badge(s) back
			} else if ($(this).data('awah-quest') === 'news') {
				await visitNews();
			} else if ($(this).data('awah-quest') === 'social') {
				await shareSocial();
			// Non automatic stuff
			} else if ($(this).data('awah-quest') === 'avatar') {
				document.location.href = '/account/personalization';
			} else if ($(this).data('awah-quest') === 'forum') {
				document.location.href = '/forums/board/113/awa-on-topic';
			}

			let questCompleted = await dailyQuestDone();
			if (questCompleted) {
				$('.awah-btn-quest').addClass('disabled');
				// TODO: update site interface in part where it says 'Incomplete'
				// span.quest-item-progress
				// fetch new DOM elements through api and replace them
				ui.newStatusMessage('Daily Quest completed!');
			}
		});
	}

	async function showDailyQuestButton() {
		while(!document.querySelector('.quest-title')) {
			await new Promise((r) => setTimeout(r, 500));
		}

		try {
			let response = await getURL('/api/v1/users/arp/status');
			console.log(`👽 QUEST: ${response.quests[0].title} (${response.quests[0].type})`);
			switch (response.quests[0].type) {
				case 'change_border':
					$(`<a class="btn btn-default awah-btn-quest" href="javascript:void(0);" data-awah-tooltip="Automatic border swap" data-awah-quest="border">
						<span class="more-link right"></span></a>`).appendTo(".quest-item > .col-2");
					break;
				case 'change_badge':
					$(`<a class="btn btn-default awah-btn-quest" href="javascript:void(0);" data-awah-tooltip="Automatic badge swap" data-awah-quest="badge">
						<span class="more-link right"></span></a>`).appendTo(".quest-item > .col-2");
					break;
				case 'share_page':
					$(`<a class="btn btn-default awah-btn-quest" href="javascript:void(0);" data-awah-tooltip="Automatic sharing" data-awah-quest="social">
						<span class="more-link right"></span></a>`).appendTo(".quest-item > .col-2");
					break;
				case 'read_articles':
					$(`<a class="btn btn-default awah-btn-quest" href="javascript:void(0);" data-awah-tooltip="Automatic news visiting" data-awah-quest="news">
						<span class="more-link right"></span></a>`).appendTo(".quest-item > .col-2");
					break;
				case 'change_avatar_placeholder':
					$(`<a class="btn btn-default awah-btn-quest" href="javascript:void(0);" data-awah-tooltip="Visit personalization page" data-awah-quest="avatar">
						<span class="more-link right"></span></a>`).appendTo(".quest-item > .col-2");
					break;
				case 'visit_page':
					$(`<a class="btn btn-default awah-btn-quest" href="javascript:void(0);" data-awah-tooltip="Visit forum" data-awah-quest="forum">
						<span class="more-link right"></span></a>`).appendTo(".quest-item > .col-2");
					break;
				case 'post_replies':
					$(`<a class="btn btn-default awah-btn-quest" href="javascript:void(0);" data-awah-tooltip="Visit forum" data-awah-quest="forum">
						<span class="more-link right"></span></a>`).appendTo(".quest-item > .col-2");
					break;
				default:
					$(`<a class="btn btn-default awah-btn-quest" href="javascript:void(0);" data-awah-tooltip="Visit forum" data-awah-quest="forum">
						<span class="more-link right"></span></a>`).appendTo(".quest-item > .col-2");
					break;
			}

			if(response.quests[0].completed === true) {
				$('.awah-btn-quest').addClass('disabled');
			}
		} catch (e) {
			console.log(`👽 QUEST: ${e}`);
			ui.newStatusMessage('Unable to get daily quest!');
			$(`<a class="btn btn-default awah-btn-quest" href="javascript:void(0);" data-awah-tooltip="Visit forum" data-awah-quest="forum">
				<span class="more-link right"></span></a>`).appendTo('.quest-item > .col-2');
		}

		registerQuestButtons();
	}
	showDailyQuestButton();

	// USER profile functions
	function showUserSteamProfileLink() {
		if (profileData.profile.steamId) {
			$(`<a href="//steamcommunity.com/profiles/${profileData.profile.steamId}" target="_blank" data-steam-enabled="true" data-is-current-user="false" class="hexagon btn-social btn-steamfriend" data-toggle="tooltip" data-placement="top" title="" data-original-title="Open user\'s Steam profile in new tab"><i class="fab fa-steam" aria-hidden="true"></i></a>`)
				.appendTo('section.um-profile__friends');
		}
	}

	function showUserRecentActivityTotal() {
		$(`<div class="awah-sub-recent-activity awah-grey">Total: ${recentActivityData.total}</div>`).insertAfter('.show-hdr__txt:contains("Recent Activity")');
	}

	// GIVEAWAY functions
	function showAvailableKeys() {
		//output prependTo('.content-container');
		//div#get-key-actions span.key-count
		if (typeof countryKeys !== 'undefined') {
			let keysLeft = 0;
			let keysOutput = '';
			let userCountryKeys = countryKeys[user_country];
			if (typeof userCountryKeys === 'number') {
				keysLeft = userCountryKeys;
			} else if (typeof userCountryKeys === 'object') {
				for (let level in userCountryKeys['normal']) {
					if (userCountryKeys['normal'][level] > 0) {
						keysLeft += userCountryKeys['normal'][level];
						keysOutput += `<b>${userCountryKeys['normal'][level]}</b> keys for <b>${level}</b>+ level<br>\n`;
					}
				}
				for (let level in userCountryKeys['prestige']) {
					if (userCountryKeys['prestige'][level] > 0) {
						keysOutput += `<b>${userCountryKeys['prestige'][level]}</b> keys for <b>master${(userCountryKeys['prestige'].length > 1  ? ` ${level}</b>+ level` : '</b> levels')} <span class="awah-info-btn" data-awah-tooltip="Prestige key pool"><span class="fa fa-fw fa-info-circle"></span></span><br>\n`;
					}
				}
			}
			$('#giveaway-flash-message').after(`<div class="well well-sm">
<span class="awah-grey" style="float: right;" data-awah-tooltip="by Alienware Arena helper"><span class="fa fa-fw fa-key"></span> Available keys info</span>
User country: <b>${user_country}</b> <span class="awah-info-btn" data-awah-tooltip="Can affect the keys availability.
Site determines it automatically, based on your IP."><span class="fa fa-fw fa-info-circle"></span></span><br>
${(keysOutput ? `${keysOutput}` : `<b>${keysLeft}</b> keys left`)}</div>`);
		}
	}

	function showActivateSteamKeyButton() {
		function injectActivateSteamKeyButton() {
			// https://store.steampowered.com/account/registerkey?key=XXXXX-XXXXX-XXXXX
			// /([A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5})/
			let message = $('#giveaway-flash-message').html();
			message = message.replace(/<p>Key: (.*)([\s]{1}<a[\s]{1}.*<\/a>)<\/p>/m, `<p>Key: $1</p>`);
			$('#giveaway-flash-message').html(message.replace(/<p>Key:[\s]{1}([A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5})<\/p>/m, '<p>Key: $1 <a target="_blank" href="https://store.steampowered.com/account/registerkey?key=$1" class="btn btn-share awah-activate-steam-key-btn" data-awah-tooltip="Activate key on Steam site"><i class="fa fa-steam"></i> Activate</a></p>'));
		}
		injectActivateSteamKeyButton();
		document.addEventListener('animationstart', function(event) {
			if (event.animationName === 'awah-element-appears-hook') {
				setTimeout(() => injectActivateSteamKeyButton(), 1);
			}
		}, false);
	}

	function markTakenGiveaways(giveawayKeysByID) {
		$('.giveaways__listing .giveaways__listing-post').each(function() {
			let giveawayID = /\/ucf\/show\/([\d]+)/.exec($(this).data('url-link'));
			giveawayID = giveawayID[1];
			if (typeof giveawayKeysByID[giveawayID] === 'object') {
				$(this).addClass('awah-giveaway-taken');
				let awahLabel = `✔\nTAKEN AT: ${giveawayKeysByID[giveawayID].assigned_at}`;
				if (options.showKeyOnMarkedGiveaways) {
					awahLabel += `\n            KEY: ${giveawayKeysByID[giveawayID].value}`;
				}
				$(this).attr('awahlabel', awahLabel);
			}
		});
	}

	function getTakenGiveaways() {
		let statusMessage = $('<div>Getting your giveaways info <span class="fa fa-fw fa-circle-o-notch fa-spin"></span></div>');
		statusMessage.delay(2000).queue(function() {
			$(this).appendTo('.awah-arp-status').dequeue();
		});

		$.getJSON('/giveaways/keys', function(data) {
			statusMessage.clearQueue()
				.html('<div>Getting your giveaways info <span class="fa fa-fw fa-check-circle"></span></div>')
				.delay(options.statusMessageDelay).queue(function() {
					$(this).addClass('awah-casper-out');
			});
			let awahGiveawayKeys = {};
			$.each(data, function(index, value) {
				awahGiveawayKeys[value.giveaway_id] = value;
			});
			console.log('👽 awahGiveawayKeys', awahGiveawayKeys);
			markTakenGiveaways(awahGiveawayKeys); // sometimes first giveaways page loaded before event registered
			document.addEventListener('animationstart', function(event) {
				if (event.animationName === 'awah-element-appears-hook') {
					markTakenGiveaways(awahGiveawayKeys);
				}
			}, false);
		}).fail(function() {
			statusMessage.html('<div>Getting your giveaways info <span class="fa fa-fw fa-exclamation-triangle"></span></div>')
				.delay(options.statusMessageDelay).queue(function() {
				$(this).addClass('awah-casper-out').dequeue();
			});
		});
	}

	function closeRecentKeyPopup() {
		let popup = document.querySelector('div.alert-info button.close');
		if (popup) popup.click();
	}

	function showUserLevelAtInsignias() {
		function parseUserLevelData() {
			$('div.user-profile-small').each(function(i) {
				$(this).parent().next().find('.insignia-label').attr('data-arp-level', $(this).attr('data-arp-level'));
			});

			// master insignias size fix
			$('.prestige-label').prevAll('.insignia-label').children('img').css({
				'position': 'relative',
				'left': '2px',
				'top': '2px'
			});

			// master insignias size fix - alternative variant with using big images
			/* $('.username.text-prestiged').prev('.insignia-label').children('img').each(function(i) {
				$(this).css('width', '35px');
				$(this).attr('src', $(this).attr('src').replace(/\/sm/, '/lg'));
			}); */
		}
		parseUserLevelData();
		$.ajaxPrefilter(function(options, originalOptions, jqXHR) {
			if (options.url.indexOf('ucf/comments/') >= 0) {
				let originalSuccess = options.success;
				options.success = function(data) {
					/* ajaxBeforeSuccess functionality */
					let contentId = parseInt(this.url.replace(/\/ucf\/comments\/(\d*)/g, '$1'), 10);
					setTimeout(() => parseUserLevelData(), 1);
					/* ajaxBeforeSuccess functionality END */
					if (typeof originalSuccess === 'function') {
						originalSuccess(data);
					}
				};
			}
		});
	}

	let path = window.location.pathname;
	path = path.replace(/\/+/g, '/');

	switch (true) {
		case /.*\/ucf\/show\/.*/.test(path):
			console.log('👽 SWITCH: Content');
			// <meta property="og:url" content="https://eu.alienwarearena.com/ucf/show/1592462/boards/contest-and-giveaways-global/Giveaway/rising-storm-2-vietnam-closed-beta-key-giveaway" />
			let ogUrl = $('meta[property="og:url"]').attr('content');
			switch (true) {
				case /.*\/boards\/this-or-that\/.*/.test(path):
				case /.*\/boards\/this-or-that\/.*/.test(ogUrl):
					console.log('👽 SWITCH: This or That');
					// this_or_that_btn();
					break;
				case /^\/ucf\/show\/.*\/Giveaway\//.test(path):
				case /\/ucf\/show\/.*\/Giveaway\//.test(ogUrl):
					console.log('👽 SWITCH: Giveaway');
					getTakenGiveaways();
					showAvailableKeys();
					showActivateSteamKeyButton();
					break;
			}
			//showUserLevelAtInsignias();
			break;
		case /^\/ucf\/Giveaway$/.test(path):
			console.log('👽 SWITCH: Giveaways list');
			getTakenGiveaways();
			closeRecentKeyPopup();
			break;
		case /^\/ucf\/Image$/.test(path):
			console.log('👽 SWITCH: Featured images page');
			//showFeaturedContentVotingButtons('Image');
			break;
		case /^\/ucf\/Video$/.test(path):
			console.log('👽 SWITCH: Featured videos page');
			showFeaturedContentVotingButtons('Video');
			break;
		case /^\/ucf\/News$/.test(path):
			console.log('👽 SWITCH: Featured news page');
			showFeaturedContentVotingButtons('News');
			break;
		case /^\/member\/.*$/.test(path):
			console.log('👽 SWITCH: user profile page');
			//showProfileContentVotingButtons();
			showUserSteamProfileLink();
			//showUserRecentActivityTotal();
			break;
		case /\/$/.test(window.location.href):
			console.log('👽 SWITCH: main page');
			break;
	}
}(window));
