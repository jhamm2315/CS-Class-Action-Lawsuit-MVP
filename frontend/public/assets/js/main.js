// Minimal init so body doesn't stay "is-preload"; avoids 404 and keeps ZeroFour UX predictable.
window.addEventListener("load", function () {
  document.body.classList.remove("is-preload");
});