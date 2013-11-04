jQuery(function ($) {
    var History = window.History;
    var siteURL = location.host;
    var internalLinksQuery = "a[href^='" + siteURL + "'], a[href^='/'], a[href^='./'], a[href^='../'], a[href^='#']";
    var $window = $(window);
    var $mainContent = $('#main-content');
    var $internalLinks = $(internalLinksQuery);
    var $relatedPostsContainer = $('#related-posts-container');

    scrollToContent();

    // if on home, saves related posts to local storage and removes the temporary element
    // if on post, displays related posts if available
    if ($relatedPostsContainer.length > 0) {
        var rp = $relatedPostsContainer.clone();
        $relatedPostsContainer.remove();
        localStorage.setItem('relatedPosts', JSON.stringify(rp.html()));
    } else {
        displayRelatedPosts();
    }

    // if history is available we can load content asynchronously
    // otherwise do it the usual way to keep correct url in path
    if (History.enabled) {

        // listens to history change and loads content
        History.Adapter.bind(window, 'statechange', function () {
            var state = History.getState();
            $.ajax({
                url: state.url + ' #main-content',
                cache: true,
                contentType: 'html',
                statusCode: {
                    404: function () {
                        Avgrund.show('#default-popup');
                    }
                },
                dataFilter: function (data, type) {
                    type = type || 'text';
                    if (type == 'html' || type == 'text') {
                        data = data.replace(/<link.*?\/>/gi, '');
                        data = data.replace(/<script.*?>([\w\W]*?)<\/script>/gi, '');
                        data = $(data).filter('#main-content').children().parent();
                        return data.html();
                    }

                    return data;
                },
                success: function (data, status, xhr) {
                    $mainContent.html(data);
                    Prism.highlightElement();
                    switch (status) {
                        case 'error':
                            alert('Something terrible has happened. Sky is falling on your head.');
                            break;
                        case 'success':
                            scrollToContent();
                            displayRelatedPosts();
                            break;
                    }
                }
            });
        });

        // override all internal clicks and updates content asynchronously
        $internalLinks.click(function (e) {
            e.preventDefault();
            var url = $(this).attr('href');
            var title = $(this).attr('title') || null;
            History.pushState({}, title, url);
        });

    }


    // if on home, updates related posts in local storage
    // if on posts, displays related posts if available
    function displayRelatedPosts() {
        var related = JSON.parse(localStorage.getItem('relatedPosts'));
        if (related.length > 0 && $('nav.related-posts ul').length > 0) {
            $('nav.related-posts ul').html(related);
        } else {
            $('nav.related-posts').remove();
        }
    }

    // scrolls down to start of content if marker is available
    function scrollToContent() {
        var contentAnchor = $("span[name='post-content']");
        if (contentAnchor.length > 0) {
            $('html,body').animate({scrollTop: contentAnchor.offset().top - 30}, 'slow');
        } else {
            $('html,body').animate({scrollTop: 0}, 'slow');
        }
    }

    // fix for ios overscrolling issue
    if ('ontouchstart' in document.documentElement) {
        var checkInterval;
        window.addEventListener('touchstart', function (e) {
            checkInterval = setInterval(scrollPosFooterFix, 20);
        }, false);
        document.addEventListener('touchend', function (e) {
            clearInterval(checkInterval);
        }, false);
        function scrollPosFooterFix() {
            if ($window.scrollTop() > 50) {
                $('.site-footer').css({bottom: 0});
            } else {
                $('.site-footer').css({bottom: -200});
            }
        }
        scrollPosFooterFix();
    }

});
