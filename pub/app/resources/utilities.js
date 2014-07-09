/**
* A place to add custom functions to Underscore and Backbone
*/

// Used for filtering things before jake runs
if (typeof DEVMODE == 'undefined') {
    DEVMODE = true;
}

(function(_) {
    // ported from jQuery 1.8 for things that require checking the browser (as bad as it is)
    (function() {
        var matched, browser;

        // Use of jQuery.browser is frowned upon. http://api.jquery.com/jQuery.browser
        var uaMatch = function(ua) {
            ua = ua.toLowerCase();

            var match = /(chrome)[ \/]([\w.]+)/.exec(ua) ||
                /(webkit)[ \/]([\w.]+)/.exec(ua) ||
                /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua) ||
                /(msie) ([\w.]+)/.exec(ua) ||
                ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua) ||
                [];

            return {
                browser: match[1] || "",
                version: match[2] || "0"
            };
        };

        matched = uaMatch(navigator.userAgent);
        browser = {};

        if (matched.browser) {
            browser[matched.browser] = true;
            browser.version = matched.version;
        }

        // Chrome is Webkit, but Webkit is also Safari.
        if (browser.chrome) {
            browser.webkit = true;
        } else if (browser.webkit) {
            browser.safari = true;
        }

        jQuery.browser = browser;
    })();

    var clipHandler = null,
        clipHandlerTarget = null,
        flashDfds = {},

        domainWhitelist = 'grooveshark\\.com|wikipedia\\.org|facebook\\.com|twitter\\.com|musicbrainz\\.org|itunes\\.apple\\.com|amazon\\.com|play\\.google\\.com|' +
                                  'vimeo\\.com|youtube\\.com|pinterest\\.com|ustream\\.com|reddit\\.com|twitch\\.tv|kickstarter\\.com|indiegogo\\.com|cl\\.ly|ballercast\\.com|flattr\\.com|' + 
                                  'youtu\\.be|soundcloud\\.com',
        safeLinkRegex = new RegExp('(https?:\\/\\/)?(((?:[a-z0-9\\-]+\\.)*(?:' + domainWhitelist + '))(\/[a-z0-9_&=%#!;,\\+\\-\\?\\.\\~\\[\\]\\/]+)?)', 'gi');
    
    /*
    * Functions to mixin to Underscore
    */
    _.mixin({
        /**
        * @function defined
        * shorthand for testing if variable is defined of not
        * @return boolean
        */
        defined: function(subject) {
            return subject !== undefined && subject !== null;
        },
        /**
        * @function notDefined
        * shorthand for testing if variable is defined of not
        * @return boolean
        */
        notDefined: function(subject) {
            return subject === undefined || subject === null;
        },
        
        /**
        * @function orEqual
        * for use in functions that take a set number of args and want to set default values.
        * @return The value passed in or the fallback if value is undefined
        */
        orEqual: function(value, fallback) {
            return (_.defined(value) ? value : fallback);
        },
        
        /**
        * @function orEqualEx
        * like orEqual, but takes more parameters and returns the first defined one
        * @return The first defined value in the list
        */
        orEqualEx: function() {
            var i, len = arguments.length;
            for (i=0; i<len; i++) {
                if (_.defined(arguments[i])) {
                    return arguments[i];
                }
            }
            
            return arguments[len-1];
        },

        isInstance: function(object, constructor) {
            if (DEVMODE && !constructor) {
                console.log('_.isInstance called with nonexistant constructor', object, constructor);
                if (console.trace) {
                    console.trace();
                }
            }
            return constructor && object instanceof constructor;
        },

        isRetina: function() {
            return window.devicePixelRatio && window.devicePixelRatio >= 2;
        },

        /**
        * @function getItemType
        * take an object and check for IDs to determine the type of content
        * @return type string
        */
        getItemType: function(data) {
            var type;
            switch (data.idAttribute) {
                case 'PlaylistID':
                    type = 'playlist';
                    break;
                case 'SongID':
                case 'queueSongID':
                case 'playlistSongID':
                case 'broadcastSongID':
                case 'CalloutID':
                    type = 'song';
                    break;
                case 'UserID':
                    type = 'user';
                    break;
                case 'AlbumID':
                    type = 'album';
                    break;
                case 'ArtistID':
                    type = 'artist';
                    break;
                case 'VideoID':
                    type = 'video';
                    break;
                case 'EventID':
                    type = 'event';
                    break;
                case 'TagID':
                    type = 'tag';
                    break;
                case 'BroadcastID':
                    type = 'broadcast';
                    break;
                case 'radioID':
                    type = 'radio';
                    break;
            }

            return type;
        },
        
        /**
        * @function getCollectionType
        * take a collection and check for IDs to determine the type of content
        * @return type string
        */
        getCollectionType: function(collection) {
            if (collection && collection.models && collection.models.length) {
                return this.getItemType(collection.models[0]);
            } else if (collection instanceof Array) {
                return this.getItemType(collection[0]);
            } else {
                return 'unknown';
            }
        },
        
        /**
        * @function cleanUrl
        * create basic urls for main object (song, album, artist, playlists, users)
        * @return url string
        */
        cleanUrl: function(name, id, type, token, subpage) {
            var tmp, url = '';
            if (isNaN(parseInt(id, 10))) {
                tmp = id;
                id = name;
                name = tmp;
            }
            url = '';
            name = name || "Unknown";
            name = _.cleanNameForURL(name, (type != "user"));
            type = type.toLowerCase();
            subpage = _.orEqual(subpage, '');
            if (subpage.length) {
                subpage = "/"+subpage;
            }
            
            if (type === 's' && !token) {
                return '#!/notFound';
            }
            
            if (token) {
                if (type == "song") {
                    type = "s";
                }
                url = "#!/"+type+"/"+name+"/"+token+subpage+"?src=5";
            } else {
                url = "#!/"+type+"/"+name+"/"+id+subpage;
            }

            return url;
        },

        findWhere: function(list, properties) {
            return _.where(list, properties)[0];
        },

        filterUndefined: function(list) {
            return _.filter(list, function(item) {
                return _.defined(item);
            });
        },
        
        makeUrlFromPathName: function(pathName, subpage) {
            subpage = _.orEqual(subpage, '');
            if (subpage.length) {
                subpage = "/"+subpage;
            }
            
            return "#!/"+pathName+subpage;
        },
        
        makeUrlForShare: function(service, type, item) {
            var url = encodeURIComponent('http://grooveshark.com'+ item.toUrl().replace('#!', ''));
            var title = '';
            
            switch (type) {
                case 'song':
                    title = item.get('ArtistName') + ' - ' + item.get('SongName');
                break;
                case 'playlist':
                    title = item.get('PlaylistName') + ' by ' + item.get('UserName');
                break;
                case 'album':
                    title = item.get('AlbumName') + ' by ' + item.get('ArtistName');
                break;
                case 'artist':
                    title = item.get('ArtistName');
                break;
            }
            title = encodeURIComponent(title);
                
            switch (service) {
                case 'reddit':
                    return 'http://www.reddit.com/submit?title=' + title + '&url=' + url;
                
                case 'stumbleupon':
                    return 'http://www.stumbleupon.com/submit?url=' + url;
                
            }
            return '';
        },
        
        cleanNameForURL: function(name, capWords) {
            capWords = _.orEqual(capWords, true);
            if (capWords) {
                name = _.ucwords(name, true);
            }
            name = (''+name).replace(/&/g, " and ")
                       .replace(/#/g, " number ")
                       .replace(/[^\w]/g, "_");


            name = name.replace(/\s+/g, "_");
            name = encodeURIComponent(name);
            name = name.replace(/_+/g, "+");
            name = name.replace(/^\++|\++$/g, '');

            if (name === '') {
                name = '-';
            }

            return name;
        },

        cleanHash: function(hash) {
            hash = hash || '';
            var i = hash.indexOf('#');
            if (i != -1) {
                var addBang = hash.indexOf('#!') !== i;
                if (addBang) {
                    return '#!' + hash.substring(i + 1);
                }

                return hash.substring(i);
            }
            i = hash.indexOf('/');
            if (i !== 0) {
                return "#!/" + hash;
            }

            return "#!" + hash;
        },

        truncateNumber: function(num, threshold) {
            threshold = _.orEqual(threshold, 1e3);
            if (num >= threshold) {
                if (num >= 1e6) {
                    return _.addCommaSeparators(parseFloat((num / 1e6).toFixed(1))) + 'M';
                }
                if (num >= 1e3) {
                    return _.addCommaSeparators(parseFloat((num / 1e3).toFixed(1))) + 'k';
                } 
            }
            return _.addCommaSeparators(num);
        },

        getString: function(key, data) {
            return $.localize.getStringWithVars(key, data);
        },

        getStringPluralized: function(singularKey, pluralKey, count, params) {
            return _.getString(count === 1 ? singularKey : pluralKey, params); 
        },

        ucwords: function(str, skipLower) {
            if (!skipLower) {
                //when generating urls the backend doesn't lowercase first
                str = (str + '').toLowerCase();
            }
            return (str + '').replace(/^(.)|\s(.)|&(.)/g, function ($1) { return $1.toUpperCase();});
        },

        /**
         * @function millisToSecondsMinutes
         * returns {String} with millis converted to seconds:minutes
         */
        millisToMinutesSeconds: function(millis, precision) {
            precision = _.orEqual(precision, false);
            var sec = Math.round((millis ? millis : 0)/1000);
            var min = Math.floor(sec/60);
            sec = sec - (min*60);
            
            if (sec < 10) {
                sec = "0" + sec;
            }
            if (min < 10 && precision) {
                min = '0' + min;
            }
            
            return min + ":" + sec;
        },

        addCommaSeparators: function addCommas(nStr) {
            var commaRegex = /(\d+)(\d{3})/;
            nStr += '';
            while (commaRegex.test(nStr)) {
                nStr = nStr.replace(commaRegex, '$1' + ',' + '$2');
            }
            return nStr;
        },

        dobToAge: function(year, month, day) {
            var birthDate, dateDiff, ageDays, ageYears;
            if (year && _.notDefined(month) && _.notDefined(day)) {
                birthDate = new Date(year);
            } else {
                birthDate = new Date(year, month, day);
            }
            dateDiff = (new Date()).getTime() - birthDate.getTime();
            ageDays = dateDiff / 86400000;
            ageYears = Math.floor(ageDays / 365.24);
            return isNaN(ageYears) ? false : ageYears;
        },

        getDateFormatChars: function(date) {
            var day = date.getDay(),
                month = date.getMonth();
            return {
                D: _.daysOfTheWeek[day].substr(0, 3),
                M: _.monthsOfTheYear[month].substr(0, 3),
                j: date.getDate(),
                Y: date.getFullYear()
            };
        },
        
        getCDNImage: function(image) {
            if (!image) return '';
            return [gsConfig.assetHost, '/webincludes/images/', image].join('');
        },

        // @TODO update this
        globalDragProxyMousewheel: function(ev, delta) {
            // translate mousewheel scroll event to parent
            var $shortcuts = $('#shortcuts_scroll .viewport');
            if ($shortcuts.within(ev.clientX, ev.clientY).length > 0) {
                $shortcuts.scrollTop( $shortcuts.scrollTop() - (82 * delta) );
                return;
            }
            
            var $queueWrapper = $('#queue_list_window');
            if ($queueWrapper.within(ev.clientX, ev.clientY).length > 0) {
                $queueWrapper.scrollLeft( $queueWrapper.scrollLeft() - (82 * delta) );
                return;
            }
            
            var $sidebarWrapper = $("#sidebar_pinboard .viewport");
            if ($sidebarWrapper.within(ev.clientX, ev.clientY).length > 0) {
                $sidebarWrapper.scrollTop( $sidebarWrapper.scrollTop() - (82 * delta) );
                return;
            }
            
            var $grid = $('#grid'),
                view = $grid.data('view'),
                $gridViewport;
            if (view && view.$scrollElement) {
                $gridViewport = view.$scrollElement;
            } else if ($grid.length) {
                $gridViewport = $grid.find('.grid-viewport');
            } else {
                $gridViewport = $('.grid-viewport');
                if ($gridViewport.length) {
                    $gridViewport = $($gridViewport[0]);
                }
            }
            if ($gridViewport.within(ev.clientX, ev.clientY).length > 0) {
                $gridViewport.scrollTop( $gridViewport.scrollTop() - (82 * delta) );
            }
        },
        
        // Everything has the same on drag code so lets keep it in one place
        globalDragHandler: function(ev, dd) {
            var $proxy = $(dd.proxy),
                scrollTop = $(document).scrollTop(),
                scrollLeft = $(document).scrollLeft(),
                approxX, approxY, element, scroll,
                wasScrolling, startScrolling, doScroll;

            dd.clientX = ev.clientX;
            dd.clientY = ev.clientY;
            dd.proxyOffsetX = _.orEqual(dd.proxyOffsetX, 0);
            dd.proxyOffsetY = _.orEqual(dd.proxyOffsetY, 0);

            $proxy.css({'top': ev.clientY - dd.proxyOffsetY + scrollTop, 'left': ev.clientX - dd.proxyOffsetX + scrollLeft});

            // begin scrolling the best matching drop target or element
            approxX = ev.clientX - 20;
            approxY = ev.clientY;

            if (approxX < 0) {
                approxX = ev.clientX;
                approxY = ev.clientY - 20;
            }

            element = $(document.elementFromPoint(approxX, approxY));

            if (element && element.length) {
                scroll = _.getScrollableParent(element);
            }

            dd.lastEvent = ev;

            wasScrolling = dd.dragLastScroll && dd.dragLastScroll.length && scroll && dd.dragLastScroll[0] == scroll[0];

            if (dd.dragScroll && dd.dragScroll.length && scroll && scroll.length && dd.dragScroll[0] != scroll[0]) {
                clearTimeout(dd.dragScrollTimeout);
                dd.dragScroll = null;
                dd.dragLastScroll = null;
            }

            startScrolling = scroll && scroll.length && !dd.dragScroll;

            if (startScrolling && !dd.dragScroll) {
                doScroll = function() {
                    var ev = dd.lastEvent,
                        chunk = 60,
                        chunkTop = scroll.find('.grid-toolbar-inner').height() + chunk,
                        scrollTime = wasScrolling ? 50 : 500,
                        totalHeight = scroll[0].scrollHeight,
                        visibleHeight = scroll.outerHeight(),
                        objCoords = scroll.offset() || {top: 0, left: 0},
                        scrollTop = scroll.scrollTop(),
                        currBottom = visibleHeight + scrollTop,
                        scrollAccelTop = Math.max(0, (objCoords.top - window.pageYOffset + chunkTop) - ev.clientY),
                        scrollAccelBottom = Math.max(0, ev.clientY - (objCoords.top - window.pageYOffset + visibleHeight - chunk)),
                        powerDivider = 1000,
                        powerMax = 1.0,
                        powerMin = 0.5,
                        accelPower = Math.max(powerMin, Math.min(powerMax, totalHeight / powerDivider)),
                        changeScrollTop;

                    if (scroll[0] === document) {
                        objCoords = $(ev.currentTarget).offset() || {top: 0, left: 0};
                        totalHeight = ev.currentTarget.scrollHeight + objCoords.top;
                        scrollTop = scroll[0].body.scrollTop;
                        currBottom = $(window).height() + scrollTop;
                        scrollAccelTop = (scrollTop > objCoords.top - chunkTop) && Math.max(0, ($("#header").height() + chunkTop) - (ev.clientY));
                        scrollAccelBottom = Math.max(0, ev.clientY - ($(window).height() - chunk));
                        accelPower = Math.max(powerMin, Math.min(powerMax, totalHeight / powerDivider));
                    }

                    if (totalHeight) {
                        if (scrollTop > 0 && scrollAccelTop > 0) {
                            changeScrollTop = scrollTop - Math.pow(scrollAccelTop, accelPower);
                        } else if (totalHeight > currBottom && scrollAccelBottom > 0) {
                            changeScrollTop = scrollTop + Math.pow(scrollAccelBottom, accelPower);
                        }
                    }

                    if (changeScrollTop) {
                        if (wasScrolling) {
                            scroll.scrollTop(changeScrollTop);
                        }
                        $proxy.css('top', dd.clientY + $(document).scrollTop());
                        dd.dragScrollTimeout = setTimeout(doScroll, scrollTime);
                        dd.dragScroll = scroll;
                        dd.dragLastScroll = scroll;
                        wasScrolling = true;
                    } else {
                        dd.dragScrollTimeout = null;
                        dd.dragScroll = null;
                        dd.dragLastScroll = null;
                    }
                };
            }

            if (doScroll) {
                doScroll();
            }

            var overDrop = false,
                overThisDropCont, $dropCont, lastAllowedDropTarget, $grid;
            //console.log('ALL THE DROPS', dd.available);
            _.forEach(dd.available, function(grid) {
                $grid = $(grid);
                $dropCont = _.getScrollableParent($grid);
                //if the scrollable container is not the document, the drop container should be the scrollable element, not the grid
                if ($dropCont[0] === document) {
                    $dropCont = $grid;
                }
                overThisDropCont = $dropCont.within(ev.clientX, ev.clientY).length > 0;
                //console.warn('are we over it??', $dropCont, $grid, overThisDropCont, ev.clientX, ev.clientY, $grid.data('valid-drop'));
                if (overThisDropCont && _.isFunction(grid.updateDropOnDrag)) {
                    grid.updateDropOnDrag(ev, dd);
                }
                if (!overDrop && overThisDropCont && $grid.data('valid-drop')) {
                    overDrop = true;
                    lastAllowedDropTarget = grid;

                //if the container says it's okay to drop, but a child says it isn't then it isn't dropable
                } else if (overDrop && overThisDropCont && lastAllowedDropTarget && !$grid.data('valid-drop') && $.contains(lastAllowedDropTarget, grid)) {
                    overDrop = false;
                    lastAllowedDropTarget = null;
                }
            });
            if (overDrop) {
                $(dd.proxy).addClass('valid').removeClass('invalid');
            } else {
                $(dd.proxy).addClass('invalid').removeClass('valid');
            }
        },

        // Clean up the drag handler
        globalDragCleanup: function(ev, dd) {
            $('.dragging').removeClass('dragging');
            if (dd.dragScrollTimeout) {
                clearTimeout(dd.dragScrollTimeout);
                dd.dragScrollTimeout = null;
            }
            $(dd.proxy).remove();
        },
        
        randomizeArray: function(origArray) {
            var orig = origArray.concat(),  //make a copy first so we dont destroy original
                newArr = [],
                i, obj;
            
            while (orig.length) {
                i = Math.floor(Math.random() * orig.length);
                obj = orig.splice(i, 1)[0];
                newArr.push(obj);
            }
            
            return newArr;
        },

        /**
         * @function browerDetect
         * returns {Object} just a wrapper to clean up after $.browser
         */
        browserDetect: function() {
            var b = {
                browser: '',
                version: 0
            };

            var userAgent = navigator.userAgent.toLowerCase();
            $.browser.chrome = /chrome/.test(navigator.userAgent.toLowerCase());
            $.browser.adobeair = /adobeair/.test(navigator.userAgent.toLowerCase());
            var version = 0;

            // Is this a version of IE?
            if ($.browser.msie) {
                userAgent = $.browser.version;
                userAgent = userAgent.substring(0,userAgent.indexOf('.'));
                b.browser = 'msie';
                b.version = parseFloat(userAgent);
            }

            // Is this a version of Chrome?
            if ($.browser.chrome && !$.browser.msie) {  //both chrome and msie are true in ChromeFrame
                userAgent = userAgent.substring(userAgent.indexOf('chrome/') +7);
                userAgent = userAgent.substring(0,userAgent.indexOf('.'));
                b.browser = 'chrome';
                b.version = parseFloat(userAgent);
                // If it is chrome then jQuery thinks it's safari so we have to tell it it isn't
                $.browser.safari = false;
            }
            
            // Is this the desktop app?
            if ($.browser.adobeair) {
                userAgent = userAgent.substring(userAgent.indexOf('adobeair/') +9);
                userAgent = userAgent.substring(0,userAgent.indexOf('.'));
                b.browser = 'adobeair';
                b.version = parseFloat(userAgent);
                // If it is AIR then jQuery thinks it's safari so we have to tell it it isn't
                $.browser.safari = false;
            }

            // Is this a version of Safari?
            if ($.browser.safari) {
                userAgent = userAgent.substring(userAgent.indexOf('safari/') +7);
                userAgent = userAgent.substring(0,userAgent.indexOf('.'));
                b.browser = 'safari';
                b.version = parseFloat(userAgent);
            }

            // Is this a version of Mozilla?
            if ($.browser.mozilla) {
            //Is it Firefox?
                if(navigator.userAgent.toLowerCase().indexOf('firefox') != -1) {
                    userAgent = userAgent.substring(userAgent.indexOf('firefox/') +8);
                    userAgent = userAgent.substring(0,userAgent.indexOf('.'));
                    b.browser = 'firefox';
                    b.version = parseFloat(userAgent);
                }
                // If not then it must be another Mozilla
                else{
                    b.browser = 'mozilla';
                    b.version = parseFloat($.browser.version);
                }
            }

            // Is this a version of Opera?
            if ($.browser.opera) {
                userAgent = userAgent.substring(userAgent.indexOf('version/') +8);
                userAgent = userAgent.substring(0,userAgent.indexOf('.'));
                b.browser = 'opera';
                b.version = parseFloat(userAgent);
            }

            return b;
        },
        
        getModelSort: function(key, asc) {
            var keyLookup = false; 
            //If 3, we're passing in a key map by currying with _.bind
            if (arguments.length == 3) {
                keyLookup = arguments[0];
                key = arguments[1];
                asc = arguments[2];
            }

            asc = asc ? 1 : -1;
            if (keyLookup) {
                key = keyLookup[key];
                if (!key) {
                    return false;   //Make sure the key is in the table
                }
            }

            if (!_.isArray(key)) {
                key = [key];
            }

            return function(a, b) {
                for (i = 0; i < key.length; i++) {
                    var ak = a.get(key[i]),
                        bk = b.get(key[i]);
                        
                    if (key[i] === 'TSAdded') {
                        if (typeof ak === 'undefined') {
                            ak = a.get('TSFavorited');
                        }
                        if (typeof bk === 'undefined') {
                            bk = b.get('TSFavorited');
                        }
                    } else if (key[i] === 'TrackNum') {
                        ak = _.toInt(ak);
                        bk = _.toInt(bk);
                    }
                    if (_.isString(ak)) { ak = ak.toLowerCase(); }
                    if (_.isString(bk)) { bk = bk.toLowerCase(); }
                    
                    if (ak > bk) { return asc; }
                    if (ak < bk) { return -1 * asc; }
                }
                return 0;
            };
        },
        
        /**
         * @function localeTag
         * @param {String} element name. eg - 'span'
         * @param {String} the locale key to use for the tag. eg - 'SHARE_ALBUM'
         * @param {Object} optional html attributes to be added to tag. eg - {"class": "right"}
         * @param {Object} optional data needed for translation
         * @return {String} a localization-ready html tag
         */
        localeTag: function(el, localeKey, attributes, data) {
            attributes = attributes || {};
            attributes['data-translate-text'] = localeKey;
            var text = $.localize.getString(localeKey);

            if (data) {
                text = $('<span></span>').dataString(text, data).render();
            }

            return [
                _.tag(el, attributes),
                text,
                _.tagEnd(el)
            ].join('');
        },
        /**
         * @function tag
         * creates an html tag with optional attributes. mostly to be used by other helpers
         * @param {String} element name. eg - 'span'
         * @param {Object} optional html attributes to be added to tag. eg - {"class": "right"}
         * @param {String} optional way to end the tag. eg - '/>'. Defaults to '>'
         * @return {String} an html tag
         */
        tag: function(el, attributes, end) {
            var parts = ['<' + el];
            _.forEach(attributes, function(attribute, key) {
                parts.push(' ' + key + '=' + '"' + attribute + '"');
            });
            parts.push(end || '>');
            return parts.join('');
        },
        /**
         * @function tagEnd
         * creates the end of an html tag. mostly to be used by other helpers
         * @param {String} element name. eg - 'span'
         * @return {String} the tag end string
         */

        tagEnd: function(el) {
            return ['</', el, '>'].join('');
        },

        setCasing: function(str, uppercase) {
            if (uppercase) {
                return str.replace(/\w\S*/g, function(txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
            } else {
                return str.toLowerCase();
            }    
        },

        /**
         * Gets centered coordinates for a popup window
         * @param width
         * @param height
         * @return [x,y]
         */
        getCenteredCoordinates: function(width, height) {
            var innerWidth = 0,
                innerHeight = 0;
            if ('innerWidth' in window) {
                // For non-IE
                innerWidth = window.innerWidth;
                innerHeight = window.innerHeight;
            } else {
                var elem;
                // For IE,
                if (('BackCompat' === window.document.compatMode) && ('body' in window.document)) {
                    elem = window.document.body;
                } else if ('documentElement' in window.document) {
                    elem = window.document.documentElement;
                }
                if (elem !== null) {
                    innerWidth = elem.offsetWidth;
                    innerHeight = elem.offsetHeight;
                }
            }
            var posX = 0,
                posY = 0;
            if ('screenLeft' in window) {
                // IE-compatible variants
                posX = window.screenLeft;
                posY = window.screenTop;
            } else if ('screenX' in window) {
                // Firefox-compatible
                posX = window.screenX;
                posY = window.screenY;
            }
            var xPos = posX + Math.max(0, Math.floor((innerWidth - width) / 2));
            var yPos = posY + Math.max(0, Math.floor((innerHeight - height) / 2));
            if (xPos < 0) { //fix for secondary monitor on the left and different size
                xPos += screen.width;
            }
            return [xPos, yPos];
        },

        /**
         * Gets or sets cookies
         * @param name
         * @param value (null to delete or undefined to get)
         * @param options (domain, expire (in days))
         * @return value or true
         */
        cookie: function(name, value, options) {
            if (typeof value === "undefined") {
                var n, v,
                    cookies = document.cookie.split(";");
                for (var i = 0; i < cookies.length; i++) {
                    n = $.trim(cookies[i].substr(0,cookies[i].indexOf("=")));
                    v = cookies[i].substr(cookies[i].indexOf("=")+1);
                    if (n === name){
                        return unescape(v);
                    }
                }
            } else {
                options = options || {};
                if (!value) {
                    value = "";
                    options.expires = -365;
                } else {
                    value = escape(value);
                }
                if (options.expires) {
                    var d = new Date();
                    d.setDate(d.getDate() + options.expires);
                    value += "; expires=" + d.toUTCString();
                }
                if (options.domain) {
                    value += "; domain=" + options.domain;
                }
                if (options.path) {
                    value += "; path=" + options.path;
                }
                document.cookie = name + "=" + value;
            }
        },

        /**
        * @function mapValues
        * build a new object by transforming a given object's values
        * @return object
        */
        mapValues: function(obj, fn) {
            var newObj = {};
            _.each(obj, function(val, key) {
                newObj[key] = fn(val, key);
            });
            return newObj;
        },

        /**
        * @function padLeft
        * pads the left part of a string with a given character
        * @return string
        */
        padLeft: function(str, len, ch) {
            var padding = new Array(len + 1).join(ch); // repeating string of the given character
            return padding.substring(0, padding.length - str.length) + str;
        },

        getNormalizedAuthorForCommentResponse: function(object, itemID, typeID) {
            var author = null;
            if (object.artist) {
                author = object.artist;
            } else if (object.user && !object.FromOwner) {
                author = object.user;
            } else if ((!object.user || object.FromOwner) && itemID && typeID) {
                //the owner of the page commented
                if (typeID === GS.Models.Comment.COMMENT_PAGE_TYPES.USER) {
                    author = GS.Models.User.getCached(itemID);
                } else if (typeID === GS.Models.Comment.COMMENT_PAGE_TYPES.ARTIST) {
                    author = GS.Models.Artist.getCached(itemID);
                } else if (typeID === GS.Models.Comment.COMMENT_PAGE_TYPES.ALBUM) {
                    //if on a album page then the author is the artist
                    var m = GS.Models.Album.getCached(itemID);
                    if (m) {
                        author = GS.Models.Artist.getCached(m.get('ArtistID'));
                    }
                } else if (typeID === GS.Models.Comment.COMMENT_PAGE_TYPES.PLAYLIST) {
                    //if on a playlist page then the author is the owner of the playlist
                    var p = GS.Models.Playlist.getCached(itemID);
                    if (p) {
                        author = GS.Models.User.getCached(p.get('UserID'));
                    }
                } else if (typeID === GS.Models.Comment.COMMENT_PAGE_TYPES.SONG) {
                    //if on a song page then the author is the artist
                    var s = GS.Models.Song.getCached(itemID);
                    if (s) {
                        author = GS.Models.Artist.getCached(s.get('ArtistID'));
                    }
                }
            }

            //defaults
            var authorObject = {
                Name: '',
                getPicture: function(size){ return GS.Models.User.artPath + size + '_user.png'; },
                Url: '',
                UserID: null
            };
            if (author instanceof Backbone.Model) {
                authorObject.Name = _.orEqualEx(author.get('Name'), author.get('ArtistName'), '');
                authorObject.getPicture = function(size) { return _.orEqual(author.getImageURL(size), GS.Models.User.artPath + size + '_user.png');};
                authorObject.URL = _.orEqual(author.toUrl(), '#');
                authorObject.UserID = author.get('UserID');
            }

            return authorObject;
        },

        //excepts timestamp in seconds
        getFormattedDate: function(timestamp) {
            if (!timestamp) {
                return "0";
            }
            var time = timestamp * 1000,
                now = Date.now(), d;
            if (now - time < -1 * 24 * 3600 * 1000) {
                var daysAhead = Math.floor((time - now) / (24 * 3600 * 1000));
                if (daysAhead == 1) {
                    return _.getString("ONE_DAY");
                } else {
                    return _.getString("NUM_DAYS", {days: daysAhead});
                }
            } else if (now - time < -1 * 2 * 60 * 60 * 1000) {
                var hoursAhead = Math.floor((time - now) / (3600 * 1000));
                return _.getString("NUM_HOURS", {hours: hoursAhead});
            } else if (now - time < 0) {
                var minutesAhead = Math.floor((time - now) / (60 * 1000)) || 1;
                if (minutesAhead == 60) {
                    return _.getString("ONE_HOUR");
                } else if (minutesAhead == 1) {
                    return _.getString("ONE_MINUTE", {minutes: minutesAhead});
                } else {
                    return _.getString("NUM_MINUTES", {minutes: minutesAhead});
                }
            } else if (now - time < 2 * 60 * 1000) {
                return _.getString("SECONDS_AGO");
            } else if (now - time < 60 * 60 * 1000) {
                return _.getString("MINUTES_AGO", {minutes: Math.floor((now - time) / (60 * 1000))});
            } else if (now - time < 24 * 3600 * 1000) {
                var hours = Math.floor((now - time) / (3600 * 1000));
                if (hours > 1) {
                    return _.getString("HOURS_AGO", {hours: hours});
                } else {
                    return _.getString("HOUR_AGO");
                }
            } else if (now - time < 14 * 24 * 3600 * 1000) {
                var days = Math.floor((now - time) / (24 * 3600 * 1000));
                if (days > 1) {
                    return _.getString("DAYS_AGO", {days: days});
                } else {
                    d = new Date();
                    d.setTime(time);
                    var string = "",
                        hour = d.getHours();
                    if (hour > 12) {
                        string += " PM";
                        hour -= 12;
                    } else if (hour === 12) {
                        string += " PM";
                    } else {
                        string += " AM";
                        if (hour === 0) {
                            hour = 12;
                        }
                    }
                    var minute = d.getMinutes();
                    if (minute < 10) {
                        minute = "0" + minute;
                    }

                    return _.getString("YESTERDAY");
                }
            } else {
                d = new Date();
                d.setTime(time);
                return _.getString("OVER_A_WEEK_AGO", {
                    day: _.getString('WEEK_DAYS').split(",")[d.getDay()],
                    date: _.getString('MONTHS').split(",")[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear()
                });
            }
        },

        setClipboardHandler: function(el, text, callback) {
            if (el.length) {
                el = el[0];
            }
            var $el = $(el),
                onClipboardComplete = function() {
                    if (clipHandler && callback) {
                        callback.call();
                    } else if (clipHandler) {
                        clipHandlerTarget.addClass('copied').text(_.getString('SHARE_COPIED'));
                        clipHandler.reposition(); //need to resize because button text changed
                    } else if (DEVMODE && console.trace) {
                        console.log('reached clipHandler complete without a clipHandler', clipHandler);
                        console.trace();
                    }
                };

            if (!clipHandler) {
                clipHandler = new ZeroClipboard({
                    moviePath: gsConfig.assetHost + '/webincludes/flash/ZeroClipboard.swf?v=1',
                    forceHandCursor: true,
                    useNoCache: false,
                    allowScriptAccess: "always",
                    hoverClass: "hover",
                    activeClass: "active",
                    trustedOrigins: [window.location.protocol + "//" + window.location.host]
                });
                //create function on clipHandler to magically re-attach to a new element
                clipHandler.reAttach = function($e) {
                    if (!$e) {
                        this.resetBridge();
                        return;
                    }
                    this.setCurrent($e);
                    clipHandlerTarget = $e;
                    this.setText($e.data('clipboardText'));
                };
            }

            clipHandler.on('complete', onClipboardComplete);

            function onMouseover(ev) {
                clipHandler.reAttach($(ev.currentTarget));
            }
            $el.data('clipboardText', text).on('mouseover', onMouseover);

            return {
                destroy: function() {
                    $el.off('mouseover', onMouseover);
                    clipHandlerTarget = null;
                    clipHandler.resetBridge();
                    clipHandler.off('complete', onClipboardComplete);
                }
            };
        },

        resizeClipboardHandler: function(useScroll) {
            if (clipHandler) {
                clipHandler.reAttach(clipHandlerTarget);
            }
        },

        getScrollableParent: function(a) {
            var cached = a.data('scrollParent');
            if (cached) {
                return cached;
            }

            var origA = a,
                scrolling = ['auto', 'scroll'],
                docBody = document.body;
            while (a.length && a[0] !== docBody && _.indexOf(scrolling, a.css('overflow-x')) == -1 && _.indexOf(scrolling, a.css('overflow-y')) == -1) {
                a = a.parent();
            }
            //must use document even if body is scrolling
            if (!a.length || a[0] === docBody) {
                a = $(document);
            }
            origA.data('scrollParent', a);
            return a;
        },
        
        getCombinedScrollValuesParents: function($a) {
            var scrollVals = {top: 0, left: 0, parents: []};
            do {
                $a = _.getScrollableParent($a.parent());
                if ($a.length < 1) {
                    break;
                }
                scrollVals.parents.push($a);
                scrollVals.top += $a.scrollTop();
                scrollVals.left += $a.scrollLeft();
            } while ($a[0] && $a[0] !== document);
            return scrollVals;
        },


        //used for drag drop $viewport positioning fixes
        //requires parent to at least have position: relative
        getCombinedPositionToParent: function($a, $parent) {
            var posVals = {top: 0, left: 0},
                pos;
            //if the element isn't visible then we can't do this because browsers suck
            if (!$a.is(':visible')) {
                return posVals;
            }
            do {
                if ($a[0] === document || $a[0] === document.documentElement) {
                    if (DEVMODE) {
                        console.error('getCombinedPositionToParent was passed a parent without position: relative!');
                        if (console.trace) {
                            console.trace();
                        }
                    }
                    return {top: 0, left: 0};
                }
                pos = $a.position();
                posVals.top += pos.top;
                posVals.left += pos.left;
                $a = $a.offsetParent();
            } while ($a[0] && $a[0] !== $parent[0]);
            return posVals;
        },

        makeSafeLinks: function(message) {
            if (!message) {
                return message;
            }
            message = _.escape(message);
            message = message.replace(safeLinkRegex, function(match, protocol, url, domain, path) {
                var target = "_blank";
                if (domain === "grooveshark.com") {
                    if (path) {
                        if (path.substr(0,2) !== "/#") {
                            path = '#!' + path;
                        }
                        target = '';
                        url = path;
                    } else { //don't do anything because it is just "grooveshark.com"
                        return match;
                    }
                } else if (domain === "help.grooveshark.com") {
                    url = "http://" + url;
                } else {
                    url = (protocol ? protocol : 'http://') + url;
                }
                return '<a href="' + url + '" class="inner-comment-link" target="' + target + '" title="' + match + '">' + match + '</a>';
            });
            return message;
        },
        
        startsWith: function(str, search) {
            return str.slice(0, search.length).toLowerCase() === search.toLowerCase();
        },

        endsWith: function(str, search) {
            return str.slice(-search.length).toLowerCase() === search.toLowerCase();
        },
        
        // Suck, but feedback form needs it
        getCountryFromID: function(id) {
            if (this.countries) {
                var c = _.find(this.countries, function(c) {
                    return c.code === id;
                });
                if (c) {
                    return c.name;
                }
            }
            return '';
        },
        
        checkEmailMisspells: function(email) {
            var domains = ["yahoo.com", "google.com", "hotmail.com", "gmail.com", "me.com", "aol.com", "mac.com",
                          "live.com", "comcast.net", "googlemail.com", "msn.com", "hotmail.co.uk", "yahoo.co.uk",
                          "facebook.com", "verizon.net", "sbcglobal.net", "att.net", "gmx.com", "mail.com"]; 
            var threshold = 2;
            var parts = email.split('@');
            if (parts < 2 || !parts[1]) {
                return {error: "Not an valid e-mail."};
            }

            var closestDomain = findClosestDomain(parts[1], domains);

            if (closestDomain) {
                return { address: parts[0], domain: closestDomain, full: parts[0] + "@" + closestDomain };
            } else {
                return false;
            }

            function findClosestDomain(domain, domains) {
                var dist;
                var minDist = 99;
                var closestDomain = null;

                for (var i = 0; i < domains.length; i++) {
                    dist = stringDistance(domain, domains[i]);
                    if (dist < minDist) {
                        minDist = dist;
                        closestDomain = domains[i];
                    }
                }

                if (minDist <= threshold && closestDomain !== null && closestDomain !== domain) {
                    return closestDomain;
                } else {
                    return false;
                }
            }

            function stringDistance(s1, s2) {
                // sift3: http://siderite.blogspot.com/2007/04/super-fast-and-accurate-string-distance.html
                if (s1 === null || s1.length === 0) {
                    if (s2 === null || s2.length === 0) {
                        return 0;
                    } else {
                        return s2.length;
                    }
                }

                if (s2 === null || s2.length === 0) {
                    return s1.length;
                }

                var c = 0;
                var offset1 = 0;
                var offset2 = 0;
                var lcs = 0;
                var maxOffset = 5;

                while ((c + offset1 < s1.length) && (c + offset2 < s2.length)) {
                    if (s1[c + offset1] == s2[c + offset2]) {
                        lcs++;
                    } else {
                        offset1 = 0;
                        offset2 = 0;
                        for (var i = 0; i < maxOffset; i++) {
                            if ((c + i < s1.length) && (s1[c + i] == s2[c])) {
                                offset1 = i;
                                break;
                            }
                            if ((c + i < s2.length) && (s1[c] == s2[c + i])) {
                                offset2 = i;
                                break;
                            }       
                        }
                    }
                    c++;
                }
                return (s1.length + s2.length) /2 - lcs;
            }
        },

        inputLimitCountdown: function($source, limit, $counter, preventTyping) {
            if (!$source || !$source[0]) {
                return;
            }

            var el = $source[0],
                length = el.value.length,
                difference = limit - length,
                overLimit = false,
                miscCodes = {13: 1, 32: 1, 186: 1, 187: 1, 188: 1 , 189: 1, 180: 1, 191: 1, 192: 1, 219: 1, 220: 1, 221: 1, 222: 1}; //space, enter, symbols
            $source.on('keydown', function(ev) {
                length = el.value.length;
                //only prevent typing if they actually typed something that would make another character
                if (preventTyping && ev.which && (miscCodes[ev.which] || (ev.which >= 65 && ev.which <= 90) || //alphas
                    (ev.which >= 48 && ev.which <= 57) || //numbers
                    (ev.which >= 96 && ev.which <= 112)) && //numpad
                    (ev.which != 65 || (!ev.metaKey && !ev.ctrlKey)) && //make sure they didn't press Ctrl+A
                    (ev.which != 67 || (!ev.metaKey && !ev.ctrlKey))) { //make sure they didn't press Ctrl+C

                    if (length >= limit) {
                        ev.preventDefault();
                        ev.stopPropagation();
                        return false;
                    }
                }

                if ($counter) {
                    difference = limit - length;
                    $counter.text(difference);
                    if (difference < 0 && !overLimit) {
                        $counter.addClass('over-limit');
                        overLimit = true;
                    } else if (difference >= 0 && overLimit) {
                        $counter.removeClass('over-limit');
                        overLimit = false;
                    }
                }
                return true;
            });
            $source.on('keyup', function(ev) {
                //delete events wouldn't consider the NEW count with keydown
                if ($counter && (ev.which === 8 || ev.which === 46)) {
                    length = el.value.length;
                    difference = limit - length;
                    $counter.text(difference);
                    if (difference < 0 && !overLimit) {
                        $counter.addClass('over-limit');
                        overLimit = true;
                    } else if (difference >= 0 && overLimit) {
                        $counter.removeClass('over-limit');
                        overLimit = false;
                    }
                }
            });
            if ($counter) {
                $counter.text(difference);
                if (difference < 0 && !overLimit) {
                    $counter.addClass('over-limit');
                    overLimit = true;
                } else if (difference >= 0 && overLimit) {
                    $counter.removeClass('over-limit');
                    overLimit = false;
                }
            }
        },

        preventScroll: function(ev) {
            ev.stopPropagation();
            ev.preventDefault();
            ev.returnValue = false;
            return false;
        },

        preventDocumentScroll: function(ev) {
            var $this = $(this),
                scrollTop = this.scrollTop,
                scrollHeight = this.scrollHeight,
                height = $this.height(),
                delta = (ev.type == 'DOMMouseScroll' ? ev.originalEvent.detail * -40 : ev.originalEvent.wheelDelta),
                up = delta > 0;

            if (!up && -delta > scrollHeight - height - scrollTop) {
                $this.scrollTop(scrollHeight);
                return _.preventScroll(ev);
            } else if (up && delta > scrollTop) {
                $this.scrollTop(0);
                return _.preventScroll(ev);
            }
        },

        // For getting the adjusted coordinates to send to guts from a mouse event
        eventToGUTSCoords: function(ev) {
            var $win = $(window),
                winW = $win.width(),
                winH = $win.height(),
                gutsX = 1 * (ev.clientX/winW),
                gutsY = 1 * (ev.clientY/winH);
                
            return {
                eventX: gutsX,
                eventY: gutsY,
                winW: winW,
                winH: winH
            };
        },
        
        calculateTextWidth: function(text, css, opts) {
            var textEl = $('#tooltip-helper-text-sizing'),
                baseCss = {zIndex: -1, position: 'absolute', left: -50000, top: 0},
                newCss = $.extend({}, baseCss, css);
                
            if (!textEl.length) {
                textEl = $(document.createElement('div'));
                textEl.attr('id', 'tooltip-helper-text-sizing');
                $('body').append(textEl);
            }

            if (opts && opts.html) {
                textEl.css(newCss).html(text);
            } else {
                textEl.css(newCss).text(text);
            }
            var width = textEl.width();
            textEl.removeAttr('style').css(baseCss);
            return width;
        },
        
        // create groups for today, yesterday, last week, last month, long ago
        getTimeBasedGroups: function() {
            var theDate = new Date(),
                groups = [];

            theDate.setHours(0,0,0);
            groups.push({time: Math.floor(theDate.getTime() / 1000), localeKey: "TODAY", gridClass: 'today'});

            theDate.setDate(theDate.getDate() - 1);
            groups.push({time: Math.floor(theDate.getTime() / 1000), localeKey: "YESTERDAY", gridClass: 'yesterday'});

            theDate.setDate(theDate.getDate() - 6);
            groups.push({time: Math.floor(theDate.getTime() / 1000), localeKey: "LAST_WEEK", gridClass: 'last-week'});

            theDate = new Date();
            theDate.setHours(0,0,0);
            theDate.setMonth(theDate.getMonth() - 1); //JS is awesome
            groups.push({time: Math.floor(theDate.getTime() / 1000), localeKey: "LAST_MONTH", gridClass: 'last-month'});

            groups.push({time: 0, localeKey: "LONG_AGO", gridClass: 'long-ago'});
            return groups;
        },

        bindScrollbarTo: function($el, onScroll) {
            var $scrollbar = $el.find('.scrollbar'),
                $overview = $el.find('.overview');

            $el.tinyscrollbar({onscroll: onScroll});
            $el.on('mouseenter', function() {
                if ($overview.height() >= $el.height()) {
                    $scrollbar.stop().fadeTo(200, 1);
                }
            });
            $el.on('mouseleave', function() {
                $scrollbar.stop().fadeTo(200, 0);
            });
        },

        parseURI: function(uri) {
            /* This function was adapted from parseUri 1.2.1
               http://stevenlevithan.com/demo/parseuri/js/assets/parseuri.js
             */
            var o = {key: ['source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'],
                     parser: {strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@\/]*):?([^:@\/]*))?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/ }},
                str = _.orEqual(uri, ''),
                m = o.parser.strict.exec(str),
                parsed = {},
                i = 14;

            while (i--) {
                parsed[o.key[i]] = m[i] || '';
            }

            return parsed;
        },

        omitSameKeys: function(base, newObj) {
            var difference = {},
                undef, k;
            for (k in newObj) {
                //optimized for fast cases first then hasOwnPropery check last
                if (base[k] === undef && newObj[k] !== undef && newObj.hasOwnProperty(k)) {
                    difference[k] = newObj[k];
                }
            }
            return difference;
        },

        gaTrackPageView: function(url) {
            if (window._gaq && _gaq.push && url && url.length) {
                _gaq.push(['_trackPageview', url]);
            }
        },

        boxBlurImage: function(imageID, canvasID, radius, iterations, canvasWidth, canvasHeight, topOffset) {
            var img = document.getElementById(imageID);
            if (!img) {
                if (DEVMODE) {
                    console.log('boxBlurImage called without imageID on page');
                    console.trace();
                }
                return '';
            }
            var w = img.naturalWidth,
                h = img.naturalHeight,
                canvas = document.getElementById(canvasID),
                scaleRatio = canvasWidth/w,
                scaleHeight = h * scaleRatio,
                context;

            canvas.width = canvasWidth;
            canvas.height = canvasHeight;

            context = canvas.getContext("2d");
            context.clearRect(0, 0, w, h);
            context.drawImage(img, 0, topOffset, canvasWidth, scaleHeight);

            if (isNaN(radius) || radius < 1) return;

            return _.boxBlurCanvasRGB(canvasID, 0, 0, canvasWidth, canvasHeight, radius, iterations);
        },

        boxBlurCanvasRGB: function(id, top_x, top_y, width, height, radius, iterations) {
            if (isNaN(radius) || radius < 1) {
                return '';
            }

            // cached noise to improve the blur quality
            var mul_table = [
                    1, 57, 41, 21, 203, 34, 97, 73, 227, 91, 149, 62, 105, 45, 39, 137,
                    241, 107, 3, 173, 39, 71, 65, 238, 219, 101, 187, 87, 81, 151, 141,
                    133, 249, 117, 221, 209, 197, 187, 177, 169, 5, 153, 73, 139, 133,
                    127, 243, 233, 223, 107, 103, 99, 191, 23, 177, 171, 165, 159, 77,
                    149, 9, 139, 135, 131, 253, 245, 119, 231, 224, 109, 211, 103, 25,
                    195, 189, 23, 45, 175, 171, 83, 81, 79, 155, 151, 147, 9, 141, 137,
                    67, 131, 129, 251, 123, 30, 235, 115, 113, 221, 217, 53, 13, 51, 50,
                    49, 193, 189, 185, 91, 179, 175, 43, 169, 83, 163, 5, 79, 155, 19,
                    75, 147, 145, 143, 35, 69, 17, 67, 33, 65, 255, 251, 247, 243, 239,
                    59, 29, 229, 113, 111, 219, 27, 213, 105, 207, 51, 201, 199, 49, 193,
                    191, 47, 93, 183, 181, 179, 11, 87, 43, 85, 167, 165, 163, 161, 159,
                    157, 155, 77, 19, 75, 37, 73, 145, 143, 141, 35, 138, 137, 135, 67,
                    33, 131, 129, 255, 63, 250, 247, 61, 121, 239, 237, 117, 29, 229,
                    227, 225, 111, 55, 109, 216, 213, 211, 209, 207, 205, 203, 201, 199,
                    197, 195, 193, 48, 190, 47, 93, 185, 183, 181, 179, 178, 176, 175,
                    173, 171, 85, 21, 167, 165, 41, 163, 161, 5, 79, 157, 78, 154, 153,
                    19, 75, 149, 74, 147, 73, 144, 143, 71, 141, 140, 139, 137, 17, 135,
                    134, 133, 66, 131, 65, 129, 1
                ],
                shg_table = [
                    0, 9, 10, 10, 14, 12, 14, 14, 16, 15, 16, 15, 16, 15, 15, 17, 18, 17,
                    12, 18, 16, 17, 17, 19, 19, 18, 19, 18, 18, 19, 19, 19, 20, 19, 20,
                    20, 20, 20, 20, 20, 15, 20, 19, 20, 20, 20, 21, 21, 21, 20, 20, 20,
                    21, 18, 21, 21, 21, 21, 20, 21, 17, 21, 21, 21, 22, 22, 21, 22, 22,
                    21, 22, 21, 19, 22, 22, 19, 20, 22, 22, 21, 21, 21, 22, 22, 22, 18,
                    22, 22, 21, 22, 22, 23, 22, 20, 23, 22, 22, 23, 23, 21, 19, 21, 21,
                    21, 23, 23, 23, 22, 23, 23, 21, 23, 22, 23, 18, 22, 23, 20, 22, 23,
                    23, 23, 21, 22, 20, 22, 21, 22, 24, 24, 24, 24, 24, 22, 21, 24, 23,
                    23, 24, 21, 24, 23, 24, 22, 24, 24, 22, 24, 24, 22, 23, 24, 24, 24,
                    20, 23, 22, 23, 24, 24, 24, 24, 24, 24, 24, 23, 21, 23, 22, 23, 24,
                    24, 24, 22, 24, 24, 24, 23, 22, 24, 24, 25, 23, 25, 25, 23, 24, 25,
                    25, 24, 22, 25, 25, 25, 24, 23, 24, 25, 25, 25, 25, 25, 25, 25, 25,
                    25, 25, 25, 25, 23, 25, 23, 24, 25, 25, 25, 25, 25, 25, 25, 25, 25,
                    24, 22, 25, 25, 23, 25, 25, 20, 24, 25, 24, 25, 25, 22, 24, 25, 24,
                    25, 24, 25, 25, 24, 25, 25, 25, 25, 22, 25, 25, 25, 24, 25, 24, 25,
                    18
                ],
                canvas  = document.getElementById(id),
                context = canvas.getContext("2d"),
                r = [], g = [], b = [],
                vmin = [],
                vmax = [],
                mul_sum = mul_table[radius],
                shg_sum = shg_table[radius],
                wm = width - 1,
                hm = height - 1,
                rad1 = radius + 1,
                rsum, gsum, bsum, x, y, i,
                p, p1, p2, yp, yi, yw,
                imageData, pixels;

            radius = parseInt(radius, 10);
            iterations = isNaN(iterations) ? 1 : Math.min(3, Math.max(1, parseInt(iterations, 10)));

            try {
                imageData = context.getImageData(top_x, top_y, width, height);
            } catch(e) {
                // NOTE: this part is supposedly only needed if you want to work with local files
                // so it might be okay to remove the whole try/catch block and just use
                // imageData = context.getImageData( top_x, top_y, width, height );
                try {
                    netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
                    imageData = context.getImageData(top_x, top_y, width, height);
                } catch(e) {
                    throw new Error("unable to access local image data: " + e);
                }
                if (!imageData) {
                    throw new Error("unable to access image data: " + e);
                }
            }

            pixels = imageData.data;
        
            while (iterations-- > 0) {
                yw = yi = 0;
        
                for (y=0; y < height; y++) {
                    rsum = pixels[yw]   * rad1;
                    gsum = pixels[yw+1] * rad1;
                    bsum = pixels[yw+2] * rad1;
        
                    for(i = 1; i <= radius; i++) {
                        p = yw + (((i > wm ? wm : i )) << 2 );
                        rsum += pixels[p++];
                        gsum += pixels[p++];
                        bsum += pixels[p++];
                    }
        
                    for (x = 0; x < width; x++) {
                        r[yi] = rsum;
                        g[yi] = gsum;
                        b[yi] = bsum;
        
                        if (y==0) {
                            vmin[x] = ( ( p = x + rad1) < wm ? p : wm ) << 2;
                            vmax[x] = ( ( p = x - radius) > 0 ? p << 2 : 0 );
                        } 
        
                        p1 = yw + vmin[x];
                        p2 = yw + vmax[x];
        
                        rsum += pixels[p1++] - pixels[p2++];
                        gsum += pixels[p1++] - pixels[p2++];
                        bsum += pixels[p1++] - pixels[p2++];
        
                        yi++;
                    }
                    yw += ( width << 2 );
                }
        
                for (x = 0; x < width; x++) {
                    yp = x;
                    rsum = r[yp] * rad1;
                    gsum = g[yp] * rad1;
                    bsum = b[yp] * rad1;
        
                    for(i = 1; i <= radius; i++) {
                        yp += ( i > hm ? 0 : width );
                        rsum += r[yp];
                        gsum += g[yp];
                        bsum += b[yp];
                    }
        
                    yi = x << 2;
                    for (y = 0; y < height; y++) {
                        pixels[yi]   = (rsum * mul_sum) >>> shg_sum;
                        pixels[yi+1] = (gsum * mul_sum) >>> shg_sum;
                        pixels[yi+2] = (bsum * mul_sum) >>> shg_sum;
        
                        if(x == 0) {
                            vmin[y] = ( ( p = y + rad1) < hm ? p : hm ) * width;
                            vmax[y] = ( ( p = y - radius) > 0 ? p * width : 0 );
                        } 
        
                        p1 = x + vmin[y];
                        p2 = x + vmax[y];
        
                        rsum += r[p1] - r[p2];
                        gsum += g[p1] - g[p2];
                        bsum += b[p1] - b[p2];
        
                        yi += width << 2;
                    }
                }
            }
            context.putImageData(imageData, top_x, top_y);
            return canvas.toDataURL();
        },

        pageHeaderBoxBlur: function(image) {
            var $pageHeader = $('#page-header'),
                $img = $('#page-header-blur-img'),
                $canvas = $('#page-header-blur-canvas'),
                dfd = $.Deferred(),
                radius = 40,
                iterations = 2,
                height = 300,
                $body, width, offsetTop, imgEl, lastDfd;

            // setup our img for the first time
            if (!$img.length) {
                $img = $('<img id="page-header-blur-img" class="hide">');
                $body = $('body');
                $body.append($img);
            }

            // setup our canvas for the first time
            if (!$canvas.length) {
                $canvas = $('<canvas id="page-header-blur-canvas" class="hide"></canvas>');
                if (!$body) {
                    $body = $('body');
                }
                $body.append($canvas);
            }

            // see if we have a previous dfd and reject it if so
            lastDfd = $canvas.data('lastDfd');
            if (lastDfd) {
                lastDfd.reject();
            }

            // setup handlers for load/error and resolve/reject the dfd accordingly
            imgEl = $img[0];
            imgEl.onload = function() {
                imgEl.onerror = imgEl.onload = null;
                // ensure we still have the same header
                if ($pageHeader[0] != $('#page-header')[0]) {
                    dfd.reject();
                    return;
                }
                width = $pageHeader.width();
                offsetTop = (width / -2) + 150;
                console.log(width, offsetTop);
                dfd.resolve(_.boxBlurImage($img.attr('id'), $canvas.attr('id'), radius, iterations, width, height, offsetTop));
            };
            imgEl.onerror = function() {
                dfd.reject();
            };

            // load the image and begin the process
            imgEl.crossOrigin = '';
            imgEl.src = image;

            $canvas.data('lastDfd', dfd);

            return dfd;
        },

        // Borrowed off swfobject
        getFlashObject: function(name) {
            var r = null,
                o = document.getElementById(name),
                n;
            if (o && o.nodeName == 'OBJECT') {
                if (typeof o.SetVariable != 'undefined') {
                    r = o;
                } else {
                    n = o.getElementsByTagName('object')[0];
                    if (n) {
                        r = n;
                    }
                }
            }
            return r;
        },
        
        getFlashObjectDfd: function(name, method) {
            if (flashDfds[name]) {
                return flashDfds[name];
            }
            
            var dfd = flashDfds[name] = $.Deferred(),
                interval, timeout;

            interval = setInterval(function() {
                var f = _.getFlashObject(name);
                if (f && _.isFunction(f[method])) {
                    clearInterval(interval);
                    clearTimeout(timeout);
                    dfd.resolve(f);
                }
            }, 200);
            timeout = setTimeout(function() {
                if (dfd.state() === 'pending') {
                    dfd.reject();
                }
            }, 3000);

            return dfd.promise();
        },

        //seconds... to match backend (PHP) if you want milliseconds, make currentTimeMS
        currentTime: function() {
            return Math.floor(((new Date()).getTime() + window.clientTimeDivergence) / 1000);
        }
        
    });

    /*
    toInt optimizations
    test: http://jsperf.com/double-tilde-vs-parseint/18
     */

    /*
        webkit-based browers:
            Seem to be better at doing parseInt first
            ~~ is faster than a ternary checking isNaN
            parseInt(true, 10) != 1 so need to check true first
     */
    if (/WebKit/.test(navigator.userAgent)) {
        _.toInt = function(a) {
            return a === true ? 1 : ~~parseInt(a, 10);
        };
    } else {
        // ie is slightly better at double tidle
        // for some reason ff is 40x faster at double tidle
        _.toInt = function(a) {
            return ~~a;
        };
    }

    var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame,
        animateTime = 30; //yes this is double the 16.66666 actual 60fps we hope to achieve

    if ($.browser.msie && $.browser.version < 9) {
        animateTime = 90;
    }

    _.requestAnimationFrame = requestAnimationFrame;

    if (requestAnimationFrame) {
        _.animationThrottle = function(callback, context) {
            var shouldContinue = false,
                running = false,
                args,

                frameCallback = function() {
                    callback.apply(context, args);
                    if (shouldContinue) {
                        requestAnimationFrame(frameCallback); //request another animation within this callback
                        shouldContinue = false;
                    } else {
                        running = false;
                    }
                };
            return function() {
                args = arguments;
                if (!running) {
                    requestAnimationFrame(frameCallback);
                    running = true;
                    shouldContinue = false;
                } else {
                    shouldContinue = true;
                }
            };
        };
    } else {
        _.animationThrottle = function(callback, context) {
            var shouldContinue = false,
                running, args,

                frameCallback = function() {
                    if (!shouldContinue) {
                        clearInterval(running);
                        running = null;
                    } else {
                        callback.apply(context, args);
                        shouldContinue = false;
                    }
                };
            return function() {
                args = arguments;
                if (!running) {
                    callback.apply(context, args);

                    running = setInterval(frameCallback, animateTime);
                    shouldContinue = false;
                } else {
                    shouldContinue = true;
                }
            };
        };
    }

    // These get translated in application.js
    _.daysOfTheWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday','Saturday'];
    _.monthsOfTheYear = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August','September', 'October', 'November', 'December'];
    _.shortMonthsOfTheYear = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug','Sept', 'Oct', 'Nov', 'Dec'];
    _.keyboard = {ESC: 27, ENTER: 13, UP: 38, DOWN: 40, LEFT: 37, RIGHT: 39, TAB: 9, BACKSPACE: 8, AT: 64};

    _.playerShortcuts = {32:true, 17:true, 91:true, 93:true, 37:true, 38:true, 39:true, 40:true, 16:true};
    _.specialKeys = {9:true, 18:true, 19:true, 20:true, 27:true, 33:true, 34:true, 35:true, 36:true, 45:true, 46:true, 112:true, 113:true, 114:true, 115:true, 116:true, 117:true, 118:true, 119:true, 120:true, 121:true, 122:true, 123:true, 145:true};
    
    // polyfill base64 encoding
    // https://github.com/inexorabletash/polyfill
    window.btoa = window.btoa || function (input) {
        input = String(input);
        var B64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
            position = 0,
            out = [],
            o1, o2, o3,
            e1, e2, e3, e4;

        if (/[^\x00-\xFF]/.test(input)) { throw new Error("InvalidCharacterError"); }

        while (position < input.length) {
            o1 = input.charCodeAt(position++);
            o2 = input.charCodeAt(position++);
            o3 = input.charCodeAt(position++);

            // 111111 112222 222233 333333
            e1 = o1 >> 2;
            e2 = ((o1 & 0x3) << 4) | (o2 >> 4);
            e3 = ((o2 & 0xf) << 2) | (o3 >> 6);
            e4 = o3 & 0x3f;

            if (position === input.length + 2) {
                e3 = 64; e4 = 64;
            } else if (position === input.length + 1) {
                e4 = 64;
            }

            out.push(B64_ALPHABET.charAt(e1),
                     B64_ALPHABET.charAt(e2),
                     B64_ALPHABET.charAt(e3),
                     B64_ALPHABET.charAt(e4));
        }

        return out.join('');
    };

    // Make sure that we don't use Array#indexOf
    if (DEVMODE) {
        var nativeIndexOf = Array.prototype.indexOf,
            stopIndexOf = function() {
                if (arguments.callee.caller === $.inArray) {
                    return nativeIndexOf.apply(this, arguments);
                } else {
                    var str = "indexOf doesn't exist in IE8!";
                    console.trace();
                    console.error(str, this, arguments);
                    throw str;
                }
            };
        try {
            Object.defineProperty(Array.prototype, 'indexOf', {
                value: stopIndexOf,
                enumerable: false
            });
        } catch (e) {}
    }

    // TODO: move this somewhere better(?) that pay.php can access too
    _.doStyles = function() {
        amdModules.requireDeferred('tier2');
        if (window.parentSandboxBridge) { return; } //AIR already loaded css
        if (DEVMODE) {
            if (gsConfig.lessServerPath) {
                $.getStylesheet(gsConfig.lessServerPath + "lightboxes.less");
            } else {
                $.getStylesheet('/webincludes/css/less-compiler.php?file=2');
            }
        }
        if (window.gsProduction && window.gsProduction.LB_CSSURI) {
            var cssInfo = (_.isUndefined(window.dataURISupport) || dataURISupport) ? gsProduction.LB_CSSURI : gsProduction.LB_CSS;
            if (cssInfo && cssInfo.assetPath) {
                $.getStylesheet(cssInfo.assetPath);
            }
        }
    };

    //temporary while we are converting over to tooltips
    _.asyncTooltipMenu = function($el, opts, models, menuName) {
        amdModules.requireDeferred('contextMenus').done(function() {
            var tooltipOptions = _.defaults(opts, {
                    width: 175,
                    $attached: $el,
                    tooltipClass: 'menu',
                    closeOnScroll: true,
                    sticky: true
                }),
                menuOptions, tooltipView;

            if (!GS.contextMenus[menuName]) {
                if (DEVMODE) {
                    console.log('missing menu', menuName);
                    console.trace();
                }
                return;
            }

            tooltipOptions.tooltipKey = 'context-menu';
            menuOptions = GS.contextMenus[menuName](models, tooltipOptions);

            GS.trigger('tooltip:close', tooltipOptions.tooltipKey);

            if (!menuOptions) {
                if (DEVMODE) {
                    console.error("failed to get context menu for", menuName, models, tooltipOptions);
                }
                return;
            }
            tooltipOptions.items = menuOptions.items;
            tooltipView = new GS.Views.Tooltips.Menu(tooltipOptions);
            tooltipView.open();
        });
    };

    _.asyncMenu = function(ev, $el, opts, modelOrModels, menuName) {
        amdModules.requireDeferred('contextMenus').done(function() {
            var contextMenus = GS.contextMenus,
                menuOptions = (opts && opts.menuOptions) || {},
                extra = (opts && opts.extra) || {},
                menu;
            if (contextMenus && contextMenus.hasOwnProperty(menuName)) {
                menu = contextMenus[menuName](modelOrModels, extra);
                $el.jjmenu(ev, menu, null, menuOptions);
            }
        });
    };

    // IE 7 and 8 don't have Date.now()
    if (!Date.now || !_.isFunction(Date.now)) {
        Date.now = function() {
            return +new Date;
        };
    }

    if (!_.isFunction(Date.prototype.getWeek)) {
        Date.prototype.getWeek = function() {
            var onejan = new Date(this.getFullYear(),0,1);
            return Math.ceil((((this - onejan) / 86400000) + onejan.getDay()+1)/7);
        };
    }
    
    var nestReg = /nest\((.*?)\)/g,
        pathReg = /['|"](.*?)['|"]/,
        pendingTemplates = {},
        pendingBundles = {},
        emptyTemplate = _.template('');
    
    function checkNestAndCompile(dfd, id) {
        // Before we can resolve a template we must pre-cache all nested templates
        var template = GS.Views.templateCache[id],
            matches = template.match(nestReg),
            toCache = [], dfds = [];
        
        if (matches && matches.length) {
            for (var i=0; i< matches.length; i++) {
                var m = matches[i].match(pathReg);
                if (DEVMODE) {
                    if (!m) {
                        console.error('missing template', matches[i], template);
                    }
                }
                if (m.length > 1 && _.indexOf(toCache, m[1]) === -1) {
                    toCache.push(m[1]);
                    dfds.push(fetchTemplate(m[1]));
                }
            }
        }

        if (dfd) {
            $.after(dfds).then(function() {
                dfd.resolve(_.template(template));
            });
        }
    }
    
    // Add methods to Backbone
    Backbone.View.prototype.templatePath = "";
    var bundleViewHash = undefined;
    var setupBundleViewHash = function() {
        bundleViewHash = {};
        _.each(GS.Views.viewBundles, function(bundleDefinition, key) {
            var i, l;
            if (_.isArray(bundleDefinition.directories)) {
                for (i = 0, l = bundleDefinition.directories.length; i < l; i++) {
                    bundleViewHash[bundleDefinition.directories[i]] = key;
                }
            }
            if (_.isArray(bundleDefinition.files)) {
                for (i = 0, l = bundleDefinition.files.length; i < l; i++) {
                    bundleViewHash[bundleDefinition.files[i]] = key;
                }
            }
        });
    };
    var getBundleForTemplate = function(view) {
        if (!bundleViewHash && GS.Views.viewBundles) {
            setupBundleViewHash();
        }
        var pathParts = (view || '').replace('//', '/').split('/'),
            pathBuffer = '';
        if (pathParts.length <= 1) {
            return undefined;
        }
        pathParts.shift();
        for (var i = 0, l = pathParts.length, resolved; i < l; i++) {
            pathBuffer = pathBuffer + '/' + pathParts[i];
            resolved = bundleViewHash[pathBuffer];
            if (resolved) {
                return resolved;
            }
        }
        return bundleViewHash['/' + pathParts.join('/')];
    };
    var fetchTemplate = Backbone.View.prototype.fetchTemplate = function(view) {
        var dfd = $.Deferred(),
            viewPath = ['gs', 'templates'],
            cacheBuster = '';

        //prevent caching on dev server
        if (DEVMODE) {
            cacheBuster = $.now();
        }

        if (view.match(/^themes/) || (this.templatePath && this.templatePath.match && this.templatePath.match(/^themes/))) {
            // actually use webroot for themes
            if (GS && GS.Models && GS.Models.Theme && GS.Models.Theme.themeVersion) {
                cacheBuster = GS.Models.Theme.themeVersion;
            }

            viewPath = [view];
            if (this.templatePath && this.templatePath.match && this.templatePath.match(/^themes/)) {
                // relative path given. derive from controller's default path
                viewPath.unshift(this.templatePath);
            }
        } else if (view.match(/^\//)) {
            // absolute path given. remove the leading slash and use as is
            viewPath.push(view.replace(/^\//, ''));
        } else {
            if (this.templatePath) {
                // relative path given. derive from controller's default path
                viewPath.push(this.templatePath);
            }
            viewPath.push(view);
        }
        // make sure to always use absolute pathing
        viewPath = '/' + viewPath.join('/');
        viewPath += '.ejs'; //Add file extension
        var viewPathStatic = viewPath;
        viewPath = amdModules.resolvePath(viewPath);
        
        var id = viewPathStatic,
            bundle = getBundleForTemplate(viewPathStatic),
            pending = pendingTemplates[id],
            module = require(viewPathStatic);

        if (!GS.Views.templateCache[id] && module && module.exports && module.exports.template) {
            GS.Views.templateCache[id] = module.exports.template;
        }

        if (GS.Views.templateCache[id]) {
            if (!_.isFunction(GS.Views.templateCache[id])) {
                // If cached but not compiled, check for nested templates and compile/resolve
                checkNestAndCompile(dfd, id);
            } else {
                dfd.resolve(GS.Views.templateCache[id]);
            }
        } else if (pending && pending.state() == 'pending') {
            return pending.promise();  // Reuse pending promise
        } else {
            // Need to fetch the bundle or template
            var ajaxRequest;
            if (bundle) {
                var bundlePath = amdModules.resolvePath('/gs/' + bundle + '.json');
                ajaxRequest = {
                    contentType: 'application/json',
                    dataType: 'json',
                    url: bundlePath,
                    type: 'GET',
                    cache: true
                };
                if (window.gsConfig && window.gsConfig.viewsJSONP) {
                    ajaxRequest.url = gsConfig.assetHost + url;
                    ajaxRequest.dataType = "jsonp";
                    ajaxRequest.jsonp = false;
                    ajaxRequest.jsonpCallback = window.gsConfig.viewsJSONP + bundle;
                }
            } else {
                ajaxRequest = {
                    dataType: 'text',
                    url: viewPath,
                    type: 'GET',
                    cache: true
                };
                if (cacheBuster) {
                    ajaxRequest.url += '?' + cacheBuster;
                }
            }

            pendingTemplates[id] = dfd;  // Prevent multiple ajax requests for the same template
            if (bundle) {
                if (pendingBundles[bundle] && pendingBundles[bundle].state() == 'pending') {
                    return dfd.promise();
                }
                pendingBundles[bundle] = $.Deferred();
            }

        }
        
        return dfd.promise();
    };

    function renderTemplate(template, data) {
        var templateData = data || this.model;
        //make it possible to render subtemplates
        //Nest requires full path
        templateData.nest = nest;
        if (_.isFunction(template)) {
            return template(templateData);
        }
        return _.template(template)(templateData)
    }

    Backbone.View.prototype.renderTemplate = renderTemplate;

    function ChildViews() {}
    //don't expose push in a for loop with hasOwnProperty
    ChildViews.prototype.push = function() {
        for (var i = 0, l = arguments.length; i < l; i++) {
            this[arguments[i].cid] = arguments[i];
        }
    };


    var oldViewInitialize = Backbone.View.prototype.initialize;
    Backbone.View.prototype.initialize = function(options) {
        this.childViews = new ChildViews();
        return oldViewInitialize.call(this, options);
    };

    //Cleanup method for Views
    Backbone.View.prototype.cleanupChildViews = function(force, opts) {
        var options = opts || {},
            exclude = options.exclude || {},
            removeOnDestroy = _.orEqual(options.remove, true);

        if (this.childViews) {
            var childViews = this.childViews,
                i, l, k, v;

            if (_.isArray(childViews)) {
                for (i = 0, l = childViews.length; i < l; i++) {
                    v = childViews[i];
                    if (force || !v.persist) {
                        if (_.isFunction(v.destroy)) {
                            v.destroy(removeOnDestroy);
                            v.off(null, null, this);
                        }
                        childViews.splice(i, 1);
                        i--;
                        l--;
                    }
                }
            } else {
                for (k in childViews) {
                    if (childViews.hasOwnProperty(k)) {
                        v = childViews[k];
                        if (force || !(exclude[k] || v.persist)) {
                            if (_.isFunction(v.destroy)) {
                                v.destroy(removeOnDestroy);
                                v.off(null, null, this);
                            }
                            delete childViews[k];
                        }
                    }
                }
            }
        }
    };
    
    Backbone.View.prototype.destroy = function(remove) {
        remove = _.orEqual(remove, true);
        this.destroyed = true;
        if (remove) {
            this.$el.remove();
        } else {
            this.undelegateEvents();
            this.$el.empty();
        }
        this.unbind();
        
        this.cleanupChildViews(true);
        
        if (_.isFunction(this.onDestroy)) {
            this.onDestroy();
        }
    };
    
    // Adds a super method to all of Backbone
    var _super = function(methodName) {
        // temporarily keeps track of where the super method is in the chain
        if (!this._superStack) {
            this._superStack = {};
        }

        // prevent screwing with the _superStack object itself accidentally
        var stackMethodName = '__' + methodName;

        // find the next class that has a new method called methodName
        // make sure that we don't call the function that called this
        var currentFunc = this._superStack[stackMethodName] ? this._superStack[stackMethodName][methodName] : arguments.callee.caller,
            object = this._superStack[stackMethodName] || this,
            parentObject,
            result;
        do {
            object = object.constructor.__super__;
        } while (object[methodName] === currentFunc);

        parentObject = object;
        this._superStack[stackMethodName] = parentObject;

        // _.rest will remove the first argument and pass the rest as an array
        result = parentObject[methodName].apply(this, _.rest(arguments));

        delete this._superStack[stackMethodName];
        return result;
    };

    _.each(["Model", "Collection", "Router", "View"], function(klass) {
        Backbone[klass].prototype._super = _super;
    });
    
    Backbone.CachedModel = Backbone.Model.extend(
    // Prototype
    {
        constructor: function(attrs, options) {
            var id = attrs[this.idAttribute];
            if (id && (!options || !options.noCache)) {
                var inst = this.constructor.getCached(id);
                if (inst) {
                    if (!options || !options.skipUpdate) {
                        inst.updateFromNew(inst.parse(attrs, options), options);
                    }
                    return inst;
                }
            }
            
            Backbone.Model.prototype.constructor.call(this, attrs, options);
        },

        destroy: function(options) {
            this.constructor.uncache(this);
            return Backbone.Model.prototype.destroy.call(this, options);
        },
        
        initialize: function(attrs, options) {
            this.constructor.cache(this, options);
        },
        
        // By default will fill in missing props but not overwrite anything
        updateFromNew: function(attrs, options) {
            this.set(_.defaults({}, this.attributes, attrs), options);
        }
    },
    // Static
    {
        cache: function(inst, options) {
            if (options && (options.noCache || options.dontCache)) {
                return false;
            }
            if (inst.id === undefined) {
                if (DEVMODE) {
                    console.error("Model has undefined id property!", inst);
                }
                return false;
            }
            if (!this._cache) {
                this._cache = {};
            }
            if (this._cache.hasOwnProperty(inst.id)) {
                if (this._cache[inst.id].cid !== inst.cid) {
                    throw ["Attempt to overwrite cached instance for ", inst.idAttribute, ":", inst.id].join('');
                }
                return false;
            }
            this._cache[inst.id] = inst;

            if (options && options.notifyCache && this._cacheCallbacks && this._cacheCallbacks[0]) {
                var cacheCallbacks = this._cacheCallbacks;
                _.delay(function() {
                    //check length each time in case someone removes a callback in a callback
                    for (var i = 0; i < cacheCallbacks.length; i++) {
                        if (!cacheCallbacks[i]) {
                            continue;
                        }
                        cacheCallbacks[i].func.call(cacheCallbacks[i].context, inst.id, inst);
                    }
                });
            }
            return true;
        },
        
        uncache: function(inst) {
            if (this._cache && this._cache.hasOwnProperty(inst.id)) {
                delete this._cache[inst.id];
            }
        },

        uncacheID: function(id) {
            if (this._cache && this._cache.hasOwnProperty(id)) {
                delete this._cache[id];
            }
        },
        
        getCached: function(id) {
            if (id === null || id === undefined || !this._cache || !this._cache.hasOwnProperty(id)) {
                return null;
            }
            return this._cache[id];
        },

        addCacheCallback: function(func, context) {
            if (!this._cacheCallbacks) {
                this._cacheCallbacks = [];
            } else {
                //make sure this context isn't already registered (if we had an object this wouldn't be a problem...)
                for (var i = 0; i < this._cacheCallbacks.length; i++) {
                    if (this._cacheCallbacks[i] && this._cacheCallbacks[i].context === context) {
                        return;
                    }
                }
            }
            this._cacheCallbacks.push({func: func, context: context});
        },

        removeCacheCallbacks: function(context) {
            if (!this._cacheCallbacks) {
                return;
            }

            var newCallbacks = [];
            for (var i = 0; i < this._cacheCallbacks.length; i++) {
                if (!this._cacheCallbacks[i] || this._cacheCallbacks[i].context === context) {
                    continue;
                }
                newCallbacks.push(this._cacheCallbacks[i]);
            }
            if (!newCallbacks.length) {
                this._cacheCallbacks = null;
            } else {
                this._cacheCallbacks = newCallbacks;
            }
        },
        
        genericGet: function(apiFunc, idKey, id, options) {
            var dfd = $.Deferred();
            
            if (this._cache && this._cache.hasOwnProperty(id)) {
                dfd.resolve(this._cache[id]);
            } else {
                var apiDfd = apiFunc(id, options);
                apiDfd.done(_.bind(function(data) {
                    if (data && data[idKey]) {
                        dfd.resolve(new this(data, options));
                    } else {
                        dfd.reject(data);
                    }
                }, this));
                apiDfd.fail(function(data) {
                    dfd.reject(data);
                });
            }

            return dfd;
        },

        replaceCacheAttributes: function(oldInst, properties, options) {
            if (properties && !_.isEmpty(properties)) {
                //make a new instance but don't cache it, were going to instead cache the old instance ref but with the new properties
                var newAttributes = this.prototype.parse(properties, options);
                //update the old instance with the new attributes
                oldInst.set($.extend({}, oldInst.attributes, newAttributes), options);
            }
            return oldInst;
        },

        newOrUpdate: function (attrs, opts) {
            var id = attrs[this.prototype.idAttribute],
                inst = id && this.getCached(id),
                options = opts || {};
            if ((!id || inst) && (!options || !options.noCache)) {
                attrs = this.prototype.parse(attrs, options);
                options.skipParse = true;

                if (!inst) { //since we might've just sanitized the data, see if we have an inst now
                    id = attrs[this.prototype.idAttribute];
                    inst = this.getCached(id);
                }
                if (inst) {
                    if (!options || !options.skipUpdate) {
                        inst.updateFromNew(attrs, options);
                    }
                    return inst;
                }
            }
            return new this(attrs, options);
        }
    });

    Backbone.Collection.prototype.replaceModelByID = function(newInst) {
        var found = false,
            id = newInst.id;
        for (var i = 0, l = this.length; i < l; i++) {
            if (this.models[i] && this.models[i].id == id) {
                found = true;
                break;
            }
        }
        if (!found) {
            return;
        }
        var oldInst = this.models[i];
        if (!oldInst || oldInst.id != newInst.id) {
            return;
        }
        if (oldInst.cid) {
            delete this._byId[oldInst.cid];
        }
        //this needs to follow what backbone's set is doing
        newInst.on('all', this._onModelEvent, this);
        this._byId[newInst.cid] = newInst;
        this._byId[newInst.id] = newInst;
        this.models[i] = newInst;

        //transfer over any missing data that we had on the old one to the new one
        if (newInst.hasOwnProperty('updateFromNew')) {
            newInst.updateFromNew(oldInst.attributes);
        }
    };

    Backbone.WrappedModelCollection = Backbone.Collection.extend({
        replaceWrappedModelByID: function(newInst) {
            var id = newInst.id;
            for (var i = 0, l = this.length; i < l; i++) {
                if (this.models[i] && this.models[i]._wrapped && this.models[i]._wrapped.id == id) {
                    this.models[i].replaceWrapped(newInst);
                }
            }
        }
    });

    Backbone.CachedModelCollection = Backbone.Collection.extend({
        /**
         * we are overriding the native _prepareModel and not calling _super. Keep up to date with native.
         */
        _prepareModel: function(attrs, opts) {
            //support creating a collection of songs from an array of wrapped models
            if (attrs && attrs._wrapped !== undefined && attrs._wrapped instanceof this.model) {
                return attrs._wrapped;
            }
            if (attrs instanceof Backbone.Model) {
                return attrs;
            }
            
            var options = _.extend({}, this._modelOptions, opts) || this._modelOptions || {};

            if (options && (options.noCache || options.dontCache)) {
                var parsed = this.model.prototype.parse(attrs, options),
                    localCopy = this.get(parsed[this.model.prototype.idAttribute]);
                if (localCopy) {
                    localCopy.updateFromNew(parsed, options);
                    return false;
                }
                return new this.model(attrs, options);
            }
            
            return this.model.newOrUpdate(attrs, options);
        }
    });

    Backbone.CappedCollection = Backbone.Collection.extend({
        initialize: function(models, options) {
            this.silentCapping = options && options.silentCapping;
            this.limit = (options && options.limit) || 0;
            // "first" implies we should only keep the first "limit" number of models
            // "last" implies we should only keep the last "limit" number of models
            // -- both as per the order of models
            this.capDirection = (options && options.capDirection === 'first') ? 'first' : 'last';
        },

        add: function(models, options) {
            Backbone.Collection.prototype.add.call(this, models, options);
            if (!this.limit || this.length <= this.limit) { return; }
            this.remove(_[this.capDirection === 'first' ? 'last' : 'first'](this.models, this.length - this.limit), {silent: !!this.silentCapping});
        }
    });

    function makeWrappedMethod(method) {
        return function() {
            try {
                return this._wrapped[method].apply(this._wrapped, _.toArray(arguments));
            } catch (e) {
                console.log('wtf', this, this._wrapped, method, arguments);
                console.trace();
            }
        };
    }
    
    // Model that wraps another model and passes through most of its attributes
    Backbone.MagicModelWrapper = Backbone.Model.extend(
    // Prototype
    {
        // Attribute names that should not get passed through to the underlying model object
        myAttributes: [],
        
        // Class we are wrapping
        wrappedClass: Backbone.Model,
        
        //Default implementation, calls wrappedClass, then copies over myAttributes, override if necessary
        parse: function(attrs, opts) {
            var options = opts || {};
            options.fromWrapper = true;
            
            var a = {},
                i, l, key;

            for (i = 0, l = this.myAttributes.length; i < l; i++) {
                key = this.myAttributes[i];
                if (attrs.hasOwnProperty(key)) {
                    a[key] = attrs[key];
                }
            }
            
            return a;
        },
        
        constructor: function(a, opts) {
            var i, l,
                options = opts || {};

            options.fromWrapper = true;
            if (options.wrappedModel) {
                this._wrapped = options.wrappedModel;
            } else {
                this._wrapped = _.isFunction(this.makeWrappedModel) ? this.makeWrappedModel(a, options) : new this.wrappedClass(a, options);
            }

            // if we don't have an id, then try to get it from wrapped model
            if (!a.hasOwnProperty(this.idAttribute) && this._wrapped.attributes.hasOwnProperty(this.idAttribute)) {
                a[this.idAttribute] = this._wrapped.attributes[this.idAttribute];
            }

            // Want to trigger wrapped object's change events like they are our own
            this._wrapped.on('change', Backbone.MagicModelWrapper.wrappedChangedAttributes, this);

            // Call the parent constructor method which sets up the model
            Backbone.Model.prototype.constructor.call(this, a, options);
        },
        
        // Return a copy of the model's `attributes` object.
        toJSON: function() {
          return _.extend(this._super.apply(this, ['toJSON']), this._wrapped.toJSON());
        },
        
        // Get the value of an attribute.
        get: function(attr) {
            if (this.myAttributesHash.hasOwnProperty(attr)) {
                return this.attributes[attr];
            } else {
                return this._wrapped.attributes[attr];
            }
        },
        
        // Get the HTML-escaped value of an attribute.
        escape: function(attr) {
            if (this.myAttributesHash.hasOwnProperty(attr)) {
                return this._wrapped.escape.call(this, attr);
            } else {
                return this._wrapped.escape(attr);
            }
        },
        
        // Returns `true` if the attribute contains a value that is not null
        // or undefined.
        has: function(attr) {
            return this.get(attr) != null;
        },

        // Set a hash of model attributes on the object, firing `"change"` unless
        // you choose to silence it.
        set: function(key, value, options) {
            var attrs, attr, val;
            if (_.isObject(key) || key === null) {
                attrs = key;
                options = value;
            } else {
                attrs = {};
                attrs[key] = value;
            }

            // Extract attributes and options.
            options || (options = {});
            if (!attrs) return this;
            if (attrs instanceof Backbone.Model) attrs = attrs.attributes;
            if (options.unset) for (attr in attrs) attrs[attr] = void 0;

            // Check for changes of `id`.
            if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];
            if (this._wrapped.idAttribute in attrs) this._wrapped.id = attrs[this._wrapped.idAttribute];

            var changes = [];
            var current = this.attributes;
            var changing = this._changing;
            this._changing = true;

            if (!changing) {
              this._previousAttributes = _.clone(this.attributes);
              this.changed = {};
            }

            var prev = this._previousAttributes || {},
                wrappedAttrs = {},
                setWrapped = false;
            
            // For each `set` attribute...
            for (attr in attrs) {
                if (!attrs.hasOwnProperty(attr)) {
                    continue;
                }
                val = attrs[attr];

                if (!this.myAttributesHash.hasOwnProperty(attr)) {
                    setWrapped = true;
                    wrappedAttrs[attr] = val;
                    continue;
                }
                if (!_.isEqual(current[attr], val)) changes.push(attr);
                if (!_.isEqual(prev[attr], val)) {
                    this.changed[attr] = val;
                } else {
                    delete this.changed[attr];
                }
                options.unset ? delete current[attr] : current[attr] = val;
            }
            if (setWrapped) {
                this._wrapped.set(wrappedAttrs, options);
            }

            // Fire the `"change"` events.
            if (!options.silent) {
                if (changes.length) this._pending = true;
                for (var i = 0, l = changes.length; i < l; i++) {
                    this.trigger('change:' + changes[i], this, current[changes[i]], options);
                }
            }

            if (changing) return this;

            if (!options.silent) {
                while (this._pending) {
                    this._pending = false;
                    this.trigger('change', this, options);
                }
            }

            this._pending = false;
            this._changing = false;
            return this;
        },
        
        // Create a new model with identical attributes to this one.
        clone: function() {
            return new this.constructor(_.extend(this.attributes, this._wrapped.attributes));
        },
        
        // Determine if the model has changed since the last `"change"` event.
        // If you specify an attribute name, determine if that attribute has changed.
        hasChanged: function(attr) {
            if (!arguments.length) return !_.isEmpty(this.changed) || !_.isEmpty(this._wrapped.changed);
            if (this.myAttributesHash.hasOwnProperty(attr)) {
                return _.has(this.changed, attr);
            } else {
                return _.has(this._wrapped.changed, attr);
            }
        },
        
        // Return an object containing all the attributes that have changed, or
        // false if there are no changed attributes. Useful for determining what
        // parts of a view need to be updated and/or what attributes need to be
        // persisted to the server. Unset attributes will be set to undefined.
        // You can also pass an attributes object to diff against the model,
        // determining if there *would be* a change.
        changedAttributes: function(diff) {
            if (!diff) return this.hasChanged() ? _.extend(_.clone(this.changed), _.clone(this._wrapped.changed)) : false;
            var val, changed = false, old = this._previousAttributes, oldW = this._wrapped._previousAttributes;
            for (var attr in diff) {
                if (this.myAttributesHash.hasOwnProperty(attr)) {
                    if (_.isEqual(old[attr], (val = diff[attr]))) continue;
                    (changed || (changed = {}))[attr] = val;
                } else {
                    if (_.isEqual(oldW[attr], (val = diff[attr]))) continue;
                    (changed || (changed = {}))[attr] = val;
                }
            }
            return changed;
        },

        // Get the previous value of an attribute, recorded at the time the last
        // `"change"` event was fired.
        previous: function(attr) {
            if (!arguments.length || (!this._previousAttributes && !this._wrapped._previousAttributes)) return null;
            if (this.myAttributesHash.hasOwnProperty(attr)) {
                return this._previousAttributes[attr];
            } else {
                return this._wrapped._previousAttributes[attr];
            }
        },

        // Get all of the attributes of the model at the time of the previous
        // `"change"` event.
        previousAttributes: function() {
            return _.extend(this._super.apply(this, ['previousAttributes']), this._wrapped.previousAttributes());
        },

        replaceWrapped: function(newInst) {
            var oldInst = this._wrapped;
            if (!oldInst || oldInst.id != newInst.id) {
                return;
            }
            //remove the old change event to prevent memory leak
            oldInst.off('change', Backbone.MagicModelWrapper.wrappedChangedAttributes, this);
            this._wrapped = newInst;

            //transfer over any missing data that we had on the old one to the new one
            if (newInst.hasOwnProperty('updateFromNew')) {
                newInst.updateFromNew(oldInst.attributes);
            }
            //re-establish the change event listener, we are doing this post-updateFromNew because any changes that would've fired then would've already been there
            newInst.on('change', Backbone.MagicModelWrapper.wrappedChangedAttributes, this);
            this.trigger('change', this, {});
            //todo: fire change events for updated attributes gained from moving to newInst
        }
    },
    // Static
    {
        wrapMethods: function(wrappedClass, receivingClass, methodNames) {
            var source = wrappedClass.prototype,
                target = receivingClass.prototype;

            for (var i = 0, l = methodNames.length; i < l; i++) {
                var method = methodNames[i];
                
                if (target.hasOwnProperty(method)) {
                    throw ["Trying to overwrite existing method '", method, "' in MagicModelWrapper"].join('');
                }
                if (_.isFunction(source[method])) {
                    target[method] = makeWrappedMethod(method);
                }
            }
        },
        createMyAttributesHash: function(wrappedClass) {
            var proto = wrappedClass.prototype,
                hash = {};
            if (proto.myAttributes) {
                for (var i = 0, l = proto.myAttributes.length; i < l; i++) {
                    hash[proto.myAttributes[i]] = true;
                }
            }

            proto.myAttributesHash = hash;
        },

        //called when a wrapped model fires a change event (context is wrapper model itself)
        wrappedChangedAttributes: function(model, opts) {
            var changed = this._wrapped.changedAttributes(),
                attr;
            for (attr in changed) {
                if (changed.hasOwnProperty(attr)) {
                    this.trigger('change:' + attr, this, changed[attr], opts);
                }
            }
            this.trigger('change', this, opts);
        }
    });

    //allow a property to be defined with a description, etc on the model
    //writeable false doesn't need to be specified if defining a get function since nothing will access the changed value
    Backbone.Model.prototype.defineProperty = (function() {
        var a = {},
            worked = false;
        //need to feature detect the defineProperty because IE8 allows you to define ONLY DOM objects
        try {
            Object.defineProperty(a, 'b', {value: 1, writable: false});
            a.b = 2;
            worked = (a.b === 1);
        } catch (e) {}

        if (worked) {
            return function(property, description) {
                return Object.defineProperty(this.attributes, property, description);
            };
        }
        return function(property, description) {
            var orginalGet = this.get;
            this.get = function(getProperty) {
                if (getProperty === property) {
                    return description.value || description.get();
                }
                return orginalGet.call(this, getProperty);
            }
            //match return of normal Object.defineProperty
            return this.attributes;
        };
    })();

    //allow a property or all properties to be frozen on the model
    Backbone.Model.prototype.freeze = function(property) {
       if (typeof Object.freeze !== "function") {
           return;
       }

       if (!property) {
           Object.freeze(this.attributes);
       } else if (property && this.attributes[property] instanceof "Object") {
           Object.freeze(this.attributes[property]);
       }
    };

    _.$one = (function() {
        var _$ = jQuery([1]);
        // _$.innerText is used only for situation where we know we do not need to unlink event handlers (e.g. grid)
        var innerText = function(val) {
            if (arguments.length) {
                if (!val && typeof val == 'undefined') {
                    this[0].innerText = '';
                } else {
                    this[0].innerText = val;
                }
                return this;
            }
            return this[0].innerText;
        };
        var textContent = function(val) {
            if (arguments.length) {
                if (!val && typeof val == 'undefined') {
                    this[0].textContent = '';
                } else {
                    this[0].textContent = val;
                }
                return this;
            }
            return this[0].textContent;
        };
        _$.innerText = (document.documentElement.textContent !== undefined) ? textContent : innerText;
        var smartAddClassLegacy = function(value) {
            if (!value) {
                return this;
            }

            var elem = this[0],
                classNames = value.split(/\s+/),
                setClass = " " + elem.className + " ",
                c, cl, changed;
            for (c = 0, cl = classNames.length; c < cl; c++) {
                if (setClass.indexOf(" " + classNames[c] + " ") === -1) {
                    setClass += classNames[c] + " ";
                    changed = true;
                }
            }
            if (changed) {
                elem.className = jQuery.trim(setClass);
            }

            return this;
        };
        var smartAddClass = function(value) {
            if (!value) {
                return this;
            }

            var elem = this[0],
                elemClasses = elem.classList,
                classNames = value.split(/\s+/),
                i = 0, l = classNames.length;

            for (; i < l; i++) {
                elemClasses.add(classNames[i]);
            }

            return this;
        };
        var smartRemoveClassLegacy = function(value) {
            if (!value) {
                return this;
            }

            var elem = this[0],
                classNames = value.split(/\s+/),
                setClass, c, cl, changed;

            if (elem.className) {
                setClass = (" " + elem.className + " ").replace(/[\t\r\n]/g, " ");
                for (c = 0, cl = classNames.length; c < cl && setClass; c++) {
                    while (setClass.indexOf(" " + classNames[c] + " ") !== -1) {
                        setClass = setClass.replace(" " + classNames[c] + " ", " ");
                        changed = true;
                    }
                }
                if (changed) {
                    elem.className = value ? jQuery.trim(setClass) : "";
                }
            }

            return this;
        };
        var smartRemoveClass = function(value) {
            if (!value) {
                return this;
            }

            var elem = this[0],
                elemClasses = elem.classList,
                classNames = value.split(/\s+/),
                i = 0, l = classNames.length;

            if (elem.className) {
                for (; i < l && elemClasses.length; i++) {
                    if (elem.className.indexOf(classNames[i]) >= 0) {
                        elemClasses.remove(classNames[i]);
                    }
                }
            }

            return this;
        };
        var smartToggleClassLegacy = function(value) {
            if (!value) {
                return this;
            }

            var elem = this[0],
                classNames = value.split(/\s+/),
                setClass, c, cl, changed;

            if (elem.className) {
                setClass = (" " + elem.className + " ").replace(/[\t\r\n]/g, " ");
                for (c = 0, cl = classNames.length; c < cl; c++) {
                    if (setClass.indexOf(" " + classNames[c] + " ") === -1) {
                        setClass += classNames[c] + " ";
                        changed = true;
                    } else {
                        while (setClass.indexOf(" " + classNames[c] + " ") !== -1) {
                            setClass = setClass.replace(" " + classNames[c] + " ", " ");
                            changed = true;
                        }
                    }
                }
                if (changed) {
                    elem.className = value ? jQuery.trim(setClass) : "";
                }
            }

            return this;
        };
        var smartToggleClass = function(value, addClass) {
            // some browsers don't support addClass in classList#toggle
            if (typeof addClass !== "undefined") {
                return jQuery.fn.toggleClass.call(this, value, addClass);
            }
            if (!value) {
                return this;
            }
            var elem = this[0],
                elemClasses = elem.classList,
                classNames = value.split(/\s+/),
                i = 0, l = classNames.length;

            for (; i < l; i++) {
                elemClasses.toggle(classNames[i]);
            }

            return this;
        };
        if (document.documentElement.classList !== undefined) {
            _$.addClass = smartAddClass;
            _$.removeClass = smartRemoveClass;
            _$.toggleClass = smartToggleClass;

            _$.smartAddClass = smartAddClass;
            _$.smartRemoveClass = smartRemoveClass;
            _$.smartToggleClass = smartToggleClass;
        } else {
            _$.addClass = smartAddClassLegacy;
            _$.removeClass = smartRemoveClassLegacy;
            _$.toggleClass = smartToggleClassLegacy;

            _$.smartAddClass = smartAddClassLegacy;
            _$.smartRemoveClass = smartRemoveClassLegacy;
            _$.smartToggleClass = smartToggleClassLegacy;
        }
        return function(element) {
            // set our element on the jQuery object and return
            return (_$[0] = element) && _$;
        };
    })();

    if (DEVMODE) {
        //Because IE's console doesn't have expandable objects and sometimes you really need it
        _.expandedTrace = function(obj, indent) {
            indent = _.orEqual(indent, "");
            for (var p in obj) {
                if (obj.hasOwnProperty(p)) {
                    console.log(indent+p+": "+obj[p]);

                    if (obj[p] && _.isObject(obj[p])) {
                        this.expandedTrace(obj[p], indent+"\t");
                    }
                }
            }
        };
    }

    // Collection that allows you to page/loadmore
    Backbone.PageableCollection = Backbone.CachedModelCollection.extend(
    // Prototype
    {
        //constants
        _pageableItemsPerPage: 10, //the number of models to show per page
        _initialPageableItemLimit: 50, //does the server return a smaller amount on the initial load and then possibly return a larger amount later? Should be used in conjuction with _pageableItemsPerLoad
        _pageableItemsPerLoad: 50, //the number of results expected from the server if limit isn't supported below and the limit is server side
        _pageableLoadFunc: function(offset, limit, options) { var d = $.Deferred(), hasMore = false; d.resolve([], hasMore); return d.promise(); }, //returns deferred and loads more for the collection. hasMore prop is optional

        //variables needed to keep track of progress
        _pageableCurrentOffset: 0, //the current position in the collection
        _pageableHasMore: true,
        _pageableLoadingDfds: null, //make sure they don't spam server

        //models that haven't been requested as part of a page yet, this is raw data from the server and options
        _pageablePendingModelsGroups: null,
        _pageablePendingModelsCount: 0,

        //allows preloading of the next page if we don't have enough events for a full 2 pages
        _pageableAllowPreload: true,

        // Override constructor to get options
        constructor: function(models, options) {
            this._pageableOptions = _.orEqual(options, {});
            if (this._pageableOptions.initialPageableItemLimit) {
                this._initialPageableItemLimit = this._pageableOptions.initialPageableItemLimit;
            } else {
                this._pageableOptions.initialPageableItemLimit = this._initialPageableItemLimit;
            }
            if (this._pageableOptions.pageableItemsPerLoad) {
                this._pageableItemsPerLoad = this._pageableOptions.pageableItemsPerLoad;
            } else {
                this._pageableOptions.pageableItemsPerLoad = this._pageableItemsPerLoad;
            }
            if (this._pageableOptions.pageableItemsPerPage) {
                this._pageableItemsPerPage = this._pageableOptions.pageableItemsPerPage;
            } else {
                this._pageableOptions.pageableItemsPerPage = this._pageableItemsPerPage;
            }

            if ((!options || !options.forceCreateAllModels) && models && models.length > this._pageableItemsPerPage) {
                this.storeNewPendingModelsGroup(models.splice(this._pageableItemsPerPage), options);
            }

            return _super.apply(this, ['constructor', models, options]);
        },

        initialize: function(models, options) {
            if (options && options.hasMore != null) {
                this._pageableHasMore = !!options.hasMore;
            } else if (models && (models.length + this._pageablePendingModelsCount) < Math.min(this._initialPageableItemLimit, this._pageableItemsPerLoad)) {
                this._pageableHasMore = false;
            }
            this._pageableCurrentOffset = 0;
            this._pageableLoadingDfds = {};
        },

        hasMore: function() {
            return this._pageableHasMore;
        },

        //does NOT return a deferred
        getCurrentPage: function() {
            var results = this.models.slice(this._pageableCurrentOffset, this._pageableCurrentOffset + this._pageableItemsPerPage);
            return new (this.constructor)(results, {forceCreateAllModels: true});
        },

        getPerPage: function() {
            return this._pageableItemsPerPage;
        },

        //allows you to change the perPage count on the fly
        //generally you should call this before putting anything on the page initially to ensure you know the perPage count
        setPerPage: function(newPerPage) {
            var d = _.orEqual(arguments[1], new $.Deferred()); //allow us to keep the same deferred when calling ourself

            var numLoaded = this.models.length,
                numShowing = Math.min(numLoaded - this._pageableCurrentOffset, this._pageableItemsPerPage),
                numNeeded = newPerPage + this._pageableCurrentOffset,
                promiseObject = d.promise(),
                results, loadMoreDfd;

            if (newPerPage <= 0) {
                d.reject();
                return promiseObject;
            }
            //accounting for pending models outside of loadMore because if we have enough to satisfy the new page size then we shouldn't bother trying to load any at all
            if (numNeeded >= numLoaded) {
                numLoaded += this.addNextPendingModels(numNeeded - numLoaded);
            }

            //if we have enough loaded to load the rest or if we cannot load anymore and we're at the beginning
            if (numLoaded >= numNeeded || numShowing >= newPerPage || (!this._pageableHasMore && !this._pageableCurrentOffset)) {
                results = this.models.slice(this._pageableCurrentOffset, this._pageableCurrentOffset + newPerPage);
                d.resolve(new (this.constructor)(results, {forceCreateAllModels: true}));

            } else if (!this._pageableHasMore) { //we need to move back the start to make sure we can fill the page
                this._pageableCurrentOffset = Math.max(this._pageableCurrentOffset - (newPerPage - numShowing), 0);
                results = this.models.slice(this._pageableCurrentOffset, this._pageableCurrentOffset + newPerPage);
                d.resolve(new (this.constructor)(results, {forceCreateAllModels: true}));

            } else {
                //need to load more and then call this function again to do all the above logic
                //this could not cause an infinite loop but this method *could* be called more then once if newPerPage > pageablePerLoad
                loadMoreDfd = this.loadMore(newPerPage).done(_.bind(this.setPerPage, this, newPerPage, d)).fail(_.bind(d.reject, d));
                if (loadMoreDfd && typeof loadMoreDfd.abort === 'function' && !promiseObject.abort) {
                    promiseObject.abort = _.bind(loadMoreDfd.abort, loadMoreDfd);
                }
                return promiseObject; //don't adjust pageablePerPage yet
            }

            this._pageableItemsPerPage = newPerPage;

            return promiseObject;
        },

        hasPrevPage: function() {
            return (this._pageableCurrentOffset > 0);
        },

        getPrevPage: function() {
            var d = _.orEqual(arguments[0], new $.Deferred()), //allow us to keep the same deferred when calling ourself
                results;

            if (this._pageableCurrentOffset > 0 && this._pageableCurrentOffset >= this._pageableItemsPerPage) {
                this._pageableCurrentOffset -= this._pageableItemsPerPage;
                results = this.models.slice(this._pageableCurrentOffset, this._pageableCurrentOffset + this._pageableItemsPerPage);
                d.resolve(new (this.constructor)(results, {forceCreateAllModels: true}));
            } else if (this._pageableCurrentOffset > 0) {
                this._pageableCurrentOffset = 0;
                results = this.models.slice(this._pageableCurrentOffset, this._pageableCurrentOffset + this._pageableItemsPerPage);
                d.resolve(new (this.constructor)(results, {forceCreateAllModels: true}));
            } else { //they shouldn't have been able to go to the prev page
                d.reject();
            }
            return d.promise();
        },

        hasNextPage: function() {
            return (this._pageableHasMore || ((this.models.length + this._pageablePendingModelsCount) - this._pageableCurrentOffset > this._pageableItemsPerPage));
        },

        //nextPage returns only the page's worth
        getNextPage: function() {
            var d = _.orEqual(arguments[0], new $.Deferred()), //allow us to keep the same deferred when calling ourself
                totalNum = arguments[1] || this._pageableCurrentOffset + this._pageableItemsPerPage; //remember the totalNum so we don't end up with a horrible loop

            var numLoaded = this.models.length,
                numRemaining = (numLoaded - totalNum),
                promiseObject = d.promise(),
                loadMoreDfd;
            if (numRemaining >= this._pageableItemsPerPage || (!this._pageableHasMore && numRemaining > 0)) {
                var results = this.models.slice(totalNum, this._pageableCurrentOffset + (this._pageableItemsPerPage * 2));
                this._pageableCurrentOffset += results.length;
                d.resolve(new (this.constructor)(results, {forceCreateAllModels: true}));

                if ((this._pageableItemsPerPage * 2) + this._pageableCurrentOffset > numLoaded && this._pageableHasMore && this._pageableAllowPreload) {
                    this.loadMore(); //begin loading the page after the next
                }
            } else {
                loadMoreDfd = this.loadMore().done(_.bind(this.getNextPage, this, d, totalNum)).fail(_.bind(d.reject, d));
                if (loadMoreDfd && typeof loadMoreDfd.abort === 'function' && !promiseObject.abort) {
                    promiseObject.abort = _.bind(loadMoreDfd.abort, loadMoreDfd);
                }
            }
            return promiseObject;
        },

        storeNewPendingModelsGroup: function(models, options) {
            if (!models || !models.length) {
                return;
            }

            if (!this._pageablePendingModelsGroups) {
                this._pageablePendingModelsGroups = [models];
            } else {
                this._pageablePendingModelsGroups.push(models);
            }
            models.addOptions = options;
            this._pageablePendingModelsCount += models.length;
        },

        //returns the number of models added
        addNextPendingModels: function(maxModelsToAdd) {
            if (!this._pageablePendingModelsGroups || !this._pageablePendingModelsCount) {
                return 0;
            }
            var pendingLen = this._pageablePendingModelsCount,
                currentOffsetItemBefore = this.models[this._pageableCurrentOffset],
                modelsAdded = 0,
                nextGroup, newModels, groupLen;
            while (pendingLen > 0 && (!maxModelsToAdd || modelsAdded < maxModelsToAdd)) {
                nextGroup = this._pageablePendingModelsGroups.shift();
                if (!nextGroup) {
                    pendingLen = 0;
                    break;
                }
                groupLen = nextGroup.length;
                if (maxModelsToAdd != null && (modelsAdded + groupLen) > maxModelsToAdd) {
                    newModels = nextGroup.splice(0, maxModelsToAdd);
                    pendingLen -= maxModelsToAdd;
                    modelsAdded += maxModelsToAdd;
                } else {
                    newModels = nextGroup;
                    pendingLen -= groupLen;
                    modelsAdded += groupLen;
                }
                this.add(newModels, newModels.addOptions);
            }
            this._pageablePendingModelsCount = pendingLen;
            if (modelsAdded > 0 && currentOffsetItemBefore && this._pageableCurrentOffset > 0) {
                this._pageableCurrentOffset = this.indexOf(currentOffsetItemBefore); //recalculate offset in case something weird happened
            }
            return modelsAdded;
        },

        //loadMore returns a full new collection
        loadMore: function(numNeeded) {
            numNeeded = numNeeded || this._pageableItemsPerPage;
            var d = new $.Deferred(),
                pendingModelsAdded = this.addNextPendingModels(numNeeded),
                promiseObject = d.promise(),
                apiDfd;
            if (!this._pageableHasMore) {
                d.reject();
            } else if (pendingModelsAdded >= numNeeded) {
                d.resolve(this);
            } else {
                var dfdKey = this.models.length + ':' + numNeeded;

                if (this._pageableLoadingDfds[dfdKey]) {
                    return this._pageableLoadingDfds[dfdKey];
                }
                apiDfd = this._pageableLoadFunc.call(this, this.models.length, this._pageableOptions).done(_.bind(function(results, hasMore, modelOptions) {
                    if (!this.processMore(numNeeded, results, hasMore, modelOptions)) {
                        d.reject();
                        return;
                    }
                    d.resolve(this);
                }, this)).fail(_.bind(d.reject, d));

                if (apiDfd && typeof apiDfd.abort === 'function') {
                    promiseObject.abort = _.bind(apiDfd.abort, apiDfd);
                }
                this._pageableLoadingDfds[dfdKey] = promiseObject;
            }
            return promiseObject;
        },

        processMore: function(numNeeded, results, hasMore, modelOptions) {
            if (!_.isArray(results)) {
                return false;
            }

            if (results.length < this._pageableItemsPerLoad) {
                this._pageableHasMore = false;
            }

            var numBeforeAdd = this.models.length,
                numFetched = results.length,
                numNewPending = 0;
            if (numFetched) {
                var currentOffsetItemBefore = this.models[this._pageableCurrentOffset],
                    totalNumNeeded = (this._pageableCurrentOffset + (2 * numNeeded)); //multply by 2 because offset is of the BEGINNING of the current page
                //if we will have more items than what satisfies the next page, then store in pending
                if ((numBeforeAdd + numFetched) > totalNumNeeded) {
                    numNewPending = numFetched - totalNumNeeded + numBeforeAdd;
                    this.storeNewPendingModelsGroup(results.splice(numFetched - numNewPending), modelOptions);
                }
                this.add(results, modelOptions);
                if (currentOffsetItemBefore && this._pageableCurrentOffset > 0) {
                    this._pageableCurrentOffset = this.indexOf(currentOffsetItemBefore); //recalculate offset in case something weird happened
                }
            }
            //we're calculating new items after add() in case there were duplicates
            var newItems = this.models.length - numBeforeAdd + numNewPending;
            if ((!newItems || newItems < this._pageableItemsPerLoad) && !hasMore) {
                this._pageableHasMore = false;
            }

            //don't know how these could happen but trust the server
            if (!this._pageableHasMore && hasMore) {
                this._pageableHasMore = hasMore;
            } else if (this._pageableHasMore && hasMore === false) {
                this._pageableHasMore = hasMore;
            }
            return true;
        }

    },
    //static
    {

    });

    // Implement a version of $.when that supports an array
    $.after = function(dfds) {
        if (arguments.length > 1) {
            return $.when.apply(this, _.toArray(arguments));
        }
        if (_.isArray(dfds) && dfds.length) {
            return $.when.apply(this, dfds);
        }
        return $.when(dfds);
    };

    // Allow using a deferred for getting a stylesheet
    // TODO: make this really async in all browsers (onload, addEventListener, and using style imports)
    $.getStylesheet = function(path) {
        var css = document.createElement('link'),
            dfd = $.Deferred(),
            md5Path = hex_md5(path),
            $loadedCss = $('#getStylesheet' + md5Path);

        // cachebuster for DEVMODE
        if (DEVMODE) {
            var separator = path.indexOf('?') === -1 ? "?" : "&";
            path += separator + Date.now();
        }

        if (!$loadedCss || !$loadedCss.length) {
            css.id = 'getStylesheet' + md5Path;
            css.rel = 'stylesheet';
            css.type = 'text/css';
            css.href = path;
            var onError = function() {
                $('#getStylesheet' + md5Path).remove();
            };
            var hasEventListeners = _.isFunction(css.addEventListener);
            if (hasEventListeners) {
                css.addEventListener('error', onError);
            }
            css.onerror = onError;
            // clean up after 60s
            setTimeout(function() {
                if (hasEventListeners && css.removeEventListener) {
                    css.removeEventListener('error', onError);
                }
                css.onerror = $.noop;
                onError = null;
            }, 60000);
        }

        var links = document.getElementsByTagName('link'),
            link = links[links.length - 1],
            linkParent = link.parentNode;
        linkParent.appendChild(css);

        _.delay(function() {
            dfd.resolve();
        }, 0);
        return dfd;
    };

    // gets the offset relative to an element as long as that element is a parent
    jQuery.fn.offsetTo = function($lastElement) {
        if (!$lastElement || !this[0]) {
            return null;
        }

        var scrollOffset = {top: 0, left: 0},
            $nextOffset = this,
            $nextOffsetParent = this,
            i = 0, pos;

        // assume the body is at the top left of document...
        if (($lastElement[0].tagName || '').toLowerCase() == 'body' && $lastElement[0] == $('body')[0]) {
            var bodyOffset = $lastElement.offset();
            if (bodyOffset.top == 0 && bodyOffset.left == 0) {
                var offset = this.offset(),
                    lastElementOffset = $lastElement.offset();
                scrollOffset.top = offset.top - lastElementOffset.top;
                scrollOffset.left = offset.left - lastElementOffset.left;
                return scrollOffset;
            }
        }

        // this isn't foolproof due to margin: auto;
        do {
            i++;
            if ($nextOffset[0] == $nextOffsetParent[0]) {
                pos = $nextOffset.position();
                scrollOffset.top += pos.top;
                scrollOffset.left += pos.left;
                $nextOffsetParent = $nextOffsetParent.offsetParent();
            }
            $nextOffset = $nextOffset.parent();
        } while ($nextOffset[0] != $lastElement[0] && i < 10000);
        if ($nextOffset[0] != $lastElement[0]) {
            return null;
        }
        scrollOffset.top += $lastElement.scrollTop();
        scrollOffset.left += $lastElement.scrollLeft();
        return scrollOffset;
    };

    jQuery.fn.swapClasses = function(class1, class2, condition) {
        return this.each(function() {
            var $el = $(this);
            if (condition) {
                $el.addClass(class1).removeClass(class2);
            } else {
                $el.removeClass(class1).addClass(class2);
            }
        });
    };

    // I've stuck this at the very bottom of the file because it mucks up syntax highlighting
    _.emailRegex = /^[A-z0-9.+-]+@[A-z0-9][A-z0-9-]*(\.[A-z0-9-]+)*\.([A-z]{2,6})$/;

    $.parseGSTagMessage = function(message) {
        if (typeof message !== 'string' || !message) {
            return [];
        }

        var chunks = (message ? message.split('##') : []),
            unescapeRegex = /\\#/g, //if we want to replace more than one then we gotta use a regex
            messageParts = [],
            i = 0,
            l = chunks.length,
            chunk;
        for (;i < l; i += 3) {
            chunk = chunks[i].replace(unescapeRegex, '#');
            if (chunk) {
                messageParts.push(chunk);
            }
            //next is the item's ID
            //next next is the item's name
            if (chunks[i + 1] == null || chunks[i + 2] == null) {
                break;
            }
            messageParts.push({
                id: _.toInt(chunks[i + 1]),
                name: chunks[i + 2].replace(unescapeRegex, '#')
            });
        }
        return messageParts;
    };

}(window._));
