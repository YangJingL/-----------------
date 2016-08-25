/**
 * @author wuwg
 * @version 2016.0.1
 * @description file
 * @createTime 2016/6/30
 * @updateTime 2016/7/4
 * @descrition  ����ie7
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
         * @description  ���ƹ���������
         * @return  {{object}}  _scope
         * @���·��� _scope.scrollBar.update(tweenTime,top) ; tweenTime ����ʱ�� ��top ���� topֵ
         */
        var _scope = {};
        _scope._this = $(this);
        var defaultOptions = {
                version: '16.7.1',
                autho: 'wuwg',
                creatTime: '2016-07-06',
                updateTime: '2016-07-06',
                // ����������
                hasScrollBar: true, // �Ƿ��й�����
                scrollBarContain: '.fd-scroll-track', // ����������
                scrollBarClass: 'fd-scroll-bar', // ������
                pressClass: 'pressed', // ��������������
                scrollBarMinHeight: 50, //  ��������С�߶�
                scrollStep: 10, // һ�ι����ľ���
                scrollTweenTime: 10, // ������ʱ
                parentContain: _scope._this.parent() // ������������
            }
            // �ϲ�����
        _scope.opts = $.fn.extend(true, defaultOptions, options || {});
        /**
         * @author  wuwg
         * @createTime   2016-07-03
         * @updateTime   2016-07-03
         * @description  ���ƹ���������
         *  ���õ���tree�е���������   _scope.search.treeContain  ��  _scope._this
         *  //��Ԫ��
         _scope.scrollBar.parentContain===_scope.search.treeContain
         // ��������
         _scope.scrollBar.contentContain =_scope._this;
         *
         */
        _scope.scrollBar = {
            // �Ƚ�ֵ����
            range: function (num, max, min) {
                    return Math.ceil(Math.min(max, Math.max(num, min)));
                },
                // ��ֹð�ݺ���
                stopBubble: function (event) {
                    event.stopPropagation();
                    event.preventDefault();
                },
                // ��������������
                createScrollBar: function () {
                    _scope.scrollBar.trackContain.html('<span class="' + _scope.opts.scrollBarClass + '"></span>');
                    _scope.scrollBar.bar = _scope.scrollBar.trackContain.find('.' + _scope.opts.scrollBarClass);
                },
                /**
                 * @description  ��ȡ���еĲ���
                 */
                getParamHeight: function () {
                    //  �����ĸ�(��������ĸ�)
                    _scope.scrollBar.offsetHeight = _scope.scrollBar.parentContain.height();
                    // �ĵ��ĸ�
                    _scope.scrollBar.scrollHeight = _scope.scrollBar.contentContain.innerHeight();
                    // �����ĸ�
                    _scope.scrollBar.trackContainHeight = _scope.scrollBar.trackContain.innerHeight();
                    // �������ĸߣ� ���㹫ʽ����������ĸ�/�ĵ��ĸ�= ����scrollBar.height/_scope.scrollBar.contain.height��
                    var scrollBar = _scope.scrollBar.offsetHeight / _scope.scrollBar.scrollHeight * _scope.scrollBar.trackContainHeight;
                    //  ���¶���������ĸߣ���Ҫ����һ����Сֵ��
                    _scope.scrollBar.barHeight = Math.max(_scope.opts.scrollBarMinHeight, scrollBar);
                    // ��������С��topֵ
                    _scope.scrollBar.scrollMinDistance = 0;
                    // ����������topֵ
                    _scope.scrollBar.scrollMaxDistance = _scope.scrollBar.trackContainHeight - _scope.scrollBar.barHeight;
                    // ��������Ч�����  �����㹫ʽ�����ڻ����߼�ȥ�������ĸߣ�
                    _scope.scrollBar.scrollAreaHeight = _scope.scrollBar.trackContainHeight - _scope.scrollBar.barHeight;
                    // ���ù������ĸ�
                    _scope.scrollBar.bar.height(_scope.scrollBar.barHeight);
                    // �����������ĸߴ����ĵ����ݵĸ���ô���ع�����
                    if (_scope.scrollBar.offsetHeight > _scope.scrollBar.scrollHeight) {
                        _scope.scrollBar.trackContain.hide();
                    } else {
                        _scope.scrollBar.trackContain.show();
                    };
                },
                /**
                 *
                 * @param scrollTweenTime     number ����
                 * @description  ���¹��������в����������Լ���������λ��
                 */
                update: function (scrollTweenTime, top) {
                    if ($.type(top) == 'number') {
                        //  ����topֵ
                        var top = top;
                        // ���»�ȡ����
                        _scope.scrollBar.getParamHeight();
                        if ((_scope.scrollBar.scrollHeight - top) < _scope.scrollBar.offsetHeight) {
                            top = _scope.scrollBar.scrollHeight - _scope.scrollBar.offsetHeight;
                        }
                        var _percentProgress = Math.abs(top) / (_scope.scrollBar.scrollHeight - _scope.scrollBar.offsetHeight);
                    } else {
                        if (_scope.scrollBar.scrollHeight === _scope.scrollBar.contentContain.innerHeight() && _scope.scrollBar.offsetHeight === _scope.scrollBar.parentContain.height()) {
                            return;
                        } else {
                            // ���鵱ǰλ��
                            var _nowProgress = !parseInt(_scope.scrollBar.contentContain.css("top")) ? 0 : parseInt(_scope.scrollBar.contentContain.css("top"));
                            // �����ƶ�����ռ�ܳ��ȵİٷ�֮��
                            var _percentProgress = Math.abs(_nowProgress) / (_scope.scrollBar.scrollHeight - _scope.scrollBar.offsetHeight);
                            var originScrollHeight = _scope.scrollBar.scrollHeight;
                            _scope.scrollBar.getParamHeight();
                            var _currentPercentProgress = Math.abs(_nowProgress) / (_scope.scrollBar.scrollHeight - _scope.scrollBar.offsetHeight);
                            var newScrollHeight = _scope.scrollBar.scrollHeight;
                            // ��ô��չ��
                            if (originScrollHeight < newScrollHeight) {
                                //  �ٷֱ�ȡС���Ǹ�
                                _percentProgress = Math.min(_currentPercentProgress, _percentProgress);
                                // ��ô������
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
                    // �������ƶ�
                    _scope.scrollBar.bar.stop(true, true).animate({
                        'top': _scope.scrollBar.scrollAreaHeight * _percentProgress
                    }, _scrollTweenTime);
                    //  �����ƶ�
                    _scope.scrollBar.contentContain.stop(true, true).animate({
                        'top': -Math.round((_scope.scrollBar.scrollHeight - _scope.scrollBar.offsetHeight) * _percentProgress)
                    }, _scrollTweenTime);
                },
                /**
                 *
                 * @param moveDistance    number
                 * @description  ���������������ݶ���
                 */
                moveFunction: function (moveDistance) {
                    // ���鵱ǰλ��
                    var _nowProgress = parseInt(_scope.scrollBar.bar.css("top")) == "" ? 0 : parseInt(_scope.scrollBar.bar.css("top"));
                    _nowProgress += Number(moveDistance);
                    // ��ǰ�����topλ��  //num, max, min
                    var _ScrollCurrentTopNum = _scope.scrollBar.range(_nowProgress, _scope.scrollBar.scrollMaxDistance, _scope.scrollBar.scrollMinDistance);
                    // �����ƶ�����ռ�ܳ��ȵİٷ�֮��
                    var _percentProgress = _ScrollCurrentTopNum / _scope.scrollBar.scrollAreaHeight;
                    if (_scope.scrollBar.bar.is(':animated') || _scope.scrollBar.contentContain.is(':animated')) {
                        return;
                    } else {
                        if (_scope.scrollBar.draging) {
                            var scrollTweenTime = 0;
                        } else {
                            scrollTweenTime = _scope.opts.scrollTweenTime;
                        };

                         // �������ƶ�
                        _scope.scrollBar.bar.stop(true, true).animate({
                            'top': _ScrollCurrentTopNum
                        }, scrollTweenTime);
                        //  �����ƶ�
                        _scope.scrollBar.contentContain.stop(true, true).animate({
                            'top': -(_scope.scrollBar.scrollHeight - _scope.scrollBar.offsetHeight) * _percentProgress
                        }, scrollTweenTime);
                    }
                },
                /**
                 *
                 * @param event  �������¼�
                 */
                mousewheel: function (event) {
                    _scope.scrollBar.stopBubble(event);
                    // �ж�������»������Ϲ���
                    var _mousewheelDir = event.deltaY,
                        _moveDistance = 0;
                    switch (_mousewheelDir) {
                        //  ���Ϲ���
                    case 1:
                        //��ʼ�ͽ����Ĳ�ֵ
                        _moveDistance = _scope.opts.scrollStep * (-1);
                        //ִ�к���
                        _scope.scrollBar.moveFunction(_moveDistance);
                        break;
                        //  ���¹���
                    case -1:
                        //��ʼ�ͽ����Ĳ�ֵ
                        _moveDistance = _scope.opts.scrollStep;
                        //ִ�к���
                        _scope.scrollBar.moveFunction(_moveDistance);
                        break;
                    default:
                        break;
                    }
                },
                draging: false,
            /**
             * @param event
             * @description  ������������갴�µĵĻص��������ȸ�window���¼�������ɿ��ͷ��¼�
             */
            mousedown: function (event) {
                    var _that = $(this);
                    _scope.scrollBar.draging = true;
                    var start = event.pageY,
                        _moveDistance = 0,
                        end = 0;
                    _that.addClass(_scope.opts.pressClass);
                    $(window).on('mousemove.scrollBar', function (event) {
                        // ��ֹ�¼�ð��
                        _scope.scrollBar.stopBubble(event);
                        end = event.pageY;
                        //��ʼ�ͽ����Ĳ�ֵ
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
                 * @description  window.rezize ����, ���¹�����
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
                    //��Ԫ��
                    _scope.scrollBar.parentContain = $(_scope.opts.parentContain);
                    _scope.scrollBar.parentContain.css({
                        overflow: 'hidden'
                    });
                    // ��������
                    _scope.scrollBar.trackContain = _scope.scrollBar.parentContain.children(_scope.opts.scrollBarContain);
                    // ��������
                    _scope.scrollBar.contentContain = _scope._this;
                    // ����������
                    _scope.scrollBar.createScrollBar();
                    // ��ȡ��Ӧ�������������ù������ĸ�
                    _scope.scrollBar.getParamHeight();
                    // ���¼�
                    _scope.scrollBar.bindEvent();
                },
                //  ���ٶ���
                destory: function () {
                    //  �����¼�
                    _scope.scrollBar.unbindEvent();
                    // ��������
                    _scope.scrollBar.trackContain.html('');
                }
        };
        // ����������
        if (_scope.opts.hasScrollBar) {
            _scope.scrollBar.init();
        };
        return _scope;
    };
}(window, jQuery);