﻿/*
    Canvas Control Library Copyright 2012
    Created by Akshay Srinivasan [akshay.srin@gmail.com]
    This javascript code is provided as is with no warranty implied.
    Akshay Srinivasan are not liable or responsible for any consequence of 
    using this code in your applications.
    You are free to use it and/or change it for both commercial and non-commercial
    applications as long as you give credit to Akshay Srinivasan the creator 
    of this code.
*/


//Helper functions
function getlowcomp(value) {
    if (value > 0) {
        var x = Math.floor(value / 2);
        var y = x.toString(16);
        if (y.length < 2)
            return '0' + y;
        else
            return y;
    } else {
        return '00';
    }
}

function gethighcomp(value) {
    if (value < 255) {
        var x = value + Math.floor(((255 - value) / 2));
        if (x <= 16)
            return '0' + x.toString(16);
        else
            return x.toString(16);
    } else {
        return 'FF';
    }
}

//Window Manager Code starts here
var canvases = new Array();
var ctxs = new Array();
var windows = new Array();
var windowCount = 0;
var highestDepth = 0;
var clickFunctions = new Array();
var doubleClickFunctions = new Array();
var dragFunctions = new Array();
var dragEndFunctions = new Array();
var dragEnterFunctions = new Array();
var dragLeaveFunctions = new Array();
var dragOverFunctions = new Array();
var dragStartFunctions = new Array();
var dropFunctions = new Array();
var mouseDownFunctions = new Array();
var mouseMoveFunctions = new Array();
var mouseOutFunctions = new Array();
var mouseOverFunctions = new Array();
var mouseUpFunctions = new Array();
var mouseWheelFunctions = new Array();
var scrollFunctions = new Array();
var windowDrawFunctions = new Array();
var windowIdWithFocus = new Array();
var modalWindows = new Array();
var hiddenWindows = new Array();
var gotFocusFunctions = new Array();
var lostFocusFunctions = new Array();
var keyPressFunctions = new Array();
var doingClickEvent = 0;
var doingMouseUp = 0;
var doingMouseDown = 0;
var doingEventForWindowID = -1;
var intervalID = -1;
var windowWithAnimationCount = new Array();

function animatedDraw() {
    for (var i = 0; i < windowWithAnimationCount.length; i++) {
        if (windowWithAnimationCount[i].Count > 0) {
            draw(windowWithAnimationCount[i].CanvasID);
        }
    }
}

function registerAnimatedWindow(canvasid) {
    for (var i = 0; i < windowWithAnimationCount.length; i++) {
        if (windowWithAnimationCount[i].CanvasID == canvasid) {
            windowWithAnimationCount[i].Count++;
            if (intervalID == -1) {
                intervalID = setInterval(animatedDraw, 20);
            }
            return;
        }
    }
    windowWithAnimationCount.push({ CanvasID: canvasid, Count: 1 });
    intervalID = setInterval(animatedDraw, 20);
}

function unregisterAnimatedWindow(canvasid) {
    for (var i = 0; i < windowWithAnimationCount.length; i++) {
        if (windowWithAnimationCount[i].CanvasID == canvasid) {
            windowWithAnimationCount[i].Count--;
            if (windowWithAnimationCount[i].Count <= 0) {
                if (intervalID > -1) {
                    clearInterval(intervalID);
                    intervalID = -1;
                }
            }
            return;
        }
    }
}

function doesWindowHaveFocus(canvasid, windowid) {
    for (var i = 0; i < windowIdWithFocus.length; i++) {
        if (windowIdWithFocus[i][0] == canvasid && windowIdWithFocus[i][1] == windowid) {
            return 1;
        }
    }
    return 0;
}

function pointEvent(eventArray, canvasId, parentwindowid) {
    var canvas = getCanvas(canvasId);
    var x = event.pageX - canvas.offsetLeft;
    var y = event.pageY - canvas.offsetTop;
    var consumeevent = 0;
    var dodraw = 0;
    for (var d = highestDepth; d >= 0; d--) {
        for (var i = 0; i < windows.length; i++) {
            if (windows[i].ParentWindowID == parentwindowid && checkIfModalWindow(canvasId, windows[i].WindowCount) == 1 &&
                checkIfHiddenWindow(canvasId, windows[i].WindowCount) == 0 && windows[i].CanvasID == canvasId && windows[i].Depth == d &&
                x >= windows[i].X && x <= windows[i].X + windows[i].Width && y >= windows[i].Y && y <= windows[i].Y + windows[i].Height) {
                doingEventForWindowID = windows[i].WindowCount;
                if (doingClickEvent == 1 || doingMouseUp == 1 || doingMouseDown == 1) {
                    var found = 0;
                    consumeevent = 1;
                    for (var k = 0; k < windowIdWithFocus.length; k++) {
                        if (windowIdWithFocus[k][0] == canvasId && windowIdWithFocus[k][1] != windows[i].WindowCount && windowIdWithFocus[k][1] != -1) {
                            found = 1;
                            for (var f = 0; f < lostFocusFunctions.length; f++) {
                                if (lostFocusFunctions[f][0] == canvasId && lostFocusFunctions[f][1] == windowIdWithFocus[k][1] &&
                                    lostFocusFunctions[f][1] != windows[i].WindowCount) {
                                    lostFocusFunctions[f][2](canvasId, windowIdWithFocus[k][1]);
                                }
                            }
                            windowIdWithFocus[k][1] = windows[i].WindowCount;
                            for (var f = 0; f < gotFocusFunctions.length; f++) {
                                if (gotFocusFunctions[f][0] == canvasId && gotFocusFunctions[f][1] == windowIdWithFocus[k][1]) {
                                    gotFocusFunctions[f][2](canvasId, windowIdWithFocus[k][1]);
                                }
                            }
                            dodraw = 1;
                        } else if (windowIdWithFocus[k][0] == canvasId && windowIdWithFocus[k][1] == windows[i].WindowCount) {
                            found = 1;
                        }
                    }
                    if (found == 0) {
                        setFocusToWindowID(canvasId, windows[i].WindowCount);
                        for (var f = 0; f < gotFocusFunctions.length; f++) {
                            if (gotFocusFunctions[f][0] == canvasId && gotFocusFunctions[f][1] == windows[i].WindowCount && windowIdWithFocus[k][1] != -1) {
                                gotFocusFunctions[f][2](canvasId, windows[i].WindowCount);
                            }
                        }
                        dodraw = 1;
                    }
                }
                for (var u = 0; u < eventArray.length; u++) {
                    if (eventArray[u][0] == windows[i].WindowCount) {
                        if (windows[i].ChildWindowIDs.length > 0) {
                            if (pointEvent(eventArray, canvasId, windows[i].WindowCount) != 1) {
                                eventArray[u][1](canvasId, windows[i].WindowCount);
                            }
                        } else {
                            eventArray[u][1](canvasId, windows[i].WindowCount);
                        }
                        draw(canvasId);
                        if (window.event.preventDefault)
                            window.event.preventDefault();
                        window.event.returnValue = false;
                        return 1;
                    }
                }
                return 1;
            }
        }
    }
    for (var d = highestDepth; d >= 0; d--) {
        for (var i = 0; i < windows.length; i++) {
            if (windows[i].ParentWindowID == parentwindowid && checkIfModalWindow(canvasId, windows[i].WindowCount) == 0 && checkIfHiddenWindow(canvasId, windows[i].WindowCount) == 0 &&
                windows[i].CanvasID == canvasId && windows[i].Depth == d && x >= windows[i].X && x <= windows[i].X + windows[i].Width &&
                y >= windows[i].Y && y <= windows[i].Y + windows[i].Height) {
                doingEventForWindowID = windows[i].WindowCount;
                if (doingClickEvent == 1 || doingMouseUp == 1 || doingMouseDown == 1) {
                    var found = 0;
                    consumeevent = 1;
                    for (var k = 0; k < windowIdWithFocus.length; k++) {
                        if (windowIdWithFocus[k][0] == canvasId && windowIdWithFocus[k][1] != windows[i].WindowCount && windowIdWithFocus[k][1] != -1) {
                            found = 1;
                            for (var f = 0; f < lostFocusFunctions.length; f++) {
                                if (lostFocusFunctions[f][0] == canvasId && lostFocusFunctions[f][1] == windowIdWithFocus[k][1] &&
                                    lostFocusFunctions[f][1] != windows[i].WindowCount) {
                                    lostFocusFunctions[f][2](canvasId, windowIdWithFocus[k][1]);
                                }
                            }
                            windowIdWithFocus[k][1] = windows[i].WindowCount;
                            for (var f = 0; f < gotFocusFunctions.length; f++) {
                                if (gotFocusFunctions[f][0] == canvasId && gotFocusFunctions[f][1] == windowIdWithFocus[k][1]) {
                                    gotFocusFunctions[f][2](canvasId, windowIdWithFocus[k][1]);
                                }
                            }
                            dodraw = 1;
                        } else if (windowIdWithFocus[k][0] == canvasId && windowIdWithFocus[k][1] == windows[i].WindowCount && windowIdWithFocus[k][1] != -1) {
                            found = 1;
                        }
                    }
                    if (found == 0) {
                        setFocusToWindowID(canvasId, windows[i].WindowCount);
                        for (var f = 0; f < gotFocusFunctions.length; f++) {
                            if (gotFocusFunctions[f][0] == canvasId && gotFocusFunctions[f][1] == windows[i].WindowCount) {
                                gotFocusFunctions[f][2](canvasId, windows[i].WindowCount);
                            }
                        }
                        dodraw = 1;
                    }
                }
                for (var u = 0; u < eventArray.length; u++) {
                    if (eventArray[u][0] == windows[i].WindowCount) {
                        if (windows[i].ChildWindowIDs.length > 0) {
                            doingEvent = 0;
                            if (pointEvent(eventArray, canvasId, windows[i].WindowCount) != 1) {
                                eventArray[u][1](canvasId, windows[i].WindowCount);
                            }
                        } else {
                            eventArray[u][1](canvasId, windows[i].WindowCount);
                        }
                        if (window.event.preventDefault)
                            window.event.preventDefault();
                        window.event.returnValue = false;
                        draw(canvasId);
                        return 1;
                    }
                }
                return 1;
            }
        }
    }
    if (consumeevent == 1) {
        return 1;
    }
    if (doingClickEvent == 1 || doingMouseUp == 1 || doingMouseDown == 1) {
        for (var q = 0; q < windowIdWithFocus.length; q++) {
            if (windowIdWithFocus[q][0] == canvasId) {
                doingEventForWindowID = -1;
                for (var f = 0; f < lostFocusFunctions.length; f++) {
                    if (lostFocusFunctions[f][0] == canvasId && lostFocusFunctions[f][1] == windowIdWithFocus[q][1] && windowIdWithFocus[q][1] != -1) {
                        lostFocusFunctions[f][2](canvasId, windowIdWithFocus[q][1]);
                    }
                }
                windowIdWithFocus[q][1] = -1;
                dodraw = 1;
            }
        }
    }
    if (dodraw == 1) {
        draw(canvasId);
    }
    return 0;
}

function setFocusToWindowID(canvasId, windowid) {
    for (var i = 0; windowIdWithFocus.length; i++) {
        if (windowIdWithFocus[i][0] == canvasId) {
            windowIdWithFocus[i][1] = windowid;
            return;
        }
    }
    windowIdWithFocus.push([canvasId, windowid]);
}

function canvasOnClick(canvasId) {
    doingClickEvent = 1;
    pointEvent(clickFunctions, canvasId);
    doingClickEvent = 0;
}

function canvasOnDblClick(canvasId) {
    pointEvent(doubleClickFunctions, canvasId);
}

function canvasOnDrag(canvasId) {
    pointEvents(dragFunctions, canvasId);
}

function canvasOnDragEnd(canvasId) {
    pointEvent(dragEndFunctions, canvasId);
}

function canvasOnDragEnter(canvasId) {
    pointEvent(dragEnterFunctions, canvasId);
}

function canvasOnDragLeave(canvasId) {
    pointEvent(dragLeaveFunctions, canvasId);
}

function canvasOnDragOver(canvasId) {
    pointEvent(dragOverFunctions, canvasId);
}

function canvasOnDragStart(canvasId) {
    pointEvent(dragStartFunctions, canvasId);
}

function canvasOnDrop(canvasId) {
    pointEvent(dropFunctions, canvasId);
}

function canvasOnMouseDown(canvasId) {
    doingMouseDown = 1;
    pointEvent(mouseDownFunctions, canvasId);
    doingMouseDown = 0;
}

function canvasOnMouseMove(canvasId) {
    pointEvent(mouseMoveFunctions, canvasId);
}

function canvasOnMouseOut(canvasId) {
    pointEvent(mouseOutFunctions, canvasId);
}

function canvasOnMouseOver(canvasId) {
    pointEvent(mouseOverFunctions, canvasId);
}

function canvasOnMouseUp(canvasId) {
    doingMouseUp = 1;
    pointEvent(mouseUpFunctions, canvasId);
    doingMouseUp = 0;
}

function canvasOnMouseWheel(canvasId) {
    pointEvent(mouseWheelFunctions, canvasId);
}

function canvasOnScroll(canvasId) {
    pointEvent(scrollFunctions, canvasId);
}

function registerCanvasElementId(canvasId) {
    var canvas = document.getElementById(canvasId);
    canvases.push([canvasId, canvas]);
    ctxs.push([canvasId, canvas.getContext('2d')]);
    canvas.addEventListener('click', function () { }, false);
    canvas.addEventListener('click', function () { canvasOnClick(canvasId); }, false);
    canvas.addEventListener('dblclick', function () { canvasOnDblClick(canvasId); }, false);
    canvas.addEventListener('drag', function () { canvasOnDrag(canvasId); }, false);
    canvas.addEventListener('dragend', function () { canvasOnDragEnd(canvasId); }, false);
    canvas.addEventListener('dragenter', function () { canvasOnDragEnter(canvasId); }, false);
    canvas.addEventListener('dragleave', function () { canvasOnDragLeave(canvasId); }, false);
    canvas.addEventListener('dragover', function () { canvasOnDragOver(canvasId); }, false);
    canvas.addEventListener('dragstart', function () { canvasOnDragStart(canvasId); }, false);
    canvas.addEventListener('drop', function () { canvasOnDrop(canvasId); }, false);
    canvas.addEventListener('mousedown', function () { canvasOnMouseDown(canvasId); }, false);
    canvas.addEventListener('mousemove', function () { canvasOnMouseMove(canvasId); }, false);
    canvas.addEventListener('mouseout', function () { canvasOnMouseOut(canvasId); }, false);
    canvas.addEventListener('mouseover', function () { canvasOnMouseOver(canvasId); }, false);
    canvas.addEventListener('mouseup', function () { canvasOnMouseUp(canvasId); }, false);
    canvas.addEventListener('mousewheel', function () { canvasOnMouseWheel(canvasId); }, false);
    canvas.addEventListener('scroll', function () { canvasOnScroll(canvasId); }, false);
    canvas.onkeypress = function (e) {
        for (var i = 0; i < keyPressFunctions.length; i++) {
            for (var j = 0; j < windowIdWithFocus.length; j++) {
                if (windowIdWithFocus[j][0] == keyPressFunctions[i].CanvasID && windowIdWithFocus[j][1] == keyPressFunctions[i].WindowID) {
                    keyPressFunctions[i].KeyPressFunction(keyPressFunctions[i].CanvasID, keyPressFunctions[i].WindowID);
                    if (window.event.preventDefault)
                        window.event.preventDefault();
                    window.event.returnValue = false;
                }
            }
        }
    };
}

function createWindow(canvasId, x, y, width, height, depth, parentwindowid, controlTypeNameString, controlNameId) {
    if (depth > highestDepth)
        highestDepth = depth;
    ++windowCount;
    windows.push({
        WindowCount: windowCount, X: x, Y: y, Width: width, Height: height, Depth: depth, CanvasID: canvasId, ParentWindowID: parentwindowid, ChildWindowIDs: new Array(),
        ControlType: controlTypeNameString, ControlNameID: controlNameId
    });
    return windowCount;
}

function registerChildWindow(canvasid, windowid, parentwindowid) {
    for (var i = 0; i < windows.length; i++) {
        if (windows[i].WindowCount == parentwindowid) {
            windows[i].ChildWindowIDs.push(windowid);
            getWindowProps(canvasid, windowid).ParentWindowID = parentwindowid;
        }
    }
}

function registerKeyPressFunction(canvasid, func, windowid) {
    for (var i = 0; i < windows.length; i++) {
        if (windows[i].CanvasID == canvasid && windows[i].WindowCount == windowid) {
            keyPressFunctions.push({ CanvasID: canvasid, KeyPressFunction: func, WindowID: windowid });
        }
    }
}

function registerEvent(windowid, eventfunction, canvasId, eventfunctionarray) {
    for (var i = 0; i < windows.length; i++) {
        if (windows[i].CanvasID == canvasId && windows[i].WindowCount == windowid) {
            eventfunctionarray.push([windowid, eventfunction, canvasId]);
        }
    }
}

function registerClickFunction(windowid, clickFunction, canvasId) {
    registerEvent(windowid, clickFunction, canvasId, clickFunctions);
}

function registerDoubleClickFunction(windowid, doubleClickFunction, canvasId) {
    registerEvent(windowid, doubleClickFunction, canvasId, doubleClickFunctions);
}

function registerDragFunction(windowid, dragFunction, canvasId) {
    registerEvent(windowid, dragFunction, canvasId, dragFunctions);
}

function registerDragEndFunction(windowid, dragEndFunction, canvasId) {
    registerEvent(windowid, dragEndFunction, canvasId, dragEndFunctions);
}

function registerDragEnterFunction(windowid, dragEnterFunction, canvasId) {
    registerEvent(windowid, dragEnterFunction, canvasId, dragEnterFunctions);
}

function registerDragLeaveFunction(windowid, dragLeaveFunction, canvasId) {
    registerEvent(windowid, dragLeaveFunction, canvasId, dragLeaveFunctions);
}

function registerDragOverFunction(windowid, dragOverFunction, canvasId) {
    registerEvent(windowid, dragOverFunction, canvasId, dragOverFunctions);
}

function registerDragStartFunction(windowid, dragStartFunction, canvasId) {
    registerEvent(windowid, dragStartFunction, canvasId, dragStartFunctions);
}

function registerDropFunction(windowid, dropFunction, canvasId) {
    registerEvent(windowid, dropFunction, canvasId, dropFunctions);
}

function registerMouseDownFunction(windowid, mouseDownFunction, canvasId) {
    registerEvent(windowid, mouseDownFunction, canvasId, mouseDownFunctions);
}

function registerMouseMoveFunction(windowid, mouseMoveFunction, canvasId) {
    registerEvent(windowid, mouseMoveFunction, canvasId, mouseMoveFunctions);
}

function registerMouseOutFunction(windowid, mouseOutFunction, canvasId) {
    registerEvent(windowid, mouseOutFunction, canvasId, mouseOutFunctions);
}

function registerMouseOverFunction(windowid, mouseOverFunction, canvasId) {
    registerEvent(windowid, mouseOverFunction, canvasId, mouseOverFunctions);
}

function registerMouseUpFunction(windowid, mouseUpFunction, canvasId) {
    registerEvent(windowid, mouseUpFunction, canvasId, mouseUpFunctions);
}

function registerMouseWheelFunction(windowid, mouseWheelFunction, canvasId) {
    registerEvent(windowid, mouseWheelFunction, canvasId, mouseWheelFunctions);
}

function registerScrollFunction(windowid, scrollFunction, canvasId) {
    registerEvent(windowid, scrollFunction, canvasId, scrollFunctions);
}

function registerWindowDrawFunction(windowid, windowDrawFunction, canvasId) {
    registerEvent(windowid, windowDrawFunction, canvasId, windowDrawFunctions);
}

function getWindowDepth(windowid, canvasid) {
    for (var i = 0; i < windows.length; i++) {
        if (windows[i].WindowCount == windowid && windows[i].CanvasID == canvasid) {
            return windows[i].Depth;
        }
    }
}

function setWindowDepth(canvasid, windowid, depth) {
    for (var i = 0; i < windows.length; i++) {
        if (windows[i].WindowCount == windowid && windows[i].CanvasID == canvasid) {
            windows[i].Depth = depth;
            if (depth > highestDepth)
                highestDepth = depth;
            return;
        }
    }
}

function checkIfModalWindow(canvasid, windowid) {
    for (var i = 0; i < modalWindows.length; i++) {
        if(modalWindows[i].CanvasID == canvasid && modalWindows[i].WindowID == windowid){
            return 1;
        }
    }
    return 0;
}

function registerModalWindow(canvasid, windowid) {
    modalWindows.push({ CanvasID: canvasid, WindowID: windowid });
}

function checkIfHiddenWindow(canvasid, windowid) {
    for (var i = 0; i < hiddenWindows.length; i++) {
        if (hiddenWindows[i].CanvasID == canvasid && hiddenWindows[i].WindowID == windowid) {
            return hiddenWindows[i].HiddenStatus;
        }
    }
    return 0;
}

function registerHiddenWindow(canvasid, windowid, status) {
    hiddenWindows.push({ CanvasID: canvasid, WindowID: windowid, HiddenStatus: status });
}

function setHiddenWindowStatus(canvasid, windowid, status) {
    for (var i = 0; i < hiddenWindows.length; i++) {
        if (hiddenWindows[i].HiddenStatus != status && hiddenWindows[i].CanvasID == canvasid && hiddenWindows[i].WindowID == windowid) {
            hiddenWindows[i].HiddenStatus = status;
            draw(canvasid);
        }
    }
}

function registerLostFocusFunction(canvasid, windowid, func) {
    lostFocusFunctions.push([canvasid, windowid, func]);
}

function registerGotFocusFunction(canvasid, windowid, func) {
    gotFocusFunctions.push([canvasid, windowid, func]);
}

function getWindowProps(canvasid, windowid) {
    for (var i = 0; i < windows.length; i++) {
        if (windows[i].CanvasID == canvasid && windows[i].WindowCount == windowid) {
            return windows[i];
        }
    }
}

function draw(canvasId, parentwindowid) {
    var canvas = getCanvas(canvasId);
    if (parentwindowid == null) {
        getCtx(canvasId).clearRect(0, 0, canvas.width, canvas.height);
    }
    for (var d = 0; d <= highestDepth; d++) {
        for (var i = 0; i < windowDrawFunctions.length; i++) {
            var windowProps = getWindowProps(canvasId, windowDrawFunctions[i][0]);
            if (windowProps.ParentWindowID == parentwindowid && checkIfHiddenWindow(canvasId, windowDrawFunctions[i][0]) == 0 &&
                checkIfModalWindow(canvasId, windowDrawFunctions[i][0]) == 0 &&
                getWindowDepth(windowDrawFunctions[i][0], windowDrawFunctions[i][2]) == d && windowDrawFunctions[i][2] == canvasId) {
                var ctx = getCtx(canvasId);
                ctx.save();
                ctx.beginPath();
                ctx.rect(windowProps.X, windowProps.Y, windowProps.Width, windowProps.Height);
                ctx.clip();
                windowDrawFunctions[i][1](canvasId, windowDrawFunctions[i][0]);
                if (windowProps.ChildWindowIDs.length > 0) {
                    draw(canvasId, windowDrawFunctions[i][0]);
                }
                ctx.restore();
            }
        }
    }
    for (var i = 0; i < windowDrawFunctions.length; i++) {
        var windowProps = getWindowProps(canvasId, windowDrawFunctions[i][0]);
        if (windowProps.ParentWindowID == parentwindowid && checkIfHiddenWindow(canvasId, windowDrawFunctions[i][0]) == 0 &&
            checkIfModalWindow(canvasId, windowDrawFunctions[i][0]) == 1 &&
            windowDrawFunctions[i][2] == canvasId) {
            var ctx = getCtx(canvasId);
            ctx.save();
            ctx.beginPath();
            ctx.rect(windowProps.X, windowProps.Y, windowProps.Width, windowProps.Height);
            ctx.clip();
            windowDrawFunctions[i][1](canvasId, windowDrawFunctions[i][0]);
            if (windowProps.ChildWindowIDs.length > 0) {
                draw(canvasId, windowDrawFunctions[i][0]);
            }
            ctx.restore();
        }
    }
}

function getCtx(canvasId) {
    for (var i = 0; i < ctxs.length; i++) {
        if (ctxs[i][0] == canvasId) {
            return ctxs[i][1];
        }
    }
}

function getCanvas(canvasId) {
    for (var i = 0; i < canvases.length; i++) {
        if (canvases[i][0] == canvasId) {
            return canvases[i][1];
        }
    }
}

function destroyControl(canvasid, windowid) {
    for (var i = 0; i < windows.length; i++) {
        if (windows[i].CanvasID == canvasid && windows[i].WindowID) {
            destroyControlByWindowObj(windows[i], i);
        }
    }
}

function destroyControlByNameID(controlNameID) {
    for (var i = 0; i < windows.length; i++) {
        if (windows[i].ControlNameID == controlNameID) {
            destroyControlByWindowObj(windows[i], i);
        }
    }
}

function destroyWindow(canvasid, windowid){
    for (var i = 0; i < windows.length; i++) {
        if (windows[i].CanvasID == canvasid && windows[i].WindowID) {
            windows.splice(i, 1);
        }
    }
}

function destroyControlByWindowObj(w, windowIndex) {
    for (var i = 0; i < w.ChildWindowIDs.length; i++) {
        for (var x = 0; x < windows.length; x++) {
            if (windows[x].CanvasID == w.CanvasID && windows[x].WindowID == w.ChildWindowIDs[i]) {
                destroyControlByWindowObj(windows[x]);
            }
        }
    }
    switch (w.ControlType) {
        case "Label":
            for (var i = labelPropsArray.length - 1; i >= 0 ; i--) {
                if (labelPropsArray[i].CanvasID == w.CanvasID && labelPropsArray[i].WindowID == w.WindowCount) {
                    labelPropsArray.splice(i, 1);
                }
            }
            break;
        case "Button":
            for (var i = buttonPropsArray.length - 1; i >= 0 ; i--) {
                if (buttonPropsArray[i].CanvasID == w.CanvasID && buttonPropsArray[i].WindowID == w.WindowCount) {
                    buttonPropsArray.splice(i, 1);
                }
            }
            break;
        case "ScrollBar":
            for (var i = scrollBarPropsArray.length - 1; i >= 0 ; i--) {
                if (scrollBarPropsArray[i].CanvasID == w.CanvasID && scrollBarPropsArray[i].WindowID == w.WindowCount) {
                    scrollBarPropsArray.splice(i, 1);
                }
            }
            break;
        case "Grid":
            for (var i = gridPropsArray.length - 1; i >= 0 ; i--) {
                if (gridPropsArray[i].CanvasID == w.CanvasID && gridPropsArray[i].WindowID == w.WindowCount) {
                    gridPropsArray.splice(i, 1);
                }
            }
            break;
        case "ComboBoxTextArea":
            for (var i = comboboxPropsArray.length - 1; i >= 0 ; i--) {
                if (comboboxPropsArray[i].CanvasID == w.CanvasID && comboboxPropsArray[i].WindowID == w.WindowCount) {
                    destroyWindow(w.CanvasID, comboboxPropsArray[i].ButtonWindowID);
                    destroyWindow(w.CanvasID, comboboxPropsArray[i].ListAreaWindowID);
                    comboboxPropsArray.splice(i, 1);
                }
            }
            break;
        case "CheckBox":
            for (var i = checkboxPropsArray.length - 1; i >= 0 ; i--) {
                if (checkboxPropsArray[i].CanvasID == w.CanvasID && checkboxPropsArray[i].WindowID == w.WindowCount) {
                    checkboxPropsArray.splice(i, 1);
                }
            }
            break;
        case "RadioButtonGroup":
            for (var i = radiobuttonPropsArray.length - 1; i >= 0 ; i--) {
                if (radiobuttonPropsArray[i].CanvasID == w.CanvasID && radiobuttonPropsArray[i].WindowID == w.WindowCount) {
                    radiobuttonPropsArray.splice(i, 1);
                }
            }
            break;
        case "Image":
            for (var i = imageControlPropsArray.length - 1; i >= 0 ; i--) {
                if (imageControlPropsArray[i].CanvasID == w.CanvasID && imageControlPropsArray[i].WindowID == w.WindowCount) {
                    imageControlPropsArray.splice(i, 1);
                }
            }
            break;
        case "TreeView":
            for (var i = treeViewPropsArray.length - 1; i >= 0 ; i--) {
                if (treeViewPropsArray[i].CanvasID == w.CanvasID && treeViewPropsArray[i].WindowID == w.WindowCount) {
                    treeViewPropsArray.splice(i, 1);
                }
            }
            break;
        case "Calender":
            for (var i = calenderPropsArray.length - 1; i >= 0 ; i--) {
                if (calenderPropsArray[i].CanvasID == w.CanvasID && calenderPropsArray[i].WindowID == w.WindowCount) {
                    calenderPropsArray.splice(i, 1);
                }
            }
            break;
        case "ProgressBar":
            for (var i = progressBarPropsArray.length - 1; i >= 0 ; i--) {
                if (progressBarPropsArray[i].CanvasID == w.CanvasID && progressBarPropsArray[i].WindowID == w.WindowCount) {
                    progressBarPropsArray.splice(i, 1);
                }
            }
            break;
        case "Slider":
            for (var i = sliderPropsArray.length - 1; i >= 0 ; i--) {
                if (sliderPropsArray[i].CanvasID == w.CanvasID && sliderPropsArray[i].WindowID == w.WindowCount) {
                    sliderPropsArray.splice(i, 1);
                }
            }
            break;
        case "DatePickerTextArea":
            for (var i = datePickerPropsArray.length - 1; i >= 0 ; i--) {
                if (datePickerPropsArray[i].CanvasID == w.CanvasID && datePickerPropsArray[i].WindowID == w.WindowCount) {
                    destroyWindow(w.CanvasID, datePickerPropsArray[i].ButtonWindowID);
                    destroyControl(w.CanvasID, datePickerPropsArray[i].CalenderWindowID);
                    datePickerPropsArray.splice(i, 1);
                }
            }
            break;
        case "Panel":
            for (var i = panelPropsArray.length - 1; i >= 0 ; i--) {
                if (panelPropsArray[i].CanvasID == w.CanvasID && panelPropsArray[i].WindowID == w.WindowCount) {
                    panelPropsArray.splice(i, 1);
                }
            }
            break;
        case "BarGraph":
            for (var i = barGraphsPropsArray.length - 1; i >= 0 ; i--) {
                if (barGraphsPropsArray[i].CanvasID == w.CanvasID && barGraphsPropsArray[i].WindowID == w.WindowCount) {
                    barGraphsPropsArray.splice(i, 1);
                }
            }
            break;
        case "PieChart":
            for (var i = pieChartsPropsArray.length - 1; i >= 0 ; i--) {
                if (pieChartsPropsArray[i].CanvasID == w.CanvasID && pieChartsPropsArray[i].WindowID == w.WindowCount) {
                    pieChartsPropsArray.splice(i, 1);
                }
            }
            break;
        case "LineGraph":
            for (var i = lineGraphsPropsArray.length - 1; i >= 0 ; i--) {
                if (lineGraphsPropsArray[i].CanvasID == w.CanvasID && lineGraphsPropsArray[i].WindowID == w.WindowCount) {
                    lineGraphsPropsArray.splice(i, 1);
                }
            }
            break;
        case "Gauge":
            for (var i = gaugeChartPropsArray.length - 1; i >= 0 ; i--) {
                if (gaugeChartPropsArray[i].CanvasID == w.CanvasID && gaugeChartPropsArray[i].WindowID == w.WindowCount) {
                    gaugeChartPropsArray.splice(i, 1);
                }
            }
            break;
        case "RadarGraph":
            for (var i = radarGraphPropsArray.length - 1; i >= 0 ; i--) {
                if (radarGraphPropsArray[i].CanvasID == w.CanvasID && radarGraphPropsArray[i].WindowID == w.WindowCount) {
                    radarGraphPropsArray.splice(i, 1);
                }
            }
            break;
        case "LineAreaGraph":
            for (var i = lineAreaGraphPropsArray.length - 1; i >= 0 ; i--) {
                if (lineAreaGraphPropsArray[i].CanvasID == w.CanvasID && lineAreaGraphPropsArray[i].WindowID == w.WindowCount) {
                    lineAreaGraphPropsArray.splice(i, 1);
                }
            }
            break;
        case "CandlesticksGraph":
            for (var i = candlesticksGraphPropsArray.length - 1; i >= 0 ; i--) {
                if (candlesticksGraphPropsArray[i].CanvasID == w.CanvasID && candlesticksGraphPropsArray[i].WindowID == w.WindowCount) {
                    candlesticksGraphPropsArray.splice(i, 1);
                }
            }
            break;
        case "DoughnutChart":
            for (var i = doughnutChartPropsArray.length - 1; i >= 0 ; i--) {
                if (doughnutChartPropsArray[i].CanvasID == w.CanvasID && doughnutChartPropsArray[i].WindowID == w.WindowCount) {
                    doughnutChartPropsArray.splice(i, 1);
                }
            }
            break;
        case "BarsMixedWithLabeledLineGraph":
            for (var i = barsMixedWithLabledLineGraphsPropsArray.length - 1; i >= 0 ; i--) {
                if (barsMixedWithLabledLineGraphsPropsArray[i].CanvasID == w.CanvasID && barsMixedWithLabledLineGraphsPropsArray[i].WindowID == w.WindowCount) {
                    barsMixedWithLabledLineGraphsPropsArray.splice(i, 1);
                }
            }
            break;
        case "StackedBarGraph":
            for (var i = stackedBarGraphPropsArray.length - 1; i >= 0 ; i--) {
                if (stackedBarGraphPropsArray[i].CanvasID == w.CanvasID && stackedBarGraphPropsArray[i].WindowID == w.WindowCount) {
                    stackedBarGraphPropsArray.splice(i, 1);
                }
            }
            break;
        case "Tab":
            for (var i = tabPropsArray.length - 1; i >= 0 ; i--) {
                if (tabPropsArray[i].CanvasID == w.CanvasID && tabPropsArray[i].WindowID == w.WindowCount) {
                    tabPropsArray.splice(i, 1);
                }
            }
            break;
        case "ImageMap":
            for (var i = imageMapPropsArray.length - 1; i >= 0 ; i--) {
                if (imageMapPropsArray[i].CanvasID == w.CanvasID && imageMapPropsArray[i].WindowID == w.WindowCount) {
                    imageMapPropsArray.splice(i, 1);
                }
            }
            break;
        case "SubMenu":
            for (var i = subMenuBarPropsArray.length - 1; i >= 0 ; i--) {
                if (subMenuBarPropsArray[i].CanvasID == w.CanvasID && subMenuBarPropsArray[i].WindowID == w.WindowCount) {
                    for (var y = 0; y < subMenuBarPropsArray[i].ChildMenuWindowIDs.length; y++) {
                        destroyControl(w.CanvasID, subMenuBarPropsArray[i].ChildMenuWindowIDs[y]);
                    }
                    subMenuBarPropsArray.splice(i, 1);
                }
            }
            break;
        case "MenuBar":
            for (var i = menuBarPropsArray.length - 1; i >= 0 ; i--) {
                if (menuBarPropsArray[i].CanvasID == w.CanvasID && menuBarPropsArray[i].WindowID == w.WindowCount) {
                    for (var y = 0; y < menuBarPropsArray[i].ChildMenuWindowIDs.length; y++) {
                        destroyControl(w.CanvasID, menuBarPropsArray[i].ChildMenuWindowIDs[y]);
                    }
                    menuBarPropsArray.splice(i, 1);
                }
            }
            break;
    }
    destroyWindow(w.CanvasID, w.WindowID);
}

//Code for labels starts here
var labelPropsArray = new Array();

function getLabelProps(canvasid, windowid) {
    for (var i = 0; i < labelPropsArray.length; i++) {
        if (labelPropsArray[i].CanvasID == canvasid && labelPropsArray[i].WindowID == windowid) {
            return labelPropsArray[i];
        }
    }
}

function createLabel(canvasid, controlNameId, x, y, width, height, text, textColor, textHeight, textFontString, drawFunction, depth,
    isHyperlink, url, nobrowserhistory, isnewbrowserwindow,
    nameofnewbrowserwindow, widthofnewbrowserwindow, heightofnewbrowserwindow, newbrowserwindowisresizable, newbrowserwindowhasscrollbars,
    newbrowserwindowhastoolbar, newbrowserwindowhaslocationorurloraddressbox, newbroserwindowhasdirectoriesorextrabuttons,
    newbrowserwindowhasstatusbar, newbrowserwindowhasmenubar, newbrowserwindowcopyhistory) {
    var windowid = createWindow(canvasid, x, y, width, height, depth, null, 'Label', controlNameId);
    labelPropsArray.push({
        CanvasID: canvasid, WindowID: windowid, X: x, Y: y, Width: width, Height: height, Text: text,
        TextHeight: textHeight, TextFontString: textFontString, TextColor: textColor, IsHyperlink: isHyperlink, URL: url,
        NoBrowserHistory: nobrowserhistory, IsNewBrowserWindow: isnewbrowserwindow,
        NameOfNewBrowserWindow: nameofnewbrowserwindow, WidthOfNewBrowserWindow: widthofnewbrowserwindow,
        HeightOfNewBrowserWindow: heightofnewbrowserwindow, NewBrowserWindowIsResizable: newbrowserwindowisresizable,
        NewBrowserWindowHasScrollBars: newbrowserwindowhasscrollbars, NewBrowserWindowHasToolbar: newbrowserwindowhastoolbar,
        NewBrowserWindowHasLocationOrURLOrAddressBox: newbrowserwindowhaslocationorurloraddressbox,
        NewBrowserWindowHasDirectoriesOrExtraButtons: newbroserwindowhasdirectoriesorextrabuttons,
        NewBrowserWindowHasStatusBar: newbrowserwindowhasstatusbar, NewBrowserWindowHasMenuBar: newbrowserwindowhasmenubar,
        NewBrowserWindowCopyHistory: newbrowserwindowcopyhistory, DrawFunction: drawFunction
    });
    if (drawFunction != undefined && drawFunction != null)
        registerWindowDrawFunction(windowid, function (canvasid1, windowid1) { var lp = getLabelProps(canvasid1, windowid1); lp.DrawFunction(canvasid1, windowid1); }, canvasid);
    else
        registerWindowDrawFunction(windowid, function () {
            var ctx = getCtx(canvasid);
            var labelProps = getLabelProps(canvasid, windowid);
            ctx.font = labelProps.TextFontString;
            ctx.fillStyle = labelProps.TextColor;
            ctx.fillText(labelProps.Text, labelProps.X + ((labelProps.Width - ctx.measureText(labelProps.Text).width) / 2), labelProps.Y + labelProps.Height - ((labelProps.Height - labelProps.TextHeight) / 2));
        }, canvasid);
    if (isHyperlink == 1) {
        registerClickFunction(windowid, function () {
            if (isnewbrowserwindow == 1) {
                var str = '';
                var wroteone = 0;
                if (widthofnewbrowserwindow != null) {
                    str += 'width=' + widthofnewbrowserwindow;
                    wroteone = 1;
                }
                if (heightofnewbrowserwindow != null) {
                    str += (wroteone == 1 ? ',' : '') + 'height=' + heightofnewbrowserwindow;
                }
                if (newbrowserwindowisresizable != null) {
                    str += (wroteone == 1 ? ',' : '') + 'resizable=' + newbrowserwindowisresizable;
                }
                if (newbrowserwindowhasscrollbars != null) {
                    str += (wroteone == 1 ? ',' : '') + 'scrollbars=' + newbrowserwindowhasscrollbars;
                }
                if (newbrowserwindowhastoolbar != null) {
                    str += (wroteone == 1 ? ',' : '') + 'toolbar=' + newbrowserwindowhastoolbar;
                }
                if (newbrowserwindowhaslocationorurloraddressbox != null) {
                    str += (wroteone == 1 ? ',' : '') + 'location=' + newbrowserwindowhaslocationorurloraddressbox;
                }
                if (newbroserwindowhasdirectoriesorextrabuttons != null) {
                    str += (wroteone == 1 ? ',' : '') + 'directories=' + newbroserwindowhasdirectoriesorextrabuttons;
                }
                if (newbrowserwindowhasstatusbar != null) {
                    str += (wroteone == 1 ? ',' : '') + 'status=' + newbrowserwindowhasstatusbar;
                }
                if (newbrowserwindowhasmenubar != null) {
                    str += (wroteone == 1 ? ',' : '') + 'menubar=' + newbrowserwindowhasmenubar;
                }
                if (newbrowserwindowcopyhistory != null) {
                    str += (wroteone == 1 ? ',' : '') + 'copyhistory=' + newbrowserwindowcopyhistory;
                }
                window.open(url, nameofnewbrowserwindow, str);
            } else {
                if (nobrowserhistory == 1) {
                    window.location.replace(url);
                } else {
                    window.location.href = url;
                }
            }
        }, canvasid);
    }
    return windowid;
}

//Code for Buttons starts here
var buttonPropsArray = new Array();

function getButtonProps(canvasid, windowid) {
    for (var i = 0; i < buttonPropsArray.length; i++) {
        if (buttonPropsArray[i].CanvasID == canvasid && buttonPropsArray[i].WindowID == windowid) {
            return buttonPropsArray[i];
        }
    }
}

function defaultButtonDrawFunction(canvasid, windowid) {
    var buttonOffsetX = 0;
    var buttonOffsetY = 0;
    var ctx = getCtx(canvasid);
    var buttonProps = getButtonProps(canvasid, windowid);
    if (buttonProps.IsPressed == 1) {
        buttonOffsetX = 5;
        buttonOffsetY = 5;
    }
    ctx.beginPath();
    ctx.moveTo(buttonOffsetX + buttonProps.X, buttonOffsetY + buttonProps.Y + buttonProps.EdgeRadius);
    ctx.arc(buttonOffsetX + buttonProps.X + buttonProps.EdgeRadius, buttonOffsetY + buttonProps.Y + buttonProps.EdgeRadius,
        buttonProps.EdgeRadius, Math.PI, (Math.PI / 180) * 270, false);
    ctx.lineTo(buttonOffsetX + buttonProps.X + buttonProps.Width - buttonProps.EdgeRadius, buttonOffsetY + buttonProps.Y);
    ctx.arc(buttonOffsetX + buttonProps.X + buttonProps.Width - buttonProps.EdgeRadius, buttonOffsetY + buttonProps.Y +
        buttonProps.EdgeRadius, buttonProps.EdgeRadius, (Math.PI / 180) * 270, Math.PI * 2, false);
    ctx.lineTo(buttonOffsetX + buttonProps.X + buttonProps.Width, buttonOffsetY + buttonProps.Y + buttonProps.Height - buttonProps.EdgeRadius);
    ctx.arc(buttonOffsetX + buttonProps.X + buttonProps.Width - buttonProps.EdgeRadius, buttonOffsetY + buttonProps.Y +
        buttonProps.Height - buttonProps.EdgeRadius, buttonProps.EdgeRadius, 0, Math.PI / 2, false);
    ctx.lineTo(buttonOffsetX + buttonProps.X + buttonProps.EdgeRadius, buttonOffsetY + buttonProps.Y + buttonProps.Height);
    ctx.arc(buttonOffsetX + buttonProps.X + buttonProps.EdgeRadius, buttonOffsetY + buttonProps.Y + buttonProps.Height -
        buttonProps.EdgeRadius, buttonProps.EdgeRadius, Math.PI / 2, Math.PI, false);
    /*
    ctx.lineTo(buttonOffsetX + buttonProps.X, buttonOffsetY + buttonProps.Y + buttonProps.EdgeRadius);
    ctx.moveTo(buttonOffsetX + buttonProps.X + 3, buttonOffsetY + buttonProps.Y + 3 + buttonProps.EdgeRadius);
    ctx.lineTo(buttonOffsetX + buttonProps.X + 3, buttonOffsetY + buttonProps.Y + buttonProps.Height - buttonProps.EdgeRadius - 3);
    ctx.arc(buttonOffsetX + buttonProps.X + 3 + buttonProps.EdgeRadius, buttonOffsetY + buttonProps.Y + buttonProps.Height -
        buttonProps.EdgeRadius - 3, buttonProps.EdgeRadius, Math.PI, Math.PI / 2, true);
    ctx.lineTo(buttonOffsetX + buttonProps.X + buttonProps.Width - buttonProps.EdgeRadius - 3, buttonOffsetY + buttonProps.Y + buttonProps.Height - 3);
    ctx.arc(buttonOffsetX + buttonProps.X + buttonProps.Width - buttonProps.EdgeRadius - 3, buttonOffsetY + buttonProps.Y +
        buttonProps.Height - buttonProps.EdgeRadius - 3, buttonProps.EdgeRadius, Math.PI / 2, 0, true);
    ctx.lineTo(buttonOffsetX + buttonProps.X + buttonProps.Width - 3, buttonOffsetY + buttonProps.Y + buttonProps.EdgeRadius + 3);
    ctx.arc(buttonOffsetX + buttonProps.X + buttonProps.Width - buttonProps.EdgeRadius - 3, buttonOffsetY + buttonProps.Y +
        buttonProps.EdgeRadius + 3, buttonProps.EdgeRadius, 0, (Math.PI / 180) * 270, true);
    ctx.lineTo(buttonOffsetX + buttonProps.X + buttonProps.EdgeRadius + 3, buttonOffsetY + buttonProps.Y + 3);
    ctx.arc(buttonOffsetX + buttonProps.X + buttonProps.EdgeRadius + 3, buttonOffsetY + buttonProps.Y + buttonProps.EdgeRadius + 3,
        buttonProps.EdgeRadius, (Math.PI / 180) * 270, Math.PI, true);
        */
    ctx.closePath();
    ctx.fillStyle = buttonProps.BorderColor;
    ctx.fill();
    var g1 = ctx.createLinearGradient(buttonOffsetX + buttonProps.X, buttonOffsetY + buttonProps.Y, buttonOffsetX +
        buttonProps.X, buttonOffsetY + buttonProps.Y + buttonProps.Height);
    g1.addColorStop(0, buttonProps.TopColorStart);
    g1.addColorStop(1, buttonProps.TopColorEnd);
    ctx.fillStyle = g1;
    ctx.beginPath();
    ctx.rect(buttonOffsetX + buttonProps.X + buttonProps.EdgeRadius, buttonOffsetY + buttonProps.Y + buttonProps.EdgeRadius,
        buttonProps.Width - (2 * buttonProps.EdgeRadius), (buttonProps.Height / 2) - buttonProps.EdgeRadius);
    ctx.fill();
    var g2 = ctx.createLinearGradient(buttonOffsetX + buttonProps.X, buttonOffsetY + buttonProps.Y, buttonOffsetX +
        buttonProps.X, buttonOffsetY + buttonProps.Y + buttonProps.Height);
    g2.addColorStop(0, buttonProps.BottomColorStart);
    g2.addColorStop(1, buttonProps.BottomColorEnd);
    ctx.fillStyle = g2;
    ctx.beginPath();
    ctx.rect(buttonOffsetX + buttonProps.X + buttonProps.EdgeRadius, buttonOffsetY + buttonProps.Y + (buttonProps.Height / 2),
        buttonProps.Width - (2 * buttonProps.EdgeRadius), (buttonProps.Height / 2) - buttonProps.EdgeRadius);
    ctx.fill();
    ctx.font = buttonProps.TextFontString;
    ctx.fillStyle = buttonProps.TextColor;
    ctx.fillText(buttonProps.Text, buttonOffsetX + buttonProps.X + ((buttonProps.Width - ctx.measureText(buttonProps.Text).width) / 2),
        buttonOffsetY + buttonProps.Y + buttonProps.Height - ((buttonProps.Height - buttonProps.TextHeight) / 2));
}

function createButton(canvasid, controlNameId, x, y, width, height, text, textColor, textHeight, textFontString, edgeRadius, depth, clickFunction,
    drawFunction, bottomColorStart, bottomColorEnd, topColorStart, topColorEnd, borderColor, isHyperlink, url, nobrowserhistory, isnewbrowserwindow,
    nameofnewbrowserwindow, widthofnewbrowserwindow, heightofnewbrowserwindow, newbrowserwindowisresizable, newbrowserwindowhasscrollbars,
    newbrowserwindowhastoolbar, newbrowserwindowhaslocationorurloraddressbox, newbroserwindowhasdirectoriesorextrabuttons,
    newbrowserwindowhasstatusbar, newbrowserwindowhasmenubar, newbrowserwindowcopyhistory) {
    var windowid = createWindow(canvasid, x, y, width, height, depth, null, 'Button', controlNameId);
    buttonPropsArray.push({
        CanvasID: canvasid, WindowID: windowid, X: x, Y: y, Width: width, Height: height, Text: text,
        EdgeRadius: edgeRadius, BottomColorStart: bottomColorStart, BottomColorEnd: bottomColorEnd, 
        TopColorStart: topColorStart, TopColorEnd: topColorEnd, TextHeight: textHeight, TextFontString: textFontString,
        TextColor: textColor, IsPressed: 0, BorderColor: borderColor, IsHyperlink: isHyperlink, URL: url, 
        NoBrowserHistory: nobrowserhistory, IsNewBrowserWindow: isnewbrowserwindow,
        NameOfNewBrowserWindow: nameofnewbrowserwindow, WidthOfNewBrowserWindow: widthofnewbrowserwindow, 
        HeightOfNewBrowserWindow: heightofnewbrowserwindow, NewBrowserWindowIsResizable: newbrowserwindowisresizable, 
        NewBrowserWindowHasScrollBars: newbrowserwindowhasscrollbars, NewBrowserWindowHasToolbar: newbrowserwindowhastoolbar, 
        NewBrowserWindowHasLocationOrURLOrAddressBox: newbrowserwindowhaslocationorurloraddressbox, 
        NewBrowserWindowHasDirectoriesOrExtraButtons: newbroserwindowhasdirectoriesorextrabuttons,
        NewBrowserWindowHasStatusBar: newbrowserwindowhasstatusbar, NewBrowserWindowHasMenuBar: newbrowserwindowhasmenubar, 
        NewBrowserWindowCopyHistory: newbrowserwindowcopyhistory
    });
    registerClickFunction(windowid, function () {
        if (isHyperlink == 1) {
            if(isnewbrowserwindow == 1){
                var str = '';
                var wroteone = 0;
                if (widthofnewbrowserwindow != null) {
                    str += 'width=' + widthofnewbrowserwindow;
                    wroteone = 1;
                }
                if (heightofnewbrowserwindow != null) {
                    str += (wroteone == 1 ? ',' : '') + 'height=' + heightofnewbrowserwindow;
                }
                if (newbrowserwindowisresizable != null) {
                    str += (wroteone == 1 ? ',' : '') + 'resizable=' + newbrowserwindowisresizable;
                }
                if (newbrowserwindowhasscrollbars != null) {
                    str += (wroteone == 1 ? ',' : '') + 'scrollbars=' + newbrowserwindowhasscrollbars;
                }
                if (newbrowserwindowhastoolbar != null) {
                    str += (wroteone == 1 ? ',' : '') + 'toolbar=' + newbrowserwindowhastoolbar;
                }
                if (newbrowserwindowhaslocationorurloraddressbox != null) {
                    str += (wroteone == 1 ? ',' : '') + 'location=' + newbrowserwindowhaslocationorurloraddressbox;
                }
                if (newbroserwindowhasdirectoriesorextrabuttons != null) {
                    str += (wroteone == 1 ? ',' : '') + 'directories=' + newbroserwindowhasdirectoriesorextrabuttons;
                }
                if (newbrowserwindowhasstatusbar != null) {
                    str += (wroteone == 1 ? ',' : '') + 'status=' + newbrowserwindowhasstatusbar;
                }
                if (newbrowserwindowhasmenubar != null) {
                    str += (wroteone == 1 ? ',' : '') + 'menubar=' + newbrowserwindowhasmenubar;
                }
                if (newbrowserwindowcopyhistory != null) {
                    str += (wroteone == 1 ? ',' : '') + 'copyhistory=' + newbrowserwindowcopyhistory;
                }
                window.open(url, nameofnewbrowserwindow, str);
            } else{
                if (nobrowserhistory == 1) {
                    window.location.replace(url);
                } else {
                    window.location.href = url;
                }
            }
        } else {
            getButtonProps(canvasid, windowid).IsPressed = 0;
            draw(canvasid);
            clickFunction(canvasid, windowid);
        }
    }, canvasid);
    registerMouseDownFunction(windowid, function () { getButtonProps(canvasid, windowid).IsPressed = 1; draw(canvasid); }, canvasid);
    registerMouseUpFunction(canvasid, function () { getButtonProps(canvasid, windowid).IsPressed = 0; draw(canvasid); }, canvasid);
    if (drawFunction != undefined && drawFunction != null)
        registerWindowDrawFunction(windowid, function () { drawFunction(canvasid, windowid); }, canvasid);
    else
        registerWindowDrawFunction(windowid, function () { defaultButtonDrawFunction(canvasid, windowid); }, canvasid);
    return windowid;
}

//Code for Scrollbar
var scrollBarPropsArray = new Array();

function getScrollBarProps(canvasid, windowid) {
    for (var i = 0; i < scrollBarPropsArray.length; i++) {
        if (scrollBarPropsArray[i].CanvasID == canvasid && scrollBarPropsArray[i].WindowID == windowid) {
            return scrollBarPropsArray[i];
        }
    }
}

function drawScrollBar(canvasid, windowid) {
    var scrollBarProps = getScrollBarProps(canvasid, windowid);
    var x = scrollBarProps.X, y = scrollBarProps.Y, len = scrollBarProps.Len, maxitems = scrollBarProps.MaxItems, selindex = scrollBarProps.SelectedID;
    var ctx = getCtx(canvasid);
    if (scrollBarProps.Alignment == 1) {
        var g = ctx.createLinearGradient(x, y, x + 15, y);
        g.addColorStop(0, '#e3e3e3');
        g.addColorStop(0.5, '#ededed');
        g.addColorStop(1, '#e5e5e5');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.rect(x, y, 15, len);
        ctx.fill();
        ctx.lineCap = 'butt';
        ctx.strokeStyle = '#3c7fb1';
        ctx.beginPath();
        ctx.rect(x, y, 15, 15);
        ctx.stroke();
        ctx.fillStyle = '#dcf0fb';
        ctx.beginPath();
        ctx.rect(x + 1, y + 1, 6, 13);
        ctx.fill();
        ctx.fillStyle = '#a7d8f3';
        ctx.beginPath();
        ctx.rect(x + 8, y + 1, 6, 13);
        ctx.fill();
        ctx.strokeStyle = '#c0e4f8';
        ctx.beginPath();
        ctx.moveTo(x + 7, y + 1);
        ctx.lineTo(x + 7, y + 14);
        ctx.stroke();
        var g = ctx.createLinearGradient(x + 7, y + 6, x + 7, y + 10);
        g.addColorStop(0, '#4e9ac4');
        g.addColorStop(1, '#0d2a3a');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(x + 8, y + 6);
        ctx.lineTo(x + 11, y + 10);
        ctx.lineTo(x + 4, y + 10);
        ctx.closePath();
        ctx.fill();
        ctx.lineCap = 'butt';
        ctx.strokeStyle = '#3c7fb1';
        ctx.beginPath();
        ctx.rect(x, y + len - 15, 15, 15);
        ctx.stroke();
        ctx.fillStyle = '#dcf0fb';
        ctx.beginPath();
        ctx.rect(x + 1, y + len - 15 + 1, 6, 13);
        ctx.fill();
        ctx.fillStyle = '#a7d8f3';
        ctx.beginPath();
        ctx.rect(x + 8, y + len - 15 + 1, 6, 13);
        ctx.fill();
        ctx.strokeStyle = '#c0e4f8';
        ctx.beginPath();
        ctx.moveTo(x + 7, y + len - 15 + 1);
        ctx.lineTo(x + 7, y + len - 15 + 14);
        ctx.stroke();
        var g = ctx.createLinearGradient(x + 7, y + len - 15 + 6, x + 7, y + len - 15 + 10);
        g.addColorStop(0, '#0d2a3a');
        g.addColorStop(1, '#4e9ac4');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(x + 4, y + len - 15 + 6);
        ctx.lineTo(x + 11, y + len - 15 + 6);
        ctx.lineTo(x + 7, y + len - 15 + 10);
        ctx.closePath();
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#15598a';
        ctx.beginPath();
        ctx.rect(x, y + ((selindex * (len - 55)) / maxitems) + 16, 15, 25);
        ctx.stroke();
        ctx.fillStyle = '#6ac1e5';
        ctx.beginPath();
        ctx.rect(x + 8, y + ((selindex * (len - 55)) / maxitems) + 16 + 1, 6, 23);
        ctx.fill();
        ctx.fillStyle = '#b7e4f7';
        ctx.beginPath();
        ctx.rect(x + 1, y + ((selindex * (len - 55)) / maxitems) + 16 + 1, 6, 23);
        ctx.fill();
        ctx.strokeStyle = '#8fd5f3';
        ctx.beginPath();
        ctx.moveTo(x + 8, y + ((selindex * (len - 55)) / maxitems) + 16 + 1);
        ctx.lineTo(x + 8, y + ((selindex * (len - 55)) / maxitems) + 16 + 22);
        ctx.stroke();
        var g = ctx.createLinearGradient(x + 4, y + ((selindex * (len - 55)) / maxitems) + 16 + 8, x + 10, y + ((selindex * (len - 55)) / maxitems) + 16 + 8);
        g.addColorStop(0, '#2b404b');
        g.addColorStop(1, '#5888a1');
        ctx.strokeStyle = g;
        ctx.beginPath();
        ctx.moveTo(x + 4, y + ((selindex * (len - 55)) / maxitems) + 16 + 8);
        ctx.lineTo(x + 10, y + ((selindex * (len - 55)) / maxitems) + 16 + 8);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 4, y + ((selindex * (len - 55)) / maxitems) + 16 + 11);
        ctx.lineTo(x + 10, y + ((selindex * (len - 55)) / maxitems) + 16 + 11);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 4, y + ((selindex * (len - 55)) / maxitems) + 16 + 14);
        ctx.lineTo(x + 10, y + ((selindex * (len - 55)) / maxitems) + 16 + 14);
        ctx.stroke();
        var g = ctx.createLinearGradient(x + 4, y + ((selindex * (len - 55)) / maxitems) + 16 + 8, x + 10, y + ((selindex * (len - 55)) / maxitems) + 16 + 8);
        g.addColorStop(0, '#447791');
        g.addColorStop(1, '#96bed3');
        ctx.strokeStyle = g;
        ctx.beginPath();
        ctx.moveTo(x + 4, y + ((selindex * (len - 55)) / maxitems) + 16 + 9);
        ctx.lineTo(x + 10, y + ((selindex * (len - 55)) / maxitems) + 16 + 9);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 4, y + ((selindex * (len - 55)) / maxitems) + 16 + 12);
        ctx.lineTo(x + 10, y + ((selindex * (len - 55)) / maxitems) + 16 + 12);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 4, y + ((selindex * (len - 55)) / maxitems) + 16 + 15);
        ctx.lineTo(x + 10, y + ((selindex * (len - 55)) / maxitems) + 16 + 15);
        ctx.stroke();
    } else {
        var g = ctx.createLinearGradient(x, y, x, y + 15);
        g.addColorStop(0, '#e3e3e3');
        g.addColorStop(0.5, '#ededed');
        g.addColorStop(1, '#e5e5e5');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.rect(x, y, len, 15);
        ctx.fill();
        ctx.lineCap = 'butt';
        ctx.strokeStyle = '#3c7fb1';
        ctx.beginPath();
        ctx.rect(x, y, 15, 15);
        ctx.stroke();
        ctx.fillStyle = '#dcf0fb';
        ctx.beginPath();
        ctx.rect(x + 1, y + 1, 13, 6);
        ctx.fill();
        ctx.fillStyle = '#a7d8f3';
        ctx.beginPath();
        ctx.rect(x + 1, y + 8, 13, 6);
        ctx.fill();
        ctx.strokeStyle = '#c0e4f8';
        ctx.beginPath();
        ctx.moveTo(x + 1, y + 7);
        ctx.lineTo(x + 14, y + 7);
        ctx.stroke();
        var g = ctx.createLinearGradient(x + 6, y + 7, x + 10, y + 7);
        g.addColorStop(0, '#4e9ac4');
        g.addColorStop(1, '#0d2a3a');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(x + 6, y + 8);
        ctx.lineTo(x + 10, y + 11);
        ctx.lineTo(x + 10, y + 4);
        ctx.closePath();
        ctx.fill();
        ctx.lineCap = 'butt';
        ctx.strokeStyle = '#3c7fb1';
        ctx.beginPath();
        ctx.rect(x + len - 15, y, 15, 15);
        ctx.stroke();
        ctx.fillStyle = '#dcf0fb';
        ctx.beginPath();
        ctx.rect(x + len - 15 + 1, y, 13, 6);
        ctx.fill();
        ctx.fillStyle = '#a7d8f3';
        ctx.beginPath();
        ctx.rect(x + len - 15 + 1, y + 8, 13, 6);
        ctx.fill();
        ctx.strokeStyle = '#c0e4f8';
        ctx.beginPath();
        ctx.moveTo(x + len - 15 + 1, y + 7);
        ctx.lineTo(x + len - 1, y + 7);
        ctx.stroke();
        var g = ctx.createLinearGradient(x + len - 15 + 6, y + 7, x + len - 15 + 10, y + 7);
        g.addColorStop(0, '#0d2a3a');
        g.addColorStop(1, '#4e9ac4');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(x + len - 15 + 6, y + 4);
        ctx.lineTo(x + len - 15 + 10, y + 8);
        ctx.lineTo(x + len - 15 + 6, y + 11);
        ctx.closePath();
        ctx.fill();
    }
}

function scrollBarClick(canvasid, windowid) {
    var scrollBarProps = getScrollBarProps(canvasid, windowid);
    var canvas = getCanvas(canvasid);
    var xm = event.pageX - canvas.offsetLeft;
    var ym = event.pageY - canvas.offsetTop;
    if (scrollBarProps.Alignment == 1) {
        if (xm > scrollBarProps.X && xm < scrollBarProps.X + 15 && ym > scrollBarProps.Y && ym < scrollBarProps.Y + 15 && scrollBarProps.SelectedID - 1 >= 0) {
            --scrollBarProps.SelectedID;
            draw(canvasid);
        } else if (xm > scrollBarProps.X && xm < scrollBarProps.X + 15 && ym > scrollBarProps.Y + scrollBarProps.Len - 15 &&
            ym < scrollBarProps.Y + scrollBarProps.Len && scrollBarProps.SelectedID + 1 < scrollBarProps.MaxItems) {
            ++scrollBarProps.SelectedID;
            draw(canvasid);
        }
    } else {
        if (xm > scrollBarProps.X && xm < scrollBarProps.X + 15 && ym > scrollBarProps.Y && ym < scrollBarProps.Y + 15 && scrollBarProps.SelectedID - 1 >= 0) {
            --scrollBarProps.SelectedID;
            draw(canvasid);
        } else if (xm > scrollBarProps.X + scrollBarProps.Len - 15 && xm < scrollBarProps.X + scrollBarProps.Len &&
            ym > scrollBarProps.Y && ym < scrollBarProps.Y + 15 && scrollBarProps.SelectedID + 1 < scrollBarProps.MaxItems) {
            ++scrollBarProps.SelectedID;
            draw(canvasid);
        }
    }
}

function scrollBarMouseDown(canvasid, windowid) {
    var scrollBarProps = getScrollBarProps(canvasid, windowid);
    var canvas = getCanvas(canvasid);
    var x = event.pageX - canvas.offsetLeft;
    var y = event.pageY - canvas.offsetTop;
    if (scrollBarProps.Alignment == 1) {
        if (x > scrollBarProps.X && x < scrollBarProps.X + 15 && y > scrollBarProps.Y +
            ((scrollBarProps.SelectedID * (scrollBarProps.Len - 55)) / scrollBarProps.MaxItems) + 16 &&
            y < scrollBarProps.Y + ((scrollBarProps.SelectedID * (scrollBarProps.Len - 55)) / scrollBarProps.MaxItems) + 16 + 25) {
            scrollBarProps.MouseDownState = 1;
        }
    } else {
        if (y > scrollBarProps.Y && y < scrollBarProps.Y + 15 && x > scrollBarProps.X +
            ((scrollBarProps.SelectedID * (scrollBarProps.Len - 55)) / scrollBarProps.MaxItems) + 16 &&
            x < scrollBarProps.X + ((scrollBarProps.SelectedID * (scrollBarProps.Len - 55)) / scrollBarProps.MaxItems) + 16 + 25) {
            scrollBarProps.MouseDownState = 1;
        }
    }
}

function scrollBarMouseMove(canvasid, windowid) {
    var scrollBarProps = getScrollBarProps(canvasid, windowid);
    if (scrollBarProps.MouseDownState == 1) {
        var canvas = getCanvas(canvasid);
        if (scrollBarProps.Alignment == 1) {
            var y = event.pageY - canvas.offsetTop;
            if (y < scrollBarProps.Y) {
                scrollBarProps.SelectedID = 1;
            } else if (y > scrollBarProps.Y + scrollBarProps.Len) {
                scrollBarProps.SelectedID = scrollBarProps.MaxItems;
            } else {
                scrollBarProps.SelectedID = Math.floor(((y - scrollBarProps.Y) * scrollBarProps.MaxItems) / scrollBarProps.Len);
            }
        } else {
            var x = event.pageX - canvas.offsetLeft;
            if (x < scrollBarProps.X) {
                scrollBarProps.SelectedID = 1;
            } else if (x > scrollBarProps.X + scrollBarProps.Len) {
                scrollBarProps.SelectedID = scrollBarProps.MaxItems;
            } else {
                scrollBarProps.SelectedID = Math.floor(((x - scrollBarProps.X) * scrollBarProps.MaxItems) / scrollBarProps.Len);
            }
        }
        draw(canvasid);
    }
}

function scrollBarMouseUp(canvasid, windowid) {
    var scrollBarProps = getScrollBarProps(canvasid, windowid);
    scrollBarProps.MouseDownState = 0;
}

function scrollBarLostFocus(canvasid, windowid) {
    var scrollBarProps = getScrollBarProps(canvasid, windowid);
    scrollBarProps.MouseDownState = 0;
}

function createScrollBar(canvasid, controlNameId, x, y, len, depth, maxitems, alignment, drawFunction, clickFunction) {
    var windowid;
    if (alignment == 1) {
        windowid = createWindow(canvasid, x, y, 15, len, depth, null, 'ScrollBar', controlNameId);
    } else {
        windowid = createWindow(canvasid, x, y, len, 15, depth, null, 'ScrollBar', controlNameId);
    }
    scrollBarPropsArray.push({
        CanvasID: canvasid, WindowID: windowid, X: x, Y: y, Len: len, SelectedID: 0,
        MaxItems: maxitems, Alignment: alignment, MouseDownState: 0
    });
    if (clickFunction == null) {
        registerClickFunction(windowid, scrollBarClick, canvasid);
    } else {
        registerClickFunction(windowid, clickFunction, canvasid);
    }
    if (drawFunction == null) {
        registerWindowDrawFunction(windowid, function () { drawScrollBar(canvasid, windowid); }, canvasid);
    } else {
        registerWindowDrawFunction(windowid, function () { drawFunction(canvasid, windowid); }, canvasid);
    }
    registerMouseDownFunction(windowid, scrollBarMouseDown, canvasid);
    registerMouseMoveFunction(windowid, scrollBarMouseMove, canvasid);
    registerMouseUpFunction(windowid, scrollBarMouseUp, canvasid);
    registerLostFocusFunction(canvasid, windowid, scrollBarLostFocus);
    return windowid;
}

//Code for Listbox starts here

var gridPropsArray = new Array();

function getGridProps(canvasid, windowid) {
    for (var i = 0; i < gridPropsArray.length; i++) {
        if (gridPropsArray[i].CanvasID == canvasid && gridPropsArray[i].WindowID == windowid) {
            return gridPropsArray[i];
        }
    }
}

function createGrid(canvasid, controlNameId, x, y, width, height, depth, rowData, headerData, rowDataTextColor, rowDataTextHeight, rowDataTextFontString,
    headerDataTextColor, headerDataTextHeight, headerDataTextFontString, drawRowDataCellFunction, drawHeaderCellFunction,
    cellClickFunction, dataRowHeight, headerRowHeight, columnWidthArray, hasBorder, borderColor, borderLineWidth,
    headerbackgroundstartcolor, headerbackgroundendcolor, altrowbgcolorstart1, altrowbgcolorend1, altrowbgcolorstart2, altrowbgcolorend2, controlNameId) {
    var windowid = createWindow(canvasid, x, y, width, height, depth, null, 'Grid');
    var effectiveWidth = 0;
    for (var i = 0; i < columnWidthArray.length; i++) {
        effectiveWidth += columnWidthArray[i];
    }
    var effectiveHeight = headerRowHeight + (dataRowHeight * rowData.length);
    var vscrollBarWindowId = null;
    if (effectiveHeight > height) {
        vscrollBarWindowId = createScrollBar(canvasid, controlNameId + 'VS', x + width, y, height, depth, rowData.length, 1);
    }
    var hscrollBarWindowId = null;
    if (effectiveWidth > width) {
        hscrollBarWindowId = createScrollBar(canvasid, controlNameId + 'HS', x, y + height, width, depth, columnWidthArray.length, 0);
    }
    gridPropsArray.push({CanvasID: canvasid, WindowID: windowid,
        X: x, Y: y, 
        Width: width, Height: height,
        RowData: rowData, HeaderData: headerData, 
        RowDataTextColor: rowDataTextColor,
        RowDataTextFontString: rowDataTextFontString, HeaderDataTextColor: headerDataTextColor, 
        HeaderDataTextHeight: headerDataTextHeight, HeaderDataTextFontString: headerDataTextFontString,
        CellClickFunction: cellClickFunction, DataRowHeight: dataRowHeight,
        ColumnWidthArray: columnWidthArray, HeaderRowHeight: headerRowHeight, 
        HasBorder: hasBorder, BorderColor: borderColor, 
        BorderLineWidth: borderLineWidth, VScrollBarWindowId: vscrollBarWindowId,
        HScrollBarWindowId: hscrollBarWindowId, HeaderBackgroundStartColor: headerbackgroundstartcolor, 
        HeaderBackgroundEndColor: headerbackgroundendcolor, AltRowBgColorStart1: altrowbgcolorstart1, 
        AltRowBgColorEnd1: altrowbgcolorend1, AltRowBgColorStart2: altrowbgcolorstart2, AltRowBgColorEnd2: altrowbgcolorend2
    });
    registerWindowDrawFunction(windowid, function () { drawGrid(canvasid, windowid); }, canvasid);
    registerClickFunction(windowid, function () { clickGrid(canvasid, windowid); }, canvasid);
    return windowid;
}

function drawGrid(canvasid, windowid) {
    var gridProps = getGridProps(canvasid, windowid);
    var vscrollBarProps = getScrollBarProps(canvasid, gridProps.VScrollBarWindowId);
    var hscrollBarProps = getScrollBarProps(canvasid, gridProps.HScrollBarWindowId);
    var ctx = getCtx(canvasid);
    var startRow = 0;
    if (vscrollBarProps != null) {
        startRow = vscrollBarProps.SelectedID;
    }
    var startCol = 0;
    if (hscrollBarProps != null) {
        startCol = hscrollBarProps.SelectedID;
    }
    var totalWidth = 0;
    for (var c = startCol; c < gridProps.ColumnWidthArray.length; c++) {
        if (totalWidth >= gridProps.Width) {
            break;
        }
        totalWidth += gridProps.ColumnWidthArray[c];
        var g = ctx.createLinearGradient(gridProps.X + totalWidth - gridProps.ColumnWidthArray[c], gridProps.Y,
            gridProps.X + totalWidth - gridProps.ColumnWidthArray[c], gridProps.Y + gridProps.HeaderRowHeight);
        g.addColorStop(0, gridProps.HeaderBackgroundStartColor);
        g.addColorStop(1, gridProps.HeaderBackgroundEndColor);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.rect(gridProps.X + totalWidth - gridProps.ColumnWidthArray[c], gridProps.Y, (totalWidth > gridProps.Width ?
            gridProps.ColumnWidthArray[c] + gridProps.Width - totalWidth : gridProps.ColumnWidthArray[c]), gridProps.HeaderRowHeight);
        ctx.fill();
        ctx.save();
        ctx.beginPath();
        ctx.rect(gridProps.X + totalWidth - gridProps.ColumnWidthArray[c], gridProps.Y, (totalWidth > gridProps.Width ?
            gridProps.ColumnWidthArray[c] + gridProps.Width - totalWidth : gridProps.ColumnWidthArray[c]), gridProps.HeaderRowHeight);
        ctx.clip();
        ctx.fillStyle = gridProps.HeaderDataTextColor;
        ctx.font = gridProps.HeaderDataTextFontString;
        ctx.fillText(gridProps.HeaderData[c], gridProps.X + totalWidth - gridProps.ColumnWidthArray[c], gridProps.Y +
            gridProps.HeaderRowHeight - ((gridProps.HeaderRowHeight - gridProps.HeaderDataTextHeight) / 2));
        ctx.restore();
        if (gridProps.HasBorder == 1) {
            ctx.strokeStyle = gridProps.BorderColor;
            ctx.lineWidth = gridProps.BorderLineWidth;
            ctx.beginPath();
            ctx.rect(gridProps.X + totalWidth - gridProps.ColumnWidthArray[c], gridProps.Y, gridProps.ColumnWidthArray[c] +
                gridProps.Width - totalWidth, gridProps.HeaderRowHeight);
            ctx.stroke();
        }
    }
    var altrow = 0;
    for (var r = startRow; r < gridProps.RowData.length; r++) {
        if (((r - startRow) * gridProps.DataRowHeight) + gridProps.HeaderRowHeight >= gridProps.Height) {
            break;
        }
        var totalWidth = 0;
        for (var c = startCol; c < gridProps.ColumnWidthArray.length; c++) {
            if (totalWidth >= gridProps.Width) {
                break;
            }
            totalWidth += gridProps.ColumnWidthArray[c];
            ctx.save();
            ctx.beginPath();
            ctx.rect(gridProps.X + totalWidth - gridProps.ColumnWidthArray[c], gridProps.Y + ((r - startRow) * gridProps.DataRowHeight) +
                gridProps.HeaderRowHeight, (totalWidth > gridProps.Width ? gridProps.ColumnWidthArray[c] + gridProps.Width - totalWidth :
                gridProps.ColumnWidthArray[c]), gridProps.DataRowHeight);
            ctx.clip();
            var g2 = ctx.createLinearGradient(gridProps.X + totalWidth - gridProps.ColumnWidthArray[c], gridProps.Y + ((r - startRow) * gridProps.DataRowHeight) +
                gridProps.HeaderRowHeight, gridProps.X + totalWidth - gridProps.ColumnWidthArray[c], gridProps.Y + ((r - startRow) * gridProps.DataRowHeight) +
                gridProps.HeaderRowHeight + gridProps.DataRowHeight);
            if (altrow == 0) {
                g2.addColorStop(0, gridProps.AltRowBgColorStart1);
                g2.addColorStop(1, gridProps.AltRowBgColorEnd1);
            } else {
                g2.addColorStop(0, gridProps.AltRowBgColorStart2);
                g2.addColorStop(1, gridProps.AltRowBgColorEnd2);
            }
            ctx.fillStyle = g2;
            ctx.beginPath();
            ctx.rect(gridProps.X + totalWidth - gridProps.ColumnWidthArray[c], gridProps.Y + ((r - startRow) * gridProps.DataRowHeight) +
                gridProps.HeaderRowHeight, (totalWidth > gridProps.Width ? gridProps.ColumnWidthArray[c] + gridProps.Width - totalWidth :
                gridProps.ColumnWidthArray[c]), gridProps.DataRowHeight);
            ctx.fill();
            ctx.fillStyle = gridProps.RowDataTextColor;
            ctx.font = gridProps.RowDataTextFontString;
            ctx.fillText(gridProps.RowData[r][c], gridProps.X + totalWidth - gridProps.ColumnWidthArray[c], gridProps.Y + ((r - startRow) *
                gridProps.DataRowHeight) - ((gridProps.DataRowHeight - gridProps.HeaderDataTextHeight) / 2) + gridProps.HeaderRowHeight + gridProps.DataRowHeight);
            ctx.restore();
            if (gridProps.HasBorder == 1) {
                ctx.strokeStyle = gridProps.BorderColor;
                ctx.lineWidth = gridProps.BorderLineWidth;
                ctx.beginPath();
                ctx.rect(gridProps.X + totalWidth - gridProps.ColumnWidthArray[c], gridProps.Y + ((r - startRow) *
                    gridProps.DataRowHeight) + gridProps.HeaderRowHeight, gridProps.ColumnWidthArray[c] + gridProps.Width - totalWidth, gridProps.DataRowHeight);
                ctx.stroke();
            }
        }
        if (altrow == 1) {
            altrow = 0;
        } else {
            altrow = 1;
        }
    }
}

function clickGrid(canvasid, windowid) {
    var gridProps = getGridProps(canvasid, windowid);
    var vscrollBarProps = getScrollBarProps(canvasid, gridProps.VScrollBarWindowId);
    var hscrollBarProps = getScrollBarProps(canvasid, gridProps.HScrollBarWindowId);
    var canvas = getCanvas(canvasid);
    var x = event.pageX - canvas.offsetLeft;
    var y = event.pageY - canvas.offsetTop;
    var startRow = 0;
    if (vscrollBarProps != null) {
        startRow = vscrollBarProps.SelectedID;
    }
    var startCol = 0;
    if (hscrollBarProps != null) {
        startCol = hscrollBarProps.SelectedID;
    }
    var totalWidth = 0;
    for (var r = startRow; r < gridProps.RowData.length; r++) {
        if (((r - startRow) * gridProps.DataRowHeight) + gridProps.HeaderRowHeight >= gridProps.Height) {
            break;
        }
        var totalWidth = 0;
        for (var c = startCol; c < gridProps.ColumnWidthArray.length; c++) {
            if (totalWidth >= gridProps.Width) {
                break;
            }
            totalWidth += gridProps.ColumnWidthArray[c];
            if (x > gridProps.X + totalWidth - gridProps.ColumnWidthArray[c] && y > gridProps.Y + ((r - startRow) * gridProps.DataRowHeight) +
                gridProps.HeaderRowHeight && x < gridProps.X + totalWidth - gridProps.ColumnWidthArray[c] + (totalWidth > gridProps.Width ?
                gridProps.ColumnWidthArray[c] + gridProps.Width - totalWidth :
                gridProps.ColumnWidthArray[c]) && y < gridProps.DataRowHeight + gridProps.Y + ((r - startRow) * gridProps.DataRowHeight) +
                gridProps.HeaderRowHeight) {
                gridProps.CellClickFunction(canvasid, windowid, c + 1, r + 1);
                return;
            }
        }
    }
}

//Combobox code starts here

var comboboxPropsArray = new Array();

function getComboboxPropsByTextAreaWindowId(canvasid, windowid) {
    for (var i = 0; i < comboboxPropsArray.length; i++) {
        if (comboboxPropsArray[i].CanvasID == canvasid && comboboxPropsArray[i].TextAreaWindowID == windowid) {
            return comboboxPropsArray[i];
        }
    }
}

function getComboboxPropsByButtonWindowId(canvasid, windowid) {
    for (var i = 0; i < comboboxPropsArray.length; i++) {
        if (comboboxPropsArray[i].CanvasID == canvasid && comboboxPropsArray[i].ButtonWindowID == windowid) {
            return comboboxPropsArray[i];
        }
    }
}

function getComboboxPropsByListAreaWindowId(canvasid, windowid) {
    for (var i = 0; i < comboboxPropsArray.length; i++) {
        if (comboboxPropsArray[i].CanvasID == canvasid && comboboxPropsArray[i].ListAreaWindowID == windowid) {
            return comboboxPropsArray[i];
        }
    }
}

function getComboboxPropsByScrollBarWindowId(canvasid, windowid) {
    for (var i = 0; i < comboboxPropsArray.length; i++) {
        if (comboboxPropsArray[i].CanvasID == canvasid && comboboxPropsArray[i].VScrollBarWindowID == windowid) {
            return comboboxPropsArray[i];
        }
    }
}

function createComboBox(canvasid, controlNameId, x, y, width, height, depth, data, drawTextAreaFunction, drawButtonFunction, drawListAreaFunction, buttonClickFunction,
    listAreaClickFunction, textAreaTextColor, textAreaTextHeight, textAreaFontString, listAreaTextColor, listAreaTextHeight, listAreaFontString, onSelectionChanged) {
    var textareawindowid = createWindow(canvasid, x, y, width - 15, height, depth, null, 'ComboBoxTextArea', controlNameId + 'ComboBoxTextArea');
    var buttonwindowid = createWindow(canvasid, x + width - height, y, height, height, depth, null, 'ComboBoxButton', controlNameId + 'ComboBoxButton');
    var dropdownlistareawindowid = createWindow(canvasid, x, y + height, width - 15, 100, depth, null, 'ComboBoxListArea', controlNameId + 'ComboBoxListArea');
    registerModalWindow(canvasid, dropdownlistareawindowid);
    var vscrollBarComboboxWindowId = createScrollBar(canvasid, controlNameId + 'VS', x + width - 15, y + height, 100, depth, data.length, 1,
        function () { drawComboboxScrollBar(canvasid, vscrollBarComboboxWindowId); }, null);
    comboboxPropsArray.push({
        CanvasID: canvasid, WindowID: textareawindowid, TextAreaWindowID: textareawindowid, ButtonWindowID: buttonwindowid,
        ListAreaWindowID: dropdownlistareawindowid, VScrollBarWindowID: vscrollBarComboboxWindowId,
        X: x, Y: y, Width: width, Height: height, Data: data, SelectedID: 0,
        TextAreaTextColor: textAreaTextColor, TextAreaTextHeight: textAreaTextHeight,
        TextAreaFontString: textAreaFontString, ListAreaTextColor: listAreaTextColor,
        ListAreaTextHeight: listAreaTextHeight, ListAreaFontString: listAreaFontString, OnSelectionChanged: onSelectionChanged
    });
    if (drawTextAreaFunction != null) {
        registerWindowDrawFunction(textareawindowid, function () { drawTextAreaFunction(canvasid, textareawindowid); }, canvasid);
    } else {
        registerWindowDrawFunction(textareawindowid, function () { drawComboboxTextArea(canvasid, textareawindowid); }, canvasid);
    }
    if (drawButtonFunction != null) {
        registerWindowDrawFunction(buttonwindowid, function () { drawButtonFunction(canvasid, buttonwindowid); }, canvasid);
    } else {
        registerWindowDrawFunction(buttonwindowid, function () { drawComboboxButton(canvasid, buttonwindowid); }, canvasid);
    }
    if (drawListAreaFunction != null) {
        registerWindowDrawFunction(dropdownlistareawindowid, function () { drawListAreaFunction(canvasid, dropdownlistareawindowid); }, canvasid);
    } else {
        registerWindowDrawFunction(dropdownlistareawindowid, function () { drawComboboxListArea(canvasid, dropdownlistareawindowid); }, canvasid);
    }
    if (buttonClickFunction != null) {
        registerClickFunction(buttonwindowid, buttonClickFunction, canvasid);
    } else {
        registerClickFunction(buttonwindowid, comboboxButtonClick, canvasid);
    }
    if (listAreaClickFunction != null) {
        registerClickFunction(dropdownlistareawindowid, listAreaClickFunction, canvasid);
    } else {
        registerClickFunction(dropdownlistareawindowid, comboboxListAreaClick, canvasid);
    }
    registerModalWindow(canvasid, dropdownlistareawindowid);
    registerHiddenWindow(canvasid, dropdownlistareawindowid, 1);
    registerModalWindow(canvasid, vscrollBarComboboxWindowId);
    registerHiddenWindow(canvasid, vscrollBarComboboxWindowId, 1);
    registerLostFocusFunction(canvasid, dropdownlistareawindowid, function () { comboboxListAreaLostFocus(canvasid, dropdownlistareawindowid); });
    registerLostFocusFunction(canvasid, textareawindowid, function () { comboboxTextAreaLostFocus(canvasid, textareawindowid); });
    registerLostFocusFunction(canvasid, vscrollBarComboboxWindowId, function () { comboboxScrollBarLostFocus(canvasid, vscrollBarComboboxWindowId); });
    registerLostFocusFunction(canvasid, buttonwindowid, function () { comboboxButtonLostFocus(canvasid, buttonwindowid); });
    return textareawindowid;
}

function drawComboboxScrollBar(canvasid, windowid) {
    var comboboxProps = getComboboxPropsByScrollBarWindowId(canvasid, windowid);
    drawScrollBar(canvasid, windowid);
}

function drawComboboxTextArea(canvasid, windowid) {
    var comboboxProps = getComboboxPropsByTextAreaWindowId(canvasid, windowid);
    var ctx = getCtx(canvasid);
    ctx.fillStyle = comboboxProps.TextAreaTextColor;
    ctx.font = comboboxProps.TextAreaFontString;
    if (comboboxProps.SelectedID < comboboxProps.Data.length && comboboxProps.SelectedID >= 0) {
        ctx.fillText(comboboxProps.Data[comboboxProps.SelectedID], comboboxProps.X + 5, comboboxProps.Y + comboboxProps.Height - (comboboxProps.TextAreaTextHeight / 2));
    } else {
        ctx.fillText(comboboxProps.Data[0], comboboxProps.X + 5, comboboxProps.Y + comboboxProps.Height - (comboboxProps.TextAreaTextHeight / 2));
    }
    ctx.strokeStyle = '#b7bfc8';
    ctx.beginPath();
    ctx.rect(comboboxProps.X, comboboxProps.Y, comboboxProps.Width - comboboxProps.Height, comboboxProps.Height);
    ctx.stroke();
}

function drawComboboxButton(canvasid, windowid) {
    var comboboxProps = getComboboxPropsByButtonWindowId(canvasid, windowid);
    var ctx = getCtx(canvasid);
    ctx.lineCap = 'butt';
    ctx.strokeStyle = '#3c7fb1';
    ctx.beginPath();
    ctx.rect(comboboxProps.X + comboboxProps.Width - comboboxProps.Height, comboboxProps.Y, comboboxProps.Height, comboboxProps.Height);
    ctx.stroke();
    ctx.fillStyle = '#dcf0fb';
    ctx.beginPath();
    ctx.rect(comboboxProps.X + comboboxProps.Width - comboboxProps.Height + 1, comboboxProps.Y + 1, (comboboxProps.Height / 2) - 2, comboboxProps.Height - 2);
    ctx.fill();
    ctx.strokeStyle = '#c0e4f8';
    ctx.moveTo(comboboxProps.X + comboboxProps.Width - (comboboxProps.Height / 2) + 1, comboboxProps.Y + 1);
    ctx.lineTo(comboboxProps.X + comboboxProps.Width - (comboboxProps.Height / 2) + 1, comboboxProps.Y + comboboxProps.Height - 1);
    ctx.stroke();
    ctx.fillStyle = '#a7d8f3';
    ctx.beginPath();
    ctx.rect(comboboxProps.X + comboboxProps.Width - (comboboxProps.Height / 2) + 1, comboboxProps.Y + 1,
        (comboboxProps.Height / 2) - 2, comboboxProps.Height - 2);
    ctx.fill();
    var g = ctx.createLinearGradient(comboboxProps.X + comboboxProps.Width - (comboboxProps.Height / 2) - 1, comboboxProps.Y + (comboboxProps.Height / 2) - 1,
        comboboxProps.X + comboboxProps.Width - (comboboxProps.Height / 2) - 1, comboboxProps.Y + (comboboxProps.Height / 2) + 3);
    g.addColorStop(0, '#0d2a3a');
    g.addColorStop(1, '#4e9ac4');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(comboboxProps.X + comboboxProps.Width - (comboboxProps.Height / 2) - 4, comboboxProps.Y + (comboboxProps.Height / 2) - 1);
    ctx.lineTo(comboboxProps.X + comboboxProps.Width - (comboboxProps.Height / 2) + 3, comboboxProps.Y + (comboboxProps.Height / 2) - 1);
    ctx.lineTo(comboboxProps.X + comboboxProps.Width - (comboboxProps.Height / 2) - 1, comboboxProps.Y + (comboboxProps.Height / 2) + 3);
    ctx.closePath();
    ctx.fill();
}

function comboboxButtonClick(canvasid, windowid) {
    var comboboxProps = getComboboxPropsByButtonWindowId(canvasid, windowid);
    if (checkIfHiddenWindow(canvasid, comboboxProps.ListAreaWindowID) == 1) {
        setHiddenWindowStatus(canvasid, comboboxProps.VScrollBarWindowID, 0);
        setHiddenWindowStatus(canvasid, comboboxProps.ListAreaWindowID, 0);
    } else {
        setHiddenWindowStatus(canvasid, comboboxProps.VScrollBarWindowID, 1);
        setHiddenWindowStatus(canvasid, comboboxProps.ListAreaWindowID, 1);
    }
    draw(canvasid);
}

function drawComboboxListArea(canvasid, windowid) {
    var comboboxProps = getComboboxPropsByListAreaWindowId(canvasid, windowid);
    var vscrollBarProps = getScrollBarProps(canvasid, comboboxProps.VScrollBarWindowID);
    var ctx = getCtx(canvasid);
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.rect(comboboxProps.X, comboboxProps.Y + comboboxProps.Height, comboboxProps.Width - 15, 100);
    ctx.fill();
    ctx.fillStyle = comboboxProps.ListAreaTextColor;
    ctx.font = comboboxProps.ListAreaFontString;
    for (var i = vscrollBarProps.SelectedID; i < comboboxProps.Data.length && ((comboboxProps.ListAreaTextHeight + 6) *
        (i - vscrollBarProps.SelectedID + 1)) < 100; i++) {
        ctx.fillText(comboboxProps.Data[i], comboboxProps.X + 5, comboboxProps.Y + comboboxProps.Height +
            ((comboboxProps.ListAreaTextHeight + 6) * (i - vscrollBarProps.SelectedID + 1)));
    }
    ctx.strokeStyle = '#b7bfc8';
    ctx.beginPath();
    ctx.rect(comboboxProps.X, comboboxProps.Y + comboboxProps.Height, comboboxProps.Width - 15, 100);
    ctx.stroke();
}

function comboboxListAreaClick(canvasid, windowid) {
    var comboboxProps = getComboboxPropsByListAreaWindowId(canvasid, windowid);
    var vscrollBarProps = getScrollBarProps(canvasid, comboboxProps.VScrollBarWindowID);
    var canvas = getCanvas(canvasid);
    var x = event.pageX - canvas.offsetLeft;
    var y = event.pageY - canvas.offsetTop;
    for (var i = vscrollBarProps.SelectedID; i < comboboxProps.Data.length && ((comboboxProps.ListAreaTextHeight + 6) * (i - vscrollBarProps.SelectedID + 1)) < 100; i++) {
        if (x > comboboxProps.X && y > comboboxProps.Y + comboboxProps.Height + ((comboboxProps.ListAreaTextHeight + 6) * (i - vscrollBarProps.SelectedID)) &&
            x < comboboxProps.X + comboboxProps.Width - 15 && y < comboboxProps.Y + comboboxProps.Height + ((comboboxProps.ListAreaTextHeight + 6) *
            (i - vscrollBarProps.SelectedID + 1))) {
            comboboxProps.SelectedID = i;
            setHiddenWindowStatus(canvasid, comboboxProps.VScrollBarWindowID, 1);
            setHiddenWindowStatus(canvasid, comboboxProps.ListAreaWindowID, 1);
            if (comboboxProps.OnSelectionChanged != null) {
                comboboxProps.OnSelectionChanged(canvasid, comboboxProps.TextAreaWindowID, i);
            }
            draw(canvasid);
            return;
        }
    }
}

function comboboxListAreaLostFocus(canvasid, windowid) {
    var comboboxProps = getComboboxPropsByListAreaWindowId(canvasid, windowid);
    if (doesWindowHaveFocus(canvasid, comboboxProps.VScrollBarWindowID) == 0 &&
        doesWindowHaveFocus(canvasid, comboboxProps.TextAreaWindowID) == 0 &&
        doesWindowHaveFocus(canvasid, comboboxProps.ButtonWindowID) == 0 &&
        doingEventForWindowID != comboboxProps.ListAreaWindowID &&
        doingEventForWindowID != comboboxProps.VScrollBarWindowID) {
        setHiddenWindowStatus(canvasid, comboboxProps.VScrollBarWindowID, 1);
        setHiddenWindowStatus(canvasid, comboboxProps.ListAreaWindowID, 1);
        draw(canvasid);
    }
}

function comboboxTextAreaLostFocus(canvasid, windowid) {
    var comboboxProps = getComboboxPropsByTextAreaWindowId(canvasid, windowid);
    if (doesWindowHaveFocus(canvasid, comboboxProps.VScrollBarWindowID) == 0 &&
        doesWindowHaveFocus(canvasid, comboboxProps.ListAreaWindowID) == 0 &&
        doesWindowHaveFocus(canvasid, comboboxProps.ButtonWindowID) == 0 &&
        doingEventForWindowID != comboboxProps.ListAreaWindowID &&
        doingEventForWindowID != comboboxProps.VScrollBarWindowID) {
        setHiddenWindowStatus(canvasid, comboboxProps.VScrollBarWindowID, 1);
        setHiddenWindowStatus(canvasid, comboboxProps.ListAreaWindowID, 1);
        draw(canvasid);
    }
}

function comboboxButtonLostFocus(canvasid, windowid) {
    var comboboxProps = getComboboxPropsByButtonWindowId(canvasid, windowid);
    if (doesWindowHaveFocus(canvasid, comboboxProps.VScrollBarWindowID) == 0 &&
        doesWindowHaveFocus(canvasid, comboboxProps.ListAreaWindowID) == 0 &&
        doesWindowHaveFocus(canvasid, comboboxProps.TextAreaWindowID) == 0 &&
        doingEventForWindowID != comboboxProps.ListAreaWindowID &&
        doingEventForWindowID != comboboxProps.VScrollBarWindowID) {
        setHiddenWindowStatus(canvasid, comboboxProps.VScrollBarWindowID, 1);
        setHiddenWindowStatus(canvasid, comboboxProps.ListAreaWindowID, 1);
        draw(canvasid);
    }
}

function comboboxScrollBarLostFocus(canvasid, windowid) {
    var comboboxProps = getComboboxPropsByScrollBarWindowId(canvasid, windowid);
    if (doesWindowHaveFocus(canvasid, comboboxProps.TextAreaWindowID) == 0 &&
        doesWindowHaveFocus(canvasid, comboboxProps.ListAreaWindowID) == 0 &&
        doesWindowHaveFocus(canvasid, comboboxProps.ButtonWindowID) == 0 &&
        doingEventForWindowID != comboboxProps.ListAreaWindowID &&
        doingEventForWindowID != comboboxProps.VScrollBarWindowID) {
        setHiddenWindowStatus(canvasid, comboboxProps.VScrollBarWindowID, 1);
        setHiddenWindowStatus(canvasid, comboboxProps.ListAreaWindowID, 1);
        draw(canvasid);
    }
}

//Checkbox code begins here

var checkboxPropsArray = new Array();

function getcheckboxProps(canvasid, windowid) {
    for (var i = 0; i < checkboxPropsArray.length; i++) {
        if (checkboxPropsArray[i].CanvasID == canvasid && checkboxPropsArray[i].WindowID == windowid) {
            return checkboxPropsArray[i];
        }
    }
}

function drawCheckbox(canvasid, windowid) {
    var checkboxProps = getcheckboxProps(canvasid, windowid);
    var ctx = getCtx(canvasid);
    ctx.save();
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#e3e3e3';
    ctx.strokeStyle = '#3c7fb1';
    ctx.beginPath();
    ctx.rect(checkboxProps.X, checkboxProps.Y, 15, 15);
    ctx.stroke();
    ctx.lineCap = 'round';
    if (checkboxProps.Status == 1) {
        ctx.lineWidth = 4;
        var g = ctx.createLinearGradient(checkboxProps.X, checkboxProps.Y, checkboxProps.X + 15, checkboxProps.Y + 15);
        g.addColorStop(0, '#abffaf');
        g.addColorStop(1, '#00ff0c');
        ctx.strokeStyle = g;
        ctx.beginPath();
        ctx.moveTo(checkboxProps.X + 3, checkboxProps.Y + 9);
        ctx.lineTo(checkboxProps.X + 6, checkboxProps.Y + 12);
        ctx.lineTo(checkboxProps.X + 18, checkboxProps.Y - 3);
        ctx.stroke();
    } else {
        ctx.lineWidth = 3;
        var g = ctx.createLinearGradient(checkboxProps.X, checkboxProps.Y, checkboxProps.X + 15, checkboxProps.Y + 15);
        g.addColorStop(0, '#ff2a2a');
        g.addColorStop(1, '#ff6b6b');
        ctx.strokeStyle = g;
        ctx.beginPath();
        ctx.moveTo(checkboxProps.X + 4, checkboxProps.Y + 4);
        ctx.lineTo(checkboxProps.X + 11, checkboxProps.Y + 11);
        ctx.moveTo(checkboxProps.X + 11, checkboxProps.Y + 4);
        ctx.lineTo(checkboxProps.X + 4, checkboxProps.Y + 11);
        ctx.stroke();
    }
    ctx.restore();
}

function createCheckbox(canvasid, controlNameId, x, y, depth, status) {
    var windowid = createWindow(canvasid, x, y, 15, 15, depth, null, 'CheckBox', controlNameId);
    checkboxPropsArray.push({ CanvasID: canvasid, WindowID: windowid, X: x, Y: y, Status: status });
    registerClickFunction(windowid, function () {
        var checkboxProps = getcheckboxProps(canvasid, windowid);
        if (checkboxProps.Status == 1) {
            checkboxProps.Status = 0;
        } else {
            checkboxProps.Status = 1;
        }
        draw(canvasid);
    }, canvasid);
    registerWindowDrawFunction(windowid, function () { drawCheckbox(canvasid, windowid); }, canvasid);
    return windowid;
}

//Radio button code starts here

var radiobuttonPropsArray = new Array();

function getRadioButtonProps(canvasid, windowid) {
    for (var i = 0; i < radiobuttonPropsArray.length; i++) {
        if (radiobuttonPropsArray[i].CanvasID == canvasid && radiobuttonPropsArray[i].WindowID == windowid) {
            return radiobuttonPropsArray[i];
        }
    }
}

function createRadioButtonGroup(canvasid, controlNameId, x, y, alignment, depth, groupname, labels, selectedid, labelTextColor, labelFontString, labelTextHeight, radius) {
    var canvas = document.getElementById(canvasid);
    var ctx = canvas.getContext('2d');
    ctx.font = labelFontString;
    var height = 0;
    if (2 * radius >= labelTextHeight + 8) {
        height = 2 * radius;
    } else {
        height = labelTextHeight + 8;
    }
    var width = 0;
    for (var i = 0; i < labels.length; i++) {
        var tw = ctx.measureText(labels[i]).width;
        width += tw + 8 + (2 * radius);
    }
    var windowid = createWindow(canvasid, x, y, width, height, depth, null, 'RadioButtonGroup', controlNameId);
    radiobuttonPropsArray.push({
        CanvasID: canvasid, WindowID: windowid, X: x, Y: y, Width: width, Height: height, Alignment: alignment, GroupName: groupname,
        Labels: labels, SelectedID: selectedid, LabelTextColor: labelTextColor, LabelFontString: labelFontString, Radius: radius,
        ButtonExtents: new Array(), LabelTextHeight: labelTextHeight
    });
    registerWindowDrawFunction(windowid, function (canvasid1, windowid1) {
        var radioButtonProps = getRadioButtonProps(canvasid1, windowid1);
        var ctx = getCtx(canvasid1);
        var widthOffset = 0;
        ctx.font = radioButtonProps.LabelFontString;
        var buttonExtents = new Array();
        for (var i = 0; i < radioButtonProps.Labels.length; i++) {
            ctx.fillStyle = radioButtonProps.LabelTextColor;
            ctx.fillText(radioButtonProps.Labels[i], radioButtonProps.X + widthOffset, radioButtonProps.Y + radioButtonProps.Height -
                ((radioButtonProps.Height - radioButtonProps.LabelTextHeight) / 2));
            var tw = ctx.measureText(radioButtonProps.Labels[i]).width;
            ctx.fillStyle = '#fcfcfc';
            ctx.beginPath();
            ctx.arc(radioButtonProps.X + widthOffset + tw + 4 + radioButtonProps.Radius, radioButtonProps.Y + radioButtonProps.Radius +
                ((radioButtonProps.Height - (radioButtonProps.Radius * 2)) / 2), radioButtonProps.Radius, 0, Math.PI * 2, false);
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#c4c4c4';
            ctx.beginPath();
            ctx.arc(radioButtonProps.X + widthOffset + tw + 4 + radioButtonProps.Radius, radioButtonProps.Y + radioButtonProps.Radius +
                ((radioButtonProps.Height - (radioButtonProps.Radius * 2)) / 2), radioButtonProps.Radius - 1, (Math.PI / 180) * 315, (Math.PI / 180) * 135, false);
            ctx.stroke();
            ctx.strokeStyle = '#141414';
            ctx.beginPath();
            ctx.arc(radioButtonProps.X + widthOffset + tw + 4 + radioButtonProps.Radius, radioButtonProps.Y + radioButtonProps.Radius +
                ((radioButtonProps.Height - (radioButtonProps.Radius * 2)) / 2), radioButtonProps.Radius - 1, (Math.PI / 180) * 135, (Math.PI / 180) * 315, false);
            ctx.stroke();
            ctx.strokeStyle = '#808080';
            ctx.beginPath();
            ctx.arc(radioButtonProps.X + widthOffset + tw + 4 + radioButtonProps.Radius, radioButtonProps.Y + radioButtonProps.Radius +
                ((radioButtonProps.Height - (radioButtonProps.Radius * 2)) / 2), radioButtonProps.Radius - 1, (Math.PI / 180) * 135, (Math.PI / 180) * 315, false);
            ctx.stroke();
            if (i == radioButtonProps.SelectedID) {
                ctx.fillStyle = '#51852f';
                ctx.beginPath();
                ctx.arc(radioButtonProps.X + widthOffset + tw + 4 + radioButtonProps.Radius, radioButtonProps.Y + radioButtonProps.Radius +
                ((radioButtonProps.Height - (radioButtonProps.Radius * 2)) / 2), radioButtonProps.Radius - 4, 0, Math.PI * 2, false);
                ctx.fill();
            }
            buttonExtents.push({ X: radioButtonProps.X + widthOffset + tw + 4, Y: radioButtonProps.Y, Width: radioButtonProps.Radius * 2, Height: radioButtonProps.Height });
            widthOffset += tw + 8 + (2 * radioButtonProps.Radius);
        }
        radioButtonProps.ButtonExtents = buttonExtents;
    }, canvasid);
    registerClickFunction(windowid, function (canvasid2, windowid2) {
        var radioButtonProps = getRadioButtonProps(canvasid2, windowid2);
        var canvas = getCanvas(canvasid2);
        var clickx = event.pageX - canvas.offsetLeft;
        var clicky = event.pageY - canvas.offsetTop;
        for (var i = 0; i < radioButtonProps.ButtonExtents.length; i++) {
            if (clickx > radioButtonProps.ButtonExtents[i].X && clickx < radioButtonProps.ButtonExtents[i].X + radioButtonProps.ButtonExtents[i].Width &&
                clicky > radioButtonProps.ButtonExtents[i].Y && clicky < radioButtonProps.ButtonExtents[i].Y + radioButtonProps.ButtonExtents[i].Height) {
                radioButtonProps.SelectedID = i;
                break;
            }
        }
    }, canvasid);
    return windowid;
}

//Image Control Code Starts Here

var imageControlPropsArray = new Array();

function getImageControlProps(canvasid, windowid) {
    for (var i = 0; i < imageControlPropsArray.length; i++) {
        if (imageControlPropsArray[i].CanvasID == canvasid && imageControlPropsArray[i].WindowID == windowid) {
            return imageControlPropsArray[i];
        }
    }
}

function createImage(canvasid, controlNameId, x, y, width, height, depth, imgurl, clickFunction,
    isHyperlink, url, nobrowserhistory, isnewbrowserwindow,
    nameofnewbrowserwindow, widthofnewbrowserwindow, heightofnewbrowserwindow, newbrowserwindowisresizable, newbrowserwindowhasscrollbars,
    newbrowserwindowhastoolbar, newbrowserwindowhaslocationorurloraddressbox, newbroserwindowhasdirectoriesorextrabuttons,
    newbrowserwindowhasstatusbar, newbrowserwindowhasmenubar, newbrowserwindowcopyhistory) {
    var windowid = createWindow(canvasid, x, y, width, height, depth, null, 'Image', controlNameId);
    var image = new Image(width, height);
    image.src = imgurl;
    image.onload = function () {
        //var ctx = getCtx(canvasid);
        //ctx.drawImage(image, x, y, width, height);
        draw(canvasid);
    };
    imageControlPropsArray.push({
        CanvasID: canvasid, WindowID: windowid, X: x, Y: y, Width: width,
        Height: height, ImageURL: imgurl, ClickFunction: clickFunction, Image: image, AlreadyDrawnImage: 0, IsHyperlink: isHyperlink, URL: url,
        NoBrowserHistory: nobrowserhistory, IsNewBrowserWindow: isnewbrowserwindow,
        NameOfNewBrowserWindow: nameofnewbrowserwindow, WidthOfNewBrowserWindow: widthofnewbrowserwindow,
        HeightOfNewBrowserWindow: heightofnewbrowserwindow, NewBrowserWindowIsResizable: newbrowserwindowisresizable,
        NewBrowserWindowHasScrollBars: newbrowserwindowhasscrollbars, NewBrowserWindowHasToolbar: newbrowserwindowhastoolbar,
        NewBrowserWindowHasLocationOrURLOrAddressBox: newbrowserwindowhaslocationorurloraddressbox,
        NewBrowserWindowHasDirectoriesOrExtraButtons: newbroserwindowhasdirectoriesorextrabuttons,
        NewBrowserWindowHasStatusBar: newbrowserwindowhasstatusbar, NewBrowserWindowHasMenuBar: newbrowserwindowhasmenubar,
        NewBrowserWindowCopyHistory: newbrowserwindowcopyhistory
    });
    registerWindowDrawFunction(windowid, function (canvasid, windowid) {
        var ctx = getCtx(canvasid);
        var imageProps = getImageControlProps(canvasid, windowid);
        if (imageProps.Image) {
            ctx.drawImage(imageProps.Image, 0, 0, imageProps.Width, imageProps.Height, imageProps.X, imageProps.Y, imageProps.Width, imageProps.Height);
        }
    }, canvasid);
    if (clickFunction != null) {
        registerClickFunction(windowid, function () { clickFunction(canvasid, windowid); }, canvasid);
    } else if (isHyperlink == 1) {
        registerClickFunction(windowid, function () {
            if (isnewbrowserwindow == 1) {
                var str = '';
                var wroteone = 0;
                if (widthofnewbrowserwindow != null) {
                    str += 'width=' + widthofnewbrowserwindow;
                    wroteone = 1;
                }
                if (heightofnewbrowserwindow != null) {
                    str += (wroteone == 1 ? ',' : '') + 'height=' + heightofnewbrowserwindow;
                }
                if (newbrowserwindowisresizable != null) {
                    str += (wroteone == 1 ? ',' : '') + 'resizable=' + newbrowserwindowisresizable;
                }
                if (newbrowserwindowhasscrollbars != null) {
                    str += (wroteone == 1 ? ',' : '') + 'scrollbars=' + newbrowserwindowhasscrollbars;
                }
                if (newbrowserwindowhastoolbar != null) {
                    str += (wroteone == 1 ? ',' : '') + 'toolbar=' + newbrowserwindowhastoolbar;
                }
                if (newbrowserwindowhaslocationorurloraddressbox != null) {
                    str += (wroteone == 1 ? ',' : '') + 'location=' + newbrowserwindowhaslocationorurloraddressbox;
                }
                if (newbroserwindowhasdirectoriesorextrabuttons != null) {
                    str += (wroteone == 1 ? ',' : '') + 'directories=' + newbroserwindowhasdirectoriesorextrabuttons;
                }
                if (newbrowserwindowhasstatusbar != null) {
                    str += (wroteone == 1 ? ',' : '') + 'status=' + newbrowserwindowhasstatusbar;
                }
                if (newbrowserwindowhasmenubar != null) {
                    str += (wroteone == 1 ? ',' : '') + 'menubar=' + newbrowserwindowhasmenubar;
                }
                if (newbrowserwindowcopyhistory != null) {
                    str += (wroteone == 1 ? ',' : '') + 'copyhistory=' + newbrowserwindowcopyhistory;
                }
                window.open(url, nameofnewbrowserwindow, str);
            } else {
                if (nobrowserhistory == 1) {
                    window.location.replace(url);
                } else {
                    window.location.href = url;
                }
            }
        }, canvasid);
    }
    return windowid;
}

//TreeView code starts here

var treeViewPropsArray = new Array();

function getTreeViewProps(canvasid, windowid) {
    for (var i = 0; i < treeViewPropsArray.length; i++) {
        if (treeViewPropsArray[i].CanvasID == canvasid && treeViewPropsArray[i].WindowID == windowid) {
            return treeViewPropsArray[i];
        }
    }
}

function createTreeView(canvasid, controlNameId, x, y, width, height, depth, data, idcolindex, parentidcolindex, expandedcolindex,
    labelcolindex, textcolor, textfontstring, textheight, clickNodeFunction) {
    var windowid = createWindow(canvasid, x, y, width, height, depth, null, 'TreeView', controlNameId);
    var shownitemscount = 0;
    for (var i = 0; i < data.length; i++) {
        if (data[i][expandedcolindex] == 1) {
            shownitemscount++;
        }
    }
    var vscrollbarwindowid = createScrollBar(canvasid, controlNameId + 'VS', x + width, y, height, depth, shownitemscount, 1, null);
    var hscrollbarwindowid = createScrollBar(canvasid, controlNameId + 'HS', x, y + height, width, depth, 10, 0, null);
    var clickButtonExtents = new Array();
    var clickLabelExtents = new Array();
    treeViewPropsArray.push({
        CanvasID: canvasid, WindowID: windowid, X: x, Y: y, Width: width, Height: height,
        Data: data, IDColumnIndex: idcolindex, ParentIDColIndex: parentidcolindex, ExpandedColIndex: expandedcolindex,
        LabelColIndex: labelcolindex, VScrollBarWindowID: vscrollbarwindowid, HScrollBarWindowID: hscrollbarwindowid, 
        TextColor: textcolor, TextFontString: textfontstring, TextHeight: textheight, ClickButtonExtents: clickButtonExtents,
        ClickLabelExtents: clickLabelExtents, ClickNodeFunction: clickNodeFunction, SelectedNodeIndex: 0
    });
    registerWindowDrawFunction(windowid, drawTreeView, canvasid);
    registerClickFunction(windowid, clickTreeView, canvasid);
    return windowid;
}

function toggleAllChildNodesExpandedState(treeViewProps, p) {
    for (var i = 0; i < treeViewProps.Data.length; i++) {
        if (treeViewProps.Data[i][treeViewProps.ParentIDColIndex] == p) {
            if (treeViewProps.Data[i][treeViewProps.ExpandedColIndex] == 0) {
                treeViewProps.Data[i][treeViewProps.ExpandedColIndex] = 1;
            } else {
                treeViewProps.Data[i][treeViewProps.ExpandedColIndex] = 0;
            }
        }
    }
}

function clickTreeView(canvasid, windowid) {
    var treeViewProps = getTreeViewProps(canvasid, windowid);
    var canvas = getCanvas(canvasid);
    var x = event.pageX - canvas.offsetLeft;
    var y = event.pageY - canvas.offsetTop;
    for (var i = 0; i < treeViewProps.ClickButtonExtents.length; i++) {
        if (x > treeViewProps.ClickButtonExtents[i].X && x < treeViewProps.ClickButtonExtents[i].X + 9 &&
            y > treeViewProps.ClickButtonExtents[i].Y && y < treeViewProps.ClickButtonExtents[i].Y + 9) {
            toggleAllChildNodesExpandedState(treeViewProps, treeViewProps.Data[treeViewProps.ClickButtonExtents[i].Index][treeViewProps.IDColumnIndex]);
            draw(canvasid);
            return;
        }
    }
    for (var i = 0; i < treeViewProps.ClickLabelExtents.length; i++) {
        if (x > treeViewProps.ClickLabelExtents[i].X && x < treeViewProps.ClickLabelExtents[i].X + treeViewProps.ClickLabelExtents[i].Width &&
            y > treeViewProps.ClickLabelExtents[i].Y && y < treeViewProps.ClickLabelExtents[i].Y + treeViewProps.ClickLabelExtents[i].TextHeight) {
            treeViewProps.ClickNodeFunction(canvasid, windowid, treeViewProps.Data[treeViewProps.ClickLabelExtents[i].Index][treeViewProps.IDColumnIndex]);
            treeViewProps.SelectedNodeIndex = i;
            draw(canvasid);
            return;
        }
    }
}

function checkIfParentsAreExpanded(treeViewProps, i) {
    if (treeViewProps.Data[i][treeViewProps.ParentIDColIndex] == 0) {
        return 1;
    }
    var currIndex = i;
    while (treeViewProps.Data[checkIfStringAndConvertToInt(currIndex)][checkIfStringAndConvertToInt(treeViewProps.ParentIDColIndex)] != 0) {
        if (treeViewProps.Data[checkIfStringAndConvertToInt(currIndex)][checkIfStringAndConvertToInt(treeViewProps.ExpandedColIndex)] == 0)
            return 0;
        currIndex = treeViewProps.Data[checkIfStringAndConvertToInt(currIndex)][checkIfStringAndConvertToInt(treeViewProps.ParentIDColIndex)] - 1;
    }
    return 1;
}

function checkIfStringAndConvertToInt(o) {
    if (typeof o == 'string') {
        return parseInt(o);
    }
    return o;
}

function drawTreeView(canvasid, windowid) {
    var treeViewProps = getTreeViewProps(canvasid, windowid);
    var ctx = getCtx(canvasid);
    ctx.save();
    ctx.strokeStyle = '#C0C0C0';
    ctx.beginPath();
    ctx.rect(treeViewProps.X, treeViewProps.Y, treeViewProps.Width, treeViewProps.Height);
    ctx.stroke();
    ctx.beginPath();
    ctx.rect(treeViewProps.X, treeViewProps.Y, treeViewProps.Width, treeViewProps.Height);
    ctx.clip();
    ctx.fillStyle = treeViewProps.TextColor;
    ctx.font = treeViewProps.TextFontString;
    var vscrollbarProps = getScrollBarProps(canvasid, treeViewProps.VScrollBarWindowID);
    var heightoffset = 0;
    treeViewProps.ClickButtonExtents = new Array();
    treeViewProps.ClickLabelExtents = new Array();
    for (var i = vscrollbarProps.SelectedID; i < treeViewProps.Data.length && heightoffset < treeViewProps.Height; i++) {
        if (checkIfParentsAreExpanded(treeViewProps, i) == 1) {
            var o = hasChildNodes(treeViewProps, i);
            var level = findNodeLevel(treeViewProps, i);
            drawTreeViewNode(ctx, 4 + treeViewProps.X + (level * 8), 4 + treeViewProps.Y + heightoffset, treeViewProps.Data[i][treeViewProps.ExpandedColIndex],
                treeViewProps.Data[i][treeViewProps.LabelColIndex], treeViewProps.TextColor, treeViewProps.TextFontString, treeViewProps.TextHeight,
                level, o, (o == 0 ? 0 : numberOfChildNodes(treeViewProps, i)), treeViewProps, i);
            heightoffset += (treeViewProps.TextHeight > 9 ? treeViewProps.TextHeight : 9) + 8;
        }
    }
    ctx.restore();
}

function findNodeLevel(treeviewProps, i) {
    var currIndex = i;
    var level = 0;
    while (treeviewProps.Data[currIndex][treeviewProps.ParentIDColIndex] != 0) {
        currIndex = treeviewProps.Data[currIndex][treeviewProps.ParentIDColIndex] - 1;
        level++;
    }
    return level;
}

function hasChildNodes(treeViewProps, j) {
    for (var i = 0; i < treeViewProps.Data.length; i++) {
        if (treeViewProps.Data[i][treeViewProps.ParentIDColIndex] == treeViewProps.Data[j][treeViewProps.IDColumnIndex])
            return 1;
    }
    return 0;
}

function numberOfChildNodes(treeViewProps, j) {
    var o = 0;
    var lastchildcount = 0;
    for (var i = 0; i < treeViewProps.Data.length; i++) {
        if (treeViewProps.Data[i][treeViewProps.ParentIDColIndex] == treeViewProps.Data[j][treeViewProps.IDColumnIndex]) {
            o++;
            lastchildcount = 0;
            if (hasChildNodes(treeViewProps, i)) {
                o += lastchildcount = numberOfChildNodes(treeViewProps, i);
            }
        }
    }
    return o - lastchildcount;
}

function howManyChildNodesOnly(treeViewProps, j) {
    var o = 0;
    for (var i = 0; i < treeViewProps.Data.length; i++) {
        if (treeViewProps.Data[i][treeViewProps.ParentIDColIndex] == treeViewProps.Data[j][treeViewProps.IDColumnIndex]) {
            o++;
        }
    }
    return o;
}

function checkHowManyChildNodesAreExpanded(treeviewProps, p) {
    var f = treeviewProps.Data[p][treeviewProps.IDColumnIndex];
    var count = 0;
    var lastchildcount = 0;
    var cnodes = howManyChildNodesOnly(treeviewProps, p);
    for (var i = 0; i < treeviewProps.Data.length; i++) {
        lastchildcount = 0;
        if (treeviewProps.Data[i][treeviewProps.ParentIDColIndex] == f && treeviewProps.Data[i][treeviewProps.ExpandedColIndex] == 1) {
            count++;
            if (count < cnodes && hasChildNodes(treeviewProps, i)) {
                count += lastchildcount = checkHowManyChildNodesAreExpanded(treeviewProps, i);
            }
        }
    }
    return count - lastchildcount;
}

function drawTreeViewNode(ctx, x, y, state, text, textcolor, textfontstring, textheight, level, hasChildNodes, numOfChildNodes, treeviewProps, i) {
    x += level * 8;
    if (hasChildNodes == 1) {
        ctx.strokeStyle = '#3c7fb1';
        ctx.beginPath();
        ctx.rect(x, y, 9, 9);
        treeviewProps.ClickButtonExtents.push({X: x, Y: y, Index: i});
        ctx.stroke();
        ctx.fillStyle = '#dcf0fb';
        ctx.beginPath();
        ctx.rect(x + 1, y + 1, 7, 5);
        ctx.fill();
        ctx.fillStyle = '#a7d8f3';
        ctx.beginPath();
        ctx.rect(x + 1, y + 6, 7, 4);
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.beginPath();
        ctx.moveTo(x + 2, y + 5);
        ctx.lineTo(x + 7, y + 5);
        ctx.stroke();
        numOfChildNodes = checkHowManyChildNodesAreExpanded(treeviewProps, i);
        if (numOfChildNodes == 0) {
            ctx.strokeStyle = '#000000';
            ctx.beginPath();
            ctx.moveTo(x + 5, y + 2);
            ctx.lineTo(x + 5, y + 7);
            ctx.stroke();
        } else {
            if (numOfChildNodes > 0) {
                ctx.strokeStyle = '#C0C0C0';
                ctx.beginPath();
                ctx.moveTo(x + 5, y + 9);
                ctx.lineTo(x + 5, y + 9 + (numOfChildNodes * ((textheight > 9 ? textheight : 9) + 8)) - 4);
                ctx.stroke();
            }
        }
        if (level > 0) {
            ctx.strokeStyle = '#C0C0C0';
            ctx.beginPath();
            ctx.moveTo(x - 11, y + 5);
            ctx.lineTo(x, y + 5);
            ctx.stroke();
        }
    } else if (level > 0) {
        ctx.strokeStyle = '#C0C0C0';
        ctx.beginPath();
        ctx.moveTo(x - 11, y + 9 + (numOfChildNodes * ((textheight > 9 ? textheight : 9) + 8)) - 4);
        ctx.lineTo(x + 8, y + 9 + (numOfChildNodes * ((textheight > 9 ? textheight : 9) + 8)) - 4);
        ctx.stroke();
    }
    ctx.fillStyle = textcolor;
    ctx.font = textfontstring;
    ctx.fillText(text, x + 13, y + textheight);
    treeviewProps.ClickLabelExtents.push({ X: x + 13, Y: y, Width: ctx.measureText(text).width, TextHeight: textheight, Index: i });
}

//Calender Control Code Starts Here
var calenderPropsArray = new Array();

function getCalenderProps(canvasid, windowid) {
    for (var i = 0; i < calenderPropsArray.length; i++) {
        if (calenderPropsArray[i].CanvasID == canvasid && calenderPropsArray[i].WindowID == windowid) {
            return calenderPropsArray[i];
        }
    }
}

function drawCalender(canvasid, windowid) {
    var calenderProps = getCalenderProps(canvasid, windowid);
    var ctx = getCtx(canvasid);
    var visibleMonth = new Date('1 ' + calenderProps.VisibleMonth + ' ' + calenderProps.VisibleYear);
    var selectedDay = (calenderProps.SelectedDay != null ? new Date(calenderProps.SelectedDay) : null);
    var todaysDate = new Date();
    ctx.fillStyle = calenderProps.HeaderBackgroundColor;
    ctx.beginPath();
    ctx.rect(calenderProps.X, calenderProps.Y, calenderProps.Width, calenderProps.HeaderHeight);
    ctx.fill();
    ctx.fillStyle = calenderProps.BodyBackgroundColor;
    ctx.beginPath();
    ctx.rect(calenderProps.X, calenderProps.Y + calenderProps.HeaderHeight, calenderProps.Width, calenderProps.Height - calenderProps.HeaderHeight);
    ctx.fill();
    var buttonClickExtents = new Array();
    ctx.fillStyle = '#C0C0C0';
    ctx.font = calenderProps.TextHeaderFontString;
    var maxmonthwidth = ctx.measureText('September').width;
    var maxyearwidth = ctx.measureText('0000').width;
    var headeroffsetx = calenderProps.X + ((calenderProps.Width - (68 + maxmonthwidth + maxyearwidth)) / 2);
    ctx.beginPath();
    ctx.moveTo(headeroffsetx + 4, calenderProps.Y + ((calenderProps.HeaderHeight - 11) / 2) + 6);
    ctx.lineTo(headeroffsetx + 15, calenderProps.Y + ((calenderProps.HeaderHeight - 11) / 2));
    ctx.lineTo(headeroffsetx + 15, calenderProps.Y + ((calenderProps.HeaderHeight - 11) / 2) + 11);
    ctx.closePath();
    ctx.fill();
    buttonClickExtents.push({ X: headeroffsetx + 4, Y: calenderProps.Y + ((calenderProps.HeaderHeight - 11) / 2), Width: 11, Height: 11 });
    ctx.beginPath();
    ctx.moveTo(headeroffsetx + 23 + maxmonthwidth, calenderProps.Y + ((calenderProps.HeaderHeight - 11) / 2));
    ctx.lineTo(headeroffsetx + 23 + maxmonthwidth, calenderProps.Y + ((calenderProps.HeaderHeight - 11) / 2) + 11);
    ctx.lineTo(headeroffsetx + 34 + maxmonthwidth, calenderProps.Y + ((calenderProps.HeaderHeight - 11) / 2) + 6);
    ctx.closePath();
    ctx.fill();
    buttonClickExtents.push({ X: headeroffsetx + 23 + maxmonthwidth, Y: calenderProps.Y + ((calenderProps.HeaderHeight - 11) / 2), Width: 11, Height: 11 });
    ctx.beginPath();
    ctx.moveTo(headeroffsetx + 38 + maxmonthwidth, calenderProps.Y + ((calenderProps.HeaderHeight - 11) / 2) + 6);
    ctx.lineTo(headeroffsetx + 49 + maxmonthwidth, calenderProps.Y + ((calenderProps.HeaderHeight - 11) / 2));
    ctx.lineTo(headeroffsetx + 49 + maxmonthwidth, calenderProps.Y + ((calenderProps.HeaderHeight - 11) / 2) + 11);
    ctx.closePath();
    ctx.fill();
    buttonClickExtents.push({ X: headeroffsetx + 38 + maxmonthwidth, Y: calenderProps.Y + ((calenderProps.HeaderHeight - 11) / 2), Width: 11, Height: 11 });
    ctx.beginPath();
    ctx.moveTo(headeroffsetx + 57 + maxmonthwidth + maxyearwidth, calenderProps.Y + ((calenderProps.HeaderHeight - 11) / 2));
    ctx.lineTo(headeroffsetx + 57 + maxmonthwidth + maxyearwidth, calenderProps.Y + ((calenderProps.HeaderHeight - 11) / 2) + 11);
    ctx.lineTo(headeroffsetx + 68 + maxmonthwidth + maxyearwidth, calenderProps.Y + ((calenderProps.HeaderHeight - 11) / 2) + 6);
    ctx.closePath();
    ctx.fill();
    buttonClickExtents.push({ X: headeroffsetx + 57 + maxmonthwidth + maxyearwidth, Y: calenderProps.Y + ((calenderProps.HeaderHeight - 11) / 2), Width: 11, Height: 11 });
    calenderProps.ButtonClickExtents = buttonClickExtents;
    ctx.fillStyle = calenderProps.TextHeaderColor;
    ctx.fillText(calenderProps.VisibleMonth, headeroffsetx + 19 + ((maxmonthwidth - ctx.measureText(calenderProps.VisibleMonth).width) / 2),
        calenderProps.Y + ((calenderProps.HeaderHeight - calenderProps.TextHeaderHeight) / 2) + calenderProps.TextHeaderHeight);
    ctx.fillText(calenderProps.VisibleYear, headeroffsetx + 53 + maxmonthwidth, calenderProps.Y + ((calenderProps.HeaderHeight -
        calenderProps.TextHeaderHeight) / 2) + calenderProps.TextHeaderHeight);
    var daynum = visibleMonth.getDay();
    var currday = (visibleMonth.getDay() > 0 ? new Date(visibleMonth.getTime() - (visibleMonth.getDay() * 24 * 60 * 60 * 1000)) : visibleMonth);
    var dateClickExtents = new Array();
    for (var i = 0; i < 7; i++) {
        var daylabel;
        switch (i) {
            case 0:
                daylabel = 'Sun';
                break;
            case 1:
                daylabel = 'Mon';
                break;
            case 2:
                daylabel = 'Tue';
                break;
            case 3:
                daylabel = 'Wed';
                break;
            case 4:
                daylabel = 'Thu';
                break;
            case 5:
                daylabel = 'Fri';
                break;
            case 6:
                daylabel = 'Sat';
                break;
        }
        ctx.fillStyle = calenderProps.DayLabelTextColor;
        ctx.font = calenderProps.DayLabelTextFontString;
        ctx.fillText(daylabel, calenderProps.X + 4 + ((i % 7) * calenderProps.DayCellWidth) +
            ((calenderProps.DayCellWidth - ctx.measureText(daylabel).width) / 2),
            calenderProps.Y + calenderProps.HeaderHeight + 4 + calenderProps.DayCellHeight - ((calenderProps.DayCellHeight -
            calenderProps.DayLabelTextHeight) / 2));
    }
    for (var i = 0; i < 42; i++, currday = new Date(currday.getTime() + (24 * 60 * 60 * 1000))) {
        dateClickExtents.push({
            X: calenderProps.X + 4 + ((i % 7) * calenderProps.DayCellWidth),
            Y: calenderProps.Y + calenderProps.HeaderHeight + 4 + ((Math.floor(i / 7.0) + 1) * calenderProps.DayCellHeight),
            Date: currday
        });
        var mousehover = 0;
        if (calenderProps.MouseHoverDate != null && currday.getMonth() == calenderProps.MouseHoverDate.getMonth() &&
            currday.getDate() == calenderProps.MouseHoverDate.getDate() && currday.getFullYear() == calenderProps.MouseHoverDate.getFullYear()) {
            mousehover = 1;
            ctx.fillStyle = calenderProps.MouseOverHightLightColor;
            ctx.beginPath();
            ctx.rect(calenderProps.X + 4 + ((i % 7) * calenderProps.DayCellWidth), calenderProps.Y + calenderProps.HeaderHeight + 4 +
                ((Math.floor(i / 7.0) + 1) * calenderProps.DayCellHeight), calenderProps.DayCellWidth, calenderProps.DayCellHeight);
            ctx.fill();
        }
        if (currday.getMonth() != visibleMonth.getMonth()) {
            ctx.fillStyle = calenderProps.DayDateInactiveTextColor;
            ctx.font = calenderProps.DayDateInactiveTextFontString;
            ctx.fillText(currday.getDate().toString(), calenderProps.X + 4 + ((i % 7) * calenderProps.DayCellWidth) +
                ((calenderProps.DayCellWidth - ctx.measureText(currday.getDate().toString()).width) / 2),
                calenderProps.Y + calenderProps.HeaderHeight + 4 + ((Math.floor(i / 7.0) + 2) * calenderProps.DayCellHeight) - ((calenderProps.DayCellHeight -
                    calenderProps.TodayTextHeight) / 2));
        } else {
            if (calenderProps.SelectedDay != null && currday.getMonth() == calenderProps.SelectedDay.getMonth() &&
                currday.getDate() == calenderProps.SelectedDay.getDate() && currday.getFullYear() == calenderProps.SelectedDay.getFullYear()) {
                ctx.fillStyle = calenderProps.SelectedDayHighLightColor;
                ctx.beginPath();
                ctx.rect(calenderProps.X + 4 + ((i % 7) * calenderProps.DayCellWidth), calenderProps.Y + calenderProps.HeaderHeight + 4 +
                    ((Math.floor(i / 7.0) + 1) * calenderProps.DayCellHeight), calenderProps.DayCellWidth, calenderProps.DayCellHeight);
                ctx.fill();
                ctx.fillStyle = calenderProps.SelectedDayTextColor;
                ctx.font = calenderProps.SelectedDayTextFontString;
                ctx.fillText(currday.getDate().toString(), calenderProps.X + 4 + ((i % 7) * calenderProps.DayCellWidth) +
                    ((calenderProps.DayCellWidth - ctx.measureText(currday.getDate().toString()).width) / 2),
                    calenderProps.Y + calenderProps.HeaderHeight + 4 + ((Math.floor(i / 7.0) + 2) * calenderProps.DayCellHeight) - ((calenderProps.DayCellHeight -
                    calenderProps.SelectedDayTextHeight) / 2));
            } else if (currday.getMonth() == todaysDate.getMonth() && currday.getDate() == todaysDate.getDate() && currday.getFullYear() == todaysDate.getFullYear()) {
                if (mousehover == 0) {
                    ctx.fillStyle = calenderProps.TodayHighLightColor;
                    ctx.beginPath();
                    ctx.rect(calenderProps.X + 4 + ((i % 7) * calenderProps.DayCellWidth), calenderProps.Y + calenderProps.HeaderHeight + 4 +
                        ((Math.floor(i / 7.0) + 1) * calenderProps.DayCellHeight), calenderProps.DayCellWidth, calenderProps.DayCellHeight);
                    ctx.fill();
                }
                ctx.fillStyle = calenderProps.TodayTextColor;
                ctx.font = calenderProps.TodayTextFontString;
                ctx.fillText(currday.getDate().toString(), calenderProps.X + 4 + ((i % 7) * calenderProps.DayCellWidth) +
                    ((calenderProps.DayCellWidth - ctx.measureText(currday.getDate().toString()).width) / 2),
                    calenderProps.Y + calenderProps.HeaderHeight + 4 + ((Math.floor(i / 7.0) + 2) * calenderProps.DayCellHeight) - ((calenderProps.DayCellHeight -
                    calenderProps.TodayTextHeight) / 2));
            } else {
                ctx.fillStyle = calenderProps.DayDateActiveColor;
                ctx.font = calenderProps.DayDateActiveTextFontString;
                ctx.fillText(currday.getDate().toString(), calenderProps.X + 4 + ((i % 7) * calenderProps.DayCellWidth) +
                    ((calenderProps.DayCellWidth - ctx.measureText(currday.getDate().toString()).width) / 2),
                    calenderProps.Y + calenderProps.HeaderHeight + 4 + ((Math.floor(i / 7.0) + 2) * calenderProps.DayCellHeight) - ((calenderProps.DayCellHeight -
                    calenderProps.DayDateActiveTextHeight) / 2));
            }
        }
    }
    calenderProps.DateClickExtents = dateClickExtents;
}

function createCalendar(canvasid, controlNameId, x, y, width, height, depth, visibleMonth, visibileYear, selectedDay, dayCellWidth, dayCellHeight, headerHeight,
    headerBackgroundColor, bodyBackgroundColor, textHeaderColor, textHeaderHeight, textHeaderFontString,
    dayDateActiveColor, dayDateActiveTextHeight, dayDateActiveTextFontString,
    dayDateInactiveTextColor, dayDateInactiveTextHeight, dayDateInactiveTextFontString, selectedDayTextColor, selectedDayTextHeight,
    selectedDayTextFontString, selectedDayHighLightColor, todayTextColor, todayTextHeight, todayTextFontString, todayHighLightColor,
    mouseoverHightlightColor, ondayClickFunction, dayLabelTextColor, dayLabelTextHeight, dayLabelTextFontString) {
    var windowid = createWindow(canvasid, x, y, width, height, depth, null, 'Calender', controlNameId);
    calenderPropsArray.push({
        CanvasID: canvasid, WindowID: windowid, X: x, Y: y, Width: width, Height: height, VisibleMonth: visibleMonth, VisibleYear: visibileYear,
        SelectedDay: new Date(selectedDay), DayCellWidth: dayCellWidth, DayCellHeight: dayCellHeight, HeaderHeight: headerHeight,
        TextHeaderColor: textHeaderColor, TextHeaderHeight: textHeaderHeight, TextHeaderFontString: textHeaderFontString,
        DayDateActiveColor: dayDateActiveColor, DayDateActiveTextHeight: dayDateActiveTextHeight,
        DayDateActiveTextFontString: dayDateActiveTextFontString, DayDateInactiveTextColor: dayDateInactiveTextColor,
        DayDateInactiveTextHeight: dayDateInactiveTextHeight, DayDateInactiveTextFontString: dayDateInactiveTextFontString,
        SelectedDayTextColor: selectedDayTextColor, SelectedDayTextHeight: selectedDayTextHeight,
        SelectedDayTextFontString: selectedDayTextFontString, SelectedDayHighLightColor: selectedDayHighLightColor,
        TodayTextColor: todayTextColor, TodayTextHeight: todayTextHeight, TodayTextFontString: todayTextFontString,
        TodayHighLightColor: todayHighLightColor, OnDayClickFunction: ondayClickFunction,
        HeaderBackgroundColor: headerBackgroundColor, BodyBackgroundColor: bodyBackgroundColor,
        MouseOverHightLightColor: mouseoverHightlightColor, MouseHoverDate: null, ButtonClickExtents: null, DateClickExtents: null,
        DayLabelTextColor: dayLabelTextColor, DayLabelTextHeight: dayLabelTextHeight,
        DayLabelTextFontString: dayLabelTextFontString
    });
    registerWindowDrawFunction(windowid, drawCalender, canvasid);
    registerClickFunction(windowid, calenderClick, canvasid);
    registerMouseOverFunction(windowid, calenderMouseOver, canvasid);
    return windowid;
}

function getMonthName(x) {
    switch (x) {
        case 0:
            return 'January';
        case 1:
            return 'Febuary';
        case 2:
            return 'March';
        case 3:
            return 'April';
        case 4:
            return 'May';
        case 5:
            return 'June';
        case 6:
            return 'July';
        case 7:
            return 'August';
        case 8:
            return 'September';
        case 9:
            return 'October';
        case 10:
            return 'November';
        case 11:
            return 'December';
    }
}

function calenderClick(canvasid, windowid) {
    var calenderProps = getCalenderProps(canvasid, windowid);
    var canvas = getCanvas(canvasid);
    var x = event.pageX - canvas.offsetLeft;
    var y = event.pageY - canvas.offsetTop;
    var visibleMonth = new Date('1 ' + calenderProps.VisibleMonth + ' ' + calenderProps.VisibleYear);
    for (var i = 0; i < calenderProps.ButtonClickExtents.length; i++) {
        if (x > calenderProps.ButtonClickExtents[i].X && x < calenderProps.ButtonClickExtents[i].X + calenderProps.ButtonClickExtents[i].Width &&
            y > calenderProps.ButtonClickExtents[i].Y && y < calenderProps.ButtonClickExtents[i].Y + calenderProps.ButtonClickExtents[i].Height) {
            switch (i) {
                case 0:
                    if (visibleMonth.getMonth() == 0) {
                        calenderProps.VisibleMonth = 'December';
                        calenderProps.VisibleYear = (parseInt(calenderProps.VisibleYear, 10) - 1).toString();
                    } else {
                        calenderProps.VisibleMonth = getMonthName(visibleMonth.getMonth() - 1);
                    }
                    draw(canvasid);
                    return;
                case 1:
                    if (visibleMonth.getMonth() == 11) {
                        calenderProps.VisibleMonth = 'January';
                        calenderProps.VisibleYear = (parseInt(calenderProps.VisibleYear, 10) + 1).toString();
                    } else {
                        calenderProps.VisibleMonth = getMonthName(visibleMonth.getMonth() + 1);
                    }
                    draw(canvasid);
                    return;
                case 2:
                    calenderProps.VisibleYear = (parseInt(calenderProps.VisibleYear, 10) - 1).toString();
                    draw(canvasid);
                    return;
                case 3:
                    calenderProps.VisibleYear = (parseInt(calenderProps.VisibleYear, 10) + 1).toString();
                    draw(canvasid);
                    return;
            }
        }
    }
    for (var i = 0; i < calenderProps.DateClickExtents.length; i++) {
        if (x > calenderProps.DateClickExtents[i].X && x < calenderProps.DateClickExtents[i].X + calenderProps.DayCellWidth &&
            y > calenderProps.DateClickExtents[i].Y && y < calenderProps.DateClickExtents[i].Y + calenderProps.DayCellHeight) {
            calenderProps.SelectedDay = calenderProps.DateClickExtents[i].Date;
            draw(canvasid);
            if (calenderProps.OnDayClickFunction != null) {
                calenderProps.OnDayClickFunction(calenderProps.CanvasID, calenderProps.WindowID, calenderProps.SelectedDay);
            }
            return;
        }
    }
}

function calenderMouseOver(canvasid, windowid) {
    var calenderProps = getCalenderProps(canvasid, windowid);
    var canvas = getCanvas(canvasid);
    var x = event.pageX - canvas.offsetLeft;
    var y = event.pageY - canvas.offsetTop;
    for (var i = 0; i < calenderProps.DateClickExtents.length; i++) {
        if (x > calenderProps.DateClickExtents[i].X && x < calenderProps.DateClickExtents[i].X + calenderProps.DayCellWidth &&
            y > calenderProps.DateClickExtents[i].Y && y < calenderProps.DateClickExtents[i].Y + calenderProps.DayCellHeight) {
            calenderProps.MouseHoverDate = calenderProps.DateClickExtents[i].Date;
            draw(canvasid);
            return;
        }
    }
}

//ProgressBar Code starts here

var progressBarPropsArray = new Array();

function getProgressBarProps(canvasid, windowid) {
    for (var i = 0; i < progressBarPropsArray.length; i++) {
        if (progressBarPropsArray[i].CanvasID == canvasid && progressBarPropsArray[i].WindowID == windowid) {
            return progressBarPropsArray[i];
        }
    }
}

function createProgressBar(canvasid, controlNameId, x, y, width, height, depth, color, maxvalue, minvalue, currentvalue) {
    var windowid = createWindow(canvasid, x, y, width, height, depth, null, 'ProgressBar', controlNameId);
    progressBarPropsArray.push({
        CanvasID: canvasid, WindowID: windowid, X: x, Y: y, Width: width, Height: height, Color: color, MaxValue: maxvalue,
        MinValue: minvalue, CurrentValue: currentvalue
    });
    registerWindowDrawFunction(windowid, drawProgressBar, canvasid);
    return windowid;
}

function setProgressBarCurrentValue(canvasid, windowid, value) {
    var progressBarProps = getProgressBarProps(canvasid, windowid);
    progressBarProps.CurrentValue = value;
    draw(canvasid);
}

function drawProgressBar(canvasid, windowid) {
    var progressBarProps = getProgressBarProps(canvasid, windowid);
    var ctx = getCtx(canvasid);
    var g = ctx.createLinearGradient(progressBarProps.X, progressBarProps.Y, progressBarProps.X, progressBarProps.Y + progressBarProps.Height);
    g.addColorStop(0, '#f4f5f6');
    g.addColorStop(1, '#eaeced');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(progressBarProps.X, progressBarProps.Y + 5);
    ctx.arc(progressBarProps.X + 5, progressBarProps.Y + 5, 5, Math.PI, (Math.PI * 270) / 180, false);
    ctx.lineTo(progressBarProps.X + progressBarProps.Width - 5, progressBarProps.Y);
    ctx.arc(progressBarProps.X + progressBarProps.Width - 5, progressBarProps.Y + 5, 5, (Math.PI * 270) / 180, Math.PI * 2, false);
    ctx.lineTo(progressBarProps.X + progressBarProps.Width, progressBarProps.Y + progressBarProps.Height - 5);
    ctx.arc(progressBarProps.X + progressBarProps.Width - 5, progressBarProps.Y + progressBarProps.Height - 5, 5, 0, Math.PI / 2, false);
    ctx.lineTo(progressBarProps.X + 5, progressBarProps.Y + progressBarProps.Height);
    ctx.arc(progressBarProps.X + 5, progressBarProps.Y + progressBarProps.Height - 5, 5, Math.PI / 2, Math.PI, false);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#a9b2bb';
    ctx.beginPath();
    ctx.moveTo(progressBarProps.X, progressBarProps.Y + 5);
    ctx.arc(progressBarProps.X + 5, progressBarProps.Y + 5, 5, Math.PI, (Math.PI * 270) / 180, false);
    ctx.lineTo(progressBarProps.X + progressBarProps.Width - 5, progressBarProps.Y);
    ctx.arc(progressBarProps.X + progressBarProps.Width - 5, progressBarProps.Y + 5, 5, (Math.PI * 270) / 180, Math.PI * 2, false);
    ctx.stroke();
    ctx.strokeStyle = '#768694';
    ctx.beginPath();
    ctx.moveTo(progressBarProps.X + progressBarProps.Width, progressBarProps.Y + 5);
    ctx.lineTo(progressBarProps.X + progressBarProps.Width, progressBarProps.Y + progressBarProps.Height - 5);
    ctx.arc(progressBarProps.X + progressBarProps.Width - 5, progressBarProps.Y + progressBarProps.Height - 5, 5, 0, Math.PI / 2, false);
    ctx.moveTo(progressBarProps.X + 5, progressBarProps.Y + progressBarProps.Height);
    ctx.arc(progressBarProps.X + 5, progressBarProps.Y + progressBarProps.Height - 5, 5, Math.PI / 2, Math.PI, false);
    ctx.lineTo(progressBarProps.X, progressBarProps.Y + 5);
    ctx.stroke();
    ctx.strokeStyle = '#657582';
    ctx.beginPath();
    ctx.moveTo(progressBarProps.X + 5, progressBarProps.Y + progressBarProps.Height);
    ctx.lineTo(progressBarProps.X + progressBarProps.Width - 5, progressBarProps.Y + progressBarProps.Height);
    ctx.stroke();
    var pgwidth = ((progressBarProps.CurrentValue - progressBarProps.MinValue) * progressBarProps.Width)/(progressBarProps.MaxValue - progressBarProps.MinValue);
    var g2 = ctx.createLinearGradient(progressBarProps.X, progressBarProps.Y, progressBarProps.X, progressBarProps.Y + progressBarProps.Height);
    var redcomp = parseInt(progressBarProps.Color.substr(1, 2), 16);
    var greencomp = parseInt(progressBarProps.Color.substr(3, 2), 16);
    var bluecomp = parseInt(progressBarProps.Color.substr(5, 2), 16);
    g2.addColorStop(0.0, '#' + getlowcomp(redcomp) + getlowcomp(greencomp) + getlowcomp(bluecomp));
    g2.addColorStop(0.5, progressBarProps.Color);
    g2.addColorStop(1.0, '#' + gethighcomp(redcomp) + gethighcomp(greencomp) + gethighcomp(bluecomp));
    ctx.fillStyle = g2;
    ctx.beginPath();
    ctx.moveTo(progressBarProps.X + 2, progressBarProps.Y + 7);
    ctx.arc(progressBarProps.X + 7, progressBarProps.Y + 7, 5, Math.PI, (Math.PI * 270) / 180, false);
    ctx.lineTo(progressBarProps.X + pgwidth - 7, progressBarProps.Y + 2);
    ctx.arc(progressBarProps.X + pgwidth - 7, progressBarProps.Y + 7, 5, (Math.PI * 270) / 180, Math.PI * 2, false);
    ctx.lineTo(progressBarProps.X + pgwidth - 2, progressBarProps.Y + progressBarProps.Height - 7);
    ctx.arc(progressBarProps.X + pgwidth - 7, progressBarProps.Y + progressBarProps.Height - 7, 5, 0, Math.PI / 2, false);
    ctx.lineTo(progressBarProps.X + 7, progressBarProps.Y + progressBarProps.Height - 2);
    ctx.arc(progressBarProps.X + 7, progressBarProps.Y + progressBarProps.Height - 7, 5, Math.PI / 2, Math.PI, false);
    ctx.closePath();
    ctx.fill();
}

//Slider Control code starts here

var sliderPropsArray = new Array();

function getSliderProps(canvasid, windowid) {
    for (var i = 0; i < sliderPropsArray.length; i++) {
        if (sliderPropsArray[i].CanvasID == canvasid && sliderPropsArray[i].WindowID == windowid) {
            return sliderPropsArray[i];
        }
    }
}

function drawSlider(canvasid, windowid) {
    var sliderProps = getSliderProps(canvasid, windowid);
    var ctx = getCtx(canvasid);
    ctx.strokeStyle = '#a3aeb9';
    ctx.beginPath();
    ctx.rect(sliderProps.X, sliderProps.Y + (sliderProps.HandleHeight / 2) - 1, sliderProps.Width, 3);
    ctx.stroke();
    ctx.strokeStyle = '#e6eff7';
    ctx.beginPath();
    ctx.moveTo(sliderProps.X + 1, sliderProps.Y + (sliderProps.HandleHeight / 2));
    ctx.lineTo(sliderProps.X + sliderProps.Width - 1, sliderProps.Y + (sliderProps.HandleHeight / 2));
    ctx.stroke();
    var pgwidth = ((sliderProps.CurrentValue - sliderProps.MinValue) * sliderProps.Width) / (sliderProps.MaxValue - sliderProps.MinValue) - (sliderProps.HandleWidth / 2);
    var g = ctx.createLinearGradient(sliderProps.X + pgwidth, sliderProps.Y, sliderProps.X + pgwidth, sliderProps.Y + sliderProps.HandleHeight);
    g.addColorStop(0, '#fdfdfd');
    g.addColorStop(1, '#ced4d9');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.rect(sliderProps.X + pgwidth, sliderProps.Y, sliderProps.HandleWidth, sliderProps.HandleHeight);
    ctx.fill();
    ctx.strokeStyle = '#a0abb7';
    ctx.beginPath();
    ctx.moveTo(sliderProps.X + pgwidth + 1, sliderProps.Y);
    ctx.lineTo(sliderProps.X + pgwidth + sliderProps.HandleWidth - 1, sliderProps.Y);
    ctx.stroke();
    ctx.strokeStyle = '#8094a4';
    ctx.beginPath();
    ctx.moveTo(sliderProps.X + pgwidth, sliderProps.Y + 1);
    ctx.lineTo(sliderProps.X + pgwidth, sliderProps.Y + sliderProps.HandleHeight - 1);
    ctx.moveTo(sliderProps.X + pgwidth + sliderProps.HandleWidth, sliderProps.Y + 1);
    ctx.lineTo(sliderProps.X + pgwidth + sliderProps.HandleWidth, sliderProps.Y + sliderProps.HandleHeight - 1);
    ctx.stroke();
    ctx.strokeStyle = '#617584';
    ctx.beginPath();
    ctx.moveTo(sliderProps.X + pgwidth + 1, sliderProps.Y + sliderProps.HandleHeight);
    ctx.lineTo(sliderProps.X + pgwidth + sliderProps.HandleWidth - 1, sliderProps.Y + sliderProps.HandleHeight);
    ctx.stroke();
}

function sliderMouseDown(canvasid, windowid) {
    var sliderProps = getSliderProps(canvasid, windowid);
    sliderProps.MouseDownState = 1;
}

function sliderMouseMove(canvasid, windowid) {
    var sliderProps = getSliderProps(canvasid, windowid);
    if (sliderProps.MouseDownState == 1) {
        var canvas = getCanvas(canvasid);
        var x = event.pageX - canvas.offsetLeft;
        var y = event.pageY - canvas.offsetTop;
        if (x < sliderProps.X) {
            sliderProps.CurrentValue = sliderProps.MinValue;
        } else if (x > sliderProps.X + sliderProps.Width) {
            sliderProps.CurrentValue = sliderProps.MaxValue;
        } else {
            sliderProps.CurrentValue = sliderProps.MinValue + (((x - sliderProps.X) * (sliderProps.MaxValue - sliderProps.MinValue)) / sliderProps.Width);
        }
        draw(canvasid);
    }
}

function sliderMouseUp(canvasid, windowid) {
    var sliderProps = getSliderProps(canvasid, windowid);
    sliderProps.MouseDownState = 0;
}

function createSlider(canvasid, controlNameId, x, y, width, height, depth, handlewidth, maxvalue, minvalue, value) {
    var windowid = createWindow(canvasid, x, y, width, height, depth, null, 'Slider', controlNameId);
    sliderPropsArray.push({
        CanvasID: canvasid, WindowID: windowid, X: x, Y: y, Width: width, Height: height, HandleWidth: handlewidth,
        HandleHeight: height, MaxValue: maxvalue, MinValue: minvalue, CurrentValue: value, MouseDownState: 0
    });
    registerWindowDrawFunction(windowid, drawSlider, canvasid);
    registerMouseDownFunction(windowid, sliderMouseDown, canvasid);
    registerMouseUpFunction(windowid, sliderMouseUp, canvasid);
    registerMouseMoveFunction(windowid, sliderMouseMove, canvasid);
    return windowid;
}

//DatePicker code starts here

var datePickerPropsArray = new Array();

function getDatePickerPropsByTextBoxAreaWindowID(canvasid, windowid) {
    for (var i = 0; i < datePickerPropsArray.length; i++) {
        if (datePickerPropsArray[i].CanvasID == canvasid && datePickerPropsArray[i].TextBoxAreaWindowID == windowid) {
            return datePickerPropsArray[i];
        }
    }
}

function getDatePickerPropsByButtonWindowID(canvasid, windowid) {
    for (var i = 0; i < datePickerPropsArray.length; i++) {
        if (datePickerPropsArray[i].CanvasID == canvasid && datePickerPropsArray[i].ButtonWindowID == windowid) {
            return datePickerPropsArray[i];
        }
    }
}

function getDatePickerPropsByCalenderWindowID(canvasid, windowid) {
    for (var i = 0; i < datePickerPropsArray.length; i++) {
        if (datePickerPropsArray[i].CanvasID == canvasid && datePickerPropsArray[i].CalenderWindowID == windowid) {
            return datePickerPropsArray[i];
        }
    }
}

function createDatePicker(canvasid, controlNameId, x, y, width, height, depth, visibleMonth, visibileYear, selectedDay, dayCellWidth, dayCellHeight, headerHeight,
    headerBackgroundColor, bodyBackgroundColor, textHeaderColor, textHeaderHeight, textHeaderFontString,
    dayDateActiveColor, dayDateActiveTextHeight, dayDateActiveTextFontString,
    dayDateInactiveTextColor, dayDateInactiveTextHeight, dayDateInactiveTextFontString, selectedDayTextColor, selectedDayTextHeight,
    selectedDayTextFontString, selectedDayHighLightColor, todayTextColor, todayTextHeight, todayTextFontString, todayHighLightColor,
    mouseoverHightlightColor, ondayClickFunction, dayLabelTextColor, dayLabelTextHeight, dayLabelTextFontString, textboxAreaTextColor,
    textboxAreaTextHeight, textboxAreaTextFontString, calenderHeight) {
    var textboxAreaWindowID = createWindow(canvasid, x, y, width - height, height, depth, null, 'DatePickerTextArea', controlNameId + 'DatePickerTextArea');
    var buttonWindowID = createWindow(canvasid, x + width - height, y, height, height, depth, null, 'DatePickerButton', controlNameId + 'DatePickerButton');
    var calenderWindowID = createCalendar(canvasid, controlNameId + 'DatePickerCalender', x, y + height, width, calenderHeight, depth, visibleMonth, visibileYear, selectedDay,
        dayCellWidth, dayCellHeight, headerHeight,
        headerBackgroundColor, bodyBackgroundColor, textHeaderColor, textHeaderHeight, textHeaderFontString,
        dayDateActiveColor, dayDateActiveTextHeight, dayDateActiveTextFontString,
        dayDateInactiveTextColor, dayDateInactiveTextHeight, dayDateInactiveTextFontString, selectedDayTextColor, selectedDayTextHeight,
        selectedDayTextFontString, selectedDayHighLightColor, todayTextColor, todayTextHeight, todayTextFontString, todayHighLightColor,
        mouseoverHightlightColor, function () {
            var datePickerProps = getDatePickerPropsByTextBoxAreaWindowID(canvasid, textboxAreaWindowID);
            var calenderProps = getCalenderProps(canvasid, calenderWindowID);
            if (ondayClickFunction != null) {
                ondayClickFunction(canvasid, calenderWindowID, calenderProps.SelectedDay);
            }
            setHiddenWindowStatus(canvasid, datePickerProps.CalenderWindowID, 1);
            draw(canvasid);
        }, dayLabelTextColor, dayLabelTextHeight, dayLabelTextFontString);
    datePickerPropsArray.push({
        CanvasID: canvasid, WindowID: textboxAreaWindowID, TextBoxAreaWindowID: textboxAreaWindowID, ButtonWindowID: buttonWindowID,
        CalenderWindowID: calenderWindowID, X: x, Y: y, Width: width, Height: height, TextBoxAreaTextColor: textboxAreaTextColor,
        TextBoxAreaTextHeight: textboxAreaTextHeight, TextBoxAreaTextFontString: textboxAreaTextFontString
    });
    registerModalWindow(canvasid, calenderWindowID);
    registerHiddenWindow(canvasid, calenderWindowID, 1);
    registerClickFunction(buttonWindowID, function (canvasid2, windowid2) {
        var datePickerProps = getDatePickerPropsByButtonWindowID(canvasid2, windowid2);
        if (checkIfHiddenWindow(canvasid, datePickerProps.CalenderWindowID) == 1) {
            setHiddenWindowStatus(canvasid, datePickerProps.CalenderWindowID, 0);
        } else {
            setHiddenWindowStatus(canvasid, datePickerProps.CalenderWindowID, 1);
        }
    }, canvasid);
    registerWindowDrawFunction(textboxAreaWindowID, function (canvasid3, windowid3) {
        var datePickerProps = getDatePickerPropsByTextBoxAreaWindowID(canvasid3, windowid3);
        var calenderProps = getCalenderProps(canvasid3, datePickerProps.CalenderWindowID);
        var ctx = getCtx(canvasid3);
        ctx.strokeStyle = '#a3aeb9';
        ctx.beginPath();
        ctx.rect(datePickerProps.X, datePickerProps.Y, datePickerProps.Width - datePickerProps.Height, datePickerProps.Height);
        ctx.stroke();
        if (calenderProps.SelectedDay != null) {
            ctx.fillStyle = datePickerProps.TextBoxAreaTextColor;
            ctx.font = datePickerProps.TextBoxAreaTextFontString;
            var seldaystr = calenderProps.SelectedDay.getDate().toString() + '/' + (calenderProps.SelectedDay.getMonth() + 1).toString() +
                '/' + calenderProps.SelectedDay.getFullYear().toString();
            ctx.fillText(seldaystr, datePickerProps.X + 4, datePickerProps.Y + datePickerProps.Height -
                ((datePickerProps.Height - datePickerProps.TextBoxAreaTextHeight) / 2));
        }
    }, canvasid);
    registerWindowDrawFunction(buttonWindowID, function (canvasid4, windowid4) {
        var datePickerProps = getDatePickerPropsByButtonWindowID(canvasid4, windowid4);
        var ctx = getCtx(canvasid4);
        ctx.lineCap = 'butt';
        ctx.strokeStyle = '#3c7fb1';
        ctx.beginPath();
        ctx.rect(datePickerProps.X + datePickerProps.Width - datePickerProps.Height, datePickerProps.Y, datePickerProps.Height, datePickerProps.Height);
        ctx.stroke();
        ctx.fillStyle = '#dcf0fb';
        ctx.beginPath();
        ctx.rect(datePickerProps.X + datePickerProps.Width - datePickerProps.Height + 1, datePickerProps.Y + 1, (datePickerProps.Height / 2) - 2, datePickerProps.Height - 2);
        ctx.fill();
        ctx.strokeStyle = '#c0e4f8';
        ctx.moveTo(datePickerProps.X + datePickerProps.Width - (datePickerProps.Height / 2) + 1, datePickerProps.Y + 1);
        ctx.lineTo(datePickerProps.X + datePickerProps.Width - (datePickerProps.Height / 2) + 1, datePickerProps.Y + datePickerProps.Height - 1);
        ctx.stroke();
        ctx.fillStyle = '#a7d8f3';
        ctx.beginPath();
        ctx.rect(datePickerProps.X + datePickerProps.Width - (datePickerProps.Height / 2) + 1, datePickerProps.Y + 1,
            (datePickerProps.Height / 2) - 2, datePickerProps.Height - 2);
        ctx.fill();
        var g = ctx.createLinearGradient(datePickerProps.X + datePickerProps.Width - (datePickerProps.Height / 2) - 1, datePickerProps.Y + (datePickerProps.Height / 2) - 1,
            datePickerProps.X + datePickerProps.Width - (datePickerProps.Height / 2) - 1, datePickerProps.Y + (datePickerProps.Height / 2) + 3);
        g.addColorStop(0, '#0d2a3a');
        g.addColorStop(1, '#4e9ac4');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(datePickerProps.X + datePickerProps.Width - (datePickerProps.Height / 2) - 4, datePickerProps.Y + (datePickerProps.Height / 2) - 1);
        ctx.lineTo(datePickerProps.X + datePickerProps.Width - (datePickerProps.Height / 2) + 3, datePickerProps.Y + (datePickerProps.Height / 2) - 1);
        ctx.lineTo(datePickerProps.X + datePickerProps.Width - (datePickerProps.Height / 2) - 1, datePickerProps.Y + (datePickerProps.Height / 2) + 3);
        ctx.closePath();
        ctx.fill();
    }, canvasid);
    registerModalWindow(canvasid, calenderWindowID);
    registerHiddenWindow(canvasid, calenderWindowID, 1);
    registerLostFocusFunction(canvasid, calenderWindowID, function () { datePickerCalenderWindowLostFocus(canvasid, calenderWindowID); });
    registerLostFocusFunction(canvasid, textboxAreaWindowID, function () { datePickerTextBoxWindowLostFocus(canvasid, textboxAreaWindowID); });
    registerLostFocusFunction(canvasid, buttonWindowID, function () { datePickerButtonLostFocus(canvasid, buttonWindowID); });
    return textboxAreaWindowID;
}

function datePickerCalenderWindowLostFocus(canvasid, windowid) {
    var datePickerProps = getDatePickerPropsByCalenderWindowID(canvasid, windowid);
    if (doesWindowHaveFocus(canvasid, datePickerProps.TextBoxAreaWindowID) == 0 &&
        doesWindowHaveFocus(canvasid, datePickerProps.ButtonWindowID) == 0 &&
        doingEventForWindowID != datePickerProps.CalenderWindowID) {
        setHiddenWindowStatus(canvasid, datePickerProps.CalenderWindowID, 1);
        draw(canvasid);
    }
}

function datePickerTextBoxWindowLostFocus(canvasid, windowid) {
    var datePickerProps = getDatePickerPropsByTextBoxAreaWindowID(canvasid, windowid);
    if (doesWindowHaveFocus(canvasid, datePickerProps.CalenderWindowID) == 0 &&
        doesWindowHaveFocus(canvasid, datePickerProps.ButtonWindowID) == 0 &&
        doingEventForWindowID != datePickerProps.CalenderWindowID) {
        setHiddenWindowStatus(canvasid, datePickerProps.CalenderWindowID, 1);
        draw(canvasid);
    }
}

function datePickerButtonLostFocus(canvasid, windowid) {
    var datePickerProps = getDatePickerPropsByButtonWindowID(canvasid, windowid);
    if (doesWindowHaveFocus(canvasid, datePickerProps.CalenderWindowID) == 0 &&
        doesWindowHaveFocus(canvasid, datePickerProps.TextBoxAreaWindowID) == 0 &&
        doingEventForWindowID != datePickerProps.CalenderWindowID) {
        setHiddenWindowStatus(canvasid, datePickerProps.CalenderWindowID, 1);
        draw(canvasid);
    }
}

//Panel control code starts here

var panelPropsArray = new Array();

function getPanelProps(canvasid, windowid) {
    for (var i = 0; i < panelPropsArray.length; i++) {
        if (panelPropsArray[i].CanvasID == canvasid && panelPropsArray[i].WindowID == windowid) {
            return panelPropsArray[i];
        }
    }
}

function createPanel(canvasid, controlNameId, x, y, width, height, depth, hasBorder, borderColor, hasBackgroundGradient, backgroundStartColor, backgroundEndColor,
    iscollapsable, collapsedWidth, collapsedHeight, panellabel, panelLabelTextColor, panelLabelTextHeight, panelLabelTextFontString,
    headerBackgroundStartColor, headerBackgroundEndColor, headerheight, expandCollapseButtonColor, isexpanded, expandCollapseButtonRadius) {
    var windowid = createWindow(canvasid, x, y, (iscollapsable == 1 ? (isexpanded == 1 ? width : collapsedWidth) : width),
        (iscollapsable == 1 ? (isexpanded == 1 ? height : headerheight) : height), depth, null, 'Panel', controlNameId);
    panelPropsArray.push({
        CanvasID: canvasid, WindowID: windowid, X: x, Y: y, Width: width, Height: height, ExpandedWidth: width, ExpandedHeight: height,
        CollapsedWidth: collapsedWidth, CollapsedHeight: collapsedHeight, IsCollapsable: iscollapsable, HasBorder: hasBorder, BorderColor: borderColor,
        HasBackgroundGradient: hasBackgroundGradient, BackgroundStartColor: backgroundStartColor, BackgroundEndColor: backgroundEndColor, 
        HeaderHeight: headerheight, HeaderBackgroundStartColor: headerBackgroundStartColor, HeaderBackgroundEndColor: headerBackgroundEndColor,
        ExpandCollapseButtonColor: expandCollapseButtonColor, IsExpanded: isexpanded, ExpandCollapseButtonRadius: expandCollapseButtonRadius,
        PanelLabel: panellabel, PanelLabelTextColor: panelLabelTextColor, PanelLabelTextHeight: panelLabelTextHeight, 
        PanelLabelTextFontString: panelLabelTextFontString, OriginalWidth: width, OriginalHeight: height
    });
    registerWindowDrawFunction(windowid, function (canvasid2, windowid2) {
        var panelProps = getPanelProps(canvasid2, windowid2);
        var ctx = getCtx(canvasid2);
        if (panelProps.IsCollapsable == 1) {
            if (panelProps.IsExpanded == 1) {
                if (panelProps.HasBackgroundGradient == 1) {
                    var g = ctx.createLinearGradient(panelProps.X, panelProps.Y, panelProps.X, panelProps.Y + panelProps.Height);
                    g.addColorStop(0, panelProps.BackgroundStartColor);
                    g.addColorStop(1, panelProps.BackgroundEndColor);
                    ctx.fillStyle = g;
                    ctx.beginPath();
                    ctx.rect(panelProps.X, panelProps.Y, panelProps.Width, panelProps.Height);
                    ctx.fill();
                }
                if (panelProps.HasBorder == 1) {
                    ctx.strokeStyle = panelProps.BorderColor;
                    ctx.beginPath();
                    ctx.rect(panelProps.X, panelProps.Y, panelProps.Width, panelProps.Height);
                    ctx.stroke();
                }
            } else {
                if (panelProps.HasBorder == 1) {
                    ctx.strokeStyle = panelProps.BorderColor;
                    ctx.beginPath();
                    ctx.rect(panelProps.X, panelProps.Y, panelProps.Width, panelProps.HeaderHeight);
                    ctx.stroke();
                }
            }
            var g1 = ctx.createLinearGradient(panelProps.X, panelProps.Y, panelProps.X, panelProps.Y + panelProps.HeaderHeight);
            g1.addColorStop(0, panelProps.HeaderBackgroundStartColor);
            g1.addColorStop(1, panelProps.HeaderBackgroundEndColor);
            ctx.fillStyle = g1;
            ctx.beginPath();
            ctx.rect(panelProps.X, panelProps.Y, panelProps.Width, panelProps.HeaderHeight);
            ctx.fill();
            ctx.fillStyle = panelProps.PanelLabelTextColor;
            ctx.font = panelProps.PanelLabelTextFontString;
            ctx.fillText(panelProps.PanelLabel, panelProps.X + ((panelProps.Width - panelProps.ExpandCollapseButtonRadius -
                ctx.measureText(panelProps.PanelLabel).width) / 2), panelProps.Y + panelProps.HeaderHeight -
                ((panelProps.HeaderHeight - panelProps.PanelLabelTextHeight) / 2));
            var g2 = ctx.createRadialGradient(panelProps.X + panelProps.Width - 4 - panelProps.ExpandCollapseButtonRadius,
                panelProps.Y + panelProps.HeaderHeight - ((panelProps.HeaderHeight - (panelProps.ExpandCollapseButtonRadius * 2)) / 2)
                - panelProps.ExpandCollapseButtonRadius, 0,
                panelProps.X + panelProps.Width - 4 - panelProps.ExpandCollapseButtonRadius,
                panelProps.Y + panelProps.HeaderHeight - ((panelProps.HeaderHeight - (panelProps.ExpandCollapseButtonRadius * 2)) / 2)
                - panelProps.ExpandCollapseButtonRadius,
                panelProps.ExpandCollapseButtonRadius);
            var redcomp = parseInt(panelProps.ExpandCollapseButtonColor.substr(1, 2), 16);
            var greencomp = parseInt(panelProps.ExpandCollapseButtonColor.substr(3, 2), 16);
            var bluecomp = parseInt(panelProps.ExpandCollapseButtonColor.substr(5, 2), 16);
            g2.addColorStop(0.0, '#' + gethighcomp(redcomp) + gethighcomp(greencomp) + gethighcomp(bluecomp));
            g2.addColorStop(0.9, panelProps.ExpandCollapseButtonColor);
            g2.addColorStop(1.0, '#' + getlowcomp(redcomp) + getlowcomp(greencomp) + getlowcomp(bluecomp));
            ctx.fillStyle = g2;
            ctx.beginPath();
            ctx.arc(panelProps.X + panelProps.Width - 4 - panelProps.ExpandCollapseButtonRadius,
                panelProps.Y + panelProps.HeaderHeight - ((panelProps.HeaderHeight - (panelProps.ExpandCollapseButtonRadius * 2)) / 2)
                - panelProps.ExpandCollapseButtonRadius,
                panelProps.ExpandCollapseButtonRadius, 0, Math.PI * 2, false);
            ctx.fill();
            ctx.strokeStyle = '#000000';
            ctx.beginPath();
            if (panelProps.IsExpanded == 1) {
                ctx.moveTo(panelProps.X + panelProps.Width - 8 - panelProps.ExpandCollapseButtonRadius,
                    panelProps.Y + panelProps.HeaderHeight - ((panelProps.HeaderHeight - (panelProps.ExpandCollapseButtonRadius * 2)) / 2) + 4
                     - panelProps.ExpandCollapseButtonRadius);
                ctx.lineTo(panelProps.X + panelProps.Width - 4 - panelProps.ExpandCollapseButtonRadius,
                    panelProps.Y + panelProps.HeaderHeight - ((panelProps.HeaderHeight - (panelProps.ExpandCollapseButtonRadius * 2)) / 2) - 2
                     - panelProps.ExpandCollapseButtonRadius);
                ctx.lineTo(panelProps.X + panelProps.Width - panelProps.ExpandCollapseButtonRadius,
                    panelProps.Y + panelProps.HeaderHeight - ((panelProps.HeaderHeight - (panelProps.ExpandCollapseButtonRadius * 2)) / 2) + 4
                     - panelProps.ExpandCollapseButtonRadius);
                ctx.moveTo(panelProps.X + panelProps.Width - 8 - panelProps.ExpandCollapseButtonRadius,
                    panelProps.Y + panelProps.HeaderHeight - ((panelProps.HeaderHeight - (panelProps.ExpandCollapseButtonRadius * 2)) / 2) + 1
                     - panelProps.ExpandCollapseButtonRadius);
                ctx.lineTo(panelProps.X + panelProps.Width - 4 - panelProps.ExpandCollapseButtonRadius,
                    panelProps.Y + panelProps.HeaderHeight - ((panelProps.HeaderHeight - (panelProps.ExpandCollapseButtonRadius * 2)) / 2) - 5
                     - panelProps.ExpandCollapseButtonRadius);
                ctx.lineTo(panelProps.X + panelProps.Width - panelProps.ExpandCollapseButtonRadius,
                    panelProps.Y + panelProps.HeaderHeight - ((panelProps.HeaderHeight - (panelProps.ExpandCollapseButtonRadius * 2)) / 2) + 1
                     - panelProps.ExpandCollapseButtonRadius);
            } else {
                ctx.moveTo(panelProps.X + panelProps.Width - 8 - panelProps.ExpandCollapseButtonRadius,
                    panelProps.Y + panelProps.HeaderHeight - ((panelProps.HeaderHeight - (panelProps.ExpandCollapseButtonRadius * 2)) / 2) - 4
                     - panelProps.ExpandCollapseButtonRadius);
                ctx.lineTo(panelProps.X + panelProps.Width - 4 - panelProps.ExpandCollapseButtonRadius,
                    panelProps.Y + panelProps.HeaderHeight - ((panelProps.HeaderHeight - (panelProps.ExpandCollapseButtonRadius * 2)) / 2) + 2
                     - panelProps.ExpandCollapseButtonRadius);
                ctx.lineTo(panelProps.X + panelProps.Width - panelProps.ExpandCollapseButtonRadius,
                    panelProps.Y + panelProps.HeaderHeight - ((panelProps.HeaderHeight - (panelProps.ExpandCollapseButtonRadius * 2)) / 2) - 4
                     - panelProps.ExpandCollapseButtonRadius);
                ctx.moveTo(panelProps.X + panelProps.Width - 8 - panelProps.ExpandCollapseButtonRadius,
                    panelProps.Y + panelProps.HeaderHeight - ((panelProps.HeaderHeight - (panelProps.ExpandCollapseButtonRadius * 2)) / 2) - 1
                     - panelProps.ExpandCollapseButtonRadius);
                ctx.lineTo(panelProps.X + panelProps.Width - 4 - panelProps.ExpandCollapseButtonRadius,
                    panelProps.Y + panelProps.HeaderHeight - ((panelProps.HeaderHeight - (panelProps.ExpandCollapseButtonRadius * 2)) / 2) + 5
                     - panelProps.ExpandCollapseButtonRadius);
                ctx.lineTo(panelProps.X + panelProps.Width - panelProps.ExpandCollapseButtonRadius,
                    panelProps.Y + panelProps.HeaderHeight - ((panelProps.HeaderHeight - (panelProps.ExpandCollapseButtonRadius * 2)) / 2) - 1
                     - panelProps.ExpandCollapseButtonRadius);
            }
            ctx.stroke();
        } else {
            if (panelProps.HasBackgroundGradient == 1) {
                var g = ctx.createLinearGradient(panelProps.X, panelProps.Y, panelProps.X, panelProps.Y + panelProps.Height);
                g.addColorStop(0, panelProps.BackgroundStartColor);
                g.addColorStop(1, panelProps.BackgroundEndColor);
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.rect(panelProps.X, panelProps.Y, panelProps.Width, panelProps.Height);
                ctx.fill();
            }
            if (panelProps.HasBorder == 1) {
                ctx.strokeStyle = panelProps.BorderColor;
                ctx.beginPath();
                ctx.rect(panelProps.X, panelProps.Y, panelProps.Width, panelProps.Height);
                ctx.stroke();
            }
        }
    }, canvasid);
    if (iscollapsable == 1) {
        registerClickFunction(windowid, function (canvasid3, windowid3) {
            var panelProps = getPanelProps(canvasid3, windowid3);
            var windowProps = getWindowProps(canvasid3, windowid3);
            var canvas = getCanvas(canvasid3);
            var x = event.pageX - canvas.offsetLeft;
            var y = event.pageY - canvas.offsetTop;
            if (x > panelProps.X + panelProps.Width - 4 - (panelProps.ExpandCollapseButtonRadius * 2) &&
                x < panelProps.X + panelProps.Width - 4 && y > panelProps.Y + +
                ((panelProps.HeaderHeight - (panelProps.ExpandCollapseButtonRadius * 2)) / 2) &&
                y < panelProps.Y + panelProps.HeaderHeight -
                ((panelProps.HeaderHeight - (panelProps.ExpandCollapseButtonRadius * 2)) / 2)) {
                if (panelProps.IsExpanded == 1) {
                    panelProps.IsExpanded = 0;
                    panelProps.Width = panelProps.CollapsedWidth;
                    panelProps.Height = panelProps.HeaderHeight + panelProps.CollapsedHeight;
                    windowProps.Width = panelProps.CollapsedWidth;
                    windowProps.Height = panelProps.HeaderHeight + panelProps.CollapsedHeight;
                } else {
                    panelProps.IsExpanded = 1;
                    panelProps.Width = panelProps.OriginalWidth;
                    panelProps.Height = panelProps.OriginalHeight;
                    windowProps.Width = panelProps.OriginalWidth;
                    windowProps.Height = panelProps.OriginalHeight;
                }
                draw(canvasid3);
            }
        }, canvasid);
    } else {
        registerClickFunction(windowid, function () { }, canvasid);
    }
    registerMouseDownFunction(windowid, function () { }, canvasid);
    registerMouseMoveFunction(windowid, function () { }, canvasid);
    registerMouseUpFunction(windowid, function () { }, canvasid);
    return windowid;
}

//Bar graph control code starts here

var barGraphsPropsArray = new Array();

function getBarGraphProps(canvasid, windowid) {
    for (var i = 0; i < barGraphsPropsArray.length; i++) {
        if (barGraphsPropsArray[i].CanvasID == canvasid && barGraphsPropsArray[i].WindowID == windowid) {
            return barGraphsPropsArray[i];
        }
    }
}

function createBarGraph(canvasid, controlNameId, x, y, width, height, depth, data, maxvalue, nummarksy, title, titletextcolor, 
    titletextheigth, titletextfontstring, barwidth, axisLabelsTextColor, axisLabelsTextHeight, axisLabelsTextFontString,
    marginleft, gapbetweenbars, barClickFunction, haslegend, marginright) {
    var windowid = createWindow(canvasid, x, y, width, height, depth, null, 'BarGraph', controlNameId);
    barGraphsPropsArray.push({
        CanvasID: canvasid, WindowID: windowid, X: x, Y: y, Width: width, Height: height, Data: data,
        MaxValue: maxvalue, NumMarksY: nummarksy, Title: title, TitleTextColor: titletextcolor, TitleTextHeight: titletextheigth,
        TitleTextFontString: titletextfontstring, BarWidth: barwidth, BarLabelsWithBoundingBoxes: new Array(),
        H: height - axisLabelsTextHeight - 8 - 20, AxisLabelsTextHeight: axisLabelsTextHeight,
        AxisLabelsTextFontString: axisLabelsTextFontString, AxisLabelsTextColor: axisLabelsTextColor, MarginLeft: marginleft,
        GapBetweenBars: gapbetweenbars, BarClickFunction: barClickFunction, AlreadyUnregisteredAnimation: 0,
        HasLegend: haslegend, MarginRight: marginright
    });
    registerClickFunction(windowid, function (canvasid1, windowid1) {
        var barGraphProps = getBarGraphProps(canvasid1, windowid1);
        var canvas = getCanvas(canvasid);
        var clickx = event.pageX - canvas.offsetLeft;
        var clicky = event.pageY - canvas.offsetTop;
        for (i = 0; i < barGraphProps.BarLabelsWithBoundingBoxes.length; i++) {
            if (clickx >= barGraphProps.BarLabelsWithBoundingBoxes[i].X && clickx <= barGraphProps.BarLabelsWithBoundingBoxes[i].X +
                barGraphProps.BarLabelsWithBoundingBoxes[i].Width && clicky >= barGraphProps.BarLabelsWithBoundingBoxes[i].Y &&
                clicky <= barGraphProps.BarLabelsWithBoundingBoxes[i].Y + barGraphProps.BarLabelsWithBoundingBoxes[i].Height) {
                if (barGraphProps.BarClickFunction != null) {
                    barGraphProps.BarClickFunction(canvasid1, windowid1, i);
                    return;
                }
            }
        }
    }, canvasid);
    registerWindowDrawFunction(windowid, function (canvasid2, windowid2) {
        var barGraphProps = getBarGraphProps(canvasid2, windowid2);
        var ctx = getCtx(canvasid2);
        var h = barGraphProps.H;
        if (barGraphProps.AlreadyUnregisteredAnimation == 0 && h < barGraphProps.TitleTextHeight + 8) {
            barGraphProps.AlreadyUnregisteredAnimation = 1;
            unregisterAnimatedWindow(canvasid2);
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.fillStyle = barGraphProps.TitleTextColor;
        ctx.font = barGraphProps.TitleTextFontString;
        ctx.lineWidth = 2;
        ctx.fillText(barGraphProps.Title, barGraphProps.X + (barGraphProps.Width - ctx.measureText(barGraphProps.Title).width) / 2,
            barGraphProps.Y + barGraphProps.TitleTextHeight + 4);
        ctx.lineWidth = 1;
        ctx.fillStyle = barGraphProps.AxisLabelsTextColor;
        ctx.font = barGraphProps.AxisLabelsTextFontString;
        var yaxisheight = barGraphProps.Height - barGraphProps.TitleTextHeight - barGraphProps.AxisLabelsTextHeight - 16;
        ctx.beginPath();
        ctx.moveTo(barGraphProps.X + barGraphProps.MarginLeft, barGraphProps.Y + barGraphProps.TitleTextHeight + 8 + yaxisheight);
        ctx.lineTo(barGraphProps.X + barGraphProps.MarginLeft, barGraphProps.Y + barGraphProps.TitleTextHeight + 8);
        ctx.stroke();
        for (c = 0; c < barGraphProps.NumMarksY; c++) {
            var val = (barGraphProps.MaxValue / barGraphProps.NumMarksY) * c;
            val = Math.round(val * 100) / 100;
            var tw = ctx.measureText(val.toString()).width;
            var yval = yaxisheight / barGraphProps.NumMarksY;
            ctx.fillText(val.toString(), barGraphProps.X + barGraphProps.MarginLeft - tw - 5, barGraphProps.Y + barGraphProps.TitleTextHeight +
                8 + (barGraphProps.AxisLabelsTextHeight / 2) + yaxisheight - (c * yval));
            ctx.beginPath();
            ctx.moveTo(barGraphProps.X + barGraphProps.MarginLeft, barGraphProps.Y + barGraphProps.TitleTextHeight + 8 + yaxisheight - (c * yval));
            ctx.lineTo(barGraphProps.X + barGraphProps.MarginLeft + (barGraphProps.Data.length * (barGraphProps.BarWidth +
                barGraphProps.GapBetweenBars)) + barGraphProps.GapBetweenBars, barGraphProps.Y + barGraphProps.TitleTextHeight + 8 + yaxisheight - (c * yval));
            ctx.stroke();
        }
        barGraphProps.BarLabelsWithBoundingBoxes = new Array();
        for (i = 0; i < barGraphProps.Data.length; i++) {
            if (barGraphProps.HasLegend != 1) {
                var w = ctx.measureText(barGraphProps.Data[i][0]).width;
                ctx.fillStyle = barGraphProps.AxisLabelsTextColor;
                ctx.font = barGraphProps.AxisLabelsTextFontString;
                if (w < barGraphProps.BarWidth) {
                    ctx.fillText(barGraphProps.Data[i][0], barGraphProps.X + barGraphProps.MarginLeft + barGraphProps.GapBetweenBars +
                        (i * (barGraphProps.BarWidth + barGraphProps.GapBetweenBars)) + ((barGraphProps.BarWidth - w) / 2), barGraphProps.Y + barGraphProps.Height - 4);
                } else {
                    ctx.fillText(barGraphProps.Data[i][0], barGraphProps.X + barGraphProps.MarginLeft + barGraphProps.GapBetweenBars +
                        (i * (barGraphProps.BarWidth + barGraphProps.GapBetweenBars)) - ((w - barGraphProps.BarWidth) / 2), barGraphProps.Y + barGraphProps.Height - 4);
                }
            }
            drawrect(canvasid2, windowid2, ctx, barGraphProps, i, yaxisheight);
        }
        if (barGraphProps.HasLegend == 1) {
            for (o = 0; o < barGraphProps.Data.length; o++) {
                ctx.fillStyle = data[o][2];
                ctx.fillRect(barGraphProps.X + barGraphProps.Width - barGraphProps.MarginRight, barGraphProps.Y + barGraphProps.Height
                    - 8 - barGraphProps.AxisLabelsTextHeight - (o * (8 + barGraphProps.AxisLabelsTextHeight)), 30, barGraphProps.AxisLabelsTextHeight);
                ctx.fillText(data[o][0], barGraphProps.X + barGraphProps.Width - barGraphProps.MarginRight + 35, barGraphProps.Y + barGraphProps.Height
                    - 8 - (o * (8 + barGraphProps.AxisLabelsTextHeight)));
            }
        }
        if (h >= barGraphProps.TitleTextHeight + 8) {
            barGraphProps.H -= 5;
        }
        ctx.restore();
    }, canvasid);
    registerAnimatedWindow(canvasid);
    return windowid;
}


function drawrect(canvasid, windowid, ctx, barGraphProps, i, yaxisheight) {
    var hthis = barGraphProps.H;
    if (barGraphProps.H < barGraphProps.TitleTextHeight + 8 + yaxisheight - ((yaxisheight * barGraphProps.Data[i][1]) / barGraphProps.MaxValue)) {
        hthis = yaxisheight - ((yaxisheight * barGraphProps.Data[i][1]) / barGraphProps.MaxValue);
    }
    barGraphProps.BarLabelsWithBoundingBoxes.push({
        X: barGraphProps.X + barGraphProps.MarginLeft + barGraphProps.GapBetweenBars +
            (i * (barGraphProps.BarWidth + barGraphProps.GapBetweenBars)), Y: barGraphProps.Y + barGraphProps.TitleTextHeight + 8 + hthis,
        Width: barGraphProps.BarWidth, Height: yaxisheight - hthis
    });
    var gradient = ctx.createLinearGradient(barGraphProps.X, barGraphProps.Y + barGraphProps.TitleTextHeight + 8, barGraphProps.X,
        barGraphProps.Y + barGraphProps.Height - barGraphProps.AxisLabelsTextHeight - 8);
    var colorstr = barGraphProps.Data[i][2];
    var redcomp = parseInt(colorstr.substr(1, 2), 16);
    var greencomp = parseInt(colorstr.substr(3, 2), 16);
    var bluecomp = parseInt(colorstr.substr(5, 2), 16);
    gradient.addColorStop(0.0, '#' + getlowcomp(redcomp) + getlowcomp(greencomp) + getlowcomp(bluecomp));
    gradient.addColorStop(0.5, colorstr);
    gradient.addColorStop(1.0, '#' + gethighcomp(redcomp) + gethighcomp(greencomp) + gethighcomp(bluecomp));
    ctx.fillStyle = gradient;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#' + getlowcomp(redcomp) + getlowcomp(greencomp) + getlowcomp(bluecomp);
    ctx.beginPath();
    ctx.moveTo(barGraphProps.X + barGraphProps.MarginLeft + barGraphProps.GapBetweenBars + (i * (barGraphProps.BarWidth + barGraphProps.GapBetweenBars)),
        barGraphProps.Y + barGraphProps.TitleTextHeight + 8 + 5 + hthis);
    ctx.arc(barGraphProps.X + barGraphProps.MarginLeft + barGraphProps.GapBetweenBars + (i * (barGraphProps.BarWidth + barGraphProps.GapBetweenBars)) + 5,
        barGraphProps.Y + barGraphProps.TitleTextHeight + 8 + 5 + hthis, 5, Math.PI, (Math.PI / 180) * 270, false);
    ctx.lineTo(barGraphProps.X + barGraphProps.MarginLeft + barGraphProps.GapBetweenBars + barGraphProps.BarWidth - 5 +
        (i * (barGraphProps.BarWidth + barGraphProps.GapBetweenBars)), barGraphProps.Y + barGraphProps.TitleTextHeight + 8 + hthis);
    ctx.arc(barGraphProps.X + barGraphProps.MarginLeft + barGraphProps.GapBetweenBars + barGraphProps.BarWidth - 5 +
        (i * (barGraphProps.BarWidth + barGraphProps.GapBetweenBars)), barGraphProps.Y + barGraphProps.TitleTextHeight + 8 + 5 + hthis, 5, (Math.PI / 180) * 270, 0, false);
    ctx.lineTo(barGraphProps.X + barGraphProps.MarginLeft + barGraphProps.GapBetweenBars + barGraphProps.BarWidth + (i * (barGraphProps.BarWidth + 20)), barGraphProps.Y + barGraphProps.TitleTextHeight + 8 + yaxisheight);
    ctx.lineTo(barGraphProps.X + barGraphProps.MarginLeft + barGraphProps.GapBetweenBars + (i * (barGraphProps.BarWidth + barGraphProps.GapBetweenBars)),
        barGraphProps.Y + barGraphProps.TitleTextHeight + 8 + yaxisheight);
    ctx.closePath();
    ctx.fill();
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 0;
    ctx.shadowColor = '#FFFFFF';
    gradient = ctx.createLinearGradient(0, 0, 50, 300);
    gradient.addColorStop(0.0, '#FFFFFF');
    gradient.addColorStop(0.5, '#000000');
    gradient.addColorStop(1.0, '#FFFFFF');
    ctx.fillStyle = gradient;
    ctx.globalAlpha = 0.1;
    ctx.beginPath();
    ctx.moveTo(barGraphProps.X + barGraphProps.MarginLeft + barGraphProps.GapBetweenBars + (i * (barGraphProps.BarWidth + barGraphProps.GapBetweenBars)) + 5,
        barGraphProps.Y + barGraphProps.TitleTextHeight + 8 + 5 + hthis);
    ctx.arc(barGraphProps.X + barGraphProps.MarginLeft + barGraphProps.GapBetweenBars + (i * (barGraphProps.BarWidth + barGraphProps.GapBetweenBars)) + 10,
        barGraphProps.Y + barGraphProps.TitleTextHeight + 8 + 10 + hthis, 5, Math.PI, (Math.PI / 180) * 270, false);
    ctx.lineTo(barGraphProps.X + barGraphProps.MarginLeft + barGraphProps.GapBetweenBars + barGraphProps.BarWidth - 10 +
        (i * (barGraphProps.BarWidth + barGraphProps.GapBetweenBars)), barGraphProps.Y + barGraphProps.TitleTextHeight + 8 + hthis + 5);
    ctx.arc(barGraphProps.X + barGraphProps.MarginLeft + barGraphProps.GapBetweenBars + barGraphProps.BarWidth - 10 +
        (i * (barGraphProps.BarWidth + barGraphProps.GapBetweenBars)), barGraphProps.Y + barGraphProps.TitleTextHeight + 8 + 10 + hthis, 5, (Math.PI / 180) * 270, 0, false);
    ctx.lineTo(barGraphProps.X + barGraphProps.MarginLeft + barGraphProps.GapBetweenBars + barGraphProps.BarWidth + (i * (barGraphProps.BarWidth + 20)) - 5,
        barGraphProps.Y + barGraphProps.TitleTextHeight + 8 + yaxisheight);
    ctx.lineTo(barGraphProps.X + barGraphProps.MarginLeft + barGraphProps.GapBetweenBars + (i * (barGraphProps.BarWidth + barGraphProps.GapBetweenBars)) + 5,
        barGraphProps.Y + barGraphProps.TitleTextHeight + 8 + yaxisheight);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1.0;
    var vw = ctx.measureText(barGraphProps.Data[i][1].toString()).width;
    if (vw < barGraphProps.BarWidth) {
        ctx.fillText(barGraphProps.Data[i][1].toString(), barGraphProps.X + barGraphProps.MarginLeft + barGraphProps.GapBetweenBars +
            (i * (barGraphProps.BarWidth + barGraphProps.GapBetweenBars)) + ((barGraphProps.BarWidth + - vw) / 2),
            barGraphProps.Y + barGraphProps.TitleTextHeight + 8 + barGraphProps.AxisLabelsTextHeight + hthis + ((yaxisheight - hthis) / 2));
    } else {
        ctx.fillText(barGraphProps.Data[i][1].toString(), barGraphProps.X + barGraphProps.MarginLeft + barGraphProps.GapBetweenBars +
            (i * (barGraphProps.BarWidth + barGraphProps.GapBetweenBars)) - ((vw - barGraphProps.BarWidth) / 2),
            barGraphProps.Y + barGraphProps.TitleTextHeight + 8 + barGraphProps.AxisLabelsTextHeight + hthis + ((yaxisheight - hthis) / 2));
    }
}

//Pie Chart Control code starts here

var pieChartsPropsArray = new Array();

function getPieChartProps(canvasid, windowid) {
    for (var i = 0; i < barGraphsPropsArray.length; i++) {
        if (pieChartsPropsArray[i].CanvasID == canvasid && pieChartsPropsArray[i].WindowID == windowid) {
            return pieChartsPropsArray[i];
        }
    }
}

function createPieChart(canvasid, controlNameId, x, y, width, height, depth, data, title, titletextcolor, titletextheight, titletextfontstring,
    labeltextcolor, labeltextheight, labeltextfontstring, sliceClickFunction) {
    var windowid = createWindow(canvasid, x, y, width, height, depth, null, 'PieChart', controlNameId);
    var totalvalue = 0;
    for (i = 0; i < data.length; i++) {
        totalvalue += data[i][1];
    }
    pieChartsPropsArray.push({
        CanvasID: canvasid, WindowID: windowid, X: x, Y: y, Width: width, Height: height, Data: data,
        Title: title, TitleTextColor: titletextcolor, TitleTextHeight: titletextheight, TitleTextFontString: titletextfontstring,
        CurrentRadius: 20, TotalValue: totalvalue, LabelTextColor: labeltextcolor, LabelTextHeight: labeltextheight, 
        LabelTextFontString: labeltextfontstring, AlreadyUnregisteredAnimation: 0, DeltaI: -1,
        DeltaX: 0, DeltaY: 0, SliceClickFunction: sliceClickFunction
    });
    registerClickFunction(windowid, function (canvasid1, windowid1) {
        var pieChartProps = getPieChartProps(canvasid1, windowid1);
        var data = pieChartProps.Data;
        var currRadius = (pieChartProps.Height - pieChartProps.TitleTextHeight - 24 - (pieChartProps.LabelTextHeight * 2)) / 2;
        var totalvalue = 0;
        for (i = 0; i < data.length; i++) {
            totalvalue += data[i][1];
        }
        var canvas = getCanvas(canvasid);
        var clickx = event.pageX - canvas.offsetLeft;
        var clicky = event.pageY - canvas.offsetTop;
        var pieoutangle = -1;
        var centerx = pieChartProps.X + (pieChartProps.Width - (currRadius * 2)) / 2 + currRadius;
        var centery = pieChartProps.Y + 16 + pieChartProps.TitleTextHeight + pieChartProps.LabelTextHeight + currRadius;
        if (currRadius * currRadius > (clickx - centerx) * (clickx - centerx) + (clicky - centery) * (clicky - centery)) {
            if (clickx > centerx && clicky == centery) {
                pieoutangle = 0;
            } else if (clickx > centerx && clicky > centery) {
                pieoutangle = (Math.atan((clicky - centery) / (clickx - centerx))) * 180 / Math.PI;
            } else if (clickx < centerx && clicky > centery) {
                pieoutangle = 180 - ((Math.atan((clicky - centery) / (clickx - centerx))) * 180 / Math.PI);
            } else if (clickx < centerx && clicky == centery) {
                pieoutangle = 180;
            } else if (clickx < centerx && clicky < centery) {
                pieoutangle = 180 + ((Math.atan((clicky - centery) / (clickx - centerx))) * 180 / Math.PI);
            } else if (clickx == centerx && clicky < centery) {
                pieoutangle = 270;
            } else if (clickx > centerx && clicky < centery) {
                pieoutangle = 360 + ((Math.atan((clicky - centery) / (clickx - centerx))) * 180 / Math.PI);
            }
        }
        var currangle = 0;
        var lastangle = 0;
        var lastx = centerx + currRadius;
        var lasty = centery;
        var founddelta = 0;
        for (i = 0; i < data.length; i++) {
            currangle += (data[i][1] * 360) / totalvalue;
            var deltax = 0;
            var deltay = 0;
            if (pieoutangle >= 0 && lastangle <= pieoutangle && currangle >= pieoutangle) {
                var deltaangle = lastangle + ((currangle - lastangle) / 2);
                if (deltaangle == 0) {
                    deltax = 40;
                    deltay = 0;
                } else if (deltaangle > 0 && deltaangle < 90) {
                    deltax = Math.cos(deltaangle * (Math.PI / 180)) * 40;
                    deltay = Math.sin(deltaangle * (Math.PI / 180)) * 40;
                } else if (deltaangle == 90) {
                    deltax = 0;
                    deltay = 40;
                } else if (deltaangle > 90 && deltaangle < 180) {
                    deltax = -(Math.cos((180 - deltaangle) * (Math.PI / 180)) * 40);
                    deltay = Math.sin((180 - deltaangle) * (Math.PI / 180)) * 40;
                } else if (deltaangle == 180) {
                    deltax = -40;
                    deltay = 0;
                } else if (deltaangle > 180 && deltaangle < 270) {
                    deltax = -(Math.cos((180 - deltaangle) * (Math.PI / 180)) * 40);
                    deltay = (Math.sin((180 - deltaangle) * (Math.PI / 180)) * 40);
                } else if (deltaangle == 270) {
                    deltax = 0;
                    deltay = -40;
                } else if (deltaangle > 270 && deltaangle < 360) {
                    deltax = Math.cos((360 - deltaangle) * (Math.PI / 180)) * 40;
                    deltay = -(Math.sin((360 - deltaangle) * (Math.PI / 180)) * 40);
                }
            }
            if (deltax != 0 || deltay != 0) {
                pieChartProps.DeltaX = deltax;
                pieChartProps.DeltaY = deltay;
                pieChartProps.DeltaI = i;
                founddelta = 1;
                if (pieChartProps.SliceClickFunction != null) {
                    pieChartProps.SliceClickFunction(canvasid1, windowid1, i);
                }
            }
            if (currangle < 90) {
                lastx = centerx + Math.cos((Math.PI / 180) * currangle) * currRadius;
                lasty = centery + Math.sin((Math.PI / 180) * currangle) * currRadius;
            } else if (currangle == 90) {
                lastx = centerx;
                lasty = centery + currRadius;
            } else if (currangle > 90 && currangle < 180) {
                lastx = centerx - Math.cos((Math.PI / 180) * (180 - currangle)) * currRadius;
                lasty = centery + Math.sin((Math.PI / 180) * (180 - currangle)) * currRadius;
            } else if (currangle == 180) {
                lastx = centerx - currRadius;
                lasty = centery;
            } else if (currangle > 180 && currangle < 270) {
                lastx = centerx + Math.cos((Math.PI / 180) * (currangle - 180)) * currRadius;
                lasty = centery + Math.sin((Math.PI / 180) * (currangle - 180)) * currRadius;
            } else if (currangle == 270) {
                lastx = centerx;
                lasty = centery - currRadius;
            } else if (currangle > 270 && currangle < 360) {
                lastx = centerx - Math.cos((Math.PI / 180) * (360 - currangle)) * currRadius;
                lasty = centery + Math.sin((Math.PI / 180) * (360 - currangle)) * currRadius;
            }
            lastangle = currangle;
        }
        if (founddelta == 0) {
            pieChartProps.DeltaX = 0;
            pieChartProps.DeltaY = 0;
            pieChartProps.DeltaI = -1;
        }
    }, canvasid);
    registerWindowDrawFunction(windowid, function (canvasid2, windowid2) {
        var pieChartProps = getPieChartProps(canvasid2, windowid2);
        var currRadius = pieChartProps.CurrentRadius;
        if (pieChartProps.AlreadyUnregisteredAnimation == 0 && currRadius >= (pieChartProps.Height - pieChartProps.TitleTextHeight - 24 - (pieChartProps.LabelTextHeight * 2)) / 2) {
            pieChartProps.AlreadyUnregisteredAnimation = 1;
            unregisterAnimatedWindow(canvasid2);
        }
        var data = pieChartProps.Data;
        var centerx = pieChartProps.X + (pieChartProps.Width - (currRadius * 2)) / 2 + currRadius;
        var centery = pieChartProps.Y + 16 + pieChartProps.TitleTextHeight + pieChartProps.LabelTextHeight + currRadius;
        var ctx = getCtx(canvasid2);
        ctx.save();
        ctx.fillStyle = pieChartProps.TitleTextColor;
        ctx.font = pieChartProps.TitleTextFontString;
        ctx.fillText(pieChartProps.Title, pieChartProps.X + (pieChartProps.Width - ctx.measureText(pieChartProps.Title).width) / 2,
            pieChartProps.Y + 4 + pieChartProps.TitleTextHeight);
        ctx.font = pieChartProps.LabelTextFontString;
        var currangle = 0; //in degrees
        var lastangle = 0;
        var lastx = centerx + currRadius;
        var lasty = centery;
        for (i = 0; i < data.length; i++) {
            currangle += (data[i][1] * 100 * 360) / (totalvalue * 100);
            var redcomp = parseInt(data[i][2].substr(1, 2), 16);
            var greencomp = parseInt(data[i][2].substr(3, 2), 16);
            var bluecomp = parseInt(data[i][2].substr(5, 2), 16);
            var gradient = ctx.createRadialGradient(centerx, centery, 0, centerx, centery, currRadius);
            gradient.addColorStop(0.0, '#' + gethighcomp(redcomp) + gethighcomp(greencomp) + gethighcomp(bluecomp));
            gradient.addColorStop(0.5, data[i][2]);
            gradient.addColorStop(1.0, '#' + getlowcomp(redcomp) + getlowcomp(greencomp) + getlowcomp(bluecomp));
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(centerx + (pieChartProps.DeltaI == i ? pieChartProps.DeltaX : 0), centery + (pieChartProps.DeltaI == i ?
                pieChartProps.DeltaY : 0));
            ctx.arc(centerx + (pieChartProps.DeltaI == i ? pieChartProps.DeltaX : 0), centery + (pieChartProps.DeltaI == i ?
                pieChartProps.DeltaY : 0), currRadius, (Math.PI / 180) * lastangle, (Math.PI / 180) * currangle, false);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = data[i][2];
            if (currangle < 90) {
                lastx = centerx + Math.cos((Math.PI / 180) * currangle) * currRadius;
                lasty = centery + Math.sin((Math.PI / 180) * currangle) * currRadius;
            } else if (currangle == 90) {
                lastx = centerx;
                lasty = centery + currRadius;
            } else if (currangle > 90 && currangle < 180) {
                lastx = centerx - Math.cos((Math.PI / 180) * (180 - currangle)) * currRadius;
                lasty = centery + Math.sin((Math.PI / 180) * (180 - currangle)) * currRadius;
            } else if (currangle == 180) {
                lastx = centerx - currRadius;
                lasty = centery;
            } else if (currangle > 180 && currangle < 270) {
                lastx = centerx + Math.cos((Math.PI / 180) * (currangle - 180)) * currRadius;
                lasty = centery + Math.sin((Math.PI / 180) * (currangle - 180)) * currRadius;
            } else if (currangle == 270) {
                lastx = centerx;
                lasty = centery - currRadius;
            } else if (currangle > 270 && currangle < 360) {
                lastx = centerx - Math.cos((Math.PI / 180) * (360 - currangle)) * currRadius;
                lasty = centery + Math.sin((Math.PI / 180) * (360 - currangle)) * currRadius;
            }
            lastangle = currangle;
        }
        if (currRadius < (pieChartProps.Height - pieChartProps.TitleTextHeight - 24 - (pieChartProps.LabelTextHeight * 2)) / 2) {
            pieChartProps.CurrentRadius += 5;
        }
        var currangle = 0;
        var lastangle = 0;
        var lastx = centerx + currRadius;
        var lasty = 250;
        ctx.font = pieChartProps.LabelTextFontString;
        for (i = 0; i < data.length; i++) {
            currangle += (data[i][1] * 100 * 360) / (totalvalue * 100);
            ctx.fillStyle = data[i][2];
            drawPieChartLabels(ctx, data[i][0], currangle, lastangle, currRadius, totalvalue, data[i][1], data[i][2], 0, 0, centerx +
                (pieChartProps.DeltaI == i ? pieChartProps.DeltaX : 0), centery + (pieChartProps.DeltaI == i ?
                pieChartProps.DeltaY : 0), pieChartProps.LabelTextHeight);
            lastangle = currangle;
        }
        for (o = 0; o < data.length; o++) {
            ctx.fillStyle = data[o][2];
            ctx.fillRect(pieChartProps.X + pieChartProps.Width - 100, pieChartProps.Y + pieChartProps.Height
                - 8 - pieChartProps.LabelTextHeight - (o * (8 + pieChartProps.LabelTextHeight)), 30, pieChartProps.LabelTextHeight);
            ctx.fillStyle = data[o][2];
            ctx.fillText(data[o][0], pieChartProps.X + pieChartProps.Width - 100 + 35, pieChartProps.Y + pieChartProps.Height
                - 8 - (o * (8 + pieChartProps.LabelTextHeight)));
        }
        ctx.restore();
    }, canvasid);
    registerAnimatedWindow(canvasid);
    return windowid;
}

function drawPieChartLabels(ctx, datastr, currangle, lastangle, currRadius, totalvalue, value, color, deltax, deltay, centerx, centery, textheight) {
    ctx.fillStyle = color;
    if ((((currangle - lastangle) / 2) + lastangle) < 90) {
        ctx.fillText(value.toString(), centerx + 5 + deltax + Math.cos((Math.PI / 180) * (((currangle - lastangle) / 2) + lastangle)) * currRadius,
                    centery + deltay + Math.sin((Math.PI / 180) * (((currangle - lastangle) / 2) + lastangle)) * currRadius);
    } else if ((((currangle - lastangle) / 2) + lastangle) == 90) {
        ctx.fillText(value.toString(), centerx + 5 + deltax + Math.cos((Math.PI / 180) * (((currangle - lastangle) / 2) + lastangle)) * currRadius,
                    centery + deltay + Math.sin((Math.PI / 180) * (((currangle - lastangle) / 2) + lastangle)) * currRadius);
    } else if ((((currangle - lastangle) / 2) + lastangle) > 90 && (((currangle - lastangle) / 2) + lastangle) < 180) {
        tw = ctx.measureText(value.toString()).width;
        ctx.fillText(value.toString(), centerx + deltax - tw - Math.cos((Math.PI / 180) * (180 - (((currangle - lastangle) / 2) + lastangle))) * currRadius,
                    centery + textheight + deltay + Math.sin((Math.PI / 180) * (180 - (((currangle - lastangle) / 2) + lastangle))) * currRadius);
    } else if ((((currangle - lastangle) / 2) + lastangle) == 180) {
        ctx.fillText(value.toString(), centerx + deltax - Math.cos((Math.PI / 180) * (180 - (((currangle - lastangle) / 2) + lastangle))) * currRadius,
                    centery + textheight + deltay + Math.sin((Math.PI / 180) * (180 - (((currangle - lastangle) / 2) + lastangle))) * currRadius);
    } else if ((((currangle - lastangle) / 2) + lastangle) > 180 && (((currangle - lastangle) / 2) + lastangle) < 270) {
        tw = ctx.measureText(value.toString()).width;
        ctx.fillText(value.toString(), centerx - textheight + deltax - tw - Math.cos((Math.PI / 180) * ((((currangle - lastangle) / 2) + lastangle) - 180)) * currRadius,
                    centery + deltay - Math.sin((Math.PI / 180) * ((((currangle - lastangle) / 2) + lastangle) - 180)) * currRadius);
    } else if ((((currangle - lastangle) / 2) + lastangle) == 270) {
        tw = ctx.measureText(value.toString()).width;
        ctx.fillText(value.toString(), centerx - textheight + deltax - tw - Math.cos((Math.PI / 180) * ((((currangle - lastangle) / 2) + lastangle) - 180)) * currRadius,
                    centery + deltay - Math.sin((Math.PI / 180) * ((((currangle - lastangle) / 2) + lastangle) - 180)) * currRadius);
    } else if ((((currangle - lastangle) / 2) + lastangle) > 270 && (((currangle - lastangle) / 2) + lastangle) < 360) {
        ctx.fillText(value.toString(), centerx + textheight + deltax + Math.cos((Math.PI / 180) * (360 - (((currangle - lastangle) / 2) + lastangle))) * currRadius,
                    centery + deltay - Math.sin((Math.PI / 180) * (360 - (((currangle - lastangle) / 2) + lastangle))) * currRadius);
    }
}

//Line Graph code starts here

var lineGraphsPropsArray = new Array();

function getLineGraphProps(canvasid, windowid) {
    for (var i = 0; i < lineGraphsPropsArray.length; i++) {
        if (lineGraphsPropsArray[i].CanvasID == canvasid && lineGraphsPropsArray[i].WindowID == windowid) {
            return lineGraphsPropsArray[i];
        }
    }
}

function createLineGraph(canvasid, controlNameId, x, y, width, height, depth, data, xmaxvalue, nummarksx, ymaxvalue, nummarksy, title,
    titletextcolor, titletextheight, titletextfontstring, axislabelstextcolor, axislabelstextheight, axislabelstextfontstring,
    clickFunction, marginleft, islabeledxvalues) {
    var windowid = createWindow(canvasid, x, y, width, height, depth, null, 'LineGraph', controlNameId);
    var hmax = 0;
    for (j = 0; j < data.length; j++) {
        if (data[j][0].length > hmax)
            hmax = data[j][0].length;
    }
    lineGraphsPropsArray.push({
        CanvasID: canvasid, WindowID: windowid, X: x, Y: y, Width: width, Height: height, Data: data,
        XMaxValue: xmaxvalue, NumMarksX: nummarksx, YMaxValue: ymaxvalue, NumMarksY: nummarksy, Title: title,
        TitleTextColor: titletextcolor, TitleTextHeight: titletextheight, TitleTextFontString: titletextfontstring,
        AxisLabelsTextColor: axislabelstextcolor, AxisLabelsTextHeight: axislabelstextheight, AxisLabelsTextFontString: axislabelstextfontstring,
        H: 2, HMax: hmax, LineXYs: new Array(), ClickFunction: clickFunction, AlreadyUnregisteredAnimation: 0, MarginLeft: marginleft,
        IsLabeledXValues: islabeledxvalues
    });
    registerClickFunction(windowid, function (canvasid1, windowid1) {
        var lineGraphProps = getLineGraphProps(canvasid1, windowid1);
        if (lineGraphProps.ClickFunction != null) {
            var data = lineGraphProps.Data;
            var linexys = lineGraphProps.LineXYs;
            var ctx = getCtx(canvasid1);
            var clickx = event.pageX - canvas.offsetLeft;
            var clicky = event.pageY - canvas.offsetTop;
            for (i = 0; i < linexys.length; i++) {
                for (j = 0; j < linexys[i].length - 1; j++) {
                    if (clickx >= linexys[i][j][0] && clickx <= linexys[i][j + 1][0]) {
                        if ((clicky <= linexys[i][j][1] && clicky >= linexys[i][j + 1][1]) || (clicky >= linexys[i][j][1] && clicky <= linexys[i][j + 1][1])) {
                            y = (((linexys[i][j][1] - linexys[i][j + 1][1]) * (clickx - linexys[i][j][0])) / (linexys[i][j][0] - linexys[i][j + 1][0])) + linexys[i][j][1];
                            if (y + 4 > clicky && y - 4 < clicky) {
                                lineGraphProps.ClickFunction(canvasid1, windowid1, i);
                            }
                        }
                    }
                }
            }
        }
    }, canvasid);
    registerWindowDrawFunction(windowid, function (canvasid2, windowid2) {
        var lineGraphProps = getLineGraphProps(canvasid2, windowid2);
        if (lineGraphProps.AlreadyUnregisteredAnimation == 0 && lineGraphProps.H > lineGraphProps.HMax) {
            lineGraphProps.AlreadyUnregisteredAnimation = 1;
            unregisterAnimatedWindow(canvasid2);
        }
        lineGraphProps.LineXYs = new Array();
        var ctx = getCtx(canvasid2);
        ctx.save();
        ctx.fillStyle = lineGraphProps.TitleTextColor;
        ctx.font = lineGraphProps.TitleTextFontString;
        ctx.fillText(lineGraphProps.Title, lineGraphProps.X + (lineGraphProps.Width - ctx.measureText(lineGraphProps.Title).width) / 2,
            lineGraphProps.Y + lineGraphProps.TitleTextHeight + 4);
        ctx.fillStyle = '#A0A0A0';
        ctx.font = lineGraphProps.AxisLabelsTextFontString;
        ctx.beginPath();
        ctx.moveTo(lineGraphProps.X + lineGraphProps.MarginLeft, lineGraphProps.Y + lineGraphProps.Height - lineGraphProps.AxisLabelsTextHeight - 8);
        ctx.lineTo(lineGraphProps.X + lineGraphProps.MarginLeft, lineGraphProps.Y + lineGraphProps.TitleTextHeight + 8);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(lineGraphProps.X + lineGraphProps.MarginLeft, lineGraphProps.Y + lineGraphProps.Height - lineGraphProps.AxisLabelsTextHeight - 8);
        ctx.lineTo(lineGraphProps.X + lineGraphProps.Width, lineGraphProps.Y + lineGraphProps.Height - lineGraphProps.AxisLabelsTextHeight - 8);
        ctx.stroke();
        var alternate = false;
        for (c = 0; c < lineGraphProps.NumMarksX; c++) {
            if (alternate) {
                ctx.fillStyle = '#C0C0C0';
                alternate = false;
            } else {
                ctx.fillStyle = '#D0D0D0';
                alternate = true;
            }
            ctx.fillRect(lineGraphProps.X + lineGraphProps.MarginLeft + c * ((lineGraphProps.Width - lineGraphProps.MarginLeft) / lineGraphProps.NumMarksX),
                lineGraphProps.Y + lineGraphProps.TitleTextHeight + 8, ((lineGraphProps.Width - lineGraphProps.MarginLeft) / lineGraphProps.NumMarksX),
                lineGraphProps.Height - lineGraphProps.TitleTextHeight - lineGraphProps.AxisLabelsTextHeight - 16);
        }
        ctx.fillStyle = lineGraphProps.AxisLabelsTextColor;
        ctx.font = lineGraphProps.AxisLabelsTextFontString;
        ctx.strokeStyle = '#404040';
        for (c = 0; c < lineGraphProps.NumMarksY; c++) {
            var val = (lineGraphProps.YMaxValue / lineGraphProps.NumMarksY) * c;
            var tw = ctx.measureText(val.toString()).width;
            ctx.fillText(val.toString(), lineGraphProps.X + lineGraphProps.MarginLeft - 4 - tw, lineGraphProps.Y + lineGraphProps.Height -
                lineGraphProps.AxisLabelsTextHeight - 8 - (c * ((lineGraphProps.Height - lineGraphProps.TitleTextHeight - lineGraphProps.AxisLabelsTextHeight -
                16) / lineGraphProps.NumMarksY)));
            ctx.beginPath();
            ctx.moveTo(lineGraphProps.X + lineGraphProps.MarginLeft - 3, lineGraphProps.Y + lineGraphProps.Height -
                lineGraphProps.AxisLabelsTextHeight - 8 - (c * ((lineGraphProps.Height - lineGraphProps.TitleTextHeight - lineGraphProps.AxisLabelsTextHeight -
                16) / lineGraphProps.NumMarksY)));
            ctx.lineTo(lineGraphProps.X + lineGraphProps.Width, lineGraphProps.Y + lineGraphProps.Height -
                lineGraphProps.AxisLabelsTextHeight - 8 - (c * ((lineGraphProps.Height - lineGraphProps.TitleTextHeight - lineGraphProps.AxisLabelsTextHeight -
                16) / lineGraphProps.NumMarksY)));
            ctx.stroke();
        }
        var xlabels;
        if (lineGraphProps.IsLabeledXValues == 1) {
            xlabels = new Array();
            var maxnumlabels = 0;
            for (var i = 0; i < lineGraphProps.Data.length; i++) {
                if (lineGraphProps.Data[i][0].length > maxnumlabels) {
                    maxnumlabels = lineGraphProps.Data[i][0].length;
                }
            }
            for (var i = 0; i < maxnumlabels; i++) {
                for (var j = 0; j < lineGraphProps.Data.length; j++) {
                    if (i < lineGraphProps.Data[j][0].length) {
                        var foundlabel = 0;
                        for (var p = 0; p < xlabels.length; p++) {
                            if (xlabels[p] == lineGraphProps.Data[j][0][i][0]) {
                                foundlabel = 1;
                                break;
                            }
                        }
                        if (foundlabel == 0) {
                            xlabels.push(lineGraphProps.Data[j][0][i][0]);
                        }
                    }
                }
            }
        }
        for (d = 0; d < lineGraphProps.NumMarksX; d++) {
            var val;
            var increment;
            if (lineGraphProps.IsLabeledXValues == 1) {
                increment =  xlabels.length / lineGraphProps.NumMarksX;
                if (xlabels.length % lineGraphProps.NumMarksX >= lineGraphProps.NumMarksX / 2) {
                    val = xlabels[d * Math.ceil(increment)];
                } else {
                    val = xlabels[d * Math.floor(increment)];
                }
            } else {
                val = (lineGraphProps.XMaxValue / lineGraphProps.NumMarksX) * d;
            }
            var tw = ctx.measureText(val.toString()).width;
            ctx.fillText(val.toString(), lineGraphProps.X + lineGraphProps.MarginLeft + ((d * (lineGraphProps.Width - lineGraphProps.MarginLeft))
                / lineGraphProps.NumMarksX) - (tw / 2), lineGraphProps.Y + lineGraphProps.Height - 4);
            ctx.beginPath();
            ctx.moveTo(lineGraphProps.X + lineGraphProps.MarginLeft + ((d * (lineGraphProps.Width - lineGraphProps.MarginLeft)) / lineGraphProps.NumMarksX),
                lineGraphProps.Y + lineGraphProps.Height - lineGraphProps.AxisLabelsTextHeight - 5);
            ctx.lineTo(lineGraphProps.X + lineGraphProps.MarginLeft + ((d * (lineGraphProps.Width - lineGraphProps.MarginLeft)) / lineGraphProps.NumMarksX),
                lineGraphProps.Y + lineGraphProps.TitleTextHeight + 8);
            ctx.stroke();
        }
        var i = 0;
        while (i < data.length) {
            drawline(canvasid, ctx, lineGraphProps, i, xlabels);
            i++;
        }
        if (lineGraphProps.H < lineGraphProps.HMax) {
            lineGraphProps.H += 1;
        }
        ctx.restore();
    }, canvasid);
    registerAnimatedWindow(canvasid);
    return windowid;
}

function findXLabelIndexForValue(xlabels, val) {
    for (var i = 0; i < xlabels.length; i++) {
        if (xlabels[i] == val) {
            return i;
        }
    }
}

function drawline(canvasid, ctx, lineGraphProps, x, xlabels) {
    var redcomp = parseInt(lineGraphProps.Data[x][1].substr(1, 2), 16);
    var greencomp = parseInt(lineGraphProps.Data[x][1].substr(3, 2), 16);
    var bluecomp = parseInt(lineGraphProps.Data[x][1].substr(5, 2), 16);
    ctx.strokeStyle = lineGraphProps.Data[x][1];
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.miterLimit = 0.0;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#' + getlowcomp(redcomp).toString(16) + getlowcomp(greencomp).toString(16) + getlowcomp(bluecomp).toString(16);
    ctx.beginPath();
    var linexys = new Array();
    linexys = linexys.concat([[lineGraphProps.X + lineGraphProps.MarginLeft + (lineGraphProps.IsLabeledXValues == 1 ?
        (findXLabelIndexForValue(xlabels, lineGraphProps.Data[x][0][0][0]) *
        (lineGraphProps.Width - lineGraphProps.MarginLeft)) / xlabels.length :
        ((lineGraphProps.Data[x][0][0][0] * (lineGraphProps.Width - lineGraphProps.MarginLeft)) / lineGraphProps.XMaxValue)),
        lineGraphProps.Y + lineGraphProps.Height - lineGraphProps.AxisLabelsTextHeight - 8 -
        ((lineGraphProps.Data[x][0][0][1] * (lineGraphProps.Height - lineGraphProps.TitleTextHeight - lineGraphProps.AxisLabelsTextHeight - 16)) /
        lineGraphProps.YMaxValue)]]);
    ctx.moveTo(lineGraphProps.X + lineGraphProps.MarginLeft + (lineGraphProps.IsLabeledXValues == 1 ? 
        (findXLabelIndexForValue(xlabels, lineGraphProps.Data[x][0][0][0]) *
        (lineGraphProps.Width - lineGraphProps.MarginLeft)) / xlabels.length : ((lineGraphProps.Data[x][0][0][0] * (lineGraphProps.Width -
        lineGraphProps.MarginLeft)) / lineGraphProps.XMaxValue)),
        lineGraphProps.Y + lineGraphProps.Height - lineGraphProps.AxisLabelsTextHeight - 8 - ((lineGraphProps.Data[x][0][0][1] *
        (lineGraphProps.Height - lineGraphProps.TitleTextHeight - lineGraphProps.AxisLabelsTextHeight - 16)) /
        lineGraphProps.YMaxValue));
    for (i = 1; i < lineGraphProps.H && i < lineGraphProps.Data[x][0].length; i++) {
        linexys = linexys.concat([[lineGraphProps.X + lineGraphProps.MarginLeft + (lineGraphProps.IsLabeledXValues == 1 ?
            (findXLabelIndexForValue(xlabels, lineGraphProps.Data[x][0][i][0]) * (lineGraphProps.Width - lineGraphProps.MarginLeft)) / xlabels.length :
            ((lineGraphProps.Data[x][0][i][0] * (lineGraphProps.Width - lineGraphProps.MarginLeft)) / lineGraphProps.XMaxValue)),
            lineGraphProps.Y + lineGraphProps.Height - lineGraphProps.AxisLabelsTextHeight - 8 - ((lineGraphProps.Data[x][0][i][1] *
            (lineGraphProps.Height - lineGraphProps.TitleTextHeight - lineGraphProps.AxisLabelsTextHeight - 16)) / lineGraphProps.YMaxValue)]]);
        ctx.lineTo(lineGraphProps.X + lineGraphProps.MarginLeft + (lineGraphProps.IsLabeledXValues == 1 ? (findXLabelIndexForValue(xlabels,
            lineGraphProps.Data[x][0][i][0]) * (lineGraphProps.Width - lineGraphProps.MarginLeft)) / xlabels.length :
            ((lineGraphProps.Data[x][0][i][0] * (lineGraphProps.Width - lineGraphProps.MarginLeft)) / lineGraphProps.XMaxValue)),
            lineGraphProps.Y + lineGraphProps.Height - lineGraphProps.AxisLabelsTextHeight - 8 - ((lineGraphProps.Data[x][0][i][1] *
            (lineGraphProps.Height - lineGraphProps.TitleTextHeight - lineGraphProps.AxisLabelsTextHeight - 16)) / lineGraphProps.YMaxValue));
    }
    lineGraphProps.LineXYs.concat([[linexys]]);
    ctx.stroke();
}

//Gauage Chart code starts here

var gaugeChartPropsArray = new Array();

function getGaugeChartProps(canvasid, windowid) {
    for (var i = 0; i < gaugeChartPropsArray.length; i++) {
        if (gaugeChartPropsArray[i].CanvasID == canvasid && gaugeChartPropsArray[i].WindowID == windowid) {
            return gaugeChartPropsArray[i];
        }
    }
}

function createGauge(canvasid, controlNameId, x, y, width, height, depth, data, title, titletextcolor, titletextheight, titletextfontstring, gaugeradius,
    gaugelabeltextcolor, gaugelabeltextheight, gaugelabeltextfontstring) {
    var windowid = createWindow(canvasid, x, y, width, height, depth, null, 'Gauge', controlNameId);
    gaugeChartPropsArray.push({
        CanvasID: canvasid, WindowID: windowid, X: x, Y: y, Width: width, Height: height, Data: data,
        Title: title, TitleTextColor: titletextcolor, TitleTextHeight: titletextheight, TitleTextFontString: titletextfontstring,
        H: 1, CenterX: x + width / 2, CenterY: y + (height - 8 - titletextheight) / 2 + (height - 8 - titletextheight - (gaugeradius * 2)) / 2,
        GaugeRadius: gaugeradius, GaugeLabelTextColor: gaugelabeltextcolor, GaugeLabelTextHeight: gaugelabeltextheight,
        GaugeLabelTextFontString: gaugelabeltextfontstring, AlreadyUnregisteredAnimation: 0
    });
    registerWindowDrawFunction(windowid, function (canvasid1, windowid1) {
        var gaugeChartProps = getGaugeChartProps(canvasid1, windowid1);
        var ctx = getCtx(canvasid1);
        if (gaugeChartProps.AlreadyUnregisteredAnimation == 0 && gaugeChartProps.H > 100) {
            gaugeChartProps.AlreadyUnregisteredAnimation = 1;
            unregisterAnimatedWindow(canvaisd1);
        }
        ctx.save();
        ctx.globalAlpha = gaugeChartProps.H / 100;
        ctx.fillStyle = gaugeChartProps.TitleTextColor;
        ctx.font = gaugeChartProps.TitleTextFontString;
        ctx.fillText(gaugeChartProps.Title, gaugeChartProps.X + ((gaugeChartProps.Width - ctx.measureText(title).width) / 2),
            gaugeChartProps.Y + gaugeChartProps.TitleTextHeight + 4);
        var gradient = ctx.createRadialGradient(gaugeChartProps.CenterX, gaugeChartProps.CenterY, 0, gaugeChartProps.CenterX,
            gaugeChartProps.CenterY, gaugeChartProps.GaugeRadius - 5);
        gradient.addColorStop(0.0, '#C0C0C0');
        gradient.addColorStop(0.5, '#A0A0A0');
        gradient.addColorStop(1.0, '#D0D0D0');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(gaugeChartProps.CenterX, gaugeChartProps.CenterY, gaugeChartProps.GaugeRadius, 0, 2 * Math.PI, false);
        ctx.arc(gaugeChartProps.CenterX, gaugeChartProps.CenterY, gaugeChartProps.GaugeRadius - 5, 0, 2 * Math.PI, true);
        ctx.closePath();
        ctx.fill();
        var gradient2 = ctx.createRadialGradient(gaugeChartProps.CenterX, gaugeChartProps.CenterY, 0, gaugeChartProps.CenterX,
            gaugeChartProps.CenterY, gaugeChartProps.GaugeRadius - 5);
        gradient2.addColorStop(0.0, '#0000C0');
        gradient2.addColorStop(0.5, '#0000A0');
        gradient2.addColorStop(1.0, '#0000D0');
        ctx.fillStyle = gradient2;
        ctx.beginPath();
        ctx.arc(gaugeChartProps.CenterX, gaugeChartProps.CenterY, gaugeChartProps.GaugeRadius - 5, 0, 2 * Math.PI, false);
        ctx.fill();
        if (gaugeChartProps.H < 60)
            ctx.globalAlpha = 0.0;
        else
            ctx.globalAlpha = (gaugeChartProps.H - 60) / 100;
        var gradient3 = ctx.createRadialGradient(gaugeChartProps.CenterX, gaugeChartProps.CenterY, gaugeChartProps.GaugeRadius - 50,
            gaugeChartProps.CenterX, gaugeChartProps.CenterY, gaugeChartProps.GaugeRadius - 5);
        gradient3.addColorStop(0.0, '#000000');
        gradient3.addColorStop(1.0, '#FFFFFF');
        ctx.fillStyle = gradient3;
        ctx.beginPath();
        ctx.moveTo(gaugeChartProps.CenterX - (Math.sin(Math.PI / 8) * (gaugeChartProps.GaugeRadius - 10)),
            gaugeChartProps.CenterY + (Math.cos(Math.PI / 8) * (gaugeChartProps.GaugeRadius - 10)));
        ctx.arc(gaugeChartProps.CenterX, gaugeChartProps.CenterY, gaugeChartProps.GaugeRadius - 10, (Math.PI / 180) * 112.5, (Math.PI / 180) * 67.5, false);
        ctx.lineTo(gaugeChartProps.CenterX + (Math.sin(Math.PI / 8) * (gaugeChartProps.GaugeRadius - 50)),
            gaugeChartProps.CenterY + (Math.cos(Math.PI / 8) * (gaugeChartProps.GaugeRadius - 50)));
        ctx.arc(gaugeChartProps.CenterX, gaugeChartProps.CenterY, gaugeChartProps.GaugeRadius - 50, (Math.PI / 180) * 67.5, (Math.PI / 180) * 112.5, true);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = gaugeChartProps.H / 100;
        ctx.strokeStyle = '#000000';
        for (i = 0; i < ((gaugeChartProps.Data[1] / gaugeChartProps.Data[5]) + 1) ; i++) {
            var angle = ((315 * i) / (gaugeChartProps.Data[1] / gaugeChartProps.Data[5])) + 112.5;
            if (angle > 360)
                angle -= 360;
            ctx.beginPath();
            if (angle == 0) {
                ctx.moveTo(gaugeChartProps.CenterX + (gaugeChartProps.GaugeRadius - 45), gaugeChartProps.CenterY);
                ctx.lineTo(gaugeChartProps.CenterX + (gaugeChartProps.GaugeRadius - 25), gaugeChartProps.CenterY);
            } else if (angle > 0 && angle < 90) {
                ctx.moveTo(gaugeChartProps.CenterX + (Math.cos((Math.PI / 180) * angle) * (gaugeChartProps.GaugeRadius - 45)),
                    gaugeChartProps.CenterY + (Math.sin((Math.PI / 180) * angle) * (gaugeChartProps.GaugeRadius - 45)));
                ctx.lineTo(gaugeChartProps.CenterX + (Math.cos((Math.PI / 180) * angle) * (gaugeChartProps.GaugeRadius - 25)),
                    gaugeChartProps.CenterY + (Math.sin((Math.PI / 180) * angle) * (gaugeChartProps.GaugeRadius - 25)));
            } else if (angle == 90) {
                ctx.moveTo(gaugeChartProps.CenterX, gaugeChartProps.CenterY + (gaugeChartProps.GaugeRadius - 45));
                ctx.lineTo(gaugeChartProps.CenterX, gaugeChartProps.CenterY + (gaugeChartProps.GaugeRadius - 25));
            } else if (angle > 90 && angle < 180) {
                angle = 180 - angle;
                ctx.moveTo(gaugeChartProps.CenterX - (Math.cos((Math.PI / 180) * angle) * (gaugeChartProps.GaugeRadius - 45)),
                    gaugeChartProps.CenterY + (Math.sin((Math.PI / 180) * angle) * (gaugeChartProps.GaugeRadius - 45)));
                ctx.lineTo(gaugeChartProps.CenterX - (Math.cos((Math.PI / 180) * angle) * (gaugeChartProps.GaugeRadius - 25)),
                    gaugeChartProps.CenterY + (Math.sin((Math.PI / 180) * angle) * (gaugeChartProps.GaugeRadius - 25)));
            } else if (angle == 180) {
                ctx.moveTo(gaugeChartProps.CenterX - (gaugeChartProps.GaugeRadius - 45), gaugeChartProps.CenterY);
                ctx.lineTo(gaugeChartProps.CenterX - (gaugeChartProps.GaugeRadius - 25), gaugeChartProps.CenterY);
            } else if (angle > 180 && angle < 270) {
                angle = angle - 180;
                ctx.moveTo(gaugeChartProps.CenterX - (Math.cos((Math.PI / 180) * angle) * (gaugeChartProps.GaugeRadius - 45)),
                    gaugeChartProps.CenterY - (Math.sin((Math.PI / 180) * angle) * (gaugeChartProps.GaugeRadius - 45)));
                ctx.lineTo(gaugeChartProps.CenterX - (Math.cos((Math.PI / 180) * angle) * (gaugeChartProps.GaugeRadius - 25)),
                    gaugeChartProps.CenterY - (Math.sin((Math.PI / 180) * angle) * (gaugeChartProps.GaugeRadius - 25)));
            } else if (angle == 270) {
                ctx.moveTo(gaugeChartProps.CenterX, gaugeChartProps.CenterY - (gaugeChartProps.GaugeRadius - 45));
                ctx.lineTo(gaugeChartProps.CenterX, gaugeChartProps.CenterY - (gaugeChartProps.GaugeRadius - 25));
            } else if (angle > 270 && angle < 360) {
                angle = angle - 270;
                ctx.moveTo(gaugeChartProps.CenterX + (Math.sin((Math.PI / 180) * angle) * (gaugeChartProps.GaugeRadius - 45)),
                    gaugeChartProps.CenterY - (Math.cos((Math.PI / 180) * angle) * (gaugeChartProps.GaugeRadius - 45)));
                ctx.lineTo(gaugeChartProps.CenterX + (Math.sin((Math.PI / 180) * angle) * (gaugeChartProps.GaugeRadius - 25)),
                    gaugeChartProps.CenterY - (Math.cos((Math.PI / 180) * angle) * (gaugeChartProps.GaugeRadius - 25)));
            }
            ctx.stroke();
        }
        ctx.fillStyle = gaugeChartProps.GaugeLabelTextColor;
        ctx.font = gaugeChartProps.GaugeLabelTextFontString;
        for (i = 0; i < ((gaugeChartProps.Data[1] / gaugeChartProps.Data[5]) + 1) ; i++) {
            var angle = ((315 * i) / (gaugeChartProps.Data[1] / gaugeChartProps.Data[5])) + 112.5;
            if (angle > 360)
                angle -= 360;
            var txttodisplay = (i * gaugeChartProps.Data[5]).toString();
            var textwidth = ctx.measureText(txttodisplay).width;
            var textheight = gaugeChartProps.GaugeLabelTextHeight;
            if (angle == 0) {
                ctx.fillText(txttodisplay, gaugeChartProps.CenterX + (gaugeChartProps.GaugeRadius - 52) - ctx.measureText(txttodisplay).width, gaugeChartProps.CenterY);
            } else if (angle > 0 && angle < 90) {
                ctx.fillText(txttodisplay, gaugeChartProps.CenterX - textwidth + (Math.cos((Math.PI / 180) * angle) * (gaugeChartProps.GaugeRadius - 52)),
                    gaugeChartProps.CenterY + (Math.sin((Math.PI / 180) * angle) * (gaugeChartProps.GaugeRadius - 52)));
            } else if (angle == 90) {
                ctx.fillText(txttodisplay, gaugeChartProps.CenterX - (textwidth / 2), gaugeChartProps.CenterY + (gaugeChartProps.GaugeRadius - 52) - textheight);
            } else if (angle > 90 && angle < 180) {
                angle = 180 - angle;
                ctx.fillText(txttodisplay, gaugeChartProps.CenterX - (Math.cos((Math.PI / 180) * angle) * (gaugeChartProps.GaugeRadius - 52)),
                    gaugeChartProps.CenterY + (Math.sin((Math.PI / 180) * angle) * (gaugeChartProps.GaugeRadius - 52)));
            } else if (angle == 180) {
                ctx.fillText(txttodisplay, gaugeChartProps.CenterX - (gaugeChartProps.GaugeRadius - 52), gaugeChartProps.CenterY - (textheight / 2));
            } else if (angle > 180 && angle < 270) {
                angle = angle - 180;
                ctx.fillText(txttodisplay, gaugeChartProps.CenterX - (Math.cos((Math.PI / 180) * angle) * (gaugeChartProps.GaugeRadius - 52)),
                    gaugeChartProps.CenterY + textheight - (Math.sin((Math.PI / 180) * angle) * (gaugeChartProps.GaugeRadius - 52)));
            } else if (angle == 270) {
                ctx.fillText(txttodisplay, gaugeChartProps.CenterX - (textwidth / 2), gaugeChartProps.CenterY - (gaugeChartProps.GaugeRadius - 52) + textheight);
            } else if (angle > 270 && angle < 360) {
                angle = angle - 270;
                ctx.fillText(txttodisplay, gaugeChartProps.CenterX + (Math.sin((Math.PI / 180) * angle) * ((gaugeChartProps.GaugeRadius - 52) - textwidth)),
                    gaugeChartProps.CenterY - (Math.cos((Math.PI / 180) * angle) * ((gaugeChartProps.GaugeRadius - 52) - textwidth)));
            }
        }
        ctx.strokeStyle = '#000000';
        for (i = 0; i < ((((gaugeChartProps.Data[1] / gaugeChartProps.Data[5]) * gaugeChartProps.Data[6])) + 1) ; i++) {
            if (i % gaugeChartProps.Data[6] > 0) {
                var angle = ((315 * i) / ((gaugeChartProps.Data[1] / gaugeChartProps.Data[5]) * gaugeChartProps.Data[6])) + 112.5;
                if (angle > 360)
                    angle -= 360;
                ctx.beginPath();
                if (angle == 0) {
                    ctx.moveTo(gaugeChartProps.CenterX + (gaugeChartProps.GaugeRadius - 45), gaugeChartProps.CenterY);
                    ctx.lineTo(gaugeChartProps.CenterX + (gaugeChartProps.GaugeRadius - 35), gaugeChartProps.CenterY);
                } else if (angle > 0 && angle < 90) {
                    ctx.moveTo(gaugeChartProps.CenterX + (Math.cos((Math.PI / 180) * angle) * (gaugeChartProps.GaugeRadius - 45)),
                        gaugeChartProps.CenterY + (Math.sin((Math.PI / 180) * angle) * (gaugeChartProps.GaugeRadius - 45)));
                    ctx.lineTo(gaugeChartProps.CenterX + (Math.cos((Math.PI / 180) * angle) * (gaugeChartProps.GaugeRadius - 35)),
                        gaugeChartProps.CenterY + (Math.sin((Math.PI / 180) * angle) * (gaugeChartProps.GaugeRadius - 35)));
                } else if (angle == 90) {
                    ctx.moveTo(gaugeChartProps.CenterX, gaugeChartProps.CenterY + (gaugeChartProps.GaugeRadius - 45));
                    ctx.lineTo(gaugeChartProps.CenterX, gaugeChartProps.CenterY + (gaugeChartProps.GaugeRadius - 35));
                } else if (angle > 90 && angle < 180) {
                    angle = 180 - angle;
                    ctx.moveTo(gaugeChartProps.CenterX - (Math.cos((Math.PI / 180) * angle) * (gaugeChartProps.GaugeRadius - 45)),
                        gaugeChartProps.CenterY + (Math.sin((Math.PI / 180) * angle) * (gaugeChartProps.GaugeRadius - 45)));
                    ctx.lineTo(gaugeChartProps.CenterX - (Math.cos((Math.PI / 180) * angle) * (gaugeChartProps.GaugeRadius - 35)),
                        gaugeChartProps.CenterY + (Math.sin((Math.PI / 180) * angle) * (gaugeChartProps.GaugeRadius - 35)));
                } else if (angle == 180) {
                    ctx.moveTo(gaugeChartProps.CenterX - (gaugeChartProps.GaugeRadius - 45), gaugeChartProps.CenterY);
                    ctx.lineTo(gaugeChartProps.CenterX - (gaugeChartProps.GaugeRadius - 35), gaugeChartProps.CenterY);
                } else if (angle > 180 && angle < 270) {
                    angle = angle - 180;
                    ctx.moveTo(gaugeChartProps.CenterX - (Math.cos((Math.PI / 180) * angle) * (gaugeChartProps.GaugeRadius - 45)),
                        gaugeChartProps.CenterY - (Math.sin((Math.PI / 180) * angle) * (gaugeChartProps.GaugeRadius - 45)));
                    ctx.lineTo(gaugeChartProps.CenterX - (Math.cos((Math.PI / 180) * angle) * (gaugeChartProps.GaugeRadius - 35)),
                        gaugeChartProps.CenterY - (Math.sin((Math.PI / 180) * angle) * (gaugeChartProps.GaugeRadius - 35)));
                } else if (angle == 270) {
                    ctx.moveTo(gaugeChartProps.CenterX, gaugeChartProps.CenterY - (gaugeChartProps.GaugeRadius - 45));
                    ctx.lineTo(gaugeChartProps.CenterX, gaugeChartProps.CenterY - (gaugeChartProps.GaugeRadius - 35));
                } else if (angle > 270 && angle < 360) {
                    angle = angle - 270;
                    ctx.moveTo(gaugeChartProps.CenterX + (Math.sin((Math.PI / 180) * angle) * (gaugeChartProps.GaugeRadius - 45)),
                        gaugeChartProps.CenterY - (Math.cos((Math.PI / 180) * angle) * (gaugeChartProps.GaugeRadius - 45)));
                    ctx.lineTo(gaugeChartProps.CenterX + (Math.sin((Math.PI / 180) * angle) * (gaugeChartProps.GaugeRadius - 35)),
                        gaugeChartProps.CenterY - (Math.cos((Math.PI / 180) * angle) * (gaugeChartProps.GaugeRadius - 35)));
                }
                ctx.stroke();
            }
        }
        drawarc(ctx, gaugeChartProps.Data[2][2], gaugeChartProps.Data[2][0], gaugeChartProps.Data[2][1], gaugeChartProps.Data[1],
            gaugeChartProps.CenterX, gaugeChartProps.CenterY, gaugeChartProps.GaugeRadius);
        drawarc(ctx, gaugeChartProps.Data[3][2], gaugeChartProps.Data[3][0], gaugeChartProps.Data[3][1], gaugeChartProps.Data[1],
            gaugeChartProps.CenterX, gaugeChartProps.CenterY, gaugeChartProps.GaugeRadius);
        drawarc(ctx, gaugeChartProps.Data[4][2], gaugeChartProps.Data[4][0], gaugeChartProps.Data[4][1], gaugeChartProps.Data[1],
            gaugeChartProps.CenterX, gaugeChartProps.CenterY, gaugeChartProps.GaugeRadius);
        var needleangle = (((315 * gaugeChartProps.Data[7]) / gaugeChartProps.Data[1]) * (gaugeChartProps.H / 100)) + 112.5;
        if (needleangle > 360)
            needleangle -= 360;
        ctx.translate(gaugeChartProps.CenterX, gaugeChartProps.CenterY);
        ctx.rotate((Math.PI / 180) * needleangle);
        var colorstr = '#60007C';
        var gradient5 = ctx.createLinearGradient(0, 0, gaugeChartProps.GaugeRadius - 80, 0);
        var redcomp = parseInt(colorstr.substr(1, 2), 16);
        var greencomp = parseInt(colorstr.substr(3, 2), 16);
        var bluecomp = parseInt(colorstr.substr(5, 2), 16);
        gradient5.addColorStop(0.0, '#' + getlowcomp(redcomp) + getlowcomp(greencomp) + getlowcomp(bluecomp));
        gradient5.addColorStop(0.5, colorstr);
        gradient5.addColorStop(1.0, '#' + gethighcomp(redcomp) + gethighcomp(greencomp) + gethighcomp(bluecomp));
        ctx.fillStyle = gradient5;
        ctx.beginPath();
        ctx.moveTo(0, 10);
        ctx.lineTo(0, -10);
        ctx.lineTo(gaugeChartProps.GaugeRadius - 40, 0);
        ctx.closePath();
        ctx.fill();
        var gradient3 = ctx.createRadialGradient(gaugeChartProps.CenterX, gaugeChartProps.CenterY, 0, gaugeChartProps.CenterX, gaugeChartProps.CenterY, 10);
        gradient3.addColorStop(0.0, '#C0C0C0');
        gradient3.addColorStop(0.5, '#A0A0A0');
        gradient3.addColorStop(1.0, '#D0D0D0');
        ctx.fillStyle = gradient3;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.restore();
        if (gaugeChartProps.H < 100) {
            gaugeChartProps.H++;
        }
    }, canvasid);
    registerAnimatedWindow(canvasid);
    return windowid;
}

function drawarc(ctx, colorstr, startval, endval, maxval, centerx, centery, gaugeradius) {
    var gradient4 = ctx.createRadialGradient(centerx, centery, gaugeradius - 100, centerx, centery, gaugeradius - 80);
    var redcomp = parseInt(colorstr.substr(1, 2), 16);
    var greencomp = parseInt(colorstr.substr(3, 2), 16);
    var bluecomp = parseInt(colorstr.substr(5, 2), 16);
    gradient4.addColorStop(0.0, '#' + getlowcomp(redcomp) + getlowcomp(greencomp) + getlowcomp(bluecomp));
    gradient4.addColorStop(0.5, colorstr);
    gradient4.addColorStop(1.0, '#' + gethighcomp(redcomp) + gethighcomp(greencomp) + gethighcomp(bluecomp));
    ctx.fillStyle = gradient4;
    var minrangeangle = ((315 * startval) / maxval) + 112.5;
    if (minrangeangle > 360)
        minrangeangle -= 360;
    var maxrangeangle = ((315 * endval) / maxval) + 112.5;
    if (maxrangeangle > 360)
        maxrangeangle -= 360;
    ctx.beginPath();
    var angle2 = 0;
    if (minrangeangle == 0) {
        ctx.moveTo(centerx + (gaugeradius - 100), centery);
    } else if (minrangeangle > 0 && minrangeangle < 90) {
        ctx.moveTo(centerx + (Math.cos((Math.PI / 180) * minrangeangle) * (gaugeradius - 100)), centery + (Math.sin((Math.PI / 180) * minrangeangle) * (gaugeradius - 100)));
    } else if (minrangeangle == 90) {
        ctx.moveTo(centerx, centery + (gaugeradius - 100));
    } else if (minrangeangle > 90 && minrangeangle < 180) {
        angle2 = 180 - minrangeangle;
        ctx.moveTo(centerx - (Math.cos((Math.PI / 180) * angle2) * (gaugeradius - 100)), centery + (Math.sin((Math.PI / 180) * angle2) * (gaugeradius - 100)));
    } else if (minrangeangle == 180) {
        ctx.moveTo(centerx - (gaugeradius - 100), centery);
    } else if (minrangeangle > 180 && minrangeangle < 270) {
        angle2 = minrangeangle - 180;
        ctx.moveTo(centerx - (Math.cos((Math.PI / 180) * angle2) * (gaugeradius - 100)), centery - (Math.sin((Math.PI / 180) * angle2) * (gaugeradius - 100)));
    } else if (minrangeangle == 270) {
        ctx.moveTo(centerx, centery - (gaugeradius - 100));
    } else if (minrangeangle > 270 && minrangeangle < 360) {
        angle2 = minrangeangle - 270;
        ctx.moveTo(centerx + (Math.sin((Math.PI / 180) * angle2) * (gaugeradius - 100)), centery - (Math.cos((Math.PI / 180) * angle2) * (gaugeradius - 100)));
    }
    ctx.arc(centerx, centery, (gaugeradius - 100), (Math.PI / 180) * minrangeangle, (Math.PI / 180) * maxrangeangle, false);
    ctx.arc(centerx, centery, (gaugeradius - 80), (Math.PI / 180) * maxrangeangle, (Math.PI / 180) * minrangeangle, true);
    ctx.closePath();
    ctx.fill();
}

//Radar Graph code starts here

var radarGraphPropsArray = new Array();

function getRadarGraphProps(canvasid, windowid) {
    for (var i = 0; i < radarGraphPropsArray.length; i++) {
        if (radarGraphPropsArray[i].CanvasID == canvasid && radarGraphPropsArray[i].WindowID == windowid) {
            return radarGraphPropsArray[i];
        }
    }
}

function createRadarGraph(canvasid, controlNameId, x, y, width, height, depth, data, maxvalue, colorstr, nummarks, title, titletextcolor, titletextheight,
    titletextfontstring, marklabeltextcolor, marklabeltextheight, marklabeltextfontstring) {
    var windowid = createWindow(canvasid, x, y, width, height, depth, null, 'RadarGraph', controlNameId);
    radarGraphPropsArray.push({
        CanvasID: canvasid, WindowID: windowid, X: x, Y: y, Width: width, Height: height, Data: data,
        MaxValue: maxvalue, ColorStr: colorstr, NumMarks: nummarks, Title: title, TitleTextColor: titletextcolor,
        TitleTextHeight: titletextheight, TitleTextFontString: titletextfontstring, H: 20,
        MarkLabelTextColor: marklabeltextcolor, MarkLabelTextHeight: marklabeltextheight, MarkLabelTextFontString: marklabeltextfontstring,
        AlreadyUnregisteredAnimation: 0
    });
    registerWindowDrawFunction(windowid, function (canvasid1, windowid1) {
        var radarGraphProps = getRadarGraphProps(canvasid1, windowid1);
        var ctx = getCtx(canvasid1);
        if (radarGraphProps.AlreadyUnregisteredAnimation == 0 && radarGraphProps.H >= ((radarGraphProps.Height - radarGraphProps.TitleTextHeight
            - 8 - radarGraphProps.MarkLabelTextHeight - 8 - 4) / 2)) {
            radarGraphProps.AlreadyUnregisteredAnimation = 1;
            unregisterAnimatedWindow(canvasid1);
        }
        ctx.save();
        ctx.fillStyle = radarGraphProps.TitleTextColor;
        ctx.font = radarGraphProps.TitleTextFontString;
        ctx.fillText(radarGraphProps.Title, radarGraphProps.X + ((radarGraphProps.Width - ctx.measureText(radarGraphProps.Title).width) / 2),
            radarGraphProps.Y + radarGraphProps.TitleTextHeight + 4);
        ctx.font = radarGraphProps.MarkLabelTextFontString;
        var angleinc = (Math.PI * 360) / (180 * radarGraphProps.Data.length);
        ctx.translate(radarGraphProps.X + (radarGraphProps.Width / 2), radarGraphProps.Y + radarGraphProps.TitleTextHeight + 8 + ((radarGraphProps.Height -
            radarGraphProps.TitleTextHeight - 8 - radarGraphProps.MarkLabelTextHeight - 8) / 2) + radarGraphProps.MarkLabelTextHeight + 8);
        ctx.rotate(Math.PI * 270 / 180);
        var redcomp = parseInt(radarGraphProps.ColorStr.substr(1, 2), 16);
        var greencomp = parseInt(radarGraphProps.ColorStr.substr(3, 2), 16);
        var bluecomp = parseInt(radarGraphProps.ColorStr.substr(5, 2), 16);
        var gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radarGraphProps.H);
        gradient.addColorStop(0.0, '#' + gethighcomp(redcomp) + gethighcomp(greencomp) + gethighcomp(bluecomp));
        gradient.addColorStop(0.5, radarGraphProps.ColorStr);
        gradient.addColorStop(1.0, '#' + getlowcomp(redcomp) + getlowcomp(greencomp) + getlowcomp(bluecomp));
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(radarGraphProps.Data[0] * radarGraphProps.H / radarGraphProps.MaxValue, 0);
        for (var i = 1; i < radarGraphProps.Data.length; i++) {
            ctx.rotate(angleinc);
            ctx.lineTo(radarGraphProps.Data[i] * radarGraphProps.H / radarGraphProps.MaxValue, 0);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.strokeStyle = '#505050';
        ctx.translate(radarGraphProps.X + (radarGraphProps.Width / 2), radarGraphProps.Y + radarGraphProps.TitleTextHeight + 8 + ((radarGraphProps.Height -
            radarGraphProps.TitleTextHeight - 8 - radarGraphProps.MarkLabelTextHeight - 8) / 2) + radarGraphProps.MarkLabelTextHeight + 8);
        ctx.rotate((Math.PI * 270) / 180);
        for (var i = 0; i < radarGraphProps.Data.length; i++) {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(radarGraphProps.H, 0);
            ctx.closePath();
            ctx.stroke();
            var marksinc = radarGraphProps.H / radarGraphProps.NumMarks;
            for (var x = 0; x < radarGraphProps.NumMarks; x++) {
                ctx.beginPath();
                ctx.moveTo((x + 1) * marksinc, 3);
                ctx.lineTo((x + 1) * marksinc, -3);
                ctx.closePath();
                ctx.stroke();
            }
            ctx.rotate(angleinc);
        }
        ctx.restore();
        ctx.fillStyle = radarGraphProps.MarkLabelTextColor;
        ctx.font = radarGraphProps.MarkLabelTextFontString;
        if (radarGraphProps.H == ((radarGraphProps.Height - radarGraphProps.TitleTextHeight - 8 - radarGraphProps.MarkLabelTextHeight - 8 - 4) / 2)) {
            ctx.save();
            ctx.translate(radarGraphProps.X + (radarGraphProps.Width / 2), radarGraphProps.Y + radarGraphProps.TitleTextHeight + 8 + ((radarGraphProps.Height -
                radarGraphProps.TitleTextHeight - 8 - radarGraphProps.MarkLabelTextHeight - 8) / 2) + radarGraphProps.MarkLabelTextHeight + 8);
            for (var i = 0; i < radarGraphProps.NumMarks; i++) {
                var txt = (((i + 1) * radarGraphProps.MaxValue) / radarGraphProps.NumMarks).toString();
                ctx.fillText(txt, -(ctx.measureText(txt).width + 5), (radarGraphProps.MarkLabelTextHeight / 2) - ((i + 1) * (((radarGraphProps.Height -
                    radarGraphProps.TitleTextHeight - 8) / 2) / radarGraphProps.NumMarks)));
            }
            ctx.restore();
        }
        if (radarGraphProps.H + 5 <= ((radarGraphProps.Height - radarGraphProps.TitleTextHeight - 8 - radarGraphProps.MarkLabelTextHeight - 8 - 4) / 2)) {
            radarGraphProps.H += 5;
        } else {
            radarGraphProps.H = ((radarGraphProps.Height - radarGraphProps.TitleTextHeight - 8 - radarGraphProps.MarkLabelTextHeight - 8 - 4) / 2);
        }
    }, canvasid);
    registerAnimatedWindow(canvasid);
}

//Line Area Graph code starts here

var lineAreaGraphPropsArray = new Array();

function getLineAreaGraphProps(canvasid, windowid) {
    for (var i = 0; i < lineAreaGraphPropsArray.length; i++) {
        if (lineAreaGraphPropsArray[i].CanvasID == canvasid && lineAreaGraphPropsArray[i].WindowID == windowid) {
            return lineAreaGraphPropsArray[i];
        }
    }
}

function createLineAreaGraph(canvasid, controlNameId, x, y, width, height, depth, data, xmaxvalue, ymaxvalue, nummarksx, nummarksy, title,
    titletextcolor, titletextheight, titletextfontstring, axislabelscolor, axislabelsheight, axislabelsfontstring, marginleft,
    islabeledonxaxis) {
    var windowid = createWindow(canvasid, x, y, width, height, depth, null, 'LineAreaGraph', controlNameId);
    lineAreaGraphPropsArray.push({
        CanvasID: canvasid, WindowID: windowid, X: x, Y: y, Width: width, Height: height, Data: data,
        XMaxValue: xmaxvalue, YMaxValue: ymaxvalue, NumMarksX: nummarksx, NumMarksY: nummarksy, Title: title,
        TitleTextColor: titletextcolor, TitleTextHeight: titletextheight, TitleTextFontString: titletextfontstring,
        AxisLabelsColor: axislabelscolor, AxisLabelsHeight: axislabelsheight, AxisLabelsFontString: axislabelsfontstring,
        H: 0, MarginLeft: marginleft, AlreadyUnregisteredAnimation: 0, IsLabledOnXAxis: islabeledonxaxis
    });
    registerWindowDrawFunction(windowid, function (canvasid1, windowid1) {
        var lineAreaGraphProps = getLineAreaGraphProps(canvasid1, windowid1);
        if (lineAreaGraphProps.AlreadyUnregisteredAnimation == 0 && lineAreaGraphProps.H >= lineAreaGraphProps.Data[0].length - 1) {
            lineAreaGraphProps.AlreadyUnregisteredAnimation = 1;
            unregisterAnimatedWindow(canvasid1);
        }
        var ctx = getCtx(canvasid1);
        ctx.save();
        ctx.fillStyle = lineAreaGraphProps.TitleTextColor;
        ctx.font = lineAreaGraphProps.TitleTextFontString;
        ctx.fillText(lineAreaGraphProps.Title, lineAreaGraphProps.X + ((lineAreaGraphProps.Width - ctx.measureText(lineAreaGraphProps.Title).width) / 2),
            lineAreaGraphProps.Y + 4 + lineAreaGraphProps.TitleTextHeight);
        ctx.font = lineAreaGraphProps.AxisLabelsFontString;
        ctx.beginPath();
        ctx.moveTo(lineAreaGraphProps.X + lineAreaGraphProps.MarginLeft, lineAreaGraphProps.Y + lineAreaGraphProps.Height - lineAreaGraphProps.AxisLabelsHeight - 8);
        ctx.lineTo(lineAreaGraphProps.X + lineAreaGraphProps.MarginLeft, lineAreaGraphProps.Y + lineAreaGraphProps.TitleTextHeight + 8);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(lineAreaGraphProps.X + lineAreaGraphProps.MarginLeft, lineAreaGraphProps.Y + lineAreaGraphProps.Height - lineAreaGraphProps.AxisLabelsHeight - 8);
        ctx.lineTo(lineAreaGraphProps.X + lineAreaGraphProps.Width, lineAreaGraphProps.Y + lineAreaGraphProps.Height - lineAreaGraphProps.AxisLabelsHeight - 8);
        ctx.stroke();
        var alternate = false;
        for (var c = 0; c < lineAreaGraphProps.NumMarksX; c++) {
            if (alternate) {
                ctx.fillStyle = '#C0C0C0';
                alternate = false;
            } else {
                ctx.fillStyle = '#D0D0D0';
                alternate = true;
            }
            ctx.fillRect(lineAreaGraphProps.X + lineAreaGraphProps.MarginLeft + c * ((lineAreaGraphProps.Width - lineAreaGraphProps.MarginLeft) / lineAreaGraphProps.NumMarksX), lineAreaGraphProps.Y + lineAreaGraphProps.TitleTextHeight + 8,
                ((lineAreaGraphProps.Width - lineAreaGraphProps.MarginLeft) / lineAreaGraphProps.NumMarksX),
                lineAreaGraphProps.Height - lineAreaGraphProps.TitleTextHeight - lineAreaGraphProps.AxisLabelsHeight - 16);
        }
        ctx.fillStyle = lineAreaGraphProps.AxisLabelsColor;
        ctx.strokeStyle = '#404040';
        for (c = 0; c < lineAreaGraphProps.NumMarksY; c++) {
            var val = (lineAreaGraphProps.YMaxValue / lineAreaGraphProps.NumMarksY) * c;
            var tw = ctx.measureText(val.toString()).width;
            ctx.fillText(val.toString(), lineAreaGraphProps.X + lineAreaGraphProps.MarginLeft - tw - 10, lineAreaGraphProps.Y + lineAreaGraphProps.Height -
                lineAreaGraphProps.AxisLabelsHeight - 8 - (c * ((lineAreaGraphProps.Height - lineAreaGraphProps.TitleTextHeight - lineAreaGraphProps.AxisLabelsHeight -
                16) / lineAreaGraphProps.NumMarksY)));
            ctx.beginPath();
            ctx.moveTo(lineAreaGraphProps.X + lineAreaGraphProps.MarginLeft - 5, lineAreaGraphProps.Y + lineAreaGraphProps.Height -
                lineAreaGraphProps.AxisLabelsHeight - 8 - (c * ((lineAreaGraphProps.Height - lineAreaGraphProps.TitleTextHeight - lineAreaGraphProps.AxisLabelsHeight -
                16) / lineAreaGraphProps.NumMarksY)));
            ctx.lineTo(lineAreaGraphProps.X + lineAreaGraphProps.Width, lineAreaGraphProps.Y + lineAreaGraphProps.Height -
                lineAreaGraphProps.AxisLabelsHeight - 8 - (c * ((lineAreaGraphProps.Height - lineAreaGraphProps.TitleTextHeight - lineAreaGraphProps.AxisLabelsHeight -
                16) / lineAreaGraphProps.NumMarksY)));
            ctx.stroke();
        }
        var xlabels;
        if (lineAreaGraphProps.IsLabledOnXAxis == 1) {
            xlabels = new Array();
            for (var i = 0; i < lineAreaGraphProps.Data[0].length; i++) {
                xlabels.push(lineAreaGraphProps.Data[0][i][0]);
            }
        }
        ctx.fillStyle = lineAreaGraphProps.AxisLabelsColor;
        for (d = 0; d < lineAreaGraphProps.NumMarksX; d++) {
            var val;
            if (lineAreaGraphProps.IsLabledOnXAxis == 1) {
                increment = xlabels.length / lineAreaGraphProps.NumMarksX;
                if (xlabels.length % lineAreaGraphProps.NumMarksX >= lineAreaGraphProps.NumMarksX / 2) {
                    val = xlabels[d * Math.ceil(increment)];
                } else {
                    val = xlabels[d * Math.floor(increment)];
                }
            } else {
                val = (lineAreaGraphProps.XMaxValue / lineAreaGraphProps.NumMarksX) * d;
            }
            var tw = ctx.measureText(val.toString()).width;
            ctx.fillText(val.toString(), lineAreaGraphProps.X + lineAreaGraphProps.MarginLeft + (d * ((lineAreaGraphProps.Width - lineAreaGraphProps.MarginLeft) /
                lineAreaGraphProps.NumMarksX)) - (tw / 2), lineAreaGraphProps.Y + lineAreaGraphProps.Height - 4);
            ctx.beginPath();
            ctx.moveTo(lineAreaGraphProps.X + lineAreaGraphProps.MarginLeft + (d * ((lineAreaGraphProps.Width - lineAreaGraphProps.MarginLeft) /
                lineAreaGraphProps.NumMarksX)), lineAreaGraphProps.Y + lineAreaGraphProps.TitleTextHeight + 8 + (lineAreaGraphProps.Height -
                lineAreaGraphProps.TitleTextHeight - lineAreaGraphProps.AxisLabelsHeight - 16) + 5);
            ctx.lineTo(lineAreaGraphProps.X + lineAreaGraphProps.MarginLeft + (d * ((lineAreaGraphProps.Width - lineAreaGraphProps.MarginLeft) /
                lineAreaGraphProps.NumMarksX)), lineAreaGraphProps.Y + lineAreaGraphProps.TitleTextHeight + 8);
            ctx.stroke();
        }
        for (var c = 0; c < lineAreaGraphProps.Data[0][0][1].length; c++) {
            var colorstr = lineAreaGraphProps.Data[1][c];
            var gradient = ctx.createLinearGradient(lineAreaGraphProps.X + lineAreaGraphProps.MarginLeft, lineAreaGraphProps.Y + lineAreaGraphProps.Height -
                lineAreaGraphProps.AxisLabelsHeight - 8, lineAreaGraphProps.X + lineAreaGraphProps.Width - lineAreaGraphProps.MarginLeft, 
                lineAreaGraphProps.Y + lineAreaGraphProps.Height - lineAreaGraphProps.AxisLabelsHeight - 8);
            var redcomp = parseInt(colorstr.substr(1, 2), 16);
            var greencomp = parseInt(colorstr.substr(3, 2), 16);
            var bluecomp = parseInt(colorstr.substr(5, 2), 16);
            gradient.addColorStop(0.0, '#' + getlowcomp(redcomp) + getlowcomp(greencomp) + getlowcomp(bluecomp));
            gradient.addColorStop(0.5, colorstr);
            gradient.addColorStop(1.0, '#' + gethighcomp(redcomp) + gethighcomp(greencomp) + gethighcomp(bluecomp));
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(lineAreaGraphProps.X + lineAreaGraphProps.MarginLeft, lineAreaGraphProps.Y + lineAreaGraphProps.Height - lineAreaGraphProps.AxisLabelsHeight - 8);
            for (var i = 0; i < lineAreaGraphProps.H + 1; i++) {
                ctx.lineTo(lineAreaGraphProps.X + lineAreaGraphProps.MarginLeft + (lineAreaGraphProps.IsLabledOnXAxis == 1 ?
                    (findXLabelIndexForValue(xlabels, lineAreaGraphProps.Data[0][i][0]) *
                    (lineAreaGraphProps.Width - lineAreaGraphProps.MarginLeft)) / xlabels.length : ((lineAreaGraphProps.Data[0][i][0] * (lineAreaGraphProps.Width -
                    lineAreaGraphProps.MarginLeft)) / lineAreaGraphProps.XMaxValue)), lineAreaGraphProps.Y + lineAreaGraphProps.Height -
                    lineAreaGraphProps.AxisLabelsHeight - 8 - ((lineAreaGraphProps.Data[0][i][1][c] + sumyvalues(lineAreaGraphProps.Data, c, i)) *
                    (lineAreaGraphProps.Height - lineAreaGraphProps.TitleTextHeight - lineAreaGraphProps.AxisLabelsHeight - 16)) / lineAreaGraphProps.YMaxValue);
            }
            if (c == 0) {
                ctx.lineTo(lineAreaGraphProps.X + lineAreaGraphProps.MarginLeft + (lineAreaGraphProps.IsLabledOnXAxis == 1 ?
                    (findXLabelIndexForValue(xlabels, lineAreaGraphProps.Data[0][lineAreaGraphProps.H][0]) *
                    (lineAreaGraphProps.Width - lineAreaGraphProps.MarginLeft)) / xlabels.length : ((lineAreaGraphProps.Data[0][lineAreaGraphProps.H][0] * 
                    (lineAreaGraphProps.Width -
                    lineAreaGraphProps.MarginLeft)) / lineAreaGraphProps.XMaxValue)), lineAreaGraphProps.Y + lineAreaGraphProps.Height -
                    lineAreaGraphProps.AxisLabelsHeight - 8);
            } else {
                for (var i = lineAreaGraphProps.H; i >= 0; i--) {
                    ctx.lineTo(lineAreaGraphProps.X + lineAreaGraphProps.MarginLeft + (lineAreaGraphProps.IsLabledOnXAxis == 1 ?
                        (findXLabelIndexForValue(xlabels, lineAreaGraphProps.Data[0][i][0]) * (lineAreaGraphProps.Width - lineAreaGraphProps.MarginLeft)) / xlabels.length :
                        ((lineAreaGraphProps.Data[0][i][0] * (lineAreaGraphProps.Width -
                        lineAreaGraphProps.MarginLeft)) / lineAreaGraphProps.XMaxValue)), lineAreaGraphProps.Y + lineAreaGraphProps.Height -
                        lineAreaGraphProps.AxisLabelsHeight - 8 - ((lineAreaGraphProps.Data[0][i][1][c - 1] + sumyvalues(lineAreaGraphProps.Data, c - 1, i)) * 
                        (lineAreaGraphProps.Height - lineAreaGraphProps.TitleTextHeight - lineAreaGraphProps.AxisLabelsHeight - 16)) / lineAreaGraphProps.YMaxValue);
                }
            }
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
        if (lineAreaGraphProps.H < lineAreaGraphProps.Data[0].length - 1) {
            lineAreaGraphProps.H++;
        }
    }, canvasid);
    registerAnimatedWindow(canvasid);
}

function sumyvalues(data, c, i) {
    var total = 0;
    for (var x = 0; x < c; x++) {
        total += data[0][i][1][x];
    }
    return total;
}

//Candlesticks Graph code starts here

var candlesticksGraphPropsArray = new Array();

function getCandlesticksGraphProps(canvasid, windowid) {
    for (var i = 0; i < candlesticksGraphPropsArray.length; i++) {
        if (candlesticksGraphPropsArray[i].CanvasID == canvasid && candlesticksGraphPropsArray[i].WindowID == windowid) {
            return candlesticksGraphPropsArray[i];
        }
    }
}

function createCandlesticksGraph(canvasid, controlNameId, x, y, width, height, depth, data, xmarkslabeldata, xmarkswidth, ymaxvalue, nummarksy, title,
    titlecolor, titleheight, titlefontstring, candlebodywidth, candelbodycolorstr, candellinecolorstr, marginleft,
    axislabelscolor, axislabelsheight, axislabelsfontstring) {
    var windowid = createWindow(canvasid, x, y, width, height, depth, null, 'CandlesticksGraph', controlNameId);
    candlesticksGraphPropsArray.push({
        CanvasID: canvasid, WindowID: windowid, X: x, Y: y, Width: width, Height: height, Data: data,
        XMarksLabelData: xmarkslabeldata, XMarksWidth: xmarkswidth, YMaxValue: ymaxvalue, NumMarksY: nummarksy, Title: title,
        TitleColor: titlecolor, TitleHeight: titleheight, TitleFontString: titlefontstring, CandleBodyWidth: candlebodywidth,
        CandleBodyColor: candelbodycolorstr, CandleLineColor: candellinecolorstr, MarginLeft: marginleft,
        AxisLabelsColor: axislabelscolor, AxisLabelsHeight: axislabelsheight, AxisLabelsFontString: axislabelsfontstring
    });
    registerWindowDrawFunction(windowid, function (canvasid1, windowid1) {
        var candlesticksGraphProps = getCandlesticksGraphProps(canvasid1, windowid1);
        var ctx = getCtx(canvasid1);
        ctx.save();
        ctx.fillStyle = candlesticksGraphProps.TitleColor;
        ctx.font = candlesticksGraphProps.TitleFontString;
        ctx.fillText(candlesticksGraphProps.Title, candlesticksGraphProps.X + (candlesticksGraphProps.Width - ctx.measureText(title).width) / 2,
            candlesticksGraphProps.Y + candlesticksGraphProps.TitleHeight + 4);
        ctx.strokeStyle = '#C0C0C0';
        ctx.beginPath();
        ctx.moveTo(candlesticksGraphProps.X + candlesticksGraphProps.MarginLeft, candlesticksGraphProps.Y + candlesticksGraphProps.Height - 8 -
            candlesticksGraphProps.AxisLabelsHeight);
        ctx.lineTo(candlesticksGraphProps.X + candlesticksGraphProps.MarginLeft, candlesticksGraphProps.Y + candlesticksGraphProps.TitleHeight + 8);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(candlesticksGraphProps.X + candlesticksGraphProps.MarginLeft, candlesticksGraphProps.Y + candlesticksGraphProps.Height - 8 -
            candlesticksGraphProps.AxisLabelsHeight);
        ctx.lineTo(candlesticksGraphProps.X + candlesticksGraphProps.Width, candlesticksGraphProps.Y + candlesticksGraphProps.Height - 8 -
            candlesticksGraphProps.AxisLabelsHeight);
        ctx.stroke();
        var alternate = false;
        for (var c = 0; c <= data.length; c++) {
            if (alternate) {
                ctx.fillStyle = '#C0C0C0';
                alternate = false;
            } else {
                ctx.fillStyle = '#D0D0D0';
                alternate = true;
            }
            ctx.fillRect(candlesticksGraphProps.X + candlesticksGraphProps.MarginLeft + (c * candlesticksGraphProps.XMarksWidth), candlesticksGraphProps.Y +
                candlesticksGraphProps.TitleHeight + 8, candlesticksGraphProps.XMarksWidth, candlesticksGraphProps.Height -
                candlesticksGraphProps.TitleHeight - candlesticksGraphProps.AxisLabelsHeight - 16);
        }
        ctx.fillStyle = candlesticksGraphProps.AxisLabelsColor;
        ctx.font = candlesticksGraphProps.AxisLabelsFontString;
        ctx.strokeStyle = '#404040';
        for (var c = 0; c < candlesticksGraphProps.NumMarksY; c++) {
            var val = (candlesticksGraphProps.YMaxValue / candlesticksGraphProps.NumMarksY) * c;
            var tw = ctx.measureText(val.toString()).width;
            ctx.fillText(val.toString(), candlesticksGraphProps.X + candlesticksGraphProps.MarginLeft - 10 - tw, candlesticksGraphProps.Y +
                candlesticksGraphProps.Height - candlesticksGraphProps.AxisLabelsHeight - 8 -(c * ((candlesticksGraphProps.Height -
                candlesticksGraphProps.TitleHeight - candlesticksGraphProps.AxisLabelsHeight - 16) / candlesticksGraphProps.NumMarksY)));
            ctx.beginPath();
            ctx.moveTo(candlesticksGraphProps.X + candlesticksGraphProps.MarginLeft - 5, candlesticksGraphProps.Y + candlesticksGraphProps.Height -
                candlesticksGraphProps.AxisLabelsHeight - 8 -(c * ((candlesticksGraphProps.Height - candlesticksGraphProps.TitleHeight -
                candlesticksGraphProps.AxisLabelsHeight - 16) / candlesticksGraphProps.NumMarksY)));
            ctx.lineTo(candlesticksGraphProps.X + candlesticksGraphProps.Width, candlesticksGraphProps.Y + candlesticksGraphProps.Height -
                candlesticksGraphProps.AxisLabelsHeight - 8 -(c * ((candlesticksGraphProps.Height - candlesticksGraphProps.TitleHeight -
                candlesticksGraphProps.AxisLabelsHeight - 16) / candlesticksGraphProps.NumMarksY)));
            ctx.stroke();
        }
        for (var d = 0; d < candlesticksGraphProps.Data.length; d++) {
            ctx.beginPath();
            ctx.moveTo(candlesticksGraphProps.X + candlesticksGraphProps.MarginLeft + ((d + 1) * candlesticksGraphProps.XMarksWidth), 
                candlesticksGraphProps.Y + candlesticksGraphProps.Height - candlesticksGraphProps.AxisLabelsHeight - 8 + 5);
            ctx.lineTo(candlesticksGraphProps.X + candlesticksGraphProps.MarginLeft + ((d + 1) * candlesticksGraphProps.XMarksWidth), 
                candlesticksGraphProps.Y + candlesticksGraphProps.TitleHeight + 8);
            ctx.stroke();
        }
        for (var c = 0; c < candlesticksGraphProps.XMarksLabelData.length; c++) {
            var tw = ctx.measureText(candlesticksGraphProps.XMarksLabelData[c][1].toString()).width;
            ctx.fillText(candlesticksGraphProps.XMarksLabelData[c][1], candlesticksGraphProps.X + candlesticksGraphProps.MarginLeft +
                ((candlesticksGraphProps.XMarksLabelData[c][0] + 1) * candlesticksGraphProps.XMarksWidth) - (tw / 2),
                candlesticksGraphProps.Y + candlesticksGraphProps.Height - 4);
        }
        for (var c = 0; c < candlesticksGraphProps.Data.length; c++) {
            var gradient = ctx.createLinearGradient(candlesticksGraphProps.X + candlesticksGraphProps.MarginLeft + ((c + 1) *
                candlesticksGraphProps.XMarksWidth), candlesticksGraphProps.Y + candlesticksGraphProps.Height - candlesticksGraphProps.AxisLabelsHeight - 8 -
                (candlesticksGraphProps.Data[c][0] * (candlesticksGraphProps.Height - candlesticksGraphProps.TitleHeight - candlesticksGraphProps.AxisLabelsHeight -
                16) / candlesticksGraphProps.YMaxValue), candlesticksGraphProps.X + candlesticksGraphProps.MarginLeft + ((c + 1) * candlesticksGraphProps.XMarksWidth),
                candlesticksGraphProps.Y + candlesticksGraphProps.Height - candlesticksGraphProps.AxisLabelsHeight - 8 - (candlesticksGraphProps.Data[c][1] *
                (candlesticksGraphProps.Height - candlesticksGraphProps.TitleHeight - candlesticksGraphProps.AxisLabelsHeight - 16) / candlesticksGraphProps.YMaxValue));
            var redcomp = parseInt(candlesticksGraphProps.CandleBodyColor.substr(1, 2), 16);
            var greencomp = parseInt(candlesticksGraphProps.CandleBodyColor.substr(3, 2), 16);
            var bluecomp = parseInt(candlesticksGraphProps.CandleBodyColor.substr(5, 2), 16);
            gradient.addColorStop(0.0, '#' + getlowcomp(redcomp) + getlowcomp(greencomp) + getlowcomp(bluecomp));
            gradient.addColorStop(0.5, candlesticksGraphProps.CandleBodyColor);
            gradient.addColorStop(1.0, '#' + gethighcomp(redcomp) + gethighcomp(greencomp) + gethighcomp(bluecomp));
            ctx.fillStyle = gradient;
            ctx.strokeStyle = candlesticksGraphProps.CandleLineColor;
            ctx.beginPath();
            if (candlesticksGraphProps.Data[c][0] < candlesticksGraphProps.Data[c][1]) {
                ctx.moveTo(candlesticksGraphProps.X + candlesticksGraphProps.MarginLeft + ((c + 1) * candlesticksGraphProps.XMarksWidth) -
                    (candlesticksGraphProps.CandleBodyWidth / 2), candlesticksGraphProps.Y + candlesticksGraphProps.Height - candlesticksGraphProps.AxisLabelsHeight -
                    8 - (candlesticksGraphProps.Data[c][0] * (candlesticksGraphProps.Height - candlesticksGraphProps.TitleHeight - candlesticksGraphProps.AxisLabelsHeight -
                    16) / candlesticksGraphProps.YMaxValue));
                ctx.lineTo(candlesticksGraphProps.X + candlesticksGraphProps.MarginLeft + ((c + 1) * candlesticksGraphProps.XMarksWidth) +
                    (candlesticksGraphProps.CandleBodyWidth / 2), candlesticksGraphProps.Y + candlesticksGraphProps.Height - candlesticksGraphProps.AxisLabelsHeight -
                    8 - (candlesticksGraphProps.Data[c][0] * (candlesticksGraphProps.Height - candlesticksGraphProps.TitleHeight - candlesticksGraphProps.AxisLabelsHeight -
                    16) / candlesticksGraphProps.YMaxValue));
                ctx.lineTo(candlesticksGraphProps.X + candlesticksGraphProps.MarginLeft + ((c + 1) * candlesticksGraphProps.XMarksWidth) +
                    (candlesticksGraphProps.CandleBodyWidth / 2), candlesticksGraphProps.Y +
                    candlesticksGraphProps.Height - candlesticksGraphProps.AxisLabelsHeight - 8 - (candlesticksGraphProps.Data[c][1] *
                    (candlesticksGraphProps.Height - candlesticksGraphProps.TitleHeight - candlesticksGraphProps.AxisLabelsHeight - 16) /
                    candlesticksGraphProps.YMaxValue));
                ctx.lineTo(candlesticksGraphProps.X + candlesticksGraphProps.MarginLeft + ((c + 1) * candlesticksGraphProps.XMarksWidth) -
                    (candlesticksGraphProps.CandleBodyWidth / 2), candlesticksGraphProps.Y +
                    candlesticksGraphProps.Height - candlesticksGraphProps.AxisLabelsHeight - 8 - (candlesticksGraphProps.Data[c][1] *
                    (candlesticksGraphProps.Height - candlesticksGraphProps.TitleHeight - candlesticksGraphProps.AxisLabelsHeight - 16) /
                    candlesticksGraphProps.YMaxValue));
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(candlesticksGraphProps.X + candlesticksGraphProps.MarginLeft + ((c + 1) * candlesticksGraphProps.XMarksWidth), candlesticksGraphProps.Y +
                    candlesticksGraphProps.Height - candlesticksGraphProps.AxisLabelsHeight - 8 - (candlesticksGraphProps.Data[c][0] *
                    (candlesticksGraphProps.Height - candlesticksGraphProps.TitleHeight - candlesticksGraphProps.AxisLabelsHeight - 16) /
                    candlesticksGraphProps.YMaxValue));
                ctx.lineTo(candlesticksGraphProps.X + candlesticksGraphProps.MarginLeft + ((c + 1) * candlesticksGraphProps.XMarksWidth), candlesticksGraphProps.Y +
                    candlesticksGraphProps.Height - candlesticksGraphProps.AxisLabelsHeight - 8 - (candlesticksGraphProps.Data[c][2] *
                    (candlesticksGraphProps.Height - candlesticksGraphProps.TitleHeight - candlesticksGraphProps.AxisLabelsHeight - 16) /
                    candlesticksGraphProps.YMaxValue));
                ctx.closePath();
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(candlesticksGraphProps.X + candlesticksGraphProps.MarginLeft + ((c + 1) * candlesticksGraphProps.XMarksWidth), candlesticksGraphProps.Y +
                    candlesticksGraphProps.Height - candlesticksGraphProps.AxisLabelsHeight - 8 - (candlesticksGraphProps.Data[c][1] *
                    (candlesticksGraphProps.Height - candlesticksGraphProps.TitleHeight - candlesticksGraphProps.AxisLabelsHeight - 16) /
                    candlesticksGraphProps.YMaxValue));
                ctx.lineTo(candlesticksGraphProps.X + candlesticksGraphProps.MarginLeft + ((c + 1) * candlesticksGraphProps.XMarksWidth), candlesticksGraphProps.Y +
                    candlesticksGraphProps.Height - candlesticksGraphProps.AxisLabelsHeight - 8 - (candlesticksGraphProps.Data[c][3] *
                    (candlesticksGraphProps.Height - candlesticksGraphProps.TitleHeight - candlesticksGraphProps.AxisLabelsHeight - 16) /
                    candlesticksGraphProps.YMaxValue));
                ctx.closePath();
                ctx.stroke();
            } else {
                ctx.strokeStyle = candlesticksGraphProps.CandleBodyColor;
                ctx.moveTo(candlesticksGraphProps.X + candlesticksGraphProps.MarginLeft + ((c + 1) * candlesticksGraphProps.XMarksWidth) -
                    (candlesticksGraphProps.CandleBodyWidth / 2), candlesticksGraphProps.Y +
                    candlesticksGraphProps.Height - candlesticksGraphProps.AxisLabelsHeight - 8 - (candlesticksGraphProps.Data[c][0] * (candlesticksGraphProps.Height -
                    candlesticksGraphProps.TitleHeight - candlesticksGraphProps.AxisLabelsHeight - 16) / candlesticksGraphProps.YMaxValue));
                ctx.lineTo(candlesticksGraphProps.X + candlesticksGraphProps.MarginLeft + ((c + 1) * candlesticksGraphProps.XMarksWidth) +
                    (candlesticksGraphProps.CandleBodyWidth / 2), candlesticksGraphProps.Y +
                    candlesticksGraphProps.Height - candlesticksGraphProps.AxisLabelsHeight - 8 - (candlesticksGraphProps.Data[c][0] * (candlesticksGraphProps.Height -
                    candlesticksGraphProps.TitleHeight - candlesticksGraphProps.AxisLabelsHeight - 16) / candlesticksGraphProps.YMaxValue));
                ctx.lineTo(candlesticksGraphProps.X + candlesticksGraphProps.MarginLeft + ((c + 1) * candlesticksGraphProps.XMarksWidth) +
                    (candlesticksGraphProps.CandleBodyWidth / 2), candlesticksGraphProps.Y +
                    candlesticksGraphProps.Height - candlesticksGraphProps.AxisLabelsHeight - 8 - (candlesticksGraphProps.Data[c][1] * (candlesticksGraphProps.Height -
                    candlesticksGraphProps.TitleHeight - candlesticksGraphProps.AxisLabelsHeight - 16) / candlesticksGraphProps.YMaxValue));
                ctx.lineTo(candlesticksGraphProps.X + candlesticksGraphProps.MarginLeft + ((c + 1) * candlesticksGraphProps.XMarksWidth) -
                    (candlesticksGraphProps.CandleBodyWidth / 2), candlesticksGraphProps.Y +
                    candlesticksGraphProps.Height - candlesticksGraphProps.AxisLabelsHeight - 8 - (candlesticksGraphProps.Data[c][1] * (candlesticksGraphProps.Height -
                    candlesticksGraphProps.TitleHeight - candlesticksGraphProps.AxisLabelsHeight - 16) / candlesticksGraphProps.YMaxValue));
                ctx.closePath();
                ctx.stroke();
                ctx.strokeStyle = candlesticksGraphProps.CandleLineColor;
                ctx.beginPath();
                ctx.moveTo(candlesticksGraphProps.X + candlesticksGraphProps.MarginLeft + ((c + 1) * candlesticksGraphProps.XMarksWidth), candlesticksGraphProps.Y +
                    candlesticksGraphProps.Height - candlesticksGraphProps.AxisLabelsHeight - 8 - (candlesticksGraphProps.Data[c][1] * (candlesticksGraphProps.Height -
                    candlesticksGraphProps.TitleHeight - candlesticksGraphProps.AxisLabelsHeight - 16) / candlesticksGraphProps.YMaxValue));
                ctx.lineTo(candlesticksGraphProps.X + candlesticksGraphProps.MarginLeft + ((c + 1) * candlesticksGraphProps.XMarksWidth), candlesticksGraphProps.Y +
                    candlesticksGraphProps.Height - candlesticksGraphProps.AxisLabelsHeight - 8 - (candlesticksGraphProps.Data[c][2] * (candlesticksGraphProps.Height -
                    candlesticksGraphProps.TitleHeight - candlesticksGraphProps.AxisLabelsHeight - 16) / candlesticksGraphProps.YMaxValue));
                ctx.closePath();
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(candlesticksGraphProps.X + candlesticksGraphProps.MarginLeft + ((c + 1) * candlesticksGraphProps.XMarksWidth), candlesticksGraphProps.Y +
                    candlesticksGraphProps.Height - candlesticksGraphProps.AxisLabelsHeight - 8 - (candlesticksGraphProps.Data[c][0] * (candlesticksGraphProps.Height -
                    candlesticksGraphProps.TitleHeight - candlesticksGraphProps.AxisLabelsHeight - 16) / candlesticksGraphProps.YMaxValue));
                ctx.lineTo(candlesticksGraphProps.X + candlesticksGraphProps.MarginLeft + ((c + 1) * candlesticksGraphProps.XMarksWidth), candlesticksGraphProps.Y +
                    candlesticksGraphProps.Height - candlesticksGraphProps.AxisLabelsHeight - 8 - (candlesticksGraphProps.Data[c][3] * (candlesticksGraphProps.Height -
                    candlesticksGraphProps.TitleHeight - candlesticksGraphProps.AxisLabelsHeight - 16) / candlesticksGraphProps.YMaxValue));
                ctx.closePath();
                ctx.stroke();
            }
        }
        ctx.restore();
    }, canvasid);
}

//Doughnut Chart Code starts here

var doughnutChartPropsArray = new Array();

function getDoughnutChartProps(canvasid, windowid) {
    for (var i = 0; i < doughnutChartPropsArray.length; i++) {
        if (doughnutChartPropsArray[i].CanvasID == canvasid && doughnutChartPropsArray[i].WindowID == windowid) {
            return doughnutChartPropsArray[i];
        }
    }
}

function createDoughnutChart(canvasid, controlNameId, x, y, width, height, depth, data, title, titlecolor, titletextheight, titlefontstring, innerradius, marginsides,
    labelcolor, labelheight, labelfontstring, legendwidth, legendheight, legendfontstring, sliceClickFunction) {
    var windowid = createWindow(canvasid, x, y, width, height, depth, null, 'DoughnutChart', controlNameId);
    var totalvalue = 0;
    for (i = 0; i < data.length; i++) {
        totalvalue += data[i][1];
    }
    doughnutChartPropsArray.push({
        CanvasID: canvasid, WindowID: windowid, X: x, Y: y, Width: width, Height: height, Data: data,
        Title: title, TitleColor: titlecolor, TitleTextHeight: titletextheight, TitleFontString: titlefontstring, InnerRadius: innerradius,
        CurrentRadius: innerradius + 20, TotalValue: totalvalue, MarginSides: marginsides, LabelColor: labelcolor, LabelHeight: labelheight,
        LabelFontString: labelfontstring, LegendWidth: legendwidth, LegendHeight: legendheight, LegendFontString: legendfontstring,
        AnimationCompleted: 0, DeltaI: -1, DeltaX: 0, DeltaY: 0, SliceClickFunction: sliceClickFunction
    });
    registerClickFunction(windowid, function (canvasid1, windowid1) {
        var doughnutChartProps = getDoughnutChartProps(canvasid1, windowid1);
        var data = doughnutChartProps.Data;
        var currRadius = doughnutChartProps.CurrentRadius;
        var innerradius = doughnutChartProps.InnerRadius;
        var totalvalue = doughnutChartProps.TotalValue;
        var canvas = getCanvas(canvasid1);
        var clickx = event.pageX - canvas.offsetLeft;
        var clicky = event.pageY - canvas.offsetTop;
        var pieoutangle = -1;
        var centerx = doughnutChartProps.X + (doughnutChartProps.Width / 2) + doughnutChartProps.MarginSides;
        var centery = doughnutChartProps.Y + ((doughnutChartProps.Height - doughnutChartProps.TitleTextHeight - 8 - (doughnutChartProps.LabelHeight * 2))/2);
        if (150 * 150 > (clickx - centerx) * (clickx - centerx) + (clicky - centery) * (clicky - centery)) {
            if (clickx > centerx && clicky == centery) {
                pieoutangle = 0;
            } else if (clickx > centerx && clicky > centery) {
                pieoutangle = (Math.atan((clicky - centery) / (clickx - centerx))) * 180 / Math.PI;
            } else if (clickx < centerx && clicky > centery) {
                pieoutangle = 180 - ((Math.atan((clicky - centery) / (clickx - centerx))) * 180 / Math.PI);
            } else if (clickx < centerx && clicky == centery) {
                pieoutangle = 180;
            } else if (clickx < centerx && clicky < centery) {
                pieoutangle = 180 + ((Math.atan((clicky - centery) / (clickx - centerx))) * 180 / Math.PI);
            } else if (clickx == centerx && clicky < centery) {
                pieoutangle = 270;
            } else if (clickx > centerx && clicky < centery) {
                pieoutangle = 360 + ((Math.atan((clicky - centery) / (clickx - centerx))) * 180 / Math.PI);
            }
        }
        var currangle = 0;
        var lastangle = 0;
        var lastx = centerx + currRadius;
        var lasty = centery;
        var founddelta = 0;
        for (i = 0; i < data.length; i++) {
            currangle += (data[i][1] * 360) / totalvalue;
            var deltax = 0;
            var deltay = 0;
            if (pieoutangle >= 0 && lastangle <= pieoutangle && currangle >= pieoutangle) {
                var deltaangle = lastangle + ((currangle - lastangle) / 2);
                if (deltaangle == 0) {
                    deltax = 40;
                    deltay = 0;
                } else if (deltaangle > 0 && deltaangle < 90) {
                    deltax = Math.cos(deltaangle * (Math.PI / 180)) * 40;
                    deltay = Math.sin(deltaangle * (Math.PI / 180)) * 40;
                } else if (deltaangle == 90) {
                    deltax = 0;
                    deltay = 40;
                } else if (deltaangle > 90 && deltaangle < 180) {
                    deltax = -(Math.cos((180 - deltaangle) * (Math.PI / 180)) * 40);
                    deltay = Math.sin((180 - deltaangle) * (Math.PI / 180)) * 40;
                } else if (deltaangle == 180) {
                    deltax = -40;
                    deltay = 0;
                } else if (deltaangle > 180 && deltaangle < 270) {
                    deltax = -(Math.cos((180 - deltaangle) * (Math.PI / 180)) * 40);
                    deltay = (Math.sin((180 - deltaangle) * (Math.PI / 180)) * 40);
                } else if (deltaangle == 270) {
                    deltax = 0;
                    deltay = -40;
                } else if (deltaangle > 270 && deltaangle < 360) {
                    deltax = Math.cos((360 - deltaangle) * (Math.PI / 180)) * 40;
                    deltay = -(Math.sin((360 - deltaangle) * (Math.PI / 180)) * 40);
                }
            }
            if (deltax != 0 || deltay != 0) {
                doughnutChartProps.DeltaX = deltax;
                doughnutChartProps.DeltaY = deltay;
                doughnutChartProps.DeltaI = i;
                founddelta = 1;
                if (doughnutChartProps.SliceClickFunction != null) {
                    doughnutChartProps.SliceClickFunction(canvasid1, windowid1, i);
                }
            }
            lastangle = currangle;
        }
        if (founddelta == 0) {
            doughnutChartProps.DeltaX = 0;
            doughnutChartProps.DeltaY = 0;
            doughnutChartProps.DeltaI = -1;
        }
    }, canvasid);
    registerWindowDrawFunction(windowid, function (canvasid2, windowid2) {
        var doughnutChartProps = getDoughnutChartProps(canvasid2, windowid2);
        var ctx = getCtx(canvasid2);
        var totalvalue = doughnutChartProps.TotalValue;
        var data = doughnutChartProps.Data;
        var innerradius = doughnutChartProps.InnerRadius;
        var currRadius = doughnutChartProps.CurrentRadius;
        if (doughnutChartProps.AnimationCompleted == 0 && currRadius >= (doughnutChartProps.Width - (doughnutChartProps.MarginSides * 2) -
            doughnutChartProps.LegendWidth) / 2) {
            unregisterAnimatedWindow(canvasid2);
            doughnutChartProps.AnimationCompleted = 1;
        }
        ctx.save();
        ctx.fillStyle = doughnutChartProps.TitleColor;
        ctx.font = doughnutChartProps.TitleFontString;
        ctx.fillText(doughnutChartProps.Title, doughnutChartProps.X + (doughnutChartProps.Width - ctx.measureText(doughnutChartProps.Title).width) / 2,
            doughnutChartProps.Y + doughnutChartProps.TitleTextHeight + 4);
        ctx.font = doughnutChartProps.LabelFontString;
        var centerx = doughnutChartProps.X + (doughnutChartProps.Width / 2) + doughnutChartProps.MarginSides;
        var centery = doughnutChartProps.Y + ((doughnutChartProps.Height - doughnutChartProps.TitleTextHeight - 8 - (doughnutChartProps.LabelHeight * 2)) / 2);
        var currangle = 0; //in degrees
        var lastangle = 0;
        var lastx = centerx + currRadius;
        var lasty = centery;
        for (i = 0; i < data.length; i++) {
            currangle += (data[i][1] * 100 * 360) / (totalvalue * 100);
            var redcomp = parseInt(data[i][2].substr(1, 2), 16);
            var greencomp = parseInt(data[i][2].substr(3, 2), 16);
            var bluecomp = parseInt(data[i][2].substr(5, 2), 16);
            var gradient = ctx.createRadialGradient(centerx + (doughnutChartProps.DeltaI == i ? doughnutChartProps.DeltaX : 0),
                centery + (doughnutChartProps.DeltaI == i ? doughnutChartProps.DeltaY : 0), innerradius, centerx +
                (doughnutChartProps.DeltaI == i ? doughnutChartProps.DeltaX : 0), centery + (doughnutChartProps.DeltaI == i ?
                doughnutChartProps.DeltaY : 0), currRadius);
            gradient.addColorStop(0.0, '#' + gethighcomp(redcomp) + gethighcomp(greencomp) + gethighcomp(bluecomp));
            gradient.addColorStop(0.5, data[i][2]);
            gradient.addColorStop(1.0, '#' + getlowcomp(redcomp) + getlowcomp(greencomp) + getlowcomp(bluecomp));
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(centerx + (doughnutChartProps.DeltaI == i ? doughnutChartProps.DeltaX : 0), centery + (doughnutChartProps.DeltaI == i ?
                doughnutChartProps.DeltaY : 0), currRadius, (Math.PI / 180) * lastangle, (Math.PI / 180) * currangle, false);
            ctx.arc(centerx + (doughnutChartProps.DeltaI == i ? doughnutChartProps.DeltaX : 0), centery + (doughnutChartProps.DeltaI == i ?
                doughnutChartProps.DeltaY : 0), innerradius, (Math.PI / 180) * currangle, (Math.PI / 180) * lastangle, true);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = data[i][2];
            lastangle = currangle;
        }
        if (doughnutChartProps.AnimationCompleted == 0) {
            doughnutChartProps.CurrentRadius += 5;
        }
        var currangle = 0; //in degrees
        var lastangle = 0;
        var lastx = centerx + currRadius;
        var lasty = centery;
        for (i = 0; i < data.length; i++) {
            currangle += (data[i][1] * 100 * 360) / (totalvalue * 100);
            ctx.strokeStyle = data[i][2];
            drawPieChartLabels(ctx, data[i][0], currangle, lastangle, currRadius, totalvalue, data[i][1], data[i][2], 0, 0,
                centerx + (doughnutChartProps.DeltaI == i ? doughnutChartProps.DeltaX : 0), centery + (doughnutChartProps.DeltaI == i ?
                doughnutChartProps.DeltaY : 0), doughnutChartProps.LabelHeight);
            lastangle = currangle;
        }
        ctx.font = doughnutChartProps.LegendFontString;
        for (o = 0; o < data.length; o++) {
            ctx.fillStyle = data[o][2];
            ctx.fillRect(doughnutChartProps.X + doughnutChartProps.Width - doughnutChartProps.LegendWidth, doughnutChartProps.Y + doughnutChartProps.Height
                - 4 - doughnutChartProps.LegendHeight - (o * (doughnutChartProps.LegendHeight + 10)), 30, doughnutChartProps.LegendHeight);
            ctx.fillStyle = data[o][2];
            ctx.fillText(data[o][0], doughnutChartProps.X + doughnutChartProps.Width - doughnutChartProps.LegendWidth + 35, doughnutChartProps.Y + doughnutChartProps.Height
                - 4 - (o * (doughnutChartProps.LegendHeight + 10)));
        }
        ctx.restore();
    }, canvasid);
    registerAnimatedWindow(canvasid);
}

//Bars mixed with labeled line graph

var barsMixedWithLabledLineGraphsPropsArray = new Array();

function getBarsMixedWithLabledLineGraphProps(canvasid, windowid) {
    for (var i = 0; i < barsMixedWithLabledLineGraphsPropsArray.length; i++) {
        if (barsMixedWithLabledLineGraphsPropsArray[i].CanvasID == canvasid && barsMixedWithLabledLineGraphsPropsArray[i].WindowID == windowid) {
            return barsMixedWithLabledLineGraphsPropsArray[i];
        }
    }
}

function createBarsMixedWithLabledLineGraph(canvasid, controlNameId, x, y, width, height, depth, data, maxvalue, nummarksy, title, titletextcolor,
    titletextheigth, titletextfontstring, barwidth, axisLabelsTextColor, axisLabelsTextHeight, axisLabelsTextFontString,
    marginleft, gapbetweenbars, barClickFunction, haslegend, marginright, linesData, lineClickFunction) {
    var windowid = createWindow(canvasid, x, y, width, height, depth, null, 'BarsMixedWithLabeledLineGraph', controlNameId);
    barsMixedWithLabledLineGraphsPropsArray.push({
        CanvasID: canvasid, WindowID: windowid, X: x, Y: y, Width: width, Height: height, Data: data,
        MaxValue: maxvalue, NumMarksY: nummarksy, Title: title, TitleTextColor: titletextcolor, TitleTextHeight: titletextheigth,
        TitleTextFontString: titletextfontstring, BarWidth: barwidth, BarLabelsWithBoundingBoxes: new Array(),
        H: height - axisLabelsTextHeight - 8 - 20, AxisLabelsTextHeight: axisLabelsTextHeight,
        AxisLabelsTextFontString: axisLabelsTextFontString, AxisLabelsTextColor: axisLabelsTextColor, MarginLeft: marginleft,
        GapBetweenBars: gapbetweenbars, BarClickFunction: barClickFunction, AlreadyUnregisteredAnimation: 0,
        HasLegend: haslegend, MarginRight: marginright, LinesData: linesData, LineXYs: new Array(), LineClickFunction: lineClickFunction,
        YMaxValue: maxvalue
    });
    registerClickFunction(windowid, function (canvasid1, windowid1) {
        var barsMixedWithLabledLineGraphProps = getBarsMixedWithLabledLineGraphProps(canvasid1, windowid1);
        var canvas = getCanvas(canvasid);
        var clickx = event.pageX - canvas.offsetLeft;
        var clicky = event.pageY - canvas.offsetTop;
        for (i = 0; i < barsMixedWithLabledLineGraphProps.BarLabelsWithBoundingBoxes.length; i++) {
            if (clickx >= barsMixedWithLabledLineGraphProps.BarLabelsWithBoundingBoxes[i].X && clickx <= barsMixedWithLabledLineGraphProps.BarLabelsWithBoundingBoxes[i].X +
                barsMixedWithLabledLineGraphProps.BarLabelsWithBoundingBoxes[i].Width && clicky >= barsMixedWithLabledLineGraphProps.BarLabelsWithBoundingBoxes[i].Y &&
                clicky <= barsMixedWithLabledLineGraphProps.BarLabelsWithBoundingBoxes[i].Y + barsMixedWithLabledLineGraphProps.BarLabelsWithBoundingBoxes[i].Height) {
                if (barsMixedWithLabledLineGraphProps.BarClickFunction != null) {
                    barsMixedWithLabledLineGraphProps.BarClickFunction(canvasid1, windowid1, i);
                    return;
                }
            }
        }
        var data = barsMixedWithLabledLineGraphProps.LinesData;
        var linexys = barsMixedWithLabledLineGraphProps.LineXYs;
        for (i = 0; i < linexys.length; i++) {
            for (j = 0; j < linexys[i].length - 1; j++) {
                if (clickx >= linexys[i][j][0] && clickx <= linexys[i][j + 1][0]) {
                    if ((clicky <= linexys[i][j][1] && clicky >= linexys[i][j + 1][1]) || (clicky >= linexys[i][j][1] && clicky <= linexys[i][j + 1][1])) {
                        y = (((linexys[i][j][1] - linexys[i][j + 1][1]) * (clickx - linexys[i][j][0])) / (linexys[i][j][0] - linexys[i][j + 1][0])) + linexys[i][j][1];
                        if (y + 4 > clicky && y - 4 < clicky) {
                            barsMixedWithLabledLineGraphProps.LineClickFunction(canvasid1, windowid1, i);
                        }
                    }
                }
            }
        }
    }, canvasid);
    registerWindowDrawFunction(windowid, function (canvasid2, windowid2) {
        var barsMixedWithLabledLineGraphProps = getBarsMixedWithLabledLineGraphProps(canvasid2, windowid2);
        var ctx = getCtx(canvasid2);
        var h = barsMixedWithLabledLineGraphProps.H;
        if (barsMixedWithLabledLineGraphProps.AlreadyUnregisteredAnimation == 0 && h < barsMixedWithLabledLineGraphProps.TitleTextHeight + 8) {
            barsMixedWithLabledLineGraphProps.AlreadyUnregisteredAnimation = 1;
            unregisterAnimatedWindow(canvasid2);
        }
        barsMixedWithLabledLineGraphProps.LineXYs = new Array();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.fillStyle = barsMixedWithLabledLineGraphProps.TitleTextColor;
        ctx.font = barsMixedWithLabledLineGraphProps.TitleTextFontString;
        ctx.lineWidth = 2;
        ctx.fillText(barsMixedWithLabledLineGraphProps.Title, barsMixedWithLabledLineGraphProps.X + (barsMixedWithLabledLineGraphProps.Width -
            ctx.measureText(barsMixedWithLabledLineGraphProps.Title).width) / 2, barsMixedWithLabledLineGraphProps.Y +
            barsMixedWithLabledLineGraphProps.TitleTextHeight + 4);
        ctx.lineWidth = 1;
        ctx.fillStyle = barsMixedWithLabledLineGraphProps.AxisLabelsTextColor;
        ctx.font = barsMixedWithLabledLineGraphProps.AxisLabelsTextFontString;
        var yaxisheight = barsMixedWithLabledLineGraphProps.Height - barsMixedWithLabledLineGraphProps.TitleTextHeight -
            barsMixedWithLabledLineGraphProps.AxisLabelsTextHeight - 16;
        ctx.beginPath();
        ctx.moveTo(barsMixedWithLabledLineGraphProps.X + barsMixedWithLabledLineGraphProps.MarginLeft, barsMixedWithLabledLineGraphProps.Y +
            barsMixedWithLabledLineGraphProps.TitleTextHeight + 8 + yaxisheight);
        ctx.lineTo(barsMixedWithLabledLineGraphProps.X + barsMixedWithLabledLineGraphProps.MarginLeft, barsMixedWithLabledLineGraphProps.Y +
            barsMixedWithLabledLineGraphProps.TitleTextHeight + 8);
        ctx.stroke();
        for (c = 0; c < barsMixedWithLabledLineGraphProps.NumMarksY; c++) {
            var val = (barsMixedWithLabledLineGraphProps.MaxValue / barsMixedWithLabledLineGraphProps.NumMarksY) * c;
            val = Math.round(val * 100) / 100;
            var tw = ctx.measureText(val.toString()).width;
            var yval = yaxisheight / barsMixedWithLabledLineGraphProps.NumMarksY;
            ctx.fillText(val.toString(), barsMixedWithLabledLineGraphProps.X + barsMixedWithLabledLineGraphProps.MarginLeft - tw - 5,
                barsMixedWithLabledLineGraphProps.Y + barsMixedWithLabledLineGraphProps.TitleTextHeight +
                8 + (barsMixedWithLabledLineGraphProps.AxisLabelsTextHeight / 2) + yaxisheight - (c * yval));
            ctx.beginPath();
            ctx.moveTo(barsMixedWithLabledLineGraphProps.X + barsMixedWithLabledLineGraphProps.MarginLeft, barsMixedWithLabledLineGraphProps.Y +
                barsMixedWithLabledLineGraphProps.TitleTextHeight + 8 + yaxisheight - (c * yval));
            ctx.lineTo(barsMixedWithLabledLineGraphProps.X + barsMixedWithLabledLineGraphProps.MarginLeft +
                (barsMixedWithLabledLineGraphProps.Data.length * (barsMixedWithLabledLineGraphProps.BarWidth +
                barsMixedWithLabledLineGraphProps.GapBetweenBars)) + barsMixedWithLabledLineGraphProps.GapBetweenBars, barsMixedWithLabledLineGraphProps.Y +
                barsMixedWithLabledLineGraphProps.TitleTextHeight + 8 + yaxisheight - (c * yval));
            ctx.stroke();
        }
        barsMixedWithLabledLineGraphProps.BarLabelsWithBoundingBoxes = new Array();
        for (i = 0; i < barsMixedWithLabledLineGraphProps.Data.length; i++) {
            if (barsMixedWithLabledLineGraphProps.HasLegend != 1) {
                var w = ctx.measureText(barsMixedWithLabledLineGraphProps.Data[i][0]).width;
                ctx.fillStyle = barsMixedWithLabledLineGraphProps.AxisLabelsTextColor;
                ctx.font = barsMixedWithLabledLineGraphProps.AxisLabelsTextFontString;
                if (w < barsMixedWithLabledLineGraphProps.BarWidth) {
                    ctx.fillText(barsMixedWithLabledLineGraphProps.Data[i][0], barsMixedWithLabledLineGraphProps.X +
                        barsMixedWithLabledLineGraphProps.MarginLeft + barsMixedWithLabledLineGraphProps.GapBetweenBars +
                        (i * (barsMixedWithLabledLineGraphProps.BarWidth + barsMixedWithLabledLineGraphProps.GapBetweenBars)) +
                        ((barsMixedWithLabledLineGraphProps.BarWidth - w) / 2), barsMixedWithLabledLineGraphProps.Y +
                        barsMixedWithLabledLineGraphProps.Height - 4);
                } else {
                    ctx.fillText(barsMixedWithLabledLineGraphProps.Data[i][0], barsMixedWithLabledLineGraphProps.X +
                        barsMixedWithLabledLineGraphProps.MarginLeft + barsMixedWithLabledLineGraphProps.GapBetweenBars +
                        (i * (barsMixedWithLabledLineGraphProps.BarWidth + barsMixedWithLabledLineGraphProps.GapBetweenBars)) -
                        ((w - barsMixedWithLabledLineGraphProps.BarWidth) / 2), barsMixedWithLabledLineGraphProps.Y +
                        barsMixedWithLabledLineGraphProps.Height - 4);
                }
            }
            drawrect(canvasid2, windowid2, ctx, barsMixedWithLabledLineGraphProps, i, yaxisheight);
        }
        var xlabels = new Array();
        var maxnumlabels = 0;
        for (var i = 0; i < barsMixedWithLabledLineGraphProps.LinesData.length; i++) {
            if (barsMixedWithLabledLineGraphProps.LinesData[i][0].length > maxnumlabels) {
                maxnumlabels = barsMixedWithLabledLineGraphProps.LinesData[i][0].length;
            }
        }
        for (var i = 0; i < maxnumlabels; i++) {
            for (var j = 0; j < barsMixedWithLabledLineGraphProps.LinesData.length; j++) {
                if (i < barsMixedWithLabledLineGraphProps.LinesData[j][0].length) {
                    var foundlabel = 0;
                    for (var p = 0; p < xlabels.length; p++) {
                        if (xlabels[p] == barsMixedWithLabledLineGraphProps.LinesData[j][0][i][0]) {
                            foundlabel = 1;
                            break;
                        }
                    }
                    if (foundlabel == 0) {
                        xlabels.push(barsMixedWithLabledLineGraphProps.LinesData[j][0][i][0]);
                    }
                }
            }
        }
        var i = 0;
        while (i < barsMixedWithLabledLineGraphProps.LinesData.length) {
            drawlineforbarsmixedwithlinesgraph(ctx, barsMixedWithLabledLineGraphProps, i, xlabels);
            i++;
        }
        if (barsMixedWithLabledLineGraphProps.HasLegend == 1) {
            for (o = 0; o < barsMixedWithLabledLineGraphProps.Data.length; o++) {
                ctx.fillStyle = data[o][2];
                ctx.fillRect(barsMixedWithLabledLineGraphProps.X + barsMixedWithLabledLineGraphProps.Width - barsMixedWithLabledLineGraphProps.MarginRight,
                    barsMixedWithLabledLineGraphProps.Y + barsMixedWithLabledLineGraphProps.Height
                    - 8 - barsMixedWithLabledLineGraphProps.AxisLabelsTextHeight - (o * (8 + barsMixedWithLabledLineGraphProps.AxisLabelsTextHeight)),
                    30, barsMixedWithLabledLineGraphProps.AxisLabelsTextHeight);
                ctx.fillText(data[o][0], barsMixedWithLabledLineGraphProps.X + barsMixedWithLabledLineGraphProps.Width -
                    barsMixedWithLabledLineGraphProps.MarginRight + 35, barsMixedWithLabledLineGraphProps.Y + barsMixedWithLabledLineGraphProps.Height
                    - 8 - (o * (8 + barsMixedWithLabledLineGraphProps.AxisLabelsTextHeight)));
            }
        }
        if (h >= barsMixedWithLabledLineGraphProps.TitleTextHeight + 8) {
            barsMixedWithLabledLineGraphProps.H -= 5;
        }
        ctx.restore();
    }, canvasid);
    registerAnimatedWindow(canvasid);
    return windowid;
}


function drawlineforbarsmixedwithlinesgraph(ctx, barsMixedWithLabledLineGraphProps, x, xlabels) {
    var redcomp = parseInt(barsMixedWithLabledLineGraphProps.LinesData[x][1].substr(1, 2), 16);
    var greencomp = parseInt(barsMixedWithLabledLineGraphProps.LinesData[x][1].substr(3, 2), 16);
    var bluecomp = parseInt(barsMixedWithLabledLineGraphProps.LinesData[x][1].substr(5, 2), 16);
    ctx.strokeStyle = barsMixedWithLabledLineGraphProps.LinesData[x][1];
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.miterLimit = 0.0;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#' + getlowcomp(redcomp).toString(16) + getlowcomp(greencomp).toString(16) + getlowcomp(bluecomp).toString(16);
    ctx.beginPath();
    var linexys = new Array();
    linexys = linexys.concat([[barsMixedWithLabledLineGraphProps.X + barsMixedWithLabledLineGraphProps.MarginLeft + 
        (findXLabelIndexForValue(xlabels, barsMixedWithLabledLineGraphProps.LinesData[x][0][0][0]) *
        (barsMixedWithLabledLineGraphProps.Width - barsMixedWithLabledLineGraphProps.MarginLeft)) / xlabels.length,
        barsMixedWithLabledLineGraphProps.Y + barsMixedWithLabledLineGraphProps.Height - barsMixedWithLabledLineGraphProps.AxisLabelsTextHeight - 8 -
        ((barsMixedWithLabledLineGraphProps.LinesData[x][0][0][1] * (barsMixedWithLabledLineGraphProps.Height -
        barsMixedWithLabledLineGraphProps.TitleTextHeight - barsMixedWithLabledLineGraphProps.AxisLabelsTextHeight - 16)) /
        barsMixedWithLabledLineGraphProps.YMaxValue)]]);
    ctx.moveTo(barsMixedWithLabledLineGraphProps.X + barsMixedWithLabledLineGraphProps.MarginLeft + 
        barsMixedWithLabledLineGraphProps.GapBetweenBars + (barsMixedWithLabledLineGraphProps.BarWidth / 2) +
        (findXLabelIndexForValue(xlabels, barsMixedWithLabledLineGraphProps.LinesData[x][0][0][0]) *
        (barsMixedWithLabledLineGraphProps.Width - barsMixedWithLabledLineGraphProps.MarginLeft -
        barsMixedWithLabledLineGraphProps.GapBetweenBars - (barsMixedWithLabledLineGraphProps.BarWidth / 2))) / xlabels.length,
        barsMixedWithLabledLineGraphProps.Y + barsMixedWithLabledLineGraphProps.Height - barsMixedWithLabledLineGraphProps.AxisLabelsTextHeight -
        8 - ((barsMixedWithLabledLineGraphProps.LinesData[x][0][0][1] *
        (barsMixedWithLabledLineGraphProps.Height - barsMixedWithLabledLineGraphProps.TitleTextHeight - barsMixedWithLabledLineGraphProps.AxisLabelsTextHeight - 16)) /
        barsMixedWithLabledLineGraphProps.YMaxValue));
    for (i = 1; i < barsMixedWithLabledLineGraphProps.H && i < barsMixedWithLabledLineGraphProps.LinesData[x][0].length; i++) {
        linexys = linexys.concat([[barsMixedWithLabledLineGraphProps.X + barsMixedWithLabledLineGraphProps.MarginLeft +
            (findXLabelIndexForValue(xlabels, barsMixedWithLabledLineGraphProps.LinesData[x][0][i][0]) * (barsMixedWithLabledLineGraphProps.Width - 
            barsMixedWithLabledLineGraphProps.MarginLeft)) / xlabels.length,
            barsMixedWithLabledLineGraphProps.Y + barsMixedWithLabledLineGraphProps.Height - barsMixedWithLabledLineGraphProps.AxisLabelsTextHeight -
            8 - ((barsMixedWithLabledLineGraphProps.LinesData[x][0][i][1] *
            (barsMixedWithLabledLineGraphProps.Height - barsMixedWithLabledLineGraphProps.TitleTextHeight -
            barsMixedWithLabledLineGraphProps.AxisLabelsTextHeight - 16)) / barsMixedWithLabledLineGraphProps.YMaxValue)]]);
        ctx.lineTo(barsMixedWithLabledLineGraphProps.X + barsMixedWithLabledLineGraphProps.MarginLeft +
            barsMixedWithLabledLineGraphProps.GapBetweenBars + (barsMixedWithLabledLineGraphProps.BarWidth / 2) + (findXLabelIndexForValue(xlabels,
            barsMixedWithLabledLineGraphProps.LinesData[x][0][i][0]) * (barsMixedWithLabledLineGraphProps.GapBetweenBars + barsMixedWithLabledLineGraphProps.BarWidth)),
            barsMixedWithLabledLineGraphProps.Y + barsMixedWithLabledLineGraphProps.Height - barsMixedWithLabledLineGraphProps.AxisLabelsTextHeight -
            8 - ((barsMixedWithLabledLineGraphProps.LinesData[x][0][i][1] *
            (barsMixedWithLabledLineGraphProps.Height - barsMixedWithLabledLineGraphProps.TitleTextHeight -
            barsMixedWithLabledLineGraphProps.AxisLabelsTextHeight - 16)) / barsMixedWithLabledLineGraphProps.YMaxValue));
    }
    barsMixedWithLabledLineGraphProps.LineXYs.concat([[linexys]]);
    ctx.stroke();
}

//Stacked Bar Graph

var stackedBarGraphPropsArray = new Array();

function getstackedBarGraphProps(canvasid, windowid) {
    for (var i = 0; i < stackedBarGraphPropsArray.length; i++) {
        if (stackedBarGraphPropsArray[i].CanvasID == canvasid && stackedBarGraphPropsArray[i].WindowID == windowid) {
            return stackedBarGraphPropsArray[i];
        }
    }
}

function createStackedBarGraph(canvasid, controlNameId, x, y, width, height, depth, data, maxvalue, nummarksy, title, titlecolor, titleheight,
    titlefontstring, barwidth, gapbetweenbarssets, axislabelscolor, axislabelsheight, axislabelsfontstring, barClickFunction, marginleft) {
    var windowid = createWindow(canvasid, x, y, width, height, depth, null, 'StackedBarGraph', controlNameId);
    stackedBarGraphPropsArray.push({
        CanvasID: canvasid, WindowID: windowid, X: x, Y: y, Width: width, Height: height,
        Data: data, MaxValue: maxvalue, NumMarksY: nummarksy, Title: title, TitleColor: titlecolor, TitleHeight: titleheight,
        TitleFontString: titlefontstring, BarWidth: barwidth, GapBetweenBarSets: gapbetweenbarssets, H: height - titleheight - 16 -
        axislabelsheight, AxisLabelsColor: axislabelscolor, AxisLabelsHeight: axislabelsheight, AxisLabelsFontString: axislabelsfontstring,
        BarLabelsWithBoundingBoxes: new Array(), BarClickFunction: barClickFunction, AlreadyUnregisteredAnimation: 0,
        MarginLeft: marginleft
    });
    registerClickFunction(windowid, function (canvasid1, windowid1) {
        var stackedBarGraphProps = getstackedBarGraphProps(canvasid1, windowid1);
        var data = stackedBarGraphProps.Data;
        var canvas = getCanvas(canvasid1);
        var totalvalue = 0;
        for (i = 0; i < data.length; i++) {
            totalvalue += data[i][1];
        }
        var clickx = event.pageX - canvas.offsetLeft;
        var clicky = event.pageY - canvas.offsetTop;
        for (i = 0; i < stackedBarGraphProps.BarLabelsWithBoundingBoxes.length; i++) {
            if (clickx >= stackedBarGraphProps.BarLabelsWithBoundingBoxes[i][1] && clickx <= stackedBarGraphProps.BarLabelsWithBoundingBoxes[i][3] &&
                clicky >= stackedBarGraphProps.BarLabelsWithBoundingBoxes[i][2] && clicky <= stackedBarGraphProps.BarLabelsWithBoundingBoxes[i][4]) {
                if (stackedBarGraphProps.BarClickFunction != null) {
                    stackedBarGraphProps.BarClickFunction(canvasid1, windowid1, i);
                }
            }
        }
    }, canvasid);
    registerWindowDrawFunction(windowid, function (canvasid2, windowid2) {
        var stackedBarGraphProps = getstackedBarGraphProps(canvasid2, windowid2);
        if (stackedBarGraphProps.AlreadyUnregisteredAnimation == 0 && stackedBarGraphProps.H < 100) {
            unregisterAnimatedWindow(canvasid2);
            stackedBarGraphProps.AlreadyUnregisteredAnimation = 1;
        }
        var ctx = getCtx(canvasid2);
        ctx.save();
        ctx.fillStyle = stackedBarGraphProps.TitleColor;
        ctx.font = stackedBarGraphProps.TitleFontString;
        ctx.fillText(stackedBarGraphProps.Title, stackedBarGraphProps.X + (stackedBarGraphProps.Width - ctx.measureText(stackedBarGraphProps.Title).width) / 2, 
            stackedBarGraphProps.Y + stackedBarGraphProps.TitleHeight + 4);
        ctx.font = stackedBarGraphProps.AxisLabelsFontString;
        ctx.beginPath();
        ctx.moveTo(stackedBarGraphProps.X + stackedBarGraphProps.MarginLeft, stackedBarGraphProps.Y + stackedBarGraphProps.Height -
            stackedBarGraphProps.AxisLabelsHeight - 8);
        ctx.lineTo(stackedBarGraphProps.X + stackedBarGraphProps.MarginLeft, stackedBarGraphProps.Y + stackedBarGraphProps.TitleHeight + 8);
        ctx.stroke();
        for (c = 0; c < stackedBarGraphProps.NumMarksY; c++) {
            var val = (stackedBarGraphProps.MaxValue / stackedBarGraphProps.NumMarksY) * c;
            val = Math.round(val * 100) / 100;
            var tw = ctx.measureText(val.toString()).width;
            var yval = (stackedBarGraphProps.Height - stackedBarGraphProps.TitleHeight - stackedBarGraphProps.AxisLabelsHeight - 16) / stackedBarGraphProps.NumMarksY;
            ctx.fillText(val.toString(), stackedBarGraphProps.X + stackedBarGraphProps.MarginLeft - 10 - tw, stackedBarGraphProps.Y +
                stackedBarGraphProps.Height - stackedBarGraphProps.AxisLabelsHeight - 8 - (c * yval));
            ctx.beginPath();
            ctx.moveTo(stackedBarGraphProps.X + stackedBarGraphProps.MarginLeft - 5, stackedBarGraphProps.Y + stackedBarGraphProps.Height -
                stackedBarGraphProps.AxisLabelsHeight - 8 - (c * yval));
            ctx.lineTo(stackedBarGraphProps.X + stackedBarGraphProps.MarginLeft + stackedBarGraphProps.GapBetweenBarSets + (stackedBarGraphProps.Data.length *
                stackedBarGraphProps.BarWidth), stackedBarGraphProps.Y + stackedBarGraphProps.Height - stackedBarGraphProps.AxisLabelsHeight - 8 - (c * yval));
            ctx.stroke();
        }
        stackedBarGraphProps.BarLabelsWithBoundingBoxes = new Array();
        for (i = 0; i < stackedBarGraphProps.Data.length; i++) {
            ctx.fillStyle = stackedBarGraphProps.AxisLabelsColor;
            ctx.font = stackedBarGraphProps.AxisLabelsFontString;
            var w = ctx.measureText(stackedBarGraphProps.Data[i][0]).width;
            if (w < stackedBarGraphProps.BarWidth) {
                ctx.fillText(stackedBarGraphProps.Data[i][0], stackedBarGraphProps.X + stackedBarGraphProps.MarginLeft + (i * stackedBarGraphProps.BarWidth) +
                    ((stackedBarGraphProps.BarWidth - w) / 2), stackedBarGraphProps.Y + stackedBarGraphProps.Height - 4);
            } else {
                ctx.fillText(stackedBarGraphProps.Data[i][0], stackedBarGraphProps.X + stackedBarGraphProps.MarginLeft + (i * stackedBarGraphProps.BarWidth),
                    stackedBarGraphProps.Y + stackedBarGraphProps.Height - stackedBarGraphProps.AxisLabelsHeight - 3);
            }
            drawmultiplerect(ctx, stackedBarGraphProps, i);
        }
        if (stackedBarGraphProps.AlreadyUnregisteredAnimation == 0 && stackedBarGraphProps.H > 100) {
            stackedBarGraphProps.H -= 5;
        }
        ctx.restore();
    }, canvasid);
    registerAnimatedWindow(canvasid);
}

function drawmultiplerect(ctx, stackedBarGraphProps, i) {
    ctx.save();
    var hthis = stackedBarGraphProps.H;
    var total = 0;
    for (var x = 1; x < stackedBarGraphProps.Data.length; x++) {
        total += stackedBarGraphProps.Data[i][x][0];
    }
    var axisheight = stackedBarGraphProps.Height - stackedBarGraphProps.TitleHeight - stackedBarGraphProps.AxisLabelsHeight - 16;
    var topy = stackedBarGraphProps.Height - axisheight - stackedBarGraphProps.AxisLabelsHeight - 8;
    var bottomy = stackedBarGraphProps.Height - stackedBarGraphProps.AxisLabelsHeight - 8;
    if (stackedBarGraphProps.H < topy + (axisheight - (axisheight / stackedBarGraphProps.MaxValue) * total)) {
        hthis = topy + (axisheight - (axisheight / stackedBarGraphProps.MaxValue) * total);
    }
    stackedBarGraphProps.BarLabelsWithBoundingBoxes.push([stackedBarGraphProps.Data[i][0], stackedBarGraphProps.X + stackedBarGraphProps.MarginLeft + ((stackedBarGraphProps.BarWidth - stackedBarGraphProps.GapBetweenBarSets) / 2) +
        (i * stackedBarGraphProps.BarWidth), stackedBarGraphProps.Y + bottomy - hthis,
        stackedBarGraphProps.X + stackedBarGraphProps.MarginLeft + stackedBarGraphProps.GapBetweenBarSets + ((stackedBarGraphProps.BarWidth -
        stackedBarGraphProps.GapBetweenBarSets) / 2) + (i * stackedBarGraphProps.BarWidth), stackedBarGraphProps.Y + bottomy]);
    var shift = 0;
    for (var x = 1; x < stackedBarGraphProps.Data[i].length; x++) {
        var colorstr = stackedBarGraphProps.Data[i][x][1];
        var gradient = ctx.createLinearGradient(stackedBarGraphProps.X, stackedBarGraphProps.Y, stackedBarGraphProps.X + stackedBarGraphProps.BarWidth,
            stackedBarGraphProps.Y + axisheight);
        var redcomp = parseInt(colorstr.substr(1, 2), 16);
        var greencomp = parseInt(colorstr.substr(3, 2), 16);
        var bluecomp = parseInt(colorstr.substr(5, 2), 16);
        gradient.addColorStop(0.0, '#' + getlowcomp(redcomp) + getlowcomp(greencomp) + getlowcomp(bluecomp));
        gradient.addColorStop(0.5, colorstr);
        gradient.addColorStop(1.0, '#' + gethighcomp(redcomp) + gethighcomp(greencomp) + gethighcomp(bluecomp));
        ctx.fillStyle = gradient;
        ctx.shadowOffsetX = 5;
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#' + getlowcomp(redcomp).toString(16) + getlowcomp(greencomp).toString(16) + getlowcomp(bluecomp).toString(16);
        hthis = (bottomy - stackedBarGraphProps.H) * stackedBarGraphProps.Data[i][x][0] / total;
        if (stackedBarGraphProps.H < topy + (axisheight - (axisheight / stackedBarGraphProps.MaxValue) * total)) {
            hthis = axisheight * stackedBarGraphProps.Data[i][x][0] / stackedBarGraphProps.MaxValue;
        }
        ctx.shadowOffsetY = 0;
        if (x < stackedBarGraphProps.Data[i].length - 1) {
            ctx.beginPath();
            ctx.moveTo(stackedBarGraphProps.X + stackedBarGraphProps.MarginLeft + ((stackedBarGraphProps.BarWidth - stackedBarGraphProps.GapBetweenBarSets) / 2) +
                (i * stackedBarGraphProps.BarWidth), stackedBarGraphProps.Y + bottomy - (shift + hthis));
            ctx.lineTo(stackedBarGraphProps.X + stackedBarGraphProps.MarginLeft + stackedBarGraphProps.GapBetweenBarSets + ((stackedBarGraphProps.BarWidth - 
                stackedBarGraphProps.GapBetweenBarSets) / 2) + (i * stackedBarGraphProps.BarWidth), stackedBarGraphProps.Y + bottomy - (shift + hthis));
            ctx.lineTo(stackedBarGraphProps.X + stackedBarGraphProps.MarginLeft + stackedBarGraphProps.GapBetweenBarSets + ((stackedBarGraphProps.BarWidth -
                stackedBarGraphProps.GapBetweenBarSets) / 2) + (i * stackedBarGraphProps.BarWidth), stackedBarGraphProps.Y + bottomy - shift);
            ctx.lineTo(stackedBarGraphProps.X + stackedBarGraphProps.MarginLeft + ((stackedBarGraphProps.BarWidth - stackedBarGraphProps.GapBetweenBarSets) / 2) +
                (i * stackedBarGraphProps.BarWidth), stackedBarGraphProps.Y + bottomy - shift);
            ctx.closePath();
            ctx.fill();
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.shadowBlur = 0;
            ctx.shadowColor = '#FFFFFF';
            gradient = ctx.createLinearGradient(stackedBarGraphProps.X, stackedBarGraphProps.Y, stackedBarGraphProps.X + stackedBarGraphProps.BarWidth,
                stackedBarGraphProps.Y + axisheight);
            gradient.addColorStop(0.0, '#FFFFFF');
            gradient.addColorStop(0.5, '#000000');
            gradient.addColorStop(1.0, '#FFFFFF');
            ctx.fillStyle = gradient;
            ctx.globalAlpha = 0.1;
            ctx.beginPath();
            ctx.moveTo(stackedBarGraphProps.X + stackedBarGraphProps.MarginLeft + ((stackedBarGraphProps.BarWidth - stackedBarGraphProps.GapBetweenBarSets) / 2) +
                (i * stackedBarGraphProps.BarWidth) + 5, stackedBarGraphProps.Y + bottomy - (shift + hthis) + 5);
            ctx.lineTo(stackedBarGraphProps.X + stackedBarGraphProps.MarginLeft + stackedBarGraphProps.GapBetweenBarSets - 5 +
                ((stackedBarGraphProps.BarWidth - stackedBarGraphProps.GapBetweenBarSets) / 2) + (i * stackedBarGraphProps.BarWidth),
                stackedBarGraphProps.Y + bottomy - (shift + hthis) + 5);
            ctx.lineTo(stackedBarGraphProps.X + stackedBarGraphProps.MarginLeft + stackedBarGraphProps.GapBetweenBarSets - 5 +
                ((stackedBarGraphProps.BarWidth - stackedBarGraphProps.GapBetweenBarSets) / 2) + (i * stackedBarGraphProps.BarWidth),
                stackedBarGraphProps.Y + bottomy - shift - 5);
            ctx.lineTo(stackedBarGraphProps.X + stackedBarGraphProps.MarginLeft + 5 + ((stackedBarGraphProps.BarWidth - stackedBarGraphProps.GapBetweenBarSets) / 2) +
                (i * stackedBarGraphProps.BarWidth), stackedBarGraphProps.Y + bottomy - shift - 5);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1.0;
        } else {
            ctx.beginPath();
            ctx.moveTo(stackedBarGraphProps.X + stackedBarGraphProps.MarginLeft + ((stackedBarGraphProps.BarWidth - stackedBarGraphProps.GapBetweenBarSets) / 2) +
                (i * stackedBarGraphProps.BarWidth), stackedBarGraphProps.Y + bottomy - (shift + hthis) + 5);
            ctx.arc(stackedBarGraphProps.X + stackedBarGraphProps.MarginLeft + 5 + ((stackedBarGraphProps.BarWidth - stackedBarGraphProps.GapBetweenBarSets) / 2) +
                (i * stackedBarGraphProps.BarWidth), stackedBarGraphProps.Y + bottomy - (shift + hthis) + 5, 5, Math.PI, (Math.PI / 180) * 270, false);
            ctx.lineTo(stackedBarGraphProps.X + stackedBarGraphProps.MarginLeft + stackedBarGraphProps.BarWidth - stackedBarGraphProps.GapBetweenBarSets - 5 +
                ((stackedBarGraphProps.BarWidth - stackedBarGraphProps.GapBetweenBarSets) / 2) + (i * stackedBarGraphProps.BarWidth), stackedBarGraphProps.Y +
                bottomy - (shift + hthis)); 
            ctx.arc(stackedBarGraphProps.X + stackedBarGraphProps.MarginLeft + stackedBarGraphProps.GapBetweenBarSets - 5 + ((stackedBarGraphProps.BarWidth - 
                stackedBarGraphProps.GapBetweenBarSets) / 2) + (i * stackedBarGraphProps.BarWidth), stackedBarGraphProps.Y + bottomy - (shift + hthis) + 5, 5, (Math.PI / 180) * 270, 0, false);
            ctx.lineTo(stackedBarGraphProps.X + stackedBarGraphProps.MarginLeft + stackedBarGraphProps.GapBetweenBarSets + ((stackedBarGraphProps.BarWidth - 
                stackedBarGraphProps.GapBetweenBarSets) / 2) + (i * stackedBarGraphProps.BarWidth), stackedBarGraphProps.Y + bottomy - shift);
            ctx.lineTo(stackedBarGraphProps.X + stackedBarGraphProps.MarginLeft + ((stackedBarGraphProps.BarWidth - stackedBarGraphProps.GapBetweenBarSets) / 2) +
                (i * stackedBarGraphProps.BarWidth), stackedBarGraphProps.Y + bottomy - shift);
            ctx.closePath();
            ctx.fill();
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.shadowBlur = 0;
            ctx.shadowColor = '#FFFFFF';
            gradient = ctx.createLinearGradient(stackedBarGraphProps.X, stackedBarGraphProps.Y, stackedBarGraphProps.X + stackedBarGraphProps.BarWidth,
                stackedBarGraphProps.Y + axisheight);
            gradient.addColorStop(0.0, '#FFFFFF');
            gradient.addColorStop(0.5, '#000000');
            gradient.addColorStop(1.0, '#FFFFFF');
            ctx.fillStyle = gradient;
            ctx.globalAlpha = 0.1;
            ctx.beginPath();
            ctx.moveTo(stackedBarGraphProps.X + stackedBarGraphProps.MarginLeft + 5 + ((stackedBarGraphProps.BarWidth - stackedBarGraphProps.GapBetweenBarSets) / 2) +
                (i * stackedBarGraphProps.BarWidth), stackedBarGraphProps.Y + bottomy - (shift + hthis) + 10);
            ctx.arc(stackedBarGraphProps.X + stackedBarGraphProps.MarginLeft + 10 + ((stackedBarGraphProps.BarWidth - stackedBarGraphProps.GapBetweenBarSets) / 2) +
                (i * stackedBarGraphProps.BarWidth), stackedBarGraphProps.Y + bottomy - (shift + hthis) + 10, 5, Math.PI, (Math.PI / 180) * 270, false);
            ctx.lineTo(stackedBarGraphProps.X + stackedBarGraphProps.MarginLeft + stackedBarGraphProps.GapBetweenBarSets - 10 + ((stackedBarGraphProps.BarWidth -
                stackedBarGraphProps.GapBetweenBarSets) / 2) + (i * stackedBarGraphProps.BarWidth), stackedBarGraphProps.Y + bottomy - (shift + hthis) + 5);
            ctx.arc(stackedBarGraphProps.X + stackedBarGraphProps.MarginLeft + stackedBarGraphProps.GapBetweenBarSets - 10 + ((stackedBarGraphProps.BarWidth -
                stackedBarGraphProps.GapBetweenBarSets) / 2) + (i * stackedBarGraphProps.BarWidth), stackedBarGraphProps.Y + bottomy - (shift + hthis) + 10, 5, (Math.PI / 180) * 270, 0, false);
            ctx.lineTo(stackedBarGraphProps.X + stackedBarGraphProps.MarginLeft + stackedBarGraphProps.GapBetweenBarSets - 5 + ((stackedBarGraphProps.BarWidth - 
                stackedBarGraphProps.GapBetweenBarSets) / 2) + (i * stackedBarGraphProps.BarWidth), stackedBarGraphProps.Y + bottomy - 5 - shift);
            ctx.lineTo(stackedBarGraphProps.X + stackedBarGraphProps.MarginLeft + 5 + ((stackedBarGraphProps.BarWidth - stackedBarGraphProps.GapBetweenBarSets) / 2) +
                (i * stackedBarGraphProps.BarWidth), stackedBarGraphProps.Y + bottomy - 5 - shift);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 0;
        ctx.shadowColor = '#FFFFFF';
        shift += hthis;
        ctx.restore();
    }
}

//Tab Control code starts here

var tabPropsArray = new Array();

function getTabProps(canvasid, windowid) {
    for (var i = 0; i < tabPropsArray.length; i++) {
        if (tabPropsArray[i].CanvasID == canvasid && tabPropsArray[i].WindowID == windowid) {
            return tabPropsArray[i];
        }
    }
}

function createTabControl(canvasid, controlNameId, x, y, width, height, depth, tablabels, tablabelcolor, tablabelheight, tablabelfontstring,
    tablabelgradientstartcolor, tablabelgradientendcolor, panelHasBorder, panelBorderColor, panelHasBackgroundGradient,
    panelBackgroundStartColor, panelBackgroundEndColor, selectedTabID, gapbetweentabs, selectedtabbordercolor,
    selectedtabborderlinewidth) {
    var windowid = createWindow(canvasid, x, y, width, height, depth, null, 'Tab', controlNameId);
    var panels = new Array();
    for (var i = 0; i < tablabels.length; i++) {
        var panelwindowid = createPanel(canvasid, controlNameId + 'Panel' + i.toString(), x, y + tablabelheight + 8, width, height - tablabelheight - 8, depth, panelHasBorder, panelBorderColor,
            panelHasBackgroundGradient, panelBackgroundStartColor, panelBackgroundEndColor);
        panels.push(panelwindowid);
        registerHiddenWindow(canvasid, panelwindowid, (i == selectedTabID ? 0 : 1));
        registerChildWindow(canvasid, panelwindowid, windowid);
    }
    tabPropsArray.push({
        CanvasID: canvasid, WindowID: windowid, X: x, Y: y, Width: width, Height: height,
        TabLabels: tablabels, TabLabelColor: tablabelcolor, TabLabelHeight: tablabelheight, TabLabelFontString: tablabelfontstring,
        PanelWindowIDs: panels, SelectedTabID: selectedTabID, TabLabelGradientStartColor: tablabelgradientstartcolor, 
        TabLabelGradientEndColor: tablabelgradientendcolor, TabLabelHitAreas: new Array(),
        GapBetweenTabs: gapbetweentabs, SelectedTabBorderColor: selectedtabbordercolor, SelectedTabBorderLineWidth: selectedtabborderlinewidth
    });
    registerWindowDrawFunction(windowid, function (canvasid1, windowid1) {
        var tabProps = getTabProps(canvasid1, windowid1);
        var ctx = getCtx(canvasid1);
        ctx.font = tabProps.TabLabelFontString;
        var selectedTabWidth = ctx.measureText(tabProps.TabLabels[tabProps.SelectedTabID]).width + 8 + ((tabProps.TabLabelHeight + 8) * 2);
        var currWidthOffset = 0;
        var selectedWidthOffset = 0;
        tabProps.TabLabelHitAreas = new Array();
        for (var i = 0; i < tabProps.TabLabels.length; i++) {
            if (i == tabProps.SelectedTabID + 1) {
                currWidthOffset += selectedTabWidth;
            }
            if (i == tabProps.SelectedTabID) {
                selectedWidthOffset = currWidthOffset;
            } else {
                var currentTabWidth = ctx.measureText(tabProps.TabLabels[i]).width + 8 + ((tabProps.TabLabelHeight + 8) * 2);
                if (i != tabProps.SelectedTabID && currWidthOffset + currentTabWidth < tabProps.Width) {
                    var tablabelgradient = ctx.createLinearGradient(tabProps.X + currWidthOffset, tabProps.Y, tabProps.X + currWidthOffset + currentTabWidth,
                        tabProps.Y + tabProps.TabLabelHeight + 8);
                    tablabelgradient.addColorStop(0, tabProps.TabLabelGradientStartColor);
                    tablabelgradient.addColorStop(1, tabProps.TabLabelGradientEndColor);
                    ctx.fillStyle = tablabelgradient;
                    ctx.beginPath();
                    ctx.moveTo(tabProps.X + currWidthOffset + ((i + 1) * tabProps.GapBetweenTabs), tabProps.Y + tabProps.TabLabelHeight + 8);
                    ctx.lineTo(tabProps.X + currWidthOffset + ((i + 1) * tabProps.GapBetweenTabs), tabProps.Y + 5);
                    ctx.arc(tabProps.X + currWidthOffset + ((i + 1) * tabProps.GapBetweenTabs) + 5, tabProps.Y + 5, 5, Math.PI, (Math.PI / 180) * 270, false);
                    ctx.lineTo(tabProps.X + currWidthOffset + ((i + 1) * tabProps.GapBetweenTabs) + currentTabWidth - 5, tabProps.Y);
                    ctx.arc(tabProps.X + currWidthOffset + ((i + 1) * tabProps.GapBetweenTabs) + currentTabWidth - 5, tabProps.Y + 5, 5, (Math.PI / 180) * 270, Math.PI * 2, false);
                    ctx.lineTo(tabProps.X + currWidthOffset + ((i + 1) * tabProps.GapBetweenTabs) + currentTabWidth, tabProps.Y + tabProps.TabLabelHeight + 8);
                    ctx.closePath();
                    ctx.fill();
                    ctx.fillStyle = tabProps.TabLabelColor;
                    ctx.fillText(tabProps.TabLabels[i], tabProps.X + currWidthOffset + ((i + 1) * tabProps.GapBetweenTabs) + tabProps.TabLabelHeight + 8 + 4,
                        tabProps.Y + tabProps.TabLabelHeight + 4);
                    tabProps.TabLabelHitAreas.push({
                        XStart: tabProps.X + currWidthOffset, XEnd: tabProps.X + currWidthOffset + ((tabProps.TabLabelHeight + 8) * 2) +
                            currentTabWidth + 8, YStart: tabProps.Y, YEnd: tabProps.Y + tabProps.TabLabelHeight + 8, PanelWindowID: tabProps.PanelWindowIDs[i],
                            TabID: i
                    });
                }
                currWidthOffset += currentTabWidth;
            }
        }
        currWidthOffset = selectedWidthOffset;
        var tablabelgradient = ctx.createLinearGradient(tabProps.X, tabProps.Y, tabProps.X, tabProps.Y + tabProps.TabLabelHeight + 8);
        tablabelgradient.addColorStop(0, tabProps.TabLabelGradientStartColor);
        tablabelgradient.addColorStop(1, tabProps.TabLabelGradientEndColor);
        ctx.fillStyle = tablabelgradient;
        ctx.beginPath();
        ctx.moveTo(tabProps.X + currWidthOffset + ((tabProps.SelectedTabID + 1) * tabProps.GapBetweenTabs), tabProps.Y + tabProps.TabLabelHeight + 8);
        ctx.lineTo(tabProps.X + currWidthOffset + ((tabProps.SelectedTabID + 1) * tabProps.GapBetweenTabs), tabProps.Y + 5);
        ctx.arc(tabProps.X + currWidthOffset + ((tabProps.SelectedTabID + 1) * tabProps.GapBetweenTabs) + 5, tabProps.Y + 5, 5, Math.PI, (Math.PI / 180) * 270, false);
        ctx.lineTo(tabProps.X + currWidthOffset + ((tabProps.SelectedTabID + 1) * tabProps.GapBetweenTabs) + currentTabWidth - 5, tabProps.Y);
        ctx.arc(tabProps.X + currWidthOffset + ((tabProps.SelectedTabID + 1) * tabProps.GapBetweenTabs) + currentTabWidth - 5, tabProps.Y + 5, 5, (Math.PI / 180) * 270, Math.PI * 2, false);
        ctx.lineTo(tabProps.X + currWidthOffset + ((tabProps.SelectedTabID + 1) * tabProps.GapBetweenTabs) + currentTabWidth, tabProps.Y + tabProps.TabLabelHeight + 8);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = tabProps.TabLabelColor;
        ctx.fillText(tabProps.TabLabels[tabProps.SelectedTabID], tabProps.X + currWidthOffset + ((tabProps.SelectedTabID + 1) * tabProps.GapBetweenTabs) + tabProps.TabLabelHeight + 8 + 4,
            tabProps.Y + tabProps.TabLabelHeight + 4);
        ctx.strokeStyle = tabProps.SelectedTabBorderColor;
        ctx.lineWidth = tabProps.SelectedTabBorderLineWidth;
        ctx.beginPath();
        ctx.moveTo(tabProps.X, tabProps.Y + tabProps.TabLabelHeight + 8);
        ctx.lineTo(tabProps.X + currWidthOffset + ((tabProps.SelectedTabID + 1) * tabProps.GapBetweenTabs), tabProps.Y + tabProps.TabLabelHeight + 8);
        ctx.lineTo(tabProps.X + currWidthOffset + ((tabProps.SelectedTabID + 1) * tabProps.GapBetweenTabs), tabProps.Y + 5);
        ctx.arc(tabProps.X + currWidthOffset + ((tabProps.SelectedTabID + 1) * tabProps.GapBetweenTabs) + 5, tabProps.Y + 5, 5, Math.PI, (Math.PI / 180) * 270, false);
        ctx.lineTo(tabProps.X + currWidthOffset + ((tabProps.SelectedTabID + 1) * tabProps.GapBetweenTabs) + currentTabWidth - 5, tabProps.Y);
        ctx.arc(tabProps.X + currWidthOffset + ((tabProps.SelectedTabID + 1) * tabProps.GapBetweenTabs) + currentTabWidth - 5, tabProps.Y + 5, 5, (Math.PI / 180) * 270, Math.PI * 2, false);
        ctx.lineTo(tabProps.X + currWidthOffset + ((tabProps.SelectedTabID + 1) * tabProps.GapBetweenTabs) + currentTabWidth, tabProps.Y + tabProps.TabLabelHeight + 8);
        ctx.lineTo(tabProps.X + tabProps.Width, tabProps.Y + tabProps.TabLabelHeight + 8);
        ctx.lineTo(tabProps.X + tabProps.Width, tabProps.Y + tabProps.Height);
        ctx.stroke();
        ctx.lineWidth = 1;
        tabProps.TabLabelHitAreas.push({
            XStart: tabProps.X + currWidthOffset, XEnd: tabProps.X + currWidthOffset + ((tabProps.TabLabelHeight + 8) * 2) +
                currentTabWidth + 8, YStart: tabProps.Y, YEnd: tabProps.Y + tabProps.TabLabelHeight + 8, PanelWindowID: tabProps.PanelWindowIDs[tabProps.SelectedTabID],
                TabID: tabProps.SelectedTabID
        });
    }, canvasid);
    registerClickFunction(windowid, function (canvasid2, windowid2) {
        var tabProps = getTabProps(canvasid2, windowid2);
        var canvas = getCanvas(canvasid2);
        var clickx = event.pageX - canvas.offsetLeft;
        var clicky = event.pageY - canvas.offsetTop;
        for (var i = 0; i < tabProps.TabLabelHitAreas.length; i++) {
            if (clickx > tabProps.TabLabelHitAreas[i].XStart && clickx < tabProps.TabLabelHitAreas[i].XEnd &&
                clicky > tabProps.TabLabelHitAreas[i].YStart && clicky < tabProps.TabLabelHitAreas[i].YEnd) {
                for (var p = 0; p < tabProps.PanelWindowIDs.length; p++) {
                    if (p != tabProps.TabLabelHitAreas[i].PanelWindowID) {
                        setHiddenWindowStatus(canvasid2, tabProps.PanelWindowIDs[p], 1);
                    }
                }
                setHiddenWindowStatus(canvasid2, tabProps.TabLabelHitAreas[i].PanelWindowID, 0);
                tabProps.SelectedTabID = tabProps.TabLabelHitAreas[i].TabID;
            }
        }
    }, canvasid);
    return windowid;
}

//ImageMap Control code starts here

var imageMapPropsArray = new Array();

function getImageMapProps(canvasid, windowid) {
    for (var i = 0; i < imageMapPropsArray.length; i++) {
        if (imageMapPropsArray[i].CanvasID == canvasid && imageMapPropsArray[i].WindowID == windowid) {
            return imageMapPropsArray[i];
        }
    }
}

function createImageMapControl(canvasid, controlNameId, x, y, width, height, depth, imgurl, pinxys, pinClickFunction, hasZoom,
    imagetopleftxoffset, imagetopleftyoffset, scale, scaleincrementfactor) {
    var windowid = createWindow(canvasid, x, y, width, height, depth, null, 'ImageMap', controlNameId);
    var image = new Image();
    image.src = imgurl;
    image.onload = function () {
        draw(canvasid);
    };
    imageMapPropsArray.push({
        CanvasID: canvasid, WindowID: windowid, X: x, Y: y, Width: width, Height: height,
        ImgUrl: imgurl, Image: image, PinXYs: pinxys, PinClickFunction: pinClickFunction, HasZoom: hasZoom,
        ImageTopLeftXOffset: imagetopleftxoffset, ImageTopLeftYOffset: imagetopleftyoffset, MovingMap: 0,
        LastMovingX: 0, LastMovingY: 0, Scale: scale, ScaleIncrementFactor: scaleincrementfactor
    });
    registerWindowDrawFunction(windowid, function (canvasid1, windowid1) {
        var imageMapProps = getImageMapProps(canvasid1, windowid1);
        var ctx = getCtx(canvasid1);
        ctx.save();
        ctx.drawImage(imageMapProps.Image, imageMapProps.ImageTopLeftXOffset, imageMapProps.ImageTopLeftYOffset,
            imageMapProps.Width / imageMapProps.Scale, imageMapProps.Height / imageMapProps.Scale,
            imageMapProps.X, imageMapProps.Y, imageMapProps.Width, imageMapProps.Height);
        for (var i = 0; i < imageMapProps.PinXYs.length; i++) {
            if (imageMapProps.PinXYs[i][0] * imageMapProps.Scale > imageMapProps.ImageTopLeftXOffset * imageMapProps.Scale &&
                imageMapProps.PinXYs[i][0] * imageMapProps.Scale < (imageMapProps.ImageTopLeftXOffset * imageMapProps.Scale) +
                (imageMapProps.Width * imageMapProps.Scale) && imageMapProps.PinXYs[i][1] * imageMapProps.Scale >
                imageMapProps.ImageTopLeftYOffset * imageMapProps.Scale && imageMapProps.PinXYs[i][1] * imageMapProps.Scale <
                (imageMapProps.ImageTopLeftYOffset * imageMapProps.Scale) + (imageMapProps.Height * imageMapProps.Scale)) {
                var g = ctx.createRadialGradient(imageMapProps.X + (imageMapProps.PinXYs[i][0] * imageMapProps.Scale) -
                    (imageMapProps.ImageTopLeftXOffset * imageMapProps.Scale),
                    imageMapProps.Y + (imageMapProps.PinXYs[i][1] * imageMapProps.Scale) - (imageMapProps.ImageTopLeftYOffset * imageMapProps.Scale), 0,
                    imageMapProps.X + (imageMapProps.PinXYs[i][0] * imageMapProps.Scale) - (imageMapProps.ImageTopLeftXOffset * imageMapProps.Scale),
                    imageMapProps.Y + (imageMapProps.PinXYs[i][1] * imageMapProps.Scale) - (imageMapProps.ImageTopLeftYOffset * imageMapProps.Scale),
                    imageMapProps.PinXYs[i][2]);
                var redcomp = parseInt(imageMapProps.PinXYs[i][3].substr(1, 2), 16);
                var greencomp = parseInt(imageMapProps.PinXYs[i][3].substr(3, 2), 16);
                var bluecomp = parseInt(imageMapProps.PinXYs[i][3].substr(5, 2), 16);
                g.addColorStop(0.0, '#' + getlowcomp(redcomp) + getlowcomp(greencomp) + getlowcomp(bluecomp));
                g.addColorStop(0.5, imageMapProps.PinXYs[i][3]);
                g.addColorStop(1.0, '#' + gethighcomp(redcomp) + gethighcomp(greencomp) + gethighcomp(bluecomp));
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(imageMapProps.X + (imageMapProps.PinXYs[i][0] * imageMapProps.Scale) - (imageMapProps.ImageTopLeftXOffset * imageMapProps.Scale),
                    imageMapProps.Y + (imageMapProps.PinXYs[i][1] * imageMapProps.Scale) - (imageMapProps.ImageTopLeftYOffset * imageMapProps.Scale),
                    imageMapProps.PinXYs[i][2], 0, Math.PI * 2, false);
                ctx.fill();
            }
        }
        ctx.restore();
    }, canvasid);
    registerMouseDownFunction(windowid, function (canvasid2, windowid2) {
        var imageMapProps = getImageMapProps(canvasid2, windowid2);
        imageMapProps.MovingMap = 1;
    }, canvasid);
    registerLostFocusFunction(canvasid, windowid, function (canvasid3, windowid3) {
        var imageMapProps = getImageMapProps(canvasid3, windowid3);
        imageMapProps.MovingMap = 0;
    });
    registerMouseUpFunction(windowid, function (canvasid4, windowid4) {
        var imageMapProps = getImageMapProps(canvasid4, windowid4);
        imageMapProps.MovingMap = 0;
    }, canvasid);
    registerClickFunction(windowid, function (canvasid5, windowid5) {
        var imageMapProps = getImageMapProps(canvasid5, windowid5);
        var canvas = getCanvas(canvasid5);
        var clickx = event.pageX - canvas.offsetLeft;
        var clicky = event.pageY - canvas.offsetTop;
        for (var i = 0; i < imageMapProps.PinXYs.length; i++) {
            if (clickx > imageMapProps.X + (imageMapProps.PinXYs[i][0] * imageMapProps.Scale) - (imageMapProps.ImageTopLeftXOffset * imageMapProps.Scale) - imageMapProps.PinXYs[i][2] &&
                clickx < imageMapProps.X + (imageMapProps.PinXYs[i][0] * imageMapProps.Scale) - (imageMapProps.ImageTopLeftXOffset * imageMapProps.Scale) + imageMapProps.PinXYs[i][2] &&
                clicky > imageMapProps.Y + (imageMapProps.PinXYs[i][1]* imageMapProps.Scale) - (imageMapProps.ImageTopLeftYOffset * imageMapProps.Scale) - imageMapProps.PinXYs[i][2] &&
                clicky < imageMapProps.Y + (imageMapProps.PinXYs[i][1] * imageMapProps.Scale) - (imageMapProps.ImageTopLeftYOffset * imageMapProps.Scale) + imageMapProps.PinXYs[i][2]) {
                if (imageMapProps.PinClickFunction != null) {
                    imageMapProps.PinClickFunction(canvasid5, windowid5, i);
                }
            }
        }
    }, canvasid);
    registerMouseMoveFunction(windowid, function (canvasid6, windowid6) {
        var imageMapProps = getImageMapProps(canvasid6, windowid6);
        var canvas = getCanvas(canvasid6);
        var x = event.pageX - canvas.offsetLeft;
        var y = event.pageY - canvas.offsetTop;
        if (imageMapProps.MovingMap == 0) {
            imageMapProps.LastMovingX = x;
            imageMapProps.LastMovingY = y;
        } else if (imageMapProps.MovingMap == 1) {
            var deltax = x - imageMapProps.LastMovingX;
            var deltay = y - imageMapProps.LastMovingY;
            if (deltax != 0 && imageMapProps.ImageTopLeftXOffset + deltax > 0 && imageMapProps.ImageTopLeftXOffset + deltax +
                (imageMapProps.Width / imageMapProps.Scale) < imageMapProps.Image.width && deltay != 0 && imageMapProps.ImageTopLeftYOffset + deltay > 0 &&
                imageMapProps.ImageTopLeftYOffset + deltay + (imageMapProps.Height / imageMapProps.Scale) < imageMapProps.Image.height) {
                imageMapProps.ImageTopLeftXOffset += deltax;
                imageMapProps.ImageTopLeftYOffset += deltay;
            }
        }
    }, canvasid);
    if (hasZoom == 1) {
        registerMouseWheelFunction(windowid, function (canvasid7, windowid7) {
            var imageMapProps = getImageMapProps(canvasid7, windowid7);
            var lastscale = imageMapProps.Scale;
            imageMapProps.Scale += (event.wheelDelta / 120) * imageMapProps.ScaleIncrementFactor;
            if (imageMapProps.ImageTopLeftXOffset + (imageMapProps.Width / imageMapProps.Scale) >= imageMapProps.Image.width ||
                imageMapProps.ImageTopLeftYOffset + (imageMapProps.Height / imageMapProps.Scale) >= imageMapProps.Image.height) {
                imageMapProps.Scale = lastscale;
            }
        }, canvasid);
    }
}

//Menu Bar code starts here

var menuBarPropsArray = new Array();
var subMenuBarPropsArray = new Array();

function getMenuBarProps(canvasid, windowid) {
    for (var i = 0; i < menuBarPropsArray.length; i++) {
        if (menuBarPropsArray[i].CanvasID == canvasid && menuBarPropsArray[i].WindowID == windowid) {
            return menuBarPropsArray[i];
        }
    }
}

function getSubMenuBarProps(canvasid, windowid) {
    for (var i = 0; i < subMenuBarPropsArray.length; i++) {
        if (subMenuBarPropsArray[i].CanvasID == canvasid && subMenuBarPropsArray[i].WindowID == windowid) {
            return subMenuBarPropsArray[i];
        }
    }
}

function createSubMenu(canvasid, controlNameId, parentWindowId, depth, data, xoffset, yoffset, parentIndexInParentMenu, dropdowncolorstart, dropdowncolorend) {
    var ctx = getCtx(canvasid);
    var greatestLength = 0;
    var greatestHeight = 5;
    var newdata = new Array();
    for (var i = 0; i < data.length; i++) {
        ctx.font = data[i][3];
        var currWidth = ctx.measureText(data[i][0]).width + 10;
        if (currWidth > greatestLength) {
            greatestLength = currWidth;
        }
        greatestHeight += data[i][2] + 5;
        newdata.push([data[i][0], data[i][1], data[i][2], data[i][3], data[i][4], data[i][5]]);
    }
    var windowid = createWindow(canvasid, xoffset, yoffset, greatestLength, greatestHeight, depth, null, 'SubMenu', controlNameId);
    registerModalWindow(canvasid, windowid);
    registerHiddenWindow(canvasid, windowid, 1);
    var heightOffset = 5;
    var childMenuWindowIDs = new Array();
    for (var i = 0; i < data.length; i++) {
        if (data[i][6] != null) {
            childMenuWindowIDs.push(createSubMenu(canvasid, controlNameId + 'SubMenuLevel1_' + i.toString(), windowid, depth, data[i][6], xoffset + greatestLength, yoffset + heightOffset + 5, i, dropdowncolorstart, dropdowncolorend));
        }
        heightOffset += data[i][2] + 5;
    }
    subMenuBarPropsArray.push({
        CanvasID: canvasid, WindowID: windowid, X: xoffset, Y: yoffset, Width: greatestLength, Height: greatestHeight,
        Data: newdata, ParentMenuWindowID: parentWindowId, ParentIndexInParentMenu: parentIndexInParentMenu, ChildMenuWindowIDs: childMenuWindowIDs,
        DropDownColorStart: dropdowncolorstart, DropDownColorEnd: dropdowncolorend
    });
    registerWindowDrawFunction(windowid, function (canvasid1, windowid1) {
        var subMenuBarProps = getSubMenuBarProps(canvasid1, windowid1);
        var parentMenuBarProps = getMenuBarProps(canvasid1, subMenuBarProps.ParentMenuWindowID);
        if (parentMenuBarProps == undefined || parentMenuBarProps == null) {
            parentMenuBarProps = getSubMenuBarProps(canvasid1, subMenuBarProps.ParentMenuWindowID);
        }
        if (parentMenuBarProps.Data[subMenuBarProps.ParentIndexInParentMenu][4] == 1) {
            var ctx = getCtx(canvasid1);
            var g = ctx.createLinearGradient(subMenuBarProps.X, subMenuBarProps.Y, subMenuBarProps.X, subMenuBarProps.Y + subMenuBarProps.Height);
            g.addColorStop(0, subMenuBarProps.DropDownColorStart);
            g.addColorStop(1, subMenuBarProps.DropDownColorEnd);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.rect(subMenuBarProps.X, subMenuBarProps.Y, subMenuBarProps.Width, subMenuBarProps.Height);
            ctx.fill();
            var heightOffset = 0;
            for (var i = 0; i < subMenuBarProps.Data.length; i++) {
                ctx.fillStyle = subMenuBarProps.Data[i][1];
                ctx.font = subMenuBarProps.Data[i][3];
                ctx.fillText(subMenuBarProps.Data[i][0], subMenuBarProps.X + 5, subMenuBarProps.Y + heightOffset + 5 + subMenuBarProps.Data[i][2]);
                heightOffset += subMenuBarProps.Data[i][2] + 5;
            }
        }
    }, canvasid);
    registerClickFunction(windowid, function (canvasid2, windowid2) {
        var subMenuBarProps = getSubMenuBarProps(canvasid2, windowid2);
        var canvas = getCanvas(canvasid2);
        var x = event.pageX - canvas.offsetLeft;
        var y = event.pageY - canvas.offsetTop;
        var heightOffset = 0;
        for (var i = 0; i < subMenuBarProps.Data.length; i++) {
            if (x > subMenuBarProps.X && x < subMenuBarProps.X + subMenuBarProps.Width && y > subMenuBarProps.Y + heightOffset + 5 &&
                y < subMenuBarProps.Y + heightOffset + 5 + subMenuBarProps.Data[i][2]) {
                if (subMenuBarProps.Data[i][5] != null) {
                    subMenuBarProps.Data[i][5](canvasid2, windowid2, 1, i);
                } else {
                    var idx = 0;
                    for (var j = 0; j < subMenuBarProps.Data.length; j++) {
                        if (j == i) {
                            if (subMenuBarProps.Data[i][4] == 0) {
                                subMenuBarProps.Data[i][4] = 1;
                                setStatusForAllChildWindowsFromMenuBar(canvasid2, subMenuBarProps.ChildMenuWindowIDs, 0, idx);
                            } else {
                                subMenuBarProps.Data[i][4] = 0;
                                setStatusForAllChildWindowsFromMenuBar(canvasid2, subMenuBarProps.ChildMenuWindowIDs, 1, idx);
                            }
                        }
                        if (subMenuBarProps.Data[j][5] == null) {
                            idx++;
                        }
                    }
                }
            }
            heightOffset += subMenuBarProps.Data[i][2] + 5;
        }
    }, canvasid);
    registerLostFocusFunction(canvasid, windowid, function (canvasid3, windowid3) {
        if (checkIfAnyMenuHasFocusFromSubMenu(canvasid3, windowid3) == 0) {
            var subMenuBarProps = getSubMenuBarProps(canvasid3, windowid3);
            var parentMenuBarProps = getMenuBarProps(canvasid3, subMenuBarProps.ParentMenuWindowID);
            if (parentMenuBarProps == undefined || parentMenuBarProps == null) {
                parentMenuBarProps = getSubMenuBarProps(canvasid3, subMenuBarProps.ParentMenuWindowID);
            }
            parentMenuBarProps.Data[subMenuBarProps.ParentIndexInParentMenu][4] = 0;
            setStatusForAllChildWindowsFromMenuBar(canvasid3, subMenuBarProps.ChildMenuWindowIDs, 1, -1);
        }
    });
    return windowid;
}

function checkIfAnyMenuHasFocusFromSubMenu(canvasid, windowid) {
    var subMenuBarProps = getSubMenuBarProps(canvasid, windowid);
    if (doingEventForWindowID == windowid) {
        return 1;
    }
    for (var i = 0; i < subMenuBarProps.ChildMenuWindowIDs.length; i++) {
        if (doingEventForWindowID == subMenuBarProps.ChildMenuWindowIDs[i]) {
            return 1;
        }
    }
    var isParentMenuBarWindowID = 1;
    var parentMenuBarProps = getMenuBarProps(canvasid, subMenuBarProps.ParentMenuWindowID);
    if (parentMenuBarProps == undefined || parentMenuBarProps == null) {
        isParentMenuBarWindowID = 0;
        parentMenuBarProps = getSubMenuBarProps(canvasid, subMenuBarProps.ParentMenuWindowID);
    }
    if (doingEventForWindowID == parentMenuBarProps.WindowID) {
        return 1;
    }
    while (isParentMenuBarWindowID == 0) {
        isParentMenuBarWindowID = 1;
        var parentMenuBarProps = getMenuBarProps(canvasid, parentMenuBarProps.ParentMenuWindowID);
        if (parentMenuBarProps == undefined || parentMenuBarProps == null) {
            isParentMenuBarWindowID = 0;
            parentMenuBarProps = getSubMenuBarProps(canvasid, subMenuBarProps.ParentMenuWindowID);
        }
        if (doingEventForWindowID == parentMenuBarProps.WindowID) {
            return 1;
        }
    }
    return 0;
}

function checkIfAnyMenuHasFocusFromParentMenu(canvasid, windowid) {
    var menuBarProps = getMenuBarProps(canvasid, windowid);
    if (doingEventForWindowID == windowid) {
        return 1;
    }
    for (var i = 0; i < menuBarProps.ChildMenuWindowIDs.length; i++) {
        if (doingEventForWindowID == menuBarProps.ChildMenuWindowIDs[i]) {
            return 1;
        }
    }
    return 0;
}

function createMenuBarControl(canvasid, controlNameId, x, y, width, height, depth, data, barcolorstart, barcolormiddle, barcolorend,
    dropdowncolorstart, dropdowncolorend, orientation) {
    var windowid = createWindow(canvasid, x, y, width, height, depth, null, 'MenuBar', controlNameId);
    var ctx = getCtx(canvasid);
    var widthOffset = 0;
    var childMenuWindowIds = new Array();
    for (var i = 0; i < data.length; i++) {
        ctx.font = data[i][3];
        if (data[i][6] != null) {
            childMenuWindowIds.push(createSubMenu(canvasid, controlNameId + i.toString(), windowid, depth, data[i][6], x + widthOffset + 5, y + height, i, dropdowncolorstart, dropdowncolorend));
        }
        widthOffset += ctx.measureText(data[i][0]).width + 5;
    }
    menuBarPropsArray.push({
        CanvasID: canvasid, WindowID: windowid, X: x, Y: y, Width: width, Height: height,
        Data: data, BarColorStart: barcolorstart, BarColorMiddle: barcolormiddle, BarColorEnd: barcolorend,
        DropDownColorStart: dropdowncolorstart, DropDownColorEnd: dropdowncolorend, ChildMenuWindowIDs: childMenuWindowIds
    });
    registerWindowDrawFunction(windowid, function (canvasid1, windowid1) {
        var menuBarProps = getMenuBarProps(canvasid1, windowid1);
        var ctx = getCtx(canvasid1);
        var g = ctx.createLinearGradient(menuBarProps.X, menuBarProps.Y, menuBarProps.X, menuBarProps.Y + menuBarProps.Height);
        g.addColorStop(0, menuBarProps.BarColorStart);
        g.addColorStop(0.5, menuBarProps.BarColorMiddle);
        g.addColorStop(1, menuBarProps.BarColorEnd);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.rect(menuBarProps.X, menuBarProps.Y, menuBarProps.Width, menuBarProps.Height);
        ctx.fill();
        var widthOffset = 0;
        for (var i = 0; i < menuBarProps.Data.length; i++) {
            ctx.fillStyle = menuBarProps.Data[i][1];
            ctx.font = menuBarProps.Data[i][3];
            ctx.fillText(menuBarProps.Data[i][0], menuBarProps.X + widthOffset + 5, menuBarProps.Y + menuBarProps.Height - ((menuBarProps.Height - menuBarProps.Data[i][2]) / 2));
            widthOffset += ctx.measureText(menuBarProps.Data[i][0]).width + 5;
        }
    }, canvasid);
    registerClickFunction(windowid, function (canvasid2, windowid2) {
        var menuBarProps = getMenuBarProps(canvasid2, windowid2);
        var ctx = getCtx(canvasid2);
        var canvas = getCanvas(canvasid2);
        var x = event.pageX - canvas.offsetLeft;
        var y = event.pageY - canvas.offsetTop;
        var widthOffset = 0;
        for (var i = 0; i < menuBarProps.Data.length; i++) {
            ctx.font = menuBarProps.Data[i][3];
            currWidth = ctx.measureText(menuBarProps.Data[i][0]).width;
            if (x > menuBarProps.X + widthOffset + 5 && x < menuBarProps.X + widthOffset + currWidth + 5 &&
                y > menuBarProps.Y && y < menuBarProps.Y + menuBarProps.Height) {
                if (menuBarProps.Data[i][6] != null) {
                    var idx = 0;
                    for (var j = 0; j < menuBarProps.Data.length; j++) {
                        if (j == i) {
                            if (menuBarProps.Data[i][4] == 0) {
                                menuBarProps.Data[i][4] = 1;
                                setStatusForAllChildWindowsFromMenuBar(canvasid2, menuBarProps.ChildMenuWindowIDs, 0, idx);
                            } else {
                                menuBarProps.Data[i][4] = 0;
                                setStatusForAllChildWindowsFromMenuBar(canvasid2, menuBarProps.ChildMenuWindowIDs, 1, idx);
                            }
                        }
                        if (menuBarProps.Data[j][6] != null) {
                            idx++;
                        }
                    }
                } else if (menuBarProps.Data[i][5] != null) {
                    menuBarProps.Data[i][5](canvasid2, windowid2, 0, i);
                }
            }
            widthOffset += currWidth + 5;
        }
    }, canvasid);
    registerLostFocusFunction(canvasid, windowid, function (canvasid3, windowid3) {
        if (checkIfAnyMenuHasFocusFromParentMenu(canvasid3, windowid3) == 0) {
            var menuBarProps = getMenuBarProps(canvasid3, windowid3);
            for (var i = 0; i < menuBarProps.Data.length; i++) {
                if (menuBarProps.Data[i][4] == 1) {
                    setStatusForAllChildWindowsFromMenuBar(canvasid3, menuBarProps.ChildMenuWindowIDs, 1, -1);
                }
                menuBarProps.Data[i][4] = 0;
            }
        }
    });
}

function setStatusForAllChildWindowsFromMenuBar(canvasid, childMenuWindowIDs, status, idx) {
    for (var i = 0; i < childMenuWindowIDs.length; i++) {
        setHiddenWindowStatus(canvasid, childMenuWindowIDs[i], (i == idx ? status : 1));
        var subMenuBarProps = getSubMenuBarProps(canvasid, childMenuWindowIDs[i]);
        for (var j = 0; j < subMenuBarProps.Data.length; j++) {
            subMenuBarProps.Data[j][4] = status;
        }
        setStatusForAllChildWindowsFromMenuBar(canvasid, subMenuBarProps.ChildMenuWindowIDs, status, -1);
    }
}

//Textbox code starts here

var textBoxPropsArray = new Array();

function getTextBoxProps(canvasid, windowid) {
    for (var i = 0; i < textBoxPropsArray.length; i++) {
        if (textBoxPropsArray[i].CanvasID == canvasid && textBoxPropsArray[i].WindowID == windowid) {
            return textBoxPropsArray[i];
        }
    }
}

function createTextBox(canvasid, controlNameId, x, y, width, height, depth, waterMarkText, waterMarkTextColor, waterMarkTextHeight, waterMarkTextFontString,
    textColor, textHeight, textFontString, maxChars, allowedCharsRegEx, isPassword, passwordChar, hasBorder, borderColor, borderLineWidth, hasShadow, shadowColor, shadowOffsetX, shadowOffsetY,
    shadowBlurValue, hasRoundedEdges, edgeRadius, hasBgGradient, bgGradientStartColor, bgGradientEndColor, hasBgImage, bgImageUrl, hasAutoComplete, listPossibles, 
    dropDownPossiblesListIfThereIsInputText, limitToListPossibles, listPossiblesTextHeight, listPossiblesTextFontString, initialText, caretColor, textSelectionBgColor, hasFocusInitially) {
    var windowid = createWindow(canvasid, x, y, width, height, depth, null, 'TextBox', controlNameId);
    if (hasFocusInitially == 1) {
        setFocusToWindowID(canvasid, windowid);
    }
    textBoxPropsArray.push({
        CanvasID: canvasid, WindowID: windowid, X: x, Y: y, Width: width, Height: height, WaterMarkText: waterMarkText,
        WaterMarkTextColor: waterMarkTextColor, WaterMarkTextFontString: waterMarkTextFontString, TextColor: textColor, TextHeight: textHeight,
        TextFontString: textFontString, MaxChars: maxChars, AllowedCharsRegEx: allowedCharsRegEx, IsPassword: isPassword, PasswordChar: passwordChar,
        HasBorder: hasBorder, BorderColor: borderColor, BorderLineWidth: borderLineWidth, HasShadow: hasShadow, ShadowOffsetX: shadowOffsetX, ShadowOffsetY: shadowOffsetY,
        ShadowBlurValue: shadowBlurValue, HasRoundedEdges: hasRoundedEdges, EdgeRadius: edgeRadius, HasBgGradient: hasBgGradient, BgGradientStartColor: bgGradientStartColor,
        BgGradientEndColor: bgGradientEndColor, HasBgImage: hasBgImage, BgImageUrl: bgImageUrl, HasAutoComplete: hasAutoComplete, ListPossibles: listPossibles,
        DropDownPossiblesListIfThereIsInputText: dropDownPossiblesListIfThereIsInputText, LimitToListPossibles: limitToListPossibles, ListPossiblesTextHeight: listPossiblesTextHeight,
        ListPossiblesTextFontString: listPossiblesTextFontString, CaretPosIndex: -1, UserInputText: initialText, ShadowColor: shadowColor, ShowCaret: 0, CaretColor: caretColor
    });
    registerWindowDrawFunction(windowid, function (canvasid1, windowid1) {
        var textBoxProps = getTextBoxProps(canvasid1, windowid1);
        var ctx = getCtx(canvasid1);
        ctx.save();
        if (textBoxProps.HasBgGradient) {
            var g = ctx.createLinearGradient(textBoxProps.X, textBoxProps.Y, textBoxProps.X, textBoxProps.Y + textBoxProps.Height);
            g.addColorStop(0.0, textBoxProps.BgGradientStartColor);
            g.addColorStop(1.0, textBoxProps.BgGradientEndColor);
            ctx.fillStyle = g;
        } else {
            ctx.fillStyle = '#FFFFFF';
        }
        if (textBoxProps.HasShadow) {
            ctx.shadowBlur = textBoxProps.ShadowBlurValue;
            ctx.shadowColor = textBoxProps.ShadowColor;
            ctx.shadowOffsetX = textBoxProps.ShadowOffsetX;
            ctx.shadowOffsetY = textBoxProps.ShadowOffsetY;
        }
        ctx.beginPath();
        if (textBoxProps.HasRoundedEdges == 1) {
            ctx.moveTo(textBoxProps.X, textBoxProps.Y + textBoxProps.EdgeRadius);
            ctx.arc(textBoxProps.X + textBoxProps.EdgeRadius, textBoxProps.Y + textBoxProps.EdgeRadius, textBoxProps.EdgeRadius, Math.PI, (Math.PI / 180) * 270, false);
            ctx.lineTo(textBoxProps.X + textBoxProps.Width - textBoxProps.EdgeRadius, textBoxProps.Y);
            ctx.arc(textBoxProps.X + textBoxProps.Width - textBoxProps.EdgeRadius, textBoxProps.Y + textBoxProps.EdgeRadius, textBoxProps.EdgeRadius, (Math.PI / 180) * 270, Math.PI * 2, false);
            ctx.lineTo(textBoxProps.X + textBoxProps.Width, textBoxProps.Y + textBoxProps.Height - textBoxProps.EdgeRadius);
            ctx.arc(textBoxProps.X + textBoxProps.Width - textBoxProps.EdgeRadius, textBoxProps.Y + textBoxProps.Height - textBoxProps.EdgeRadius, textBoxProps.EdgeRadius, 0, Math.PI / 2, false);
            ctx.lineTo(textBoxProps.X + textBoxProps.EdgeRadius, textBoxProps.Y + textBoxProps.Height);
            ctx.arc(textBoxProps.X + textBoxProps.EdgeRadius, textBoxProps.Y + textBoxProps.Height - textBoxProps.EdgeRadius, textBoxProps.EdgeRadius, Math.PI / 2, Math.PI, false);
            ctx.closePath();
        } else {
            ctx.rect(textBoxProps.X, textBoxProps.Y, textBoxProps.Width, textBoxProps.Height);
        }
        ctx.fill();
        ctx.restore();
        if (textBoxProps.HasBorder == 1) {
            ctx.strokeStyle = textBoxProps.BorderColor;
            ctx.lineWidth = textBoxProps.BorderLineWidth;
            ctx.beginPath();
            if (textBoxProps.HasRoundedEdges == 1) {
                ctx.moveTo(textBoxProps.X, textBoxProps.Y + textBoxProps.EdgeRadius);
                ctx.arc(textBoxProps.X + textBoxProps.EdgeRadius, textBoxProps.Y + textBoxProps.EdgeRadius, textBoxProps.EdgeRadius, Math.PI, (Math.PI / 180) * 270, false);
                ctx.lineTo(textBoxProps.X + textBoxProps.Width - textBoxProps.EdgeRadius, textBoxProps.Y);
                ctx.arc(textBoxProps.X + textBoxProps.Width - textBoxProps.EdgeRadius, textBoxProps.Y + textBoxProps.EdgeRadius, textBoxProps.EdgeRadius, (Math.PI / 180) * 270, Math.PI * 2, false);
                ctx.lineTo(textBoxProps.X + textBoxProps.Width, textBoxProps.Y + textBoxProps.Height - textBoxProps.EdgeRadius);
                ctx.arc(textBoxProps.X + textBoxProps.Width - textBoxProps.EdgeRadius, textBoxProps.Y + textBoxProps.Height - textBoxProps.EdgeRadius, textBoxProps.EdgeRadius, 0, Math.PI / 2, false);
                ctx.lineTo(textBoxProps.X + textBoxProps.EdgeRadius, textBoxProps.Y + textBoxProps.Height);
                ctx.arc(textBoxProps.X + textBoxProps.EdgeRadius, textBoxProps.Y + textBoxProps.Height - textBoxProps.EdgeRadius, textBoxProps.EdgeRadius, Math.PI / 2, Math.PI, false);
                ctx.closePath();
            } else {
                ctx.rect(textBoxProps.X, textBoxProps.Y, textBoxProps.Width, textBoxProps.Height);
            }
            ctx.stroke();
        }
        if (textBoxProps.UserInputText && textBoxProps.UserInputText.length > 0) {
            ctx.fillStyle = textBoxProps.TextColor;
            ctx.font = textBoxProps.TextFontString;
            ctx.fillText(textBoxProps.UserInputText, textBoxProps.X + 4, textBoxProps.Y + textBoxProps.Height - ((textBoxProps.Height - textBoxProps.TextHeight) / 2));
        } else if (textBoxProps.WaterMarkText && textBoxProps.WaterMarkText.length > 0) {
            ctx.fillStyle = textBoxProps.WaterMarkTextColor;
            ctx.font = textBoxProps.WaterMarkTextFontString;
            ctx.fillText(textBoxProps.WaterMarkText, textBoxProps.X + 4, textBoxProps.Y + textBoxProps.Height - ((textBoxProps.Height - textBoxProps.TextHeight) / 2));
        }
        if (doesWindowHaveFocus(canvasid1, windowid1) == 1) {
            if (textBoxProps.ShowCaret == 1) {
                textBoxProps.ShowCaret = 0;
                ctx.strokeStyle = textBoxProps.CaretColor;
                ctx.beginPath();
                if (textBoxProps.CaretPosIndex == -1) {
                    ctx.moveTo(textBoxProps.X, textBoxProps.Y + 4);
                    ctx.lineTo(textBoxProps.X + 3, textBoxProps.Y + 4);
                    ctx.moveTo(textBoxProps.X, textBoxProps.Y + textBoxProps.Height - 4);
                    ctx.moveTo(textBoxProps.X + 3, textBoxProps.Y + textBoxProps.Height - 4);
                    ctx.moveTo(textBoxProps.X + 2, textBoxProps.Y + 4);
                    ctx.lineTo(textBoxProps.X + 2, textBoxProps.Y + textBoxProps.Height - 4);
                } else if (textBoxProps.CaretPosIndex > -1) {
                    var tempstr = (textBoxProps.UserInputText && textBoxProps.UserInputText.length - 1 >= textBoxProps.CaretPosIndex ? textBoxProps.UserInputText.substring(0, textBoxProps.CaretPosIndex + 1) :
                        '');
                    ctx.font = textBoxProps.TextFontString;
                    var w = ctx.measureText(tempstr).width;
                    ctx.moveTo(textBoxProps.X + w, textBoxProps.Y + 4);
                    ctx.lineTo(textBoxProps.X + 3 + w, textBoxProps.Y + 4);
                    ctx.moveTo(textBoxProps.X + w, textBoxProps.Y + textBoxProps.Height - 4);
                    ctx.moveTo(textBoxProps.X + 3 + w, textBoxProps.Y + textBoxProps.Height - 4);
                    ctx.moveTo(textBoxProps.X + 2 + w, textBoxProps.Y + 4);
                    ctx.lineTo(textBoxProps.X + 2 + w, textBoxProps.Y + textBoxProps.Height - 4);
                }
                ctx.stroke();
            } else {
                textBoxProps.ShowCaret = 1;
            }
        }
    }, canvasid);
    registerClickFunction(windowid, function (canvasid2, windowid2) {
        var textBoxProps = getTextBoxProps(canvasid2, windowid2);
        var canvas = getCanvas(canvasid2);
        var x = event.pageX - canvas.offsetLeft;
        var y = event.pageY - canvas.offsetTop;
        var ctx = getCtx(canvasid2);
        ctx.font = textBoxProps.TextFontString;
        if(x > textBoxProps.X && x < textBoxProps.X + 4){
            textBoxProps.CaretPosIndex = -1;
        } else if (x > textBoxProps.X + ctx.measureText(textBoxProps.UserInputText).width + 4) {
            textBoxProps.CaretPosIndex = textBoxProps.UserInputText.length - 1;
        } else {
            var letterExtents = new Array();
            var lastWidth = 0;
            for (var i = 0; i < textBoxProps.UserInputText.length; i++) {
                var currWidth = ctx.measureText(textBoxProps.UserInputText.substring(0, i + 1)).width;
                letterExtents.push({ Width: currWidth - lastWidth });
                lastWidth = currWidth;
            }
            if (x > textBoxProps.X + 4 && x < textBoxProps.X + letterExtents[0].Width) {
                textBoxProps.CaretPosIndex = 0;
            } else {
                var lastWidth = letterExtents[0].Width;
                for (var i = 1; i < letterExtents.length; i++) {
                    if (x > textBoxProps.X + lastWidth && x < textBoxProps.X + lastWidth + letterExtents[i].Width) {
                        textBoxProps.CaretPosIndex = i;
                        return;
                    }
                    lastWidth += letterExtents[i].Width;
                }
            }
        }
    }, canvasid);
    registerKeyPressFunction(canvasid, function (canvasid3, windowid3) {
        var textBoxProps = getTextBoxProps(canvasid3, windowid3);
        var e = window.event;
        switch (e.keyCode) {
            case 37:
                //left arrow	 37
                if (textBoxProps.CaretPosIndex > -1) {
                    textBoxProps.CaretPosIndex--;
                }
                return;
            case 39:
                //right arrow	 39
                if (textBoxProps.CaretPosIndex > textBoxProps.UserInputText.length - 1) {
                    textBoxProps.CaretPosIndex = textBoxProps.UserInputText.length - 1;
                } else {
                    textBoxProps.CaretPosIndex++;
                }
                return;
            case 46:
                //delete	 46
                if (textBoxProps.CaretPosIndex < textBoxProps.UserInputText.length - 1) {
                    if (textBoxProps.CaretPosIndex == -1) {
                        textBoxProps.UserInputText = textBoxProps.UserInputText.substring(1);
                    } else if (textBoxProps.CaretPosIndex == textBoxProps.UserInputText.length - 2) {
                        textBoxProps.UserInputText = textBoxProps.UserInputText.substring(0, textBoxProps.UserInputText.length - 1);
                    } else {
                        textBoxProps.UserInputText = textBoxProps.UserInputText.substring(0, textBoxProps.CaretPosIndex + 1) +
                            textBoxProps.UserInputText.substring(textBoxProps.CaretPosIndex + 2);
                    }
                }
                return;
            case 8:
                //backspace	 8
                if (textBoxProps.CaretPosIndex > -1) {
                    if (textBoxProps.CaretPosIndex == 0) {
                        if (textBoxProps.UserInputText.length > 1) {
                            textBoxProps.UserInputText = textBoxProps.UserInputText.substring(1, textBoxProps.UserInputText.length - 1);
                        } else {
                            textBoxProps.UserInputText = '';
                        }
                        textBoxProps.CaretPosIndex = -1;
                    } else if (textBoxProps.CaretPosIndex == textBoxProps.UserInputText.length - 1) {
                        textBoxProps.UserInputText = textBoxProps.UserInputText.substring(0, textBoxProps.UserInputText.length - 1);
                        textBoxProps.CaretPosIndex--;
                    } else if (textBoxProps.CaretPosIndex > 0) {
                        textBoxProps.UserInputText = textBoxProps.UserInputText.substring(0, textBoxProps.CaretPosIndex) +
                            textBoxProps.UserInputText.substring(textBoxProps.CaretPosIndex + 1);
                        textBoxProps.CaretPosIndex--;
                    }
                }
                return;
        }
        var c = String.fromCharCode(e.keyCode);
        if (textBoxProps.CaretPosIndex == -1) {
            textBoxProps.UserInputText = c + (textBoxProps.UserInputText.length > 0 ? textBoxProps.UserInputText : '');
            textBoxProps.CaretPosIndex++;
        } else if (textBoxProps.CaretPosIndex == textBoxProps.UserInputText.length - 1) {
            textBoxProps.UserInputText = textBoxProps.UserInputText + c;
            textBoxProps.CaretPosIndex++;
        } else {
            textBoxProps.UserInputText = textBoxProps.UserInputText.substring(0, textBoxProps.CaretPosIndex + 1) + c + textBoxProps.UserInputText.substring(textBoxProps.CaretPosIndex + 1);
            textBoxProps.CaretPosIndex++;
        }
    }, windowid);
    registerAnimatedWindow(canvasid);
}


//AJAX Postback code Starts here

function invokeServerSideFunction(ajaxURL, functionName, canvasid, windowid, callBackFunc) {
    var xmlhttp;
    if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
    }
    else {// code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            //Here is where you unwrap the data
            UnWrapVars(xmlhttp.responseText);
            callBackFunc();
        }
    }
    xmlhttp.open("POST", ajaxURL, true);
    xmlhttp.overrideMimeType("application/octet-stream");
    xmlhttp.send("[FunctionName]" + functionName + "[/FunctionName][CanvasID]" + canvasid + "[/CanvasID][WindowID]" + windowid.toString() + "[/WindowID][Vars]" + getEncodedVariables() + "[/Vars]");
}

function getEncodedVariables() {
    var strVars = '[Windows]';
    for (var i = 0; i < windows.length; i++) {
        strVars += '[i]' + stringEncodeObject(windows[i]) + '[/i]';
    }
    strVars += '[/Windows][labelPropsArray]';
    for (var i = 0; i < labelPropsArray.length; i++) {
        strVars += '[i]' + stringEncodeObject(labelPropsArray[i]) + '[/i]';
    }
    strVars += '[/labelPropsArray][buttonPropsArray]';
    for (var i = 0; i < buttonPropsArray.length; i++) {
        strVars += '[i]' + stringEncodeObject(buttonPropsArray[i]) + '[/i]';
    }
    strVars += '[/buttonPropsArray][scrollBarPropsArray]';
    for (var i = 0; i < scrollBarPropsArray.length; i++) {
        strVars += '[i]' + stringEncodeObject(scrollBarPropsArray[i]) + '[/i]';
    }
    strVars += '[/scrollBarPropsArray][gridPropsArray]';
    for (var i = 0; i < gridPropsArray.length; i++) {
        strVars += '[i]' + stringEncodeObject(gridPropsArray[i]) + '[/i]';
    }
    strVars += '[/gridPropsArray][comboboxPropsArray]';
    for (var i = 0; i < comboboxPropsArray.length; i++) {
        strVars += '[i]' + stringEncodeObject(comboboxPropsArray[i]) + '[/i]';
    }
    strVars += '[/comboboxPropsArray][checkboxPropsArray]';
    for (var i = 0; i < checkboxPropsArray.length; i++) {
        strVars += '[i]' + stringEncodeObject(checkboxPropsArray[i]) + '[/i]';
    }
    strVars += '[/checkboxPropsArray][radiobuttonPropsArray]';
    for (var i = 0; i < radiobuttonPropsArray.length; i++) {
        strVars += '[i]' + stringEncodeObject(radiobuttonPropsArray[i]) + '[/i]';
    }
    strVars += '[/radiobuttonPropsArray][imageControlPropsArray]';
    for (var i = 0; i < imageControlPropsArray.length; i++) {
        strVars += '[i]' + stringEncodeObject(imageControlPropsArray[i]) + '[/i]';
    }
    strVars += '[/imageControlPropsArray][treeViewPropsArray]';
    for (var i = 0; i < treeViewPropsArray.length; i++) {
        strVars += '[i]' + stringEncodeObject(treeViewPropsArray[i]) + '[/i]';
    }
    strVars += '[/treeViewPropsArray][calenderPropsArray]';
    for (var i = 0; i < calenderPropsArray.length; i++) {
        strVars += '[i]' + stringEncodeObject(calenderPropsArray[i]) + '[/i]';
    }
    strVars += '[/calenderPropsArray][progressBarPropsArray]';
    for (var i = 0; i < progressBarPropsArray.length; i++) {
        strVars += '[i]' + stringEncodeObject(progressBarPropsArray[i]) + '[/i]';
    }
    strVars += '[/progressBarPropsArray][sliderPropsArray]';
    for (var i = 0; i < sliderPropsArray.length; i++) {
        strVars += '[i]' + stringEncodeObject(sliderPropsArray[i]) + '[/i]';
    }
    strVars += '[/sliderPropsArray][datePickerPropsArray]';
    for (var i = 0; i < datePickerPropsArray.length; i++) {
        strVars += '[i]' + stringEncodeObject(datePickerPropsArray[i]) + '[/i]';
    }
    strVars += '[/datePickerPropsArray][panelPropsArray]';
    for (var i = 0; i < panelPropsArray.length; i++) {
        strVars += '[i]' + stringEncodeObject(panelPropsArray[i]) + '[/i]';
    }
    strVars += '[/panelPropsArray][barGraphsPropsArray]';
    for (var i = 0; i < barGraphsPropsArray.length; i++) {
        strVars += '[i]' + stringEncodeObject(barGraphsPropsArray[i]) + '[/i]';
    }
    strVars += '[/barGraphsPropsArray][pieChartsPropsArray]';
    for (var i = 0; i < pieChartsPropsArray.length; i++) {
        strVars += '[i]' + stringEncodeObject(pieChartsPropsArray[i]) + '[/i]';
    }
    strVars += '[/pieChartsPropsArray][lineGraphsPropsArray]';
    for (var i = 0; i < lineGraphsPropsArray.length; i++) {
        strVars += '[i]' + stringEncodeObject(lineGraphsPropsArray[i]) + '[/i]';
    }
    strVars += '[/lineGraphsPropsArray][gaugeChartPropsArray]';
    for (var i = 0; i < gaugeChartPropsArray.length; i++) {
        strVars += '[i]' + stringEncodeObject(gaugeChartPropsArray[i]) + '[/i]';
    }
    strVars += '[/gaugeChartPropsArray][radarGraphPropsArray]';
    for (var i = 0; i < radarGraphPropsArray.length; i++) {
        strVars += '[i]' + stringEncodeObject(radarGraphPropsArray[i]) + '[/i]';
    }
    strVars += '[/radarGraphPropsArray][lineAreaGraphPropsArray]';
    for (var i = 0; i < lineAreaGraphPropsArray.length; i++) {
        strVars += '[i]' + stringEncodeObject(lineAreaGraphPropsArray[i]) + '[/i]';
    }
    strVars += '[/lineAreaGraphPropsArray][candlesticksGraphPropsArray]';
    for (var i = 0; i < candlesticksGraphPropsArray.length; i++) {
        strVars += '[i]' + stringEncodeObject(candlesticksGraphPropsArray[i]) + '[/i]';
    }
    strVars += '[/candlesticksGraphPropsArray][doughnutChartPropsArray]';
    for (var i = 0; i < doughnutChartPropsArray.length; i++) {
        strVars += '[i]' + stringEncodeObject(doughnutChartPropsArray[i]) + '[/i]';
    }
    strVars += '[/doughnutChartPropsArray][barsMixedWithLabledLineGraphsPropsArray]';
    for (var i = 0; i < barsMixedWithLabledLineGraphsPropsArray.length; i++) {
        strVars += '[i]' + stringEncodeObject(barsMixedWithLabledLineGraphsPropsArray[i]) + '[/i]';
    }
    strVars += '[/barsMixedWithLabledLineGraphsPropsArray][stackedBarGraphPropsArray]';
    for (var i = 0; i < stackedBarGraphPropsArray.length; i++) {
        strVars += '[i]' + stringEncodeObject(stackedBarGraphPropsArray[i]) + '[/i]';
    }
    strVars += '[/stackedBarGraphPropsArray][tabPropsArray]';
    for (var i = 0; i < tabPropsArray.length; i++) {
        strVars += '[i]' + stringEncodeObject(tabPropsArray[i]) + '[/i]';
    }
    strVars += '[/tabPropsArray][imageMapPropsArray]';
    for (var i = 0; i < imageMapPropsArray.length; i++) {
        strVars += '[i]' + stringEncodeObject(imageMapPropsArray[i]) + '[/i]';
    }
    strVars += '[/imageMapPropsArray][menuBarPropsArray]';
    for (var i = 0; i < menuBarPropsArray.length; i++) {
        strVars += '[i]' + stringEncodeObject(menuBarPropsArray[i]) + '[/i]';
    }
    strVars += '[/menuBarPropsArray][subMenuBarPropsArray]';
    for (var i = 0; i < subMenuBarPropsArray.length; i++) {
        strVars += '[i]' + stringEncodeObject(subMenuBarPropsArray[i]) + '[/i]';
    }
    strVars += '[/subMenuBarPropsArray][textBoxPropsArray]';
    for (var i = 0; i < textBoxPropsArray.length; i++) {
        strVars += '[i]' + stringEncodeObject(textBoxPropsArray[i]) + '[/i]';
    }
    strVars += '[/textBoxPropsArray]';
    return strVars;
}

var savedImagesOnPostback = new Array();
var currentSavedImagesOnPostbackWindowID;
var currentSavedImagesOnPostbackCanvasID;
var savedFunctionsOnPostback = new Array();


function stringEncodeObject(obj) {
    var str = '';
    for (var name in obj) {
        if ((navigator.userAgent.toLowerCase().indexOf('opera') > -1 ? obj[name] instanceof Object && obj[name].hasOwnProperty && obj[name].src : obj[name] instanceof Image)) {
            savedImagesOnPostback.push({ CanvasID: currentSavedImagesOnPostbackCanvasID, WindowID: currentSavedImagesOnPostbackWindowID, Image: obj[name] });
            continue;
        }
        var getType = {};
        if (obj[name] && getType.toString.call(obj[name]) == '[object Function]') {
            savedFunctionsOnPostback.push({ CanvasID: currentSavedImagesOnPostbackCanvasID, WindowID: currentSavedImagesOnPostbackWindowID, FunctionValue: obj[name], PropertyName: name });
        }
        if (typeof obj[name] === 'string' || typeof obj[name] === 'number') {
            if (name == "WindowID") {
                currentSavedImagesOnPostbackWindowID = obj[name].toString();
            }
            if (name == "CanvasID") {
                currentSavedImagesOnPostbackCanvasID = obj[name].toString();
            }
            str += '[' + name + ']' + encodeAllBrackets(obj[name].toString()) + '[/' + name + ']';
        } else if (obj[name] instanceof Array) {
            str += '[' + name + ']';
            for (var i = 0; i < obj[name].length; i++) {
                if (typeof obj[name][i] === 'string' || typeof obj[name][i] === 'number') {
                    str += '[i]' + encodeAllBrackets(obj[name][i].toString()) + '[/i]';
                } else if (obj[name][i] instanceof Array) {
                    str += encodeArray(obj[name][i]);
                } else {
                    str += '[Array]' + stringEncodeObject(obj[name][i]) + '[/Array]';
                }
            }
            str += '[/' + name + ']'
        } else {
            str += stringEncodeObject(obj[name]);
        }
    }
    return str;
}

function encodeAllBrackets(str) {
    str = str.replace('&', '&amp;');
    str = str.replace('[', '&lb;');
    return str.replace(']', '&rb;');
}

function encodeArray(arr) {
    var str = '[Array]';
    for (var i = 0; i < arr.length; i++) {
        if (typeof arr[i] === 'string' || typeof arr[i] === 'number') {
            str += '[i]' + encodeAllBrackets(arr[i].toString()) + '[/i]';
        } else if (arr[i] instanceof Array) {
            str += encodeArray(arr[i]);
        } else {
            str += '[Array]' + stringEncodeObject(arr[i]) + '[/Array]';
        }
    }
    return str + '[/Array]'
}


function UnWrapVars(data) {
    var xmlDoc;
    data = data.replace(/\[/g, '<');
    data = data.replace(/\]/g, '>');
    data = data.replace(/[&]lb[;]/g, '[')
    data = data.replace(/[&]rb[;]/g, ']')
    data = data.replace(/[&]amp[;]/g, '&');
    if (window.DOMParser) {
        var parser = new DOMParser();
        xmlDoc = parser.parseFromString(data, "text/xml");
        for (var i = 0; i < xmlDoc.firstChild.childNodes[0].childNodes.length; i++) {
            eval(xmlDoc.firstChild.childNodes[0].childNodes[i].nodeName + " = new Array();");
            for (var x = 0; x < xmlDoc.firstChild.childNodes[0].childNodes[i].childNodes.length; x++) {
                var obj = new Object();
                recurseFillVars(xmlDoc.firstChild.childNodes[0].childNodes[i].nodeName, xmlDoc.firstChild.childNodes[0].childNodes[i].childNodes[x], obj);
                eval(xmlDoc.firstChild.childNodes[0].childNodes[i].nodeName + ".push(obj);");
            }
        }
    }
    for (var i = 0; i < savedImagesOnPostback.length; i++) {
        for (var x = 0; x < imageMapPropsArray.length; x++) {
            if (imageMapPropsArray[x].CanvasID == savedImagesOnPostback[i].CanvasID && imageMapPropsArray[x].WindowID == savedImagesOnPostback[i].WindowID) {
                imageMapPropsArray[x].Image = savedImagesOnPostback[i].Image;
            }
        } 
        for (var x = 0; x < imageControlPropsArray.length; x++) {
            if (imageControlPropsArray[x].CanvasID == savedImagesOnPostback[i].CanvasID && imageControlPropsArray[x].WindowID == savedImagesOnPostback[i].WindowID) {
                imageControlPropsArray[x].Image = savedImagesOnPostback[i].Image;
            }
        }
    }
    for (var i = 0; i < savedFunctionsOnPostback.length; i++) {
        var o = getLabelProps(savedFunctionsOnPostback[i].CanvasID, savedFunctionsOnPostback[i].WindowID);
        if (setSavedFunctionOnPostback(o, savedFunctionsOnPostback, i) == 1) { continue; }
        var o = getButtonProps(savedFunctionsOnPostback[i].CanvasID, savedFunctionsOnPostback[i].WindowID);
        if (setSavedFunctionOnPostback(o, savedFunctionsOnPostback, i) == 1) { continue; }
        var o = getScrollBarProps(savedFunctionsOnPostback[i].CanvasID, savedFunctionsOnPostback[i].WindowID);
        if (setSavedFunctionOnPostback(o, savedFunctionsOnPostback, i) == 1) { continue; }
        var o = getGridProps(savedFunctionsOnPostback[i].CanvasID, savedFunctionsOnPostback[i].WindowID);
        if (setSavedFunctionOnPostback(o, savedFunctionsOnPostback, i) == 1) { continue; }
        var o = getComboboxPropsByTextAreaWindowId(savedFunctionsOnPostback[i].CanvasID, savedFunctionsOnPostback[i].WindowID);
        if (setSavedFunctionOnPostback(o, savedFunctionsOnPostback, i) == 1) { continue; }
        var o = getcheckboxProps(savedFunctionsOnPostback[i].CanvasID, savedFunctionsOnPostback[i].WindowID);
        if (setSavedFunctionOnPostback(o, savedFunctionsOnPostback, i) == 1) { continue; }
        var o = getRadioButtonProps(savedFunctionsOnPostback[i].CanvasID, savedFunctionsOnPostback[i].WindowID);
        if (setSavedFunctionOnPostback(o, savedFunctionsOnPostback, i) == 1) { continue; }
        var o = getImageControlProps(savedFunctionsOnPostback[i].CanvasID, savedFunctionsOnPostback[i].WindowID);
        if (setSavedFunctionOnPostback(o, savedFunctionsOnPostback, i) == 1) { continue; }
        var o = getTreeViewProps(savedFunctionsOnPostback[i].CanvasID, savedFunctionsOnPostback[i].WindowID);
        if (setSavedFunctionOnPostback(o, savedFunctionsOnPostback, i) == 1) { continue; }
        var o = getCalenderProps(savedFunctionsOnPostback[i].CanvasID, savedFunctionsOnPostback[i].WindowID);
        if (setSavedFunctionOnPostback(o, savedFunctionsOnPostback, i) == 1) { continue; }
        var o = getSliderProps(savedFunctionsOnPostback[i].CanvasID, savedFunctionsOnPostback[i].WindowID);
        if (setSavedFunctionOnPostback(o, savedFunctionsOnPostback, i) == 1) { continue; }
        var o = getDatePickerPropsByTextBoxAreaWindowID(savedFunctionsOnPostback[i].CanvasID, savedFunctionsOnPostback[i].WindowID);
        if (setSavedFunctionOnPostback(o, savedFunctionsOnPostback, i) == 1) { continue; }
        var o = getPanelProps(savedFunctionsOnPostback[i].CanvasID, savedFunctionsOnPostback[i].WindowID);
        if (setSavedFunctionOnPostback(o, savedFunctionsOnPostback, i) == 1) { continue; }
        var o = getBarGraphProps(savedFunctionsOnPostback[i].CanvasID, savedFunctionsOnPostback[i].WindowID);
        if (setSavedFunctionOnPostback(o, savedFunctionsOnPostback, i) == 1) { continue; }
        var o = getPieChartProps(savedFunctionsOnPostback[i].CanvasID, savedFunctionsOnPostback[i].WindowID);
        if (setSavedFunctionOnPostback(o, savedFunctionsOnPostback, i) == 1) { continue; }
        var o = getLineGraphProps(savedFunctionsOnPostback[i].CanvasID, savedFunctionsOnPostback[i].WindowID);
        if (setSavedFunctionOnPostback(o, savedFunctionsOnPostback, i) == 1) { continue; }
        var o = getGaugeChartProps(savedFunctionsOnPostback[i].CanvasID, savedFunctionsOnPostback[i].WindowID);
        if (setSavedFunctionOnPostback(o, savedFunctionsOnPostback, i) == 1) { continue; }
        var o = getRadarGraphProps(savedFunctionsOnPostback[i].CanvasID, savedFunctionsOnPostback[i].WindowID);
        if (setSavedFunctionOnPostback(o, savedFunctionsOnPostback, i) == 1) { continue; }
        var o = getLineAreaGraphProps(savedFunctionsOnPostback[i].CanvasID, savedFunctionsOnPostback[i].WindowID);
        if (setSavedFunctionOnPostback(o, savedFunctionsOnPostback, i) == 1) { continue; }
        var o = getCandlesticksGraphProps(savedFunctionsOnPostback[i].CanvasID, savedFunctionsOnPostback[i].WindowID);
        if (setSavedFunctionOnPostback(o, savedFunctionsOnPostback, i) == 1) { continue; }
        var o = getDoughnutChartProps(savedFunctionsOnPostback[i].CanvasID, savedFunctionsOnPostback[i].WindowID);
        if (setSavedFunctionOnPostback(o, savedFunctionsOnPostback, i) == 1) { continue; }
        var o = getBarsMixedWithLabledLineGraphProps(savedFunctionsOnPostback[i].CanvasID, savedFunctionsOnPostback[i].WindowID);
        if (setSavedFunctionOnPostback(o, savedFunctionsOnPostback, i) == 1) { continue; }
        var o = getstackedBarGraphProps(savedFunctionsOnPostback[i].CanvasID, savedFunctionsOnPostback[i].WindowID);
        if (setSavedFunctionOnPostback(o, savedFunctionsOnPostback, i) == 1) { continue; }
        var o = getTabProps(savedFunctionsOnPostback[i].CanvasID, savedFunctionsOnPostback[i].WindowID);
        if (setSavedFunctionOnPostback(o, savedFunctionsOnPostback, i) == 1) { continue; }
        var o = getImageMapProps(savedFunctionsOnPostback[i].CanvasID, savedFunctionsOnPostback[i].WindowID);
        if (setSavedFunctionOnPostback(o, savedFunctionsOnPostback, i) == 1) { continue; }
        var o = getMenuBarProps(savedFunctionsOnPostback[i].CanvasID, savedFunctionsOnPostback[i].WindowID);
        if (setSavedFunctionOnPostback(o, savedFunctionsOnPostback, i) == 1) { continue; }
        var o = getSubMenuBarProps(savedFunctionsOnPostback[i].CanvasID, savedFunctionsOnPostback[i].WindowID);
        if (setSavedFunctionOnPostback(o, savedFunctionsOnPostback, i) == 1) { continue; }
        var o = getTextBoxProps(savedFunctionsOnPostback[i].CanvasID, savedFunctionsOnPostback[i].WindowID);
        if (setSavedFunctionOnPostback(o, savedFunctionsOnPostback, i) == 1) { continue; }
    }
    savedImagesOnPostback = new Array();
    for (var i = 0; i < canvases.length; i++) {
        draw(canvases[i][0]);
    }
}

function setSavedFunctionOnPostback(o, savedFunctionsOnPostback, i) {
    if (o != null) {
        o[savedFunctionsOnPostback[i].PropertyName] = savedFunctionsOnPostback[i].FunctionValue;
        return 1;
    }
    return 0;
}

function recurseFillVars(varname, node, obj) {
    for (var i = 0; i < node.childNodes.length; i++) {
        if (node.childNodes[i].childNodes.length > 0 && node.childNodes[i].childNodes[0].nodeName == "Array") {
            var arr = new Array();
            obj[node.childNodes[i].nodeName] = arr;
            for (var x = 0; x < node.childNodes[i].childNodes[0].childNodes.length; x++) {
                if (node.childNodes[i].childNodes[0].childNodes[x].nodeName == "Array") {
                    var arr2 = new Array();
                    recurseFillArray(arr2, node.childNodes[i].childNodes[0].childNodes[x]);
                    arr.push(arr2);
                } else {
                    arr.push(correctValueTypes(node.childNodes[i].childNodes[0].childNodes[x].childNodes.length > 0 ? node.childNodes[i].childNodes[0].childNodes[x].childNodes[0].nodeValue :
                        node.childNodes[i].childNodes[0].childNodes[x].nodeValue));
                }
            }
        } else {
            obj[node.childNodes[i].nodeName] = correctValueTypes(node.childNodes[i].childNodes.length > 0 ? node.childNodes[i].childNodes[0].nodeValue : node.childNodes[i].nodeValue);
        }
    }
}

function correctValueTypes(o) {
    if (typeof o == 'string' && (parseInt(o) >= 0 || parseInt(o) < 0) && parseInt(o).toString() == o) {
        return parseInt(o);
    }
    return o;
}

function recurseFillArray(arr, node) {
    for (var i = 0; i < node.childNodes.length; i++) {
        if (node.childNodes[i].nodeName == "Array") {
            var arr2 = new Array();
            recurseFillArray(arr2, node.childNodes[i]);
            arr.push(arr2);
        } else {
            arr.push(correctValueTypes(node.childNodes[i].childNodes.length > 0 ? node.childNodes[i].childNodes[0].nodeValue : node.childNodes[i].nodeValue));
        }
    }
}