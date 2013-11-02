jQuery(function ($) {
    var History = window.History;
    var siteURL = '127.0.0.1:2368'
    var internalLinksQuery = "a[href^='" + siteURL + "'], a[href^='/'], a[href^='./'], a[href^='../'], a[href^='#']";
    var $mainContent = $('#main-content');
    var $internalLinks = $(internalLinksQuery);
    var $relatedPostsContainer = $('#related-posts-container');

    scrollToContent();

    if ($relatedPostsContainer.length > 0) {
        var rp = $relatedPostsContainer.clone();
        $relatedPostsContainer.remove();
        localStorage.setItem('relatedPosts', JSON.stringify(rp.html()));
    } else {
        displayRelatedPosts();
    }

    if (!History.enabled) {
        return false;
    }

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

    $internalLinks.click(function (e) {
        e.preventDefault();
        var url = $(this).attr('href');
        var title = $(this).attr('title') || null;
        History.pushState({}, title, url);
    });

    function displayRelatedPosts() {
        var related = JSON.parse(localStorage.getItem('relatedPosts'));
        if (related.length > 0 && $('nav.related-posts ul').length > 0) {
            $('nav.related-posts ul').html(related);
        } else {
            $('nav.related-posts').remove();
        }
    }

    function scrollToContent() {
        var contentAnchor = $("span[name='post-content']");
        if (contentAnchor.length > 0) {
            $('html,body').animate({scrollTop: contentAnchor.offset().top - 30}, 'slow');
        } else {
            $('html,body').animate({scrollTop: 0}, 'slow');
        }
    }

});