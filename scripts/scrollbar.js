/**
 * @author wuwg
 * @version 2016.0.1
 * @description file
 * @createTime 2016/6/30
 * @updateTime 2016/7/4
 * @descrition  兼容ie7
 */
+ function (window, $) {
    /*! Copyright (c) 2013 Brandon Aaron (http://brandon.aaron.sh)
     * Licensed under the MIT License (LICENSE.txt).
     *
     * Version: 3.1.12
     *
     * Requires: jQuery 1.2.2+
     */
    (function (factory) {
        if (typeof define === 'function' && define.amd) {
            // AMD. Register as an anonymous module.
            define(['jquery'], factory);
        } else if (typeof exports === 'object') {
            // Node/CommonJS style for Browserify
            module.exports = factory;
        } else {
            // Browser globals
            factory(jQuery);
        }
    }(function ($) {
        var toFix = ['wheel', 'mousewheel', 'DOMMouseScroll', 'MozMousePixelScroll'],
            toBind = ('onwheel' in document || document.documentMode >= 9) ? ['wheel'] : ['mousewheel', 'DomMouseScroll', 'MozMousePixelScroll'],
            slice = Array.prototype.slice,
            nullLowestDeltaTimeout,
            lowestDelta;
        if ($.event.fixHooks) {
            for (var i = toFix.length; i;) {
                $.event.fixHooks[toFix[--i]] = $.event.mouseHooks;
            }
        }
        var special = $.event.special.mousewheel = {
            version: '3.1.12',
            setup: function () {
                    if (this.addEventListener) {
                        for (var i = toBind.length; i;) {
                            this.addEventListener(toBind[--i], handler, false);
                        }
                    } else {
                        this.onmousewheel = handler;
                    }
                    // Store the line height and page height for this particular element
                    $.data(this, 'mousewheel-line-height', special.getLineHeight(this));
                    $.data(this, 'mousewheel-page-height', special.getPageHeight(this));
                },
                teardown: function () {
                    if (this.removeEventListener) {
                        for (var i = toBind.length; i;) {
                            this.removeEventListener(toBind[--i], handler, false);
                        }
                    } else {
                        this.onmousewheel = null;
                    }
                    // Clean up the data we added to the element
                    $.removeData(this, 'mousewheel-line-height');
                    $.removeData(this, 'mousewheel-page-height');
                },
                getLineHeight: function (elem) {
                    var $elem = $(elem),
                        $parent = $elem['offsetParent' in $.fn ? 'offsetParent' : 'parent']();
                    if (!$parent.length) {
                        $parent = $('body');
                    }
                    return parseInt($parent.css('fontSize'), 10) || parseInt($elem.css('fontSize'), 10) || 16;
                },
                getPageHeight: function (elem) {
                    return $(elem).height();
                },
                settings: {
                    adjustOldDeltas: true, // see shouldAdjustOldDeltas() below
                    normalizeOffset: true // calls getBoundingClientRect for each event
                }
        };
        $.fn.extend({
            mousewheel: function (fn) {
                    return fn ? this.bind('mousewheel', fn) : this.trigger('mousewheel');
                },
                unmousewheel: function (fn) {
                    return this.unbind('mousewheel', fn);
                }
        });

        function handler(event) {
            var orgEvent = event || window.event,
                args = slice.call(arguments, 1),
                delta = 0,
                deltaX = 0,
                deltaY = 0,
                absDelta = 0,
                offsetX = 0,
                offsetY = 0;
            event = $.event.fix(orgEvent);
            event.type = 'mousewheel';
            // Old school scrollwheel delta
            if ('detail' in orgEvent) {
                deltaY = orgEvent.detail * -1;
            }
            if ('wheelDelta' in orgEvent) {
                deltaY = orgEvent.wheelDelta;
            }
            if ('wheelDeltaY' in orgEvent) {
                deltaY = orgEvent.wheelDeltaY;
            }
            if ('wheelDeltaX' in orgEvent) {
                deltaX = orgEvent.wheelDeltaX * -1;
            }
            // Firefox < 17 horizontal scrolling related to DOMMouseScroll event
            if ('axis' in orgEvent && orgEvent.axis === orgEvent.HORIZONTAL_AXIS) {
                deltaX = deltaY * -1;
                deltaY = 0;
            }
            // Set delta to be deltaY or deltaX if deltaY is 0 for backwards compatabilitiy
            delta = deltaY === 0 ? deltaX : deltaY;
            // New school wheel delta (wheel event)
            if ('deltaY' in orgEvent) {
                deltaY = orgEvent.deltaY * -1;
                delta = deltaY;
            }
            if ('deltaX' in orgEvent) {
                deltaX = orgEvent.deltaX;
                if (deltaY === 0) {
                    delta = deltaX * -1;
                }
            }
            // No change actually happened, no reason to go any further
            if (deltaY === 0 && deltaX === 0) {
                return;
            }
            // Need to convert lines and pages to pixels if we aren't already in pixels
            // There are three delta modes:
            // * deltaMode 0 is by pixels, nothing to do
            // * deltaMode 1 is by lines
            // * deltaMode 2 is by pages
            if (orgEvent.deltaMode === 1) {
                var lineHeight = $.data(this, 'mousewheel-line-height');
                delta *= lineHeight;
                deltaY *= lineHeight;
                deltaX *= lineHeight;
            } else if (orgEvent.deltaMode === 2) {
                var pageHeight = $.data(this, 'mousewheel-page-height');
                delta *= pageHeight;
                deltaY *= pageHeight;
                deltaX *= pageHeight;
            }
            // Store lowest absolute delta to normalize the delta values
            absDelta = Math.max(Math.abs(deltaY), Math.abs(deltaX));
            if (!lowestDelta || absDelta < lowestDelta) {
                lowestDelta = absDelta;
                // Adjust older deltas if necessary
                if (shouldAdjustOldDeltas(orgEvent, absDelta)) {
                    lowestDelta /= 40;
                }
            }
            // Adjust older deltas if necessary
            if (shouldAdjustOldDeltas(orgEvent, absDelta)) {
                // Divide all the things by 40!
                delta /= 40;
                deltaX /= 40;
                deltaY /= 40;
            }
            // Get a whole, normalized value for the deltas
            delta = Math[delta >= 1 ? 'floor' : 'ceil'](delta / lowestDelta);
            deltaX = Math[deltaX >= 1 ? 'floor' : 'ceil'](deltaX / lowestDelta);
            deltaY = Math[deltaY >= 1 ? 'floor' : 'ceil'](deltaY / lowestDelta);
            // Normalise offsetX and offsetY properties
            if (special.settings.normalizeOffset && this.getBoundingClientRect) {
                var boundingRect = this.getBoundingClientRect();
                offsetX = event.clientX - boundingRect.left;
                offsetY = event.clientY - boundingRect.top;
            }
            // Add information to the event object
            event.deltaX = deltaX;
            event.deltaY = deltaY;
            event.deltaFactor = lowestDelta;
            event.offsetX = offsetX;
            event.offsetY = offsetY;
            // Go ahead and set deltaMode to 0 since we converted to pixels
            // Although this is a little odd since we overwrite the deltaX/Y
            // properties with normalized deltas.
            event.deltaMode = 0;
            // Add event and delta to the front of the arguments
            args.unshift(event, delta, deltaX, deltaY);
            // Clearout lowestDelta after sometime to better
            // handle multiple device types that give different
            // a different lowestDelta
            // Ex: trackpad = 3 and mouse wheel = 120
            if (nullLowestDeltaTimeout) {
                clearTimeout(nullLowestDeltaTimeout);
            }
            nullLowestDeltaTimeout = setTimeout(nullLowestDelta, 200);
            return ($.event.dispatch || $.event.handle).apply(this, args);
        }

        function nullLowestDelta() {
            lowestDelta = null;
        }

        function shouldAdjustOldDeltas(orgEvent, absDelta) {
            // If this is an older event and the delta is divisable by 120,
            // then we are assuming that the browser is treating this as an
            // older mouse wheel event and that we should divide the deltas
            // by 40 to try and get a more usable deltaFactor.
            // Side note, this actually impacts the reported scroll distance
            // in older browsers and can cause scrolling to be slower than native.
            // Turn this off by setting $.event.special.mousewheel.settings.adjustOldDeltas to false.
            return special.settings.adjustOldDeltas && orgEvent.type === 'mousewheel' && absDelta % 120 === 0;
        }
    }));
}
(window, jQuery); + function (window, $) {
    $.fn.addScrollBar = function (options) {
        /**
         * @author  wuwg
         * @createTime   2016-07-03
         * @updateTime   2016-07-03
         * @description  自制滚动条函数
         * @return  {{object}}  _scope
         * @更新方法 _scope.scrollBar.update(tweenTime,top) ; tweenTime 缓动时间 ，top 设置 top值
         */
        var _scope = {};
        _scope._this = $(this);
        var defaultOptions = {
                version: '16.7.1',
                autho: 'wuwg',
                creatTime: '2016-07-06',
                updateTime: '2016-07-06',
                // 滚动条参数
                hasScrollBar: true, // 是否有滚动条
                scrollBarContain: '.fd-scroll-track', // 滚动条容器
                scrollBarClass: 'fd-scroll-bar', // 滚动条
                pressClass: 'pressed', // 滚动条按下类名
                scrollBarMinHeight: 50, //  滚动条最小高度
                scrollStep: 10, // 一次滚动的距离
                scrollTweenTime: 10, // 滚动耗时
                parentContain: _scope._this.parent() // 滚动条父容器
            }
            // 合并参数
        _scope.opts = $.fn.extend(true, defaultOptions, options || {});
        /**
         * @author  wuwg
         * @createTime   2016-07-03
         * @updateTime   2016-07-03
         * @description  自制滚动条函数
         *  运用到了tree中的两个对象   _scope.search.treeContain  和  _scope._this
         *  //父元素
         _scope.scrollBar.parentContain===_scope.search.treeContain
         // 内容容器
         _scope.scrollBar.contentContain =_scope._this;
         *
         */
        _scope.scrollBar = {
            // 比较值函数
            range: function (num, max, min) {
                    return Math.ceil(Math.min(max, Math.max(num, min)));
                },
                // 阻止冒泡函数
                stopBubble: function (event) {
                    event.stopPropagation();
                    event.preventDefault();
                },
                // 创建滚动条容器
                createScrollBar: function () {
                    _scope.scrollBar.trackContain.html('<span class="' + _scope.opts.scrollBarClass + '"></span>');
                    _scope.scrollBar.bar = _scope.scrollBar.trackContain.find('.' + _scope.opts.scrollBarClass);
                },
                /**
                 * @description  获取所有的参数
                 */
                getParamHeight: function () {
                    //  容器的高(可视区域的高)
                    _scope.scrollBar.offsetHeight = _scope.scrollBar.parentContain.height();
                    // 文档的高
                    _scope.scrollBar.scrollHeight = _scope.scrollBar.contentContain.innerHeight();
                    // 滑道的高
                    _scope.scrollBar.trackContainHeight = _scope.scrollBar.trackContain.innerHeight();
                    // 滚动条的高（ 计算公式：可视区域的高/文档的高= 等于scrollBar.height/_scope.scrollBar.contain.height）
                    var scrollBar = _scope.scrollBar.offsetHeight / _scope.scrollBar.scrollHeight * _scope.scrollBar.trackContainHeight;
                    //  重新定义滚动条的高（需要设置一个最小值）
                    _scope.scrollBar.barHeight = Math.max(_scope.opts.scrollBarMinHeight, scrollBar);
                    // 滚动条最小的top值
                    _scope.scrollBar.scrollMinDistance = 0;
                    // 滚动条最大的top值
                    _scope.scrollBar.scrollMaxDistance = _scope.scrollBar.trackContainHeight - _scope.scrollBar.barHeight;
                    // 滑道的有效区域高  （计算公式：等于滑道高减去滚动条的高）
                    _scope.scrollBar.scrollAreaHeight = _scope.scrollBar.trackContainHeight - _scope.scrollBar.barHeight;
                    // 设置滚动条的高
                    _scope.scrollBar.bar.height(_scope.scrollBar.barHeight);
                    // 如果可是区域的高大于文档内容的高那么隐藏滚动条
                    if (_scope.scrollBar.offsetHeight > _scope.scrollBar.scrollHeight) {
                        _scope.scrollBar.trackContain.hide();
                    } else {
                        _scope.scrollBar.trackContain.show();
                    };
                },
                /**
                 *
                 * @param scrollTweenTime     number 毫秒
                 * @description  更新滚动条所有参数和内容以及滚动条的位置
                 */
                update: function (scrollTweenTime, top) {
                    if ($.type(top) == 'number') {
                        //  设置top值
                        var top = top;
                        // 重新获取参数
                        _scope.scrollBar.getParamHeight();
                        if ((_scope.scrollBar.scrollHeight - top) < _scope.scrollBar.offsetHeight) {
                            top = _scope.scrollBar.scrollHeight - _scope.scrollBar.offsetHeight;
                        }
                        var _percentProgress = Math.abs(top) / (_scope.scrollBar.scrollHeight - _scope.scrollBar.offsetHeight);
                    } else {
                        if (_scope.scrollBar.scrollHeight === _scope.scrollBar.contentContain.innerHeight() && _scope.scrollBar.offsetHeight === _scope.scrollBar.parentContain.height()) {
                            return;
                        } else {
                            // 滑块当前位置
                            var _nowProgress = !parseInt(_scope.scrollBar.contentContain.css("top")) ? 0 : parseInt(_scope.scrollBar.contentContain.css("top"));
                            // 滑块移动距离占总长度的百分之比
                            var _percentProgress = Math.abs(_nowProgress) / (_scope.scrollBar.scrollHeight - _scope.scrollBar.offsetHeight);
                            var originScrollHeight = _scope.scrollBar.scrollHeight;
                            _scope.scrollBar.getParamHeight();
                            var _currentPercentProgress = Math.abs(_nowProgress) / (_scope.scrollBar.scrollHeight - _scope.scrollBar.offsetHeight);
                            var newScrollHeight = _scope.scrollBar.scrollHeight;
                            // 那么是展开
                            if (originScrollHeight < newScrollHeight) {
                                //  百分比取小的那个
                                _percentProgress = Math.min(_currentPercentProgress, _percentProgress);
                                // 那么是收起
                            } else {
                                _percentProgress = Math.max(_currentPercentProgress, _percentProgress);
                            };
                            if (_percentProgress > 1) {
                                _percentProgress = 1;
                            }
                        };
                    };
                    var _scrollTweenTime = _scope.opts.scrollTweenTime;
                    if ($.type(scrollTweenTime) == 'number') {
                        _scrollTweenTime = scrollTweenTime;
                    }
                    var scrollTweenTime = _scope.opts.scrollTweenTime;
                    // 滚动条移动
                    _scope.scrollBar.bar.stop(true, true).animate({
                        'top': _scope.scrollBar.scrollAreaHeight * _percentProgress
                    }, _scrollTweenTime);
                    //  内容移动
                    _scope.scrollBar.contentContain.stop(true, true).animate({
                        'top': -Math.round((_scope.scrollBar.scrollHeight - _scope.scrollBar.offsetHeight) * _percentProgress)
                    }, _scrollTweenTime);
                },
                /**
                 *
                 * @param moveDistance    number
                 * @description  滚动条动画和内容动画
                 */
                moveFunction: function (moveDistance) {
                    // 滑块当前位置
                    var _nowProgress = parseInt(_scope.scrollBar.bar.css("top")) == "" ? 0 : parseInt(_scope.scrollBar.bar.css("top"));
                    _nowProgress += Number(moveDistance);
                    // 当前滑块的top位置  //num, max, min
                    var _ScrollCurrentTopNum = _scope.scrollBar.range(_nowProgress, _scope.scrollBar.scrollMaxDistance, _scope.scrollBar.scrollMinDistance);
                    // 滑块移动距离占总长度的百分之比
                    var _percentProgress = _ScrollCurrentTopNum / _scope.scrollBar.scrollAreaHeight;
                    if (_scope.scrollBar.bar.is(':animated') || _scope.scrollBar.contentContain.is(':animated')) {
                        return;
                    } else {
                        if (_scope.scrollBar.draging) {
                            var scrollTweenTime = 0;
                        } else {
                            scrollTweenTime = _scope.opts.scrollTweenTime;
                        };

                         // 滚动条移动
                        _scope.scrollBar.bar.stop(true, true).animate({
                            'top': _ScrollCurrentTopNum
                        }, scrollTweenTime);
                        //  内容移动
                        _scope.scrollBar.contentContain.stop(true, true).animate({
                            'top': -(_scope.scrollBar.scrollHeight - _scope.scrollBar.offsetHeight) * _percentProgress
                        }, scrollTweenTime);
                    }
                },
                /**
                 *
                 * @param event  鼠标滚轮事件
                 */
                mousewheel: function (event) {
                    _scope.scrollBar.stopBubble(event);
                    // 判断鼠标向下还是向上滚动
                    var _mousewheelDir = event.deltaY,
                        _moveDistance = 0;
                    switch (_mousewheelDir) {
                        //  向上滚动
                    case 1:
                        //开始和结束的差值
                        _moveDistance = _scope.opts.scrollStep * (-1);
                        //执行函数
                        _scope.scrollBar.moveFunction(_moveDistance);
                        break;
                        //  向下滚动
                    case -1:
                        //开始和结束的差值
                        _moveDistance = _scope.opts.scrollStep;
                        //执行函数
                        _scope.scrollBar.moveFunction(_moveDistance);
                        break;
                    default:
                        break;
                    }
                },
                draging: false,
            /**
             * @param event
             * @description  滚动条区域鼠标按下的的回调函数，先给window绑定事件，鼠标松开释放事件
             */
            mousedown: function (event) {
                    var _that = $(this);
                    _scope.scrollBar.draging = true;
                    var start = event.pageY,
                        _moveDistance = 0,
                        end = 0;
                    _that.addClass(_scope.opts.pressClass);
                    $(window).on('mousemove.scrollBar', function (event) {
                        // 阻止事件冒泡
                        _scope.scrollBar.stopBubble(event);
                        end = event.pageY;
                        //开始和结束的差值
                        _moveDistance = end - start;
                        start = end;
                        _scope.scrollBar.moveFunction(_moveDistance);
                    }).on('mouseup.scrollBar', function () {
                        $(window).off('mousemove.scrollBar');
                        $(window).off('mouseup.scrollBar');
                        _scope.scrollBar.draging = false;
                        _that.removeClass(_scope.opts.pressClass);
                    });
                },
                /**
                 * @description  window.rezize 方法, 更新滚动条
                 */
                resize: function () {
                    _scope.scrollBar.update(20);
                },
                bindEvent: function () {
                    _scope.scrollBar.parentContain.on('mousewheel.scrollBar', _scope.scrollBar.mousewheel);
                    _scope.scrollBar.parentContain.on('mousedown.scrollBar', '.' + _scope.opts.scrollBarClass, _scope.scrollBar.mousedown);
                    $(window).on('resize.scrollBar', _scope.scrollBar.resize);
                },
                unbindEvent: function () {
                    _scope.scrollBar.parentContain.off('mousewheel.scrollBar', _scope.scrollBar.mousewheel);
                    _scope.scrollBar.parentContain.off('mousedown.scrollBar', '.' + _scope.opts.scrollBarClass, _scope.scrollBar.mousedown);
                    $(window).off('resize.scrollBar');
                },
                init: function () {
                    //父元素
                    _scope.scrollBar.parentContain = $(_scope.opts.parentContain);
                    _scope.scrollBar.parentContain.css({
                        overflow: 'hidden'
                    });
                    // 滑道容器
                    _scope.scrollBar.trackContain = _scope.scrollBar.parentContain.children(_scope.opts.scrollBarContain);
                    // 内容容器
                    _scope.scrollBar.contentContain = _scope._this;
                    // 创建滚动条
                    _scope.scrollBar.createScrollBar();
                    // 获取响应参数，并且设置滚动条的高
                    _scope.scrollBar.getParamHeight();
                    // 绑定事件
                    _scope.scrollBar.bindEvent();
                },
                //  销毁对象
                destory: function () {
                    //  销毁事件
                    _scope.scrollBar.unbindEvent();
                    // 销毁内容
                    _scope.scrollBar.trackContain.html('');
                }
        };
        // 创建滚动条
        if (_scope.opts.hasScrollBar) {
            _scope.scrollBar.init();
        };
        return _scope;
    };
}(window, jQuery);