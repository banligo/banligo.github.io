(function () {
  var $root = document.getElementsByClassName('root')[0];
  if (window.hasEvent('touchstart')) {
    $root.dataset.isTouch = true;
    document.addEventListener('touchstart', function(){}, false);
  }
})();

(function () {
  var toggle = document.querySelector('.js-navigation-toggle');
  var navigation = document.getElementById('site-navigation');
  if (!toggle || !navigation) return;

  function closeNavigation() {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', '打开导航');
    navigation.classList.remove('navigation--open');
  }

  toggle.addEventListener('click', function () {
    var isOpen = toggle.getAttribute('aria-expanded') === 'true';
    if (isOpen) {
      closeNavigation();
    } else {
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', '关闭导航');
      navigation.classList.add('navigation--open');
    }
  });

  navigation.addEventListener('click', function (event) {
    if (event.target.closest('a')) closeNavigation();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeNavigation();
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth >= 500) closeNavigation();
  });
})();
