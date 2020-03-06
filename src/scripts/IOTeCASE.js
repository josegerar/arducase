import { fabric } from "fabric";

fabric.isTouchDevice = false;
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

fabric.Canvas.prototype._getEl = function (elContainer) {

    const rootDomNode = document.getElementById(elContainer);
    if (!rootDomNode) {
        throw new Error("Element cont ainer is not defined");
    }
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
}

// fabric.window.onresize = function () {
//     if (fabric._pallete) {
//         if (fabric._pallete._align === "vertical") {
//             fabric._pallete.setWidth(fabric._pallete.wrapperEl.parentNode.clientWidth);
//             fabric._pallete.forEachObject(o => {
//                 o.set({ left: fabric._pallete.width / 2 - o.width / 2 });
//                 o._posXDefault = o.left;
//             });
//         }
//     }
//     if (fabric._diagram) {
//         fabric._diagram.setWidth(fabric._diagram.wrapperEl.parentNode.clientWidth);
//         fabric._diagram.setHeight(fabric._diagram.wrapperEl.parentNode.clientHeight);
//         fabric._diagram._lP = fabric._diagram.wrapperEl.parentNode.getBoundingClientRect();
//     }
// }

// fabric.window.ontouchstart = function () {
//     fabric.isTouchDevice = true;
// }

fabric.Diagram = fabric.util.createClass(fabric.Canvas, {

    initialize: function (elContainer, nodeDataArray) {

        const options = {
            isDrawingMode: false,
            preserveObjectStacking: true,
            selection: false,
            perPixelTargetFind: true
        };

        if (arguments.length === 0 || !elContainer) {
            throw new Error("Properties undefined to call");
        }

        this.callSuper('initialize', this._getEl(elContainer), options);

        this.upperCanvasEl.tabIndex = 1;

        fabric._diagram = this;

        this._initEvents();
    },

    isEditing: false,

    _initEvents: function(){

        fabric.window.onresize = this._resizeCanvas.bind(this);

        fabric.util.addListener(this.upperCanvasEl, 'keydown', this._onKeyEvents.bind(this));

        fabric.util.addListener(this.upperCanvasEl, 'blur', this._onBlur.bind(this));

        fabric.util.addListener(this.upperCanvasEl, 'focus', this._onFocus.bind(this));
    },

    _onBlur: function(){
        this.isEditing = false;
    },

    _onFocus: function(e){
        this.isEditing = true;
    },

    _onKeyEvents: function (e) {
        console.log(this.isEditing,e);
    },

    _resizeCanvas: function () {
        this.setWidth(this.wrapperEl.parentNode.clientWidth);
        this.setHeight(this.wrapperEl.parentNode.clientHeight);
        this._lP = this.wrapperEl.parentNode.getBoundingClientRect();
    }
});

fabric.Palette = fabric.util.createClass(fabric.Canvas, {

    initialize: function (elContainer, orientationType, nodeDataArray) {

        const options = {
            isDrawingMode: false,
            selection: false,
            perPixelTargetFind: true,
            moveCursor: "no-drop"
        };

        if (arguments.length === 0 || !elContainer) {
            throw new Error("Properties undefined to call");
        }

        this.callSuper('initialize', this._getEl(elContainer), options);

        this._oType = orientationType;

        if (Array.isArray(nodeDataArray)) {
            this.setNodeDataArray(nodeDataArray, orientationType);
        }

        this.on({ 'mouse:up': this._mouseUpEvent, 'object:moving': this._objectMovingEvent });

        fabric.window.onresize = this._resizeCanvas.bind(this);

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

                {
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
                }
                {
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
                }
                setTimeout(() => {

                    fabric.Image.fromURL(e.target._nodeData[this._pNPathBinding], img => {

                        img.set({
                            scaleX: e.target._nodeData.width / img.width / (img.getBoundingRect(false).width / img.getScaledWidth()),
                            scaleY: e.target._nodeData.height / img.height / (img.getBoundingRect(false).height / img.getScaledHeight()),
                            top: e.e.clientY - this._diagram._lP.top - Math.abs(e.pointer.y - e.target.top) / e.target.scaleX / e.target.scaleY,
                            left: e.e.clientX - this._diagram._lP.left - Math.abs(e.pointer.x - e.target.left) / e.target.scaleX / e.target.scaleY,
                            hasControls: false
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