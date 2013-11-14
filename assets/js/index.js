/*------------------------------------------------------------------
 Copyright (c) 2013 Viktor Bezdek - Released under The MIT License.

 Permission is hereby granted, free of charge, to any person
 obtaining a copy of this software and associated documentation
 files (the "Software"), to deal in the Software without
 restriction, including without limitation the rights to use,
 copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the
 Software is furnished to do so, subject to the following
 conditions:

 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 OTHER DEALINGS IN THE SOFTWARE.
 ----------------------------------------------------------------*/

jQuery(function ($) {
	var History = window.History;
	var siteURL = location.host;
	var internalLinksQuery = "a[href^='" + siteURL + "'], a[href^='/'], a[href^='./'], a[href^='../'], a[href^='#']";
	var $window = $(window);
	var $mainContent = $('#main-content');
	var $internalLinks = $(internalLinksQuery);
	var $relatedPostsContainer = $('#related-posts-container');
	var $logo = $('#site-head-content');
	var $header = $('#site-head');

	scrollToContent();

	// logo position
	$window.scroll(function () {
		var logoHeight = $logo.height() + 40;
		var headerHeight = $header.height() - $window.scrollTop();

		// if we need to position logo
		if (headerHeight > logoHeight) {
			var marginTop = (headerHeight / 2 - logoHeight / 2) + 'px';
			console.log(marginTop, $header.height(), $window.scrollTop());
			$logo.parent().css({paddingTop: marginTop});
		}

		// if header is completely gone
		var $secondaryTitle = $('#secondaryTitle');
		if (headerHeight <= 0) {
			if (!$secondaryTitle.hasClass('displayed')) {
				$secondaryTitle.addClass('displayed');
				$secondaryTitle.animate({top: '0px'}, 500);
			}
		}
		// if not
		else {
			if ($secondaryTitle.hasClass('displayed')) {
				$secondaryTitle.removeClass('displayed');
				$secondaryTitle.animate({top: '-200px'}, 500);
			}
		}

	});

	// create second header
	var siteName = $('#site-head h1').text().replace(/\s+/g, ' ');
	var slogan = $('#site-head h2').text().replace(/\s+/g, ' ');
	var header = $('<nav id="secondaryTitle"><div class="siteInfo"><h1>' + siteName + '</h1><h2>' + slogan + '</h2></div><a href="#top" id="scroll-to-top"></a></nav>');
	$('body').prepend(header);

	// scroll to top button
	$('#scroll-to-top').click(function (e) {
		e.preventDefault();
		$('html, body').animate({scrollTop: 0}, 200);
	});

	// resize does equalization of post titles
	$window.resize(function () {
		var articles = $('.post');//.find('h2.page-title');
		for (var x = 0; x < articles.length; x += 2) {
			console.log(x);
			var ea = $(articles[x]).find('.post-title');
			var oa = $(articles[x + 1]).find('.post-title');

			ea.css({height: 'auto', paddingTop: 0});
			oa.css({height: 'auto', paddingTop: 0});

			var eh = ea.innerHeight(), oh = oa.innerHeight();
			var th = Math.max(eh, oh) + 'px';
			var pt = Math.abs(eh - oh) / 2 + 'px';
			ea.css({height: th, paddingTop: eh < oh ? pt : 0});
			oa.css({height: th, paddingTop: eh > oh ? pt : 0});
		}
		$window.trigger('scroll');
	});

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

	// loads more posts to the page and
	// applies various transformations
	function loadMorePosts(e) {
		e.preventDefault();
		var $more = $('#more-posts');
		var url = $more.attr('href');
		$more.parent().remove();
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
						$mainContent.find('#more-posts');

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

	// updates layout after init
	setTimeout(function () {
		$window.trigger('scroll');
		$window.trigger('resize');
	}, 200);
});

// Google Analytics
/*
 if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {

 (function (i, s, o, g, r, a, m) {
 i['GoogleAnalyticsObject'] = r;
 i[r] = i[r] || function () {
 (i[r].q = i[r].q || []).push(arguments)
 }, i[r].l = 1 * new Date();
 a = s.createElement(o),
 m = s.getElementsByTagName(o)[0];
 a.async = 1;
 a.src = g;
 m.parentNode.insertBefore(a, m)
 })(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');

 ga('create', 'UA-XXXXXXXXXXXXX');
 ga('send', 'pageview');
 }
 */