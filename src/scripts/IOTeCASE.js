import { fabric } from "fabric";

fabric.Canvas.prototype.prefix = 'iotc';
fabric.Canvas.prototype.seq = 0;
fabric.isTouchDevice = false;
fabric._pallete = undefined;
fabric._diagram = undefined;
fabric._overview = undefined;

fabric.Canvas.prototype.sequence = function () {
    return {
        set: (p, type) => {
            if (type === "prefix")
                this.prefix = String(p);
            else if (type === "seq")
                this.seq = p;
        },
        get: () => {
            let result = this.prefix + this.seq;
            this.seq += 1;
            return result;
        }
    };
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
                object.uid = this.sequence().get();
        });
        return this;
    };
})(fabric.Canvas.prototype.add);

fabric.window.onresize = function () {
    if (fabric._pallete) {
        if (fabric._pallete._align === "vertical") {
            fabric._pallete.setWidth(fabric._pallete.wrapperEl.parentNode.clientWidth);
            fabric._pallete.forEachObject(o => {
                o.set({ left: fabric._pallete.width / 2 - o.width / 2 });
                o._posXDefault = o.left;
            });   
        }
    }
    if (fabric._diagram) {
        fabric._diagram.setWidth(fabric._diagram.wrapperEl.parentNode.clientWidth);
        fabric._diagram.setHeight(fabric._diagram.wrapperEl.parentNode.clientHeight);
    }
}

fabric.window.ontouchstart = function () {
    fabric.isTouchDevice = true;
}


fabric.Diagram = function (DOMSelector) {
    const rootDomNode = document.getElementById(DOMSelector);
    const canvas = document.createElement("canvas");
    canvas.id = "canvasDiagram";
    canvas.width = rootDomNode.clientWidth;
    canvas.height = rootDomNode.clientHeight;
    rootDomNode.appendChild(canvas);
    this._diagram = new this.Canvas("canvasDiagram", {
        isDrawingMode: false,
        preserveObjectStacking: true,
        selection: false,
        perPixelTargetFind: true
    });
    return this._diagram;
}


fabric.Palette = function (type, DOMSelector) {
    const rootDomNode = document.getElementById(DOMSelector);
    const canvas = document.createElement("canvas");
    canvas.id = "canvasPalette";
    canvas.width = rootDomNode.clientWidth;
    canvas.height = rootDomNode.clientHeight;
    rootDomNode.appendChild(canvas);
    this._pallete = new this.Canvas("canvasPalette", {
        isDrawingMode: false,
        preserveObjectStacking: true,
        selection: false,
        perPixelTargetFind: true,
        moveCursor: "no-drop"
    });
    this._pallete.sourceMap = { "path": "", "name": "", "width": 0, "height": 0 };
    Object.defineProperty(this._pallete, "model", {
        get: function () {
            return this._model;
        },
        set: async function (model) {
            this._model = model;
            this.clear();
            if (model && Array.isArray(model)) {
                this._tamY = 20;
                for (const node of model) {
                    await new Promise((resolve, reject) => {
                        fabric.Image.fromURL(node[this.sourceMap.path], img => {
                            if (img._originalElement) {
                                if (img.width > img.height) img.scaleToWidth(this.sourceMap.width);
                                else img.scaleToHeight(this.sourceMap.height);
                                let txtNombre = new fabric.Text(node[this.sourceMap.name], { fontSize: 14 });
                                this._align = type;
                                if (type === "vertical") {
                                    img.left = this.width / 2 - (img.width * img.scaleX) / 2;
                                    img.top = this._tamY;
                                    txtNombre.top = this._tamY + img.height * img.scaleY;
                                    txtNombre.left = this.width / 2 - txtNombre.width / 2;
                                }
                                let comp = new fabric.Group([img, txtNombre], {
                                    top: this._tamY,
                                    hasControls: false,
                                    hoverCursor: "pointer"
                                });
                                comp._posXDefault = comp.left;
                                comp._tamYDefault = comp.top;
                                comp._nodeData = node;
                                comp._sourceMap = this.sourceMap;
                                this._tamY += img.height * img.scaleY + 20 + txtNombre.height;
                                this.add(comp);
                                resolve();
                            } else {
                                reject();
                            }
                        });
                    });
                };
                if (this._tamY > rootDomNode.clientHeight) {
                    this.setHeight(this._tamY);
                } else this.height = rootDomNode.clientHeight;
                this.calcOffset();
            }
            return this._model;
        }
    });
    this._pallete.on({
        'mouse:up': function (e) {
            console.log(e);
            
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
        'object:moving': function (e) {
            if (fabric._diagram) {
                fabric._diagram._lP = fabric._diagram.wrapperEl.parentNode.getBoundingClientRect();
                if (fabric._diagram._lP.top < e.e.clientY &&
                    fabric._diagram._lP.left < e.e.clientX &&
                    fabric._diagram._lP.left + fabric._diagram._lP.width > e.e.clientX &&
                    fabric._diagram._lP.top + fabric._diagram._lP.height > e.e.clientY) {
                    {
                        fabric.util.removeListener(fabric.document, 'mousemove', fabric._pallete._onMouseMove);
                        fabric.util.removeListener(fabric.document, 'touchmove', fabric._pallete._onMouseMove);

                        fabric.util.addListener(fabric._pallete.upperCanvasEl, 'mousemove', fabric._pallete._onMouseMove);
                        fabric.util.addListener(fabric._pallete.upperCanvasEl, 'touchmove', fabric._pallete._onMouseMove, {
                            passive: false
                        });

                        if (fabric.isTouchDevice) {
                            // Wait 500ms before rebinding mousedown to prevent double triggers
                            // from touch devices
                            setTimeout(function () {
                                fabric.util.addListener(fabric._pallete.upperCanvasEl, 'mousedown', fabric._pallete._onMouseDown);
                            }, 500);
                        }
                    }
                    {
                        fabric.util.addListener(fabric.document, 'touchend', fabric._diagram._onMouseUp, {
                            passive: false
                        });
                        fabric.util.addListener(fabric.document, 'touchmove', fabric._diagram._onMouseMove, {
                            passive: false
                        });

                        fabric.util.removeListener(fabric._diagram.upperCanvasEl, 'mousemove', fabric._diagram._onMouseMove);
                        fabric.util.removeListener(fabric._diagram.upperCanvasEl, 'touchmove', fabric._diagram._onMouseMove);

                        if (fabric.isTouchDevice) {
                            // Unbind mousedown to prevent double triggers from touch devices
                            fabric.util.removeListener(fabric._diagram.upperCanvasEl, 'mousedown', fabric._diagram._onMouseDown);
                        } else {
                            fabric.util.addListener(fabric.document, 'mouseup', fabric._diagram._onMouseUp);
                            fabric.util.addListener(fabric.document, 'mousemove', fabric._diagram._onMouseMove);
                        }
                    }
                    setTimeout(function () {
                        fabric.Image.fromURL(e.target._nodeData[e.target._sourceMap.path], img => {
                            img.set({
                                scaleX: e.target._nodeData.width / img.width / (img.getBoundingRect(false).width / img.getScaledWidth()),
                                scaleY: e.target._nodeData.height / img.height / (img.getBoundingRect(false).height / img.getScaledHeight()),
                                top: e.e.clientY,
                                left: e.e.clientX 
                            });
                            const pendingTransform = JSON.parse(JSON.stringify(fabric._pallete._currentTransform));
                            img._nodeData = e.target._nodeData;
                            fabric._diagram.add(img);
                            pendingTransform.target = img;
                            fabric._diagram._currentTransform = pendingTransform;
                            fabric._diagram.setActiveObject(img);
                            fabric._diagram.renderAll();
                        });
                    }, 10);
                }
            }
        }
    });
    return this._pallete;
}

export { fabric as IOTeCASE };