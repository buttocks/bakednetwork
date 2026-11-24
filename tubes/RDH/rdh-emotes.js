/* RDH emote sizing helper */
(function () {
	'use strict';

	function markEmote(img) {
		if (!img || !img.classList || !img.classList.contains('channel-emote')) return;

		function apply() {
			if ((img.naturalWidth || 0) > 200 || (img.naturalHeight || 0) > 120) {
				img.setAttribute('data-big', 'true');
			} else {
				img.removeAttribute('data-big');
			}
		}

		if (img.complete) {
			apply();
		} else {
			img.addEventListener('load', apply, { once: true });
		}
	}

	function scan(root) {
		if (!root) return;
		if (root.matches && root.matches('.channel-emote')) markEmote(root);
		if (root.querySelectorAll) {
			root.querySelectorAll('.channel-emote').forEach(markEmote);
		}
	}

	function init() {
		scan(document);

		const observer = new MutationObserver(function (mutations) {
			for (const mutation of mutations) {
				for (const node of mutation.addedNodes) {
					if (node.nodeType === 1) scan(node);
				}
			}
		});

		observer.observe(document.documentElement, {
			childList: true,
			subtree: true
		});
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init, { once: true });
	} else {
		init();
	}
})();
