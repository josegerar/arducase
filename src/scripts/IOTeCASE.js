import { fabric } from "fabric";

fabric.Canvas.prototype.prefix = 'iotc';
fabric.Canvas.prototype.seq = 0;

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
console.log(fabric);

fabric.Palette = function (type, DOMSelector) {
    const rootDomNode = document.getElementById(DOMSelector);
    const canvas = document.createElement("canvas");
    canvas.id = "canvasPalette";
    canvas.width = rootDomNode.clientWidth;
    canvas.height = rootDomNode.clientHeight;
    rootDomNode.appendChild(canvas);
    const pallete = new this.Canvas("canvasPalette", { 
        isDrawingMode: false, 
        preserveObjectStacking: true, 
        selection: false, 
        perPixelTargetFind: true,
        moveCursor: "no-drop" 
    });
    pallete.sourceMap = { "path": "", "name": "", "width": 0, "height": 0 };
    Object.defineProperty(pallete, "model", {
        get: function () {
            return this._model;
        },
        set: async function (model) {
            this._model = model;
            this.clear();
            if (model && model.length > 0) {
                this._posY = 20;
                for (const node of model) {
                    await new Promise((resolve, reject) => {
                        fabric.Image.fromURL(node[this.sourceMap.path], img => {
                            if (img._originalElement) {
                                if (img.width > img.height) img.scaleToWidth(this.sourceMap.width);
                                else img.scaleToHeight(this.sourceMap.width);
                                let txtNombre = new fabric.Text(node[this.sourceMap.name], { fontSize: 14 });
                                if (type === "vertical") {
                                    img.left = this.width / 2 - (img.width * img.scaleX) / 2;
                                    img.top = this._posY;
                                    txtNombre.top = this._posY + img.height * img.scaleY;
                                    txtNombre.left = this.width / 2 - txtNombre.width / 2;
                                }
                                let comp = new fabric.Group([img, txtNombre], {
                                    top: this._posY,
                                    hasControls: false,
                                    hoverCursor: "pointer"
                                });
                                comp._posXDefault = comp.left;
                                comp._posYDefault = comp.top;
                                comp._nodeData = node;
                                this._posY += img.height * img.scaleY + 20 + txtNombre.height;
                                this.add(comp);
                                resolve();
                            } else {
                                reject();
                            }
                        });
                    });
                };
                if (this._posY > rootDomNode.clientHeight) {
                    this.setHeight(this._posY);
                } else this.height = rootDomNode.clientHeight;
                delete this.posY;
                this.calcOffset();
            }
            return this._model;
        }
    });
    pallete.on({
        'mouse:up': (e) => {
            if (e.target) {
                e.target._posYDefault && e.target._posXDefault && e.target.set({
                    top: e.target._posYDefault,
                    left: e.target._posXDefault
                });
                pallete.calcOffset();
                pallete.forEachObject(o => {
                    o.setCoords();
                });
            }
        }
    });
    return pallete;
}

export { fabric as IOTeCASE };