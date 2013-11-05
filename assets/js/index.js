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
                dataFilter: dataFilter,
                success: function (data, status) {
                    switch (status) {
                        case 'error':
                            alert('Something terrible has happened. Sky is falling on your head.');
                            break;
                        case 'success':
                            $mainContent
                                .html(data)
                                .find(internalLinksQuery)
                                .not('#more-posts')
                                .click(pushHistoryState);

                            $mainContent.find('#more-posts').click(loadMorePosts);

                            Prism.highlightElement();
                            scrollToContent();
                            displayRelatedPosts();
                            break;
                    }
                }
            });
        });

        // override all internal clicks and updates content asynchronously
        console.log($internalLinks.not('#more-posts'));
        $internalLinks.not('#more-posts').click(pushHistoryState);

    }

    $('#more-posts').click(loadMorePosts);

    function loadMorePosts(e) {
        e.preventDefault();
        var $more = $('#more-posts');
        var url = $more.attr('href');
        $more.remove();
        $.ajax({
            url: url + ' #main-content',
            cache: true,
            contentType: 'html',
            dataFilter: dataFilter,
            success: function (data, status) {
                switch (status) {
                    case 'error':
                        alert('Something terrible has happened. Sky is falling on your head.');
                        break;
                    case 'success':
                        $mainContent.append(data);
                        $mainContent.find('#more-posts').click(loadMorePosts);
                        break;
                }
            }
        });
    }

    // if on home, updates related posts in local storage
    // if on posts, displays related posts if available
    function displayRelatedPosts() {
        var related = JSON.parse(localStorage.getItem('relatedPosts'));
        var $nav = $('nav.related-posts ul');
        if (related.length > 0 && $nav.length > 0) {
            $nav.html(related);
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

    // removes all css and style tags from loaded content to prevent reinitialization
    function dataFilter(data, type) {
        type = type || 'text';
        if (type == 'html' || type == 'text') {
            data = data.replace(/<link.*?\/>/gi, '');
            data = data.replace(/<script.*?>([\w\W]*?)<\/script>/gi, '');
            data = $(data).filter('#main-content').children().parent();
            return data.html();
        }

        return data;
    }

    // pushes state to history
    function pushHistoryState(e) {
        e.preventDefault();
        var url = $(this).attr('href');
        var title = $(this).attr('title') || null;
        History.pushState({}, title, url);
    };
});
