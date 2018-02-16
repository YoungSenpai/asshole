// Uninstall self if API unavailable.
(function() {
  var available = false;
  try {
    available = (typeof(yandex.browser.openFeedbackPage) != 'undefined');
  } catch (e) {}

  if (!available) {
    console.log('Method `openFeedbackPage` is unavailable! Harakiri!!1');
    chrome.management.uninstallSelf();
  }
})();

chrome.browserAction.onClicked.addListener(function() {
  console.log("yandex.browser.openFeedbackPage()");
  try {
    yandex.browser.openFeedbackPage(function() {});
  } catch (e) {
    yandex.browser.openFeedbackPage();
  }
});
