"use strict";
// components/app-bar/index.js
Object.defineProperty(exports, "__esModule", { value: true });
exports.clamp = exports.lerp = exports.GestureState = void 0;
var _a = wx.worklet, shared = _a.shared, timing = _a.timing, Easing = _a.Easing;
exports.GestureState = {
    POSSIBLE: 0,
    BEGIN: 1,
    ACTIVE: 2,
    END: 3,
    CANCELLED: 4,
};
var lerp = function (begin, end, t) {
    'worklet';
    return begin + (end - begin) * t;
};
exports.lerp = lerp;
var clamp = function (cur, lowerBound, upperBound) {
    'worklet';
    if (cur > upperBound)
        return upperBound;
    if (cur < lowerBound)
        return lowerBound;
    return cur;
};
exports.clamp = clamp;
var systemInfo = wx.getSystemInfoSync();
var statusBarHeight = systemInfo.statusBarHeight, screenHeight = systemInfo.screenHeight, screenWidth = systemInfo.screenWidth, safeArea = systemInfo.safeArea;
console.info('@@@ systemInfo', systemInfo);
Component({
    properties: {},
    data: {
        showAppbar: false,
        maxCoverSize: 0,
        statusBarHeight: 0,
        musicCover: 'https://res.wx.qq.com/op_res/Nu9XXzXcXnD1j5EgWQ2ElxNcl1yMvnKypRo4MTbjOv7FC3saigGoOBTZibyESC7EXaClnPYhB6pvfb-IRmso6g'
    },
    lifetimes: {
        attached: function () {
            var progress = shared(0);
            var initCoverSize = 60; // 初始图片大小
            var pagePadding = 24;
            var maxCoverSize = screenWidth - 2 * pagePadding;
            var safeAreaInsetBottom = screenHeight - safeArea.bottom;
            var isIOS = systemInfo.system.indexOf('iOS') >= 0;
            this.setData({ statusBarHeight: statusBarHeight, maxCoverSize: maxCoverSize });
            console.log('attached: ', statusBarHeight, maxCoverSize);
            this.applyAnimatedStyle('.cover', function () {
                'worklet';
                var height = initCoverSize + (maxCoverSize - initCoverSize) * progress.value;
                console.log('height: ', maxCoverSize, initCoverSize, progress.value);
                return {
                    width: "".concat(height, "px"),
                    height: "".concat(height, "px"),
                };
            });
            this.applyAnimatedStyle('.expand-container', function () {
                'worklet';
                console.log('expand-container: ', maxCoverSize, initCoverSize, progress.value);
                var t = progress.value;
                var maxRadius = 30;
                var radius = isIOS ? maxRadius * t : 0;
                var initBarHeight = initCoverSize + 8 * 2 + safeAreaInsetBottom;
                return {
                    top: "".concat((screenHeight - initBarHeight) * (1 - t), "px"),
                    borderRadius: "".concat(radius, "px ").concat(radius, "px 0px 0px")
                };
            });
            this.applyAnimatedStyle('.title-wrap', function () {
                'worklet';
                console.log('title-wrap: ', maxCoverSize, initCoverSize, progress.value);
                return {
                    opacity: 1 - progress.value
                };
            });
            var navBarHeight = statusBarHeight + (isIOS ? 40 : 44);
            this.applyAnimatedStyle('.nav-bar', function () {
                'worklet';
                console.log('nav-bar: ', maxCoverSize, initCoverSize, progress.value);
                var t = progress.value;
                var threshold = 0.8;
                var opacity = t < threshold ? 0 : (t - threshold) / (1 - threshold);
                return {
                    opacity: opacity,
                    height: "".concat(navBarHeight * progress.value, "px")
                };
            });
            this.progress = progress;
        }
    },
    methods: {
        close: function () {
            this.progress.value = timing(0, {
                duration: 250,
                easing: Easing.ease
            });
        },
        expand: function () {
            this.progress.value = timing(1, {
                duration: 250,
                easing: Easing.ease
            });
        },
        handleDragUpdate: function (delta) {
            'worklet';
            var curValue = this.progress.value;
            var newVal = curValue - delta;
            this.progress.value = (0, exports.clamp)(newVal, 0.0, 1.0);
        },
        handleDragEnd: function (velocity) {
            'worklet';
            var t = this.progress.value;
            var animateForward = false;
            if (Math.abs(velocity) >= 1) {
                animateForward = velocity <= 0;
            }
            else {
                animateForward = t > 0.7;
            }
            var animationCurve = Easing.out(Easing.ease);
            if (animateForward) {
                this.progress.value = timing(1.0, {
                    duration: 200,
                    easing: animationCurve,
                });
            }
            else {
                this.progress.value = timing(0.0, {
                    duration: 250,
                    easing: animationCurve,
                });
            }
        },
        handleVerticalDrag: function (evt) {
            'worklet';
            if (evt.state === exports.GestureState.ACTIVE) {
                var delta = evt.deltaY / screenHeight;
                this.handleDragUpdate(delta);
            }
            else if (evt.state === exports.GestureState.END) {
                var velocity = evt.velocityY / screenHeight;
                this.handleDragEnd(velocity);
            }
            else if (evt.state === exports.GestureState.CANCELLED) {
                this.handleDragEnd(0.0);
            }
        },
    },
});
