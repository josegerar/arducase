import { fabric } from "fabric";

fabric._diagram = undefined;
fabric._overview = undefined;

fabric.Canvas.prototype.sequence = {
    prefix: 'iotc',
    seq: 0,
    set: function (p, type) {
        if (type === "prefix")
            this.prefix = String(p);
        else if (type === "seq")
            this.seq = p;
    },
    get: function () {
        this.seq += 1;
        return this.prefix + this.seq;
    }
};
fabric.Object.prototype.getZIndex = function () {
    return this.canvas.getObjects().indexOf(this);
};
fabric.Canvas.prototype.addToPosition = function (object, position) {
    this.add(object);
    while (object.getZIndex() > position) {
        this.sendBackwards(object);
    }
};
fabric.Object.prototype.toObject = (function (toObject) {
    return function () {
        return fabric.util.object.extend(toObject.call(this), {
            id: this.id,
            uid: this.uid,
            name: this.name,
            ports: this.ports,
            part: this.part
        });
    };
})(fabric.Object.prototype.toObject);

fabric.Canvas.prototype.add = (function (originalFn) {
    return function (...args) {
        originalFn.call(this, ...args);
        args.forEach(object => {
            if (!object.uid)
                object.uid = this.sequence.get();
        });
        return this;
    };
})(fabric.Canvas.prototype.add);

fabric.OverView = fabric.util.createClass(fabric.Canvas, {

    initialize: function (elContainer, properties) {
        const options = {
            isDrawingMode: false,
            selection: false,
            stopContextMenu: true
        };

        if (arguments.length === 0 || !elContainer || !properties.observed) {
            throw new Error("Properties undefined to call");
        }

        const el = this._getEl(elContainer);

        this.callSuper('initialize', el, options);

        this.on('mouse:down', this._onMouseDownEvents);
        this.on('mouse:move', this._onPanning);
        this.on('mouse:up', this._offPanning);

        fabric.util.addListener(fabric.window, 'resize', this._onResizeCanvas.bind(this));

        this.wrapperEl.style.overflow = "hidden";
        this.wrapperEl.style.backgroundColor = "mintcream";

        this._observed = properties.observed;

        this._observed.on("after:render", this._onRenderObserved.bind(this));

        this._onResizeCanvas();

        fabric._overview = this;

    },

    lastPosX: 0,

    lastPosY: 0,

    _maxPointX: 1200,

    _maxPointY: 1200,

    _observed: null,

    _continuePanning: function (e) {

        this.viewportTransform[4] = e.e.clientX - this.lastPosX + this.viewportTransform[4];
        this.viewportTransform[5] = e.e.clientY - this.lastPosY + this.viewportTransform[5];

        this._setLimitsDiagram();

        this.lastPosX = e.e.clientX;
        this.lastPosY = e.e.clientY;

    },

    _getEl: function (elContainer) {

        const rootDomNode = document.getElementById(elContainer);

        if (!rootDomNode) {
            throw new Error("Element container is not defined");
        }

        rootDomNode.style.maxHeight = "100%";
        rootDomNode.style.maxWidth = "100%";

        const canvas = document.createElement("canvas");
        let el = `${elContainer}canvas`;

        while (document.getElementById(el) !== null) {
            el += fabric.util.getRandomInt(0, 500);
        }

        canvas.id = el;
        canvas.width = rootDomNode.clientWidth;
        canvas.height = rootDomNode.clientHeight;
        canvas.style.maxHeight = "100%";
        canvas.style.maxWidth = "100%";


        rootDomNode.appendChild(canvas);

        return el;
    },

    _offPanning: function (e) {

        this.calcOffset();

        this.forEachObject(o => {
            o.setCoords();
        });
    },

    _onPanning: function (e) {

        if (e.button === 1) {

            this.lastPosX = e.e.clientX;
            this.lastPosY = e.e.clientY;

        }

    },

    _onRenderObserved: function (e) {

        let _toJSON = this._observed.toJSON();
        delete _toJSON.background;

        this.setZoom(0.13);

        this.loadFromJSON(_toJSON, () => {
            this.requestRenderAll();
        }, (oJSON, oCanvas) => {

        });

    },

    _onResizeCanvas: function () {

        if (this._observed) {

            const scale = ((this._observed.width / this.wrapperEl.parentNode.clientWidth) >= (this._observed.height / this.wrapperEl.parentNode.clientHeight)) ? (this._observed.width / this.wrapperEl.parentNode.clientWidth) : (this._observed.height / this.wrapperEl.parentNode.clientHeight);

            this.setWidth(this._observed.width / scale);
            this.setHeight(this._observed.height / scale);

            this.wrapperEl.parentNode.style.padding = `${(this.wrapperEl.parentNode.clientHeight - (this._observed.height / scale)) / 2}px ${(this.wrapperEl.parentNode.clientWidth - (this._observed.width / scale)) / 2}px`;

        } else {

            this.setWidth(this.wrapperEl.parentNode.clientWidth);
            this.setHeight(this.wrapperEl.parentNode.clientHeight);

        }
    },

    _setLimitsDiagram: function () {


    }

});

fabric.Diagram = fabric.util.createClass(fabric.Canvas, {

    initialize: function (elContainer, nodeDataArray) {

        const options = {
            isDrawingMode: false,
            preserveObjectStacking: true,
            selection: false,
            perPixelTargetFind: true,
            fireRightClick: true,
            stopContextMenu: true
        };

        if (arguments.length === 0 || !elContainer) {
            throw new Error("Properties undefined to call");
        }

        const el = this._getEl(elContainer);

        this._initContextMenu(elContainer);

        this.callSuper('initialize', el, options);

        this.wrapperEl.style.maxHeight = "100%";
        this.wrapperEl.style.maxWidth = "100%";

        this._initDiagram();
    },

    _contextMenu: null,

    _contextMenuItems: [
        { type: "Copy", node: null, value: null },
        { type: "Paste", node: null, value: null },
        { type: "Delete", node: null, value: null },
        { type: "Undo", node: null, value: null },
        { type: "Redo", node: null, value: null },
        { type: "Clear", node: null, value: null },
        { type: "More Info", node: null, value: null }
    ],

    _backGroundImageURL: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAIAAACRXR/mAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAASdEVYdFNvZnR3YXJlAEdyZWVuc2hvdF5VCAUAAADLSURBVFhH7ZnBCoMwEET9/68URBHSNj0UolFoI+aQickKlT05jz0MGQIPkb2kadu3ta42ff/MTtLRazct55bajOMjO0lHr920vnWMMTGV0GuphVALoRaiqNV1dq4TLsdUIrTe+z0fw+ndmEo0w/D61AmXYyqh1179WjGVuNLyl0eohVALuZ8Wtzwgt9zyiNxSC6EWQi1EUYtbHpBbbnlEbqmFUAuhFqKoxS0PyC23PCK31EKohVAL0dXK3vLSOX0TnKZ1z8fw/3uiW37L27QIZwrV4gAAAABJRU5ErkJggg==",

    _maxPointX: 0,

    _maxPointY: 0,

    _limitView: null,

    _limitZoom: null,

    isEditing: false,

    isDragging: false,

    isMenuVisible: false,

    lastPosX: 0,

    lastPosY: 0,

    _addCssStyleContextMenu: function (el) {
        const css = `
        .${el} {
            width: 200px;
            box-shadow: 1px 3px 5px 3px #00979c82;
            position: absolute;
            display: none;
            background-color: snow;
        }
        .${el} ul {
            list-style: none;
            padding: 1px 1px;
            margin-bottom: 0;
            margin-top: 0;
        }
        .${el} ul li {
            font-weight: 500;
            font-size: 14px;
            padding: 10px 40px 10px 20px;
            cursor: pointer;
            border-style: ridge;
        }
        .${el} ul li:hover { 
              background: rgba(0, 0, 0, 0.2); 
        }`;

        const style = document.createElement('style');

        if (style.styleSheet) {
            style.styleSheet.cssText = css;
        } else {
            style.appendChild(document.createTextNode(css));
        }

        document.getElementsByTagName('head')[0].appendChild(style);
    },

    _addLimit: function () {
        return new fabric.Rect({
            fill: 'rgba(0,0,0,0)',
            stroke: 'rgba(0,0,0,1)',
            strokeWidth: 4,
            selectable: false,
            evented: false
        });
    },

    _addLimitsView: function () {
        this._limitView = this._addLimit();

        this._limitView.set({
            left: 0,
            top: 0,
            width: this.vptCoords.br.x - this.vptCoords.tl.x - this._limitView.strokeWidth,
            height: this.vptCoords.br.y - this.vptCoords.tl.y - this._limitView.strokeWidth
        });
        this.add(this._limitView);
    },

    _addLimitsZoom: function () {
        this._limitZoom = this._addLimit();

        let points = {}, iVpt = fabric.util.invertTransform(this.viewportTransform);
        points.tl = fabric.util.transformPoint({ x: 0, y: 0 }, iVpt);
        points.br = fabric.util.transformPoint({ x: this._maxPointX * this.getZoom(), y: this._maxPointY * this.getZoom() }, iVpt);

        this._limitZoom.set({
            left: 0,
            top: 0,
            width: points.br.x - points.tl.x - this._limitZoom.strokeWidth,
            height: points.br.y - points.tl.y - this._limitZoom.strokeWidth
        });

        this.add(this._limitZoom);
    },

    _continuePanning: function (e) {

        if (this.isDragging) {

            this.viewportTransform[4] = e.e.clientX - this.lastPosX + this.viewportTransform[4];
            this.viewportTransform[5] = e.e.clientY - this.lastPosY + this.viewportTransform[5];

            this._setLimitsDiagram();

            this.lastPosX = e.e.clientX;
            this.lastPosY = e.e.clientY;

        }
    },

    _getEl: function (elContainer) {

        const rootDomNode = document.getElementById(elContainer);

        if (!rootDomNode) {
            throw new Error("Element container is not defined");
        }

        rootDomNode.style.maxHeight = "100%";
        rootDomNode.style.maxWidth = "100%";

        const canvas = document.createElement("canvas");
        let el = `${elContainer}canvas`;

        while (document.getElementById(el) !== null) {
            el += fabric.util.getRandomInt(0, 500);
        }

        canvas.id = el;
        canvas.width = rootDomNode.clientWidth;
        canvas.height = rootDomNode.clientHeight;
        canvas.style.maxHeight = "100%";
        canvas.style.maxWidth = "100%";

        rootDomNode.appendChild(canvas);

        return el;
    },

    _initContextMenu: function (elContainer) {
        let rootDomNode = document.getElementById(elContainer);

        if (!rootDomNode) {
            throw new Error("Element cont ainer is not defined");
        }

        this._contextMenu = document.createElement("div");
        this._contextMenu.classList.add(`${elContainer}menu`);

        fabric.util.addListener(this._contextMenu, 'contextmenu', this._disableContextMenu.bind(this));

        this._addCssStyleContextMenu(`${elContainer}menu`);

        let ulContextMenu = document.createElement("ul");

        this._contextMenuItems.forEach(value => {

            let liItem = document.createElement("li");

            liItem.innerText = value.type;

            liItem.addEventListener("click", this._onObjectActions.bind(this, value.type));

            ulContextMenu.appendChild(liItem);

            value.node = liItem;
        });

        this._contextMenu.appendChild(ulContextMenu);
        rootDomNode.appendChild(this._contextMenu);
    },

    _initDiagram: function () {

        this.calcViewportBoundaries();

        this.upperCanvasEl.tabIndex = 1;

        fabric._diagram = this;

        this._initEvents();

        this._lP = this.wrapperEl.parentNode.getBoundingClientRect();

        this._maxPointX = this.getWidth() + (this.getWidth() / 2);

        this._maxPointY = this.getHeight() + (this.getHeight() / 2);

        this._addLimitsView();
        this._addLimitsZoom();

        this.setBackgroundColor({ source: this._backGroundImageURL, repeat: 'repeat' }, this.requestRenderAll.bind(this), () => this.requestRenderAll());

    },

    _initEvents: function () {

        fabric.util.addListener(this.upperCanvasEl, 'keydown', this._onKeyEvents.bind(this));
        fabric.util.addListener(this.upperCanvasEl, 'blur', this._offFocus.bind(this));
        fabric.util.addListener(this.upperCanvasEl, 'focus', this._onFocus.bind(this));
        fabric.util.addListener(fabric.window, 'resize', this._onResizeCanvas.bind(this));

        this.on('mouse:wheel', this._onZoom);
        this.on('mouse:down', this._onMouseDownEvents);
        this.on('mouse:move', this._continuePanning);
        this.on('mouse:up', this._offPanning);
        this.on('object:moving', this._onObjectMoving);
        this.on("render:contextmenu", this._onRenderContextMenu);
        this.on("object:selected", this._onObjectSelected);
    },

    _offContextMenu: function (e) {

        if (this.isMenuVisible) this._toggleMenu("hide");

    },

    _offFocus: function () {

        this.isEditing = false;

    },

    _offPanning: function (e) {

        if (this.isDragging) {

            this.isDragging = false;
            this.selection = true;

            this.calcOffset();
            this.forEachObject(o => {
                o.setCoords();
            });
        }
    },

    _disableContextMenu: function (e) {

        e.preventDefault();

        e.stopPropagation();

        return false;
    },

    _onObjectActions: function (action, e) {
        console.log({ action: action, e: e, arg: this });

    },

    _onRenderContextMenu: function (e) {

        let _top = e.e.clientY, _left = e.e.clientX;
        const _dimension = this._contextMenu.getBoundingClientRect();

        this._changeContexMenuItems(e.target);

        if ((_dimension.height + _dimension.top) > (this._lP.height + this._lP.top)) _top -= _dimension.height;
        if ((_dimension.width + _dimension.left) > (this._lP.width + this._lP.left)) _left -= _dimension.width;

        this._contextMenu.style.left = `${_left}px`;
        this._contextMenu.style.top = `${_top}px`;

        this._toggleMenu("show");

    },

    _onObjectMoving: function (e) {

    },

    _onObjectSelected: function (e) {
        console.log(e);

    },

    _onPanning: function (e) {

        if (!e.target && e.button === 1) {

            this.isDragging = true;
            this.selection = false;

            this.lastPosX = e.e.clientX;
            this.lastPosY = e.e.clientY;

        }

    },

    _onFocus: function (e) {
        this.isEditing = true;
    },

    _onKeyEvents: function (e) {
        console.log(this, e);
    },

    _onMouseDownEvents: function (e) {

        this._onPanning(e);

        this._offContextMenu(e);

        this._fireObjectMenu(e);

    },

    _onResizeCanvas: function () {

        this.setWidth(this.wrapperEl.parentNode.clientWidth);
        this.setHeight(this.wrapperEl.parentNode.clientHeight);

        this._lP = this.wrapperEl.parentNode.getBoundingClientRect();

    },

    _onZoom: function (e) {
        let zoom = this.getZoom();
        zoom = zoom - e.e.deltaY / Math.abs(e.e.deltaY * 10);
        if (zoom > 2) zoom = 2;
        if (zoom < (this.getWidth() / this._maxPointX)) zoom = this.getWidth() / this._maxPointX;
        if (zoom < (this.getHeight() / this._maxPointY)) zoom = this.getHeight() / this._maxPointY;

        this.zoomToPoint({ x: e.e.offsetX, y: e.e.offsetY }, zoom);

        this._setLimitsDiagram();

        e.e.preventDefault();
        e.e.stopPropagation();
    },

    _toggleMenu: function (command) {

        if (command === "show") {

            this._contextMenu.style.display = "block";
            this.isMenuVisible = true;

        } else {

            this._contextMenu.style.display = "none";
            this.isMenuVisible = false;

        }
    },

    _changeContexMenuItems: function (target) {

        this._contextMenuItems.forEach(val => {

            if ((target && val.type === "Paste") || (!target && val.type !== "Paste")) {

                val.node.style.display = "none";

            } else {

                val.node.style.display = "block";
            }

        });
    },

    _setLimitsDiagram: function () {

        const minX = this.getWidth() - this._maxPointX * this.getZoom();
        const minY = this.getHeight() - this._maxPointY * this.getZoom();

        if (this.viewportTransform[4] < minX) this.viewportTransform[4] = minX;
        if (this.viewportTransform[5] < minY) this.viewportTransform[5] = minY;

        if (this.viewportTransform[4] >= 0) this.viewportTransform[4] = 0;
        if (this.viewportTransform[5] >= 0) this.viewportTransform[5] = 0;

        this.calcViewportBoundaries();

        this._setLimitsContainer();

        this.requestRenderAll();
    },

    _setLimitsContainer: function () {

        this._limitView && this._limitView.set({
            top: this.vptCoords.tl.y,
            left: this.vptCoords.tl.x,
            width: this.vptCoords.br.x - this.vptCoords.tl.x - this._limitView.strokeWidth,
            height: this.vptCoords.br.y - this.vptCoords.tl.y - this._limitView.strokeWidth
        });

        let points = {}, iVpt = fabric.util.invertTransform(this.viewportTransform);

        points.tl = fabric.util.transformPoint({ x: 0, y: 0 }, iVpt);
        points.br = fabric.util.transformPoint({
            x: -(this.getWidth() - this._maxPointX * this.getZoom()) + this.getWidth(),
            y: -(this.getHeight() - this._maxPointY * this.getZoom()) + this.getHeight()
        }, iVpt);

        this._limitZoom.set({
            top: 0,
            left: 0,
            width: points.br.x - points.tl.x - this._limitZoom.strokeWidth,
            height: points.br.y - points.tl.y - this._limitZoom.strokeWidth
        });
    },

    _fireObjectMenu: function (e) {

        if (e.button === 3) {

            if (e.target) {

                this.setActiveObject(e.target, e.e);
                this.fire("render:contextmenu", e);

            } else {

                this.discardActiveObject();

            }

            this.requestRenderAll();

        }

    }
});

fabric.Palette = fabric.util.createClass(fabric.Canvas, {

    initialize: function (elContainer, orientationType, nodeDataArray) {

        const options = {
            isDrawingMode: false,
            selection: false,
            perPixelTargetFind: true,
            moveCursor: "no-drop",
            stopContextMenu: true
        };

        if (arguments.length === 0 || !elContainer) {
            throw new Error("Properties undefined to call");
        }

        this.callSuper('initialize', this._getEl(elContainer), options);

        this._oType = orientationType;

        if (Array.isArray(nodeDataArray)) {
            this.setNodeDataArray(nodeDataArray, orientationType);
        }

        this.wrapperEl.style.overflow = "overlay";
        this.wrapperEl.style.maxWidth = "100%";
        this.wrapperEl.style.maxHeight = "100%";

        this.on({ 'mouse:up': this._mouseUpEvent, 'object:moving': this._objectMovingEvent });

        fabric.util.addListener(fabric.window, 'resize', this._resizeCanvas.bind(this));

        fabric._palette = this;

    },

    _diagram: null,

    _oType: null,

    _oTypeArray: ["horizontal", "h", "vertical", "v"],

    _pHeight: null,

    _pNHeight: 100,

    _pNNameBinding: null,

    _pNPathBinding: null,

    _pNWidth: 100,

    _pWidth: null,

    _configNodeDataArray: function (nodeDataArray, orientationType) {

        Array.isArray(nodeDataArray) || (nodeDataArray = []);

        if (orientationType) this._oType = orientationType;

        if (!this._oTypeArray.includes(this._oType)) throw new Error("Orientation type is invalid");

        this.clear();

        this._pWidth = 20;
        this._pHeight = 20;

    },

    getDiagram: function () {
        return this._diagram;
    },

    _getEl: function (elContainer) {

        const rootDomNode = document.getElementById(elContainer);

        if (!rootDomNode) {
            throw new Error("Element container is not defined");
        }

        rootDomNode.style.maxHeight = "100%";
        rootDomNode.style.maxWidth = "100%";

        const canvas = document.createElement("canvas");
        let el = `${elContainer}canvas`;

        while (document.getElementById(el) !== null) {
            el += fabric.util.getRandomInt(0, 500);
        }

        canvas.id = el;
        canvas.width = rootDomNode.clientWidth;
        canvas.height = rootDomNode.clientHeight;

        rootDomNode.appendChild(canvas);

        return el;
    },

    _mouseUpEvent: function (e) {
        if (e.target) {
            e.target._posYDefault && e.target._posXDefault && e.target.set({
                top: e.target._posYDefault,
                left: e.target._posXDefault
            });
            this.calcOffset();
            this.forEachObject(o => {
                o.setCoords();
            });
        }
    },

    _nodeImageItem: function (imageURL) {
        return new Promise((resolve, reject) => {
            fabric.Image.fromURL(imageURL, img => {
                if (img._originalElement) {
                    if (img.width > img.height) img.scaleToWidth(this._pNWidth);
                    else img.scaleToHeight(this._pNHeight);
                    resolve(img);
                } else {
                    reject();
                }
            });
        });
    },

    _objectMovingEvent: function (e) {
        this._diagram || fabric._diagram || (this._diagram = {});

        if (this._diagram) {

            this._diagram._lP = this._diagram.wrapperEl.parentNode.getBoundingClientRect();

            if (this._diagram._lP.top < e.e.clientY &&
                this._diagram._lP.left < e.e.clientX &&
                this._diagram._lP.left + this._diagram._lP.width > e.e.clientX &&
                this._diagram._lP.top + this._diagram._lP.height > e.e.clientY) {

                const pendingTransform = JSON.parse(JSON.stringify(this._currentTransform));

                fabric.util.removeListener(fabric.document, 'mousemove', this._onMouseMove);
                fabric.util.removeListener(fabric.document, 'touchmove', this._onMouseMove);

                fabric.util.addListener(this.upperCanvasEl, 'mousemove', this._onMouseMove);
                fabric.util.addListener(this.upperCanvasEl, 'touchmove', this._onMouseMove, {
                    passive: false
                });

                if (fabric.isTouchSupported) {
                    // Wait 500ms before rebinding mousedown to prevent double triggers
                    // from touch devices
                    setTimeout(function () {
                        fabric.util.addListener(this.upperCanvasEl, 'mousedown', this._onMouseDown);
                    }, 500);
                }

                fabric.util.addListener(fabric.document, 'touchend', this._diagram._onMouseUp, {
                    passive: false
                });
                fabric.util.addListener(fabric.document, 'touchmove', this._diagram._onMouseMove, {
                    passive: false
                });

                fabric.util.removeListener(this._diagram.upperCanvasEl, 'mousemove', this._diagram._onMouseMove);
                fabric.util.removeListener(this._diagram.upperCanvasEl, 'touchmove', this._diagram._onMouseMove);

                if (fabric.isTouchSupported) {
                    // Unbind mousedown to prevent double triggers from touch devices
                    fabric.util.removeListener(this._diagram.upperCanvasEl, 'mousedown', this._diagram._onMouseDown);
                } else {
                    fabric.util.addListener(fabric.document, 'mouseup', this._diagram._onMouseUp);
                    fabric.util.addListener(fabric.document, 'mousemove', this._diagram._onMouseMove);
                }

                setTimeout(() => {

                    fabric.Image.fromURL(e.target._nodeData[this._pNPathBinding], img => {

                        img.set({
                            scaleX: e.target._nodeData.width / img.width / (img.getBoundingRect(false).width / img.getScaledWidth()),
                            scaleY: e.target._nodeData.height / img.height / (img.getBoundingRect(false).height / img.getScaledHeight()),
                            top: ((e.e.clientY - this._diagram._lP.top - (Math.abs(e.pointer.y - e.target.top) * this._diagram.getZoom()) / e.target.scaleX / e.target.scaleY) - this._diagram.viewportTransform[5]) / this._diagram.getZoom(),
                            left: ((e.e.clientX - this._diagram._lP.left - (Math.abs(e.pointer.x - e.target.left) * this._diagram.getZoom()) / e.target.scaleX / e.target.scaleY) - this._diagram.viewportTransform[4]) / this._diagram.getZoom(),
                            hasControls: false,
                            hoverCursor: "pointer"
                        });

                        img._nodeData = e.target._nodeData;

                        this._diagram.add(img);

                        pendingTransform.target = img;

                        this._diagram._currentTransform = pendingTransform;
                        this._diagram.setActiveObject(img);
                        this._diagram.renderAll();
                    });
                }, 10);
            }
        }
    },

    _resizeCanvas: function () {

        if (this._oTypeArray.indexOf(this._oType) < 2) {

            this._resizeCanvasH();

        } else {

            this._resizeCanvasV();

        }

    },

    _resizeCanvasH: function () {
        throw new Error("function _resizeCanvasH() is not resolve");
    },

    _resizeCanvasV: function () {
        this.setWidth(this.wrapperEl.parentNode.clientWidth);
        this.forEachObject(o => {
            o.set({ left: this.width / 2 - o.width / 2 });
            o._posXDefault = o.left;
        });
    },

    setDiagram: function (diagram) {
        this._diagram = diagram;
    },

    setNodeDataArray: function (nodeDataArray, orientationType) {

        this._configNodeDataArray(nodeDataArray, orientationType);

        if (nodeDataArray.length > 0) {
            if (this._oTypeArray.indexOf(this._oType) < 2) {
                this._setNodeItemsH(nodeDataArray);
            } else {
                this._setNodeItemsV(nodeDataArray);
            }
        }
    },

    _setNodeItemsH: function (nodeDataArray) {
        throw new Error("function _setNodeItemsH(nodeDataArray) is not working");
    },

    _setNodeItemsV: async function (nodeDataArray) {
        this._pWidth += this._pNWidth;
        for (let i = 0; i < nodeDataArray.length; i++) {
            const node = nodeDataArray[i];
            let image = await this._nodeImageItem(node[this._pNPathBinding]);
            let txtNombre = new fabric.Text(node[this._pNNameBinding], { fontSize: 14 });
            image.left = this.width / 2 - (image.width * image.scaleX) / 2;
            image.top = this._pHeight;
            txtNombre.top = this._pHeight + image.height * image.scaleY;
            txtNombre.left = this.width / 2 - txtNombre.width / 2;
            let comp = new fabric.Group([image, txtNombre], { top: this._pHeight, hasControls: false, hoverCursor: "pointer" });
            comp._posXDefault = comp.left;
            comp._posYDefault = comp.top;
            comp._nodeData = node;
            this.add(comp);
            this._pHeight += image.height * image.scaleY + 20 + txtNombre.height;
        }
        if (this._pHeight > this.wrapperEl.parentNode.clientHeight) this.setHeight(this._pHeight);
        else this.setHeight(this.wrapperEl.parentNode.clientHeight);
    },

    /*
    *object example {whidth: 100, height: 100, nPropName: "text", nPropPath: "image"}
    * nodearray [{text: "", image: ""}] to binding props
    */

    setNodeTemplate: function (nodeTemplate) {
        this._pNWidth = nodeTemplate.width;
        this._pNHeight = nodeTemplate.height;
        this._pNNameBinding = nodeTemplate.nPropName;
        this._pNPathBinding = nodeTemplate.nPropPath;
    },

    _touchStart: function () {
        this.isTouchDevice = true;
    }
});



export { fabric as IOTeCASE };