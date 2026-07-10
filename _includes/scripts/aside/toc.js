(function() {
  var SOURCES = window.TEXT_VARIABLES.sources;
  var TOC_SELECTOR = window.TEXT_VARIABLES.site.toc.selectors;
  var FAB_TOC_SELECTOR = 'h1,h2,h3';
  window.Lazyload.js(SOURCES.jquery, function() {
    var $window = $(window);
    var $articleContent = $('.js-article-content');
    var $tocRoot = $('.js-toc-root'), $col2 = $('.js-col-aside');
    var $tocFab = $('.js-toc-fab');
    var $tocFabToggle = $('.js-toc-fab-toggle');
    var $tocFabPanel = $('.js-toc-fab-panel');
    var $tocFabRoot = $('.js-toc-fab-root');
    var toc, fabToc;
    var tocDisabled = false;
    var hasSidebar = $('.js-page-root').hasClass('layout--page--sidebar');
    var hasToc = $articleContent.find(TOC_SELECTOR).length > 0;
    var hasFabToc = $articleContent.find(FAB_TOC_SELECTOR).length > 0;
    if (!hasToc) {
      $col2.hide();
    }

    function disabled() {
      return $col2.css('display') === 'none' || !hasToc;
    }

    function closeFabPanel() {
      $tocFabPanel.prop('hidden', true);
      $tocFabToggle.attr('aria-expanded', 'false');
    }

    function updateFabVisibility() {
      if (!hasFabToc) {
        $tocFab.prop('hidden', true);
        closeFabPanel();
        return;
      }
      $tocFab.prop('hidden', false);
    }

    tocDisabled = disabled();

    toc = $tocRoot.toc({
      selectors: TOC_SELECTOR,
      container: $articleContent,
      scrollTarget: hasSidebar ? '.js-page-main' : null,
      scroller: hasSidebar ? '.js-page-main' : null,
      disabled: tocDisabled
    });

    if ($tocFabRoot.length && hasFabToc) {
      fabToc = $tocFabRoot.toc({
        selectors: FAB_TOC_SELECTOR,
        container: $articleContent,
        scrollTarget: hasSidebar ? '.js-page-main' : null,
        scroller: hasSidebar ? '.js-page-main' : null,
        disabled: false
      });
      $tocFabToggle.on('click', function() {
        var opened = $tocFabPanel.prop('hidden') === false;
        $tocFabPanel.prop('hidden', opened);
        $tocFabToggle.attr('aria-expanded', opened ? 'false' : 'true');
      });
      $tocFabPanel.on('click', 'a', function() {
        closeFabPanel();
      });
      $window.on('resize', window.throttle(updateFabVisibility, 100));
      updateFabVisibility();
    }

    $window.on('resize', window.throttle(function() {
      tocDisabled = disabled();
      toc && toc.setOptions({
        disabled: tocDisabled
      });
      fabToc && fabToc.setOptions({
        disabled: !hasToc
      });
    }, 100));

  });
})();
