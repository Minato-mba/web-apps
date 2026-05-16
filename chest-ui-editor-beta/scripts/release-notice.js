/**
 * One-time release notice per editor version (localStorage).
 * Bump NOTICE_VERSION when the popup content should show again.
 */
const releaseNotice = {
    NOTICE_VERSION: '2.0.0',
    STORAGE_KEY: 'chest_ui_editor_release_notice_version',
    CHANGELOG_URL: 'CHANGELOG.md',
    PAYPAL_DONATE_URL: 'https://paypal.me/mbarabic',
    KOFI_URL: 'https://ko-fi.com/minato4743',

    init: function () {
        if (typeof projectFormat !== 'undefined' && projectFormat.FORMAT_LABEL) {
            this.NOTICE_VERSION = projectFormat.FORMAT_LABEL;
        }

        const modal = document.getElementById('release-notice-modal');
        if (!modal) return;

        const closeBtn = document.getElementById('close-release-notice');
        const dismissBtn = document.getElementById('dismiss-release-notice');
        const backdrop = modal.querySelector('.modal-backdrop');
        const versionEl = document.getElementById('release-notice-version');
        const changelogLink = modal.querySelector('.release-notice-changelog a');
        const paypalLink = modal.querySelector('.release-notice-btn-paypal');
        const kofiLink = modal.querySelector('.release-notice-btn-kofi');

        if (versionEl) {
            versionEl.textContent = this.NOTICE_VERSION;
        }
        if (changelogLink) {
            changelogLink.href = this.CHANGELOG_URL;
        }
        if (paypalLink) {
            paypalLink.href = this.PAYPAL_DONATE_URL;
        }
        if (kofiLink) {
            kofiLink.href = this.KOFI_URL;
        }

        const close = () => this.dismiss();
        if (closeBtn) closeBtn.addEventListener('click', close);
        if (dismissBtn) dismissBtn.addEventListener('click', close);
        if (backdrop) backdrop.addEventListener('click', close);

        this.maybeShow();
    },

    getDismissedVersion: function () {
        try {
            return util.loadFromLocalStorage(this.STORAGE_KEY);
        } catch (e) {
            return null;
        }
    },

    dismiss: function () {
        util.saveToLocalStorage(this.STORAGE_KEY, this.NOTICE_VERSION);
        const modal = document.getElementById('release-notice-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    },

    maybeShow: function () {
        if (this.getDismissedVersion() === this.NOTICE_VERSION) {
            return;
        }

        const modal = document.getElementById('release-notice-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }
};
