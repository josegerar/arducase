import * as go from 'gojs';

const componentsList = require("../json/componentsList.json");

export let onMoreInfo = {
    active: false,
    title: "",
    overview: [],
    characteristics: [],
    links: []
};

let WENT, diagram, cw = 1;
export const initDiagram = (savedModel) => {
    WENT = go.GraphObject.make;

    diagram = WENT(go.Diagram, "divDiagram", {
        "undoManager.isEnabled": true,
        "toolManager.mouseWheelBehavior": go.ToolManager.WheelZoom,
        initialAutoScale: go.Diagram.Uniform,
        initialContentAlignment: go.Spot.Center
    });


    /* 
                        LISTENERS
     */
    //Cuando se modifica algo, agrega un * al título de la página
    diagram.addDiagramListener("Modified", function (e) {
        let idx = document.title.indexOf("*");
        if (diagram.isModified) {
            if (idx < 0) document.title += "*";
        } else {
            if (idx >= 0) document.title = document.title.substr(0, idx);
        }
    });

    //Listado de componentes
    let components = componentsList;


    /* 
                        TOOLTIPS
     */
    //Nombre del componente - tooltip
    let sharedToolTip = WENT("ToolTip", {
        "Border.figure": "RoundedRectangle"
    }, WENT(go.TextBlock, { margin: 2 },
        new go.Binding("text", "", function (d) { return d.text; }))
    );


    /* 
                        PROPIEDADES
     */
    //Propiedades del nodo
    function nodeStyle() {
        return [new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
        new go.Binding("isShadowed", "isSelected").ofObject(),
        {
            locationSpot: go.Spot.Center,
            shadowOffset: new go.Point(0, 0),
            shadowBlur: 15,
            shadowColor: "blue",
            toolTip: sharedToolTip,
            cursor: "pointer"
        }];
    }


    /* 
                        CONTEXTMENU
     */
    function makeButton(text, action, visiblePredicate) {
        return WENT("ContextMenuButton",
            WENT(go.TextBlock, text),
            { click: action },
            visiblePredicate ? new go.Binding("visible", "", function (o, e) { return o.diagram ? visiblePredicate(o, e) : false; }).ofObject() : {});
    };
    var nodeMenu =
        WENT("ContextMenu",
            makeButton("Copy",
                function (e, obj) { e.diagram.commandHandler.copySelection(); }),
            makeButton("Delete",
                function (e, obj) { e.diagram.commandHandler.deleteSelection(); }),
            WENT(go.Shape, "LineH", { strokeWidth: 2, height: 1, stretch: go.GraphObject.Horizontal }),
            makeButton("More Info...",
                function (e, obj) { loadInfo(e, obj) })
        );
    let lineMenu =
        WENT("ContextMenu",
            makeButton("Delete",
                function (e, obj) { e.diagram.commandHandler.deleteSelection(); }),
            makeButton("Change Color",
                function (e, obj) { changeColor(e, obj) })
        );
    diagram.contextMenu = WENT("ContextMenu",
        makeButton("Paste",
            function (e, obj) { e.diagram.commandHandler.pasteSelection(e.diagram.toolManager.contextMenuTool.mouseDownPoint); },
            function (o) { return o.diagram.commandHandler.canPasteSelection(o.diagram.toolManager.contextMenuTool.mouseDownPoint); }),
        makeButton("Undo",
            function (e, obj) { e.diagram.commandHandler.undo(); },
            function (o) { return o.diagram.commandHandler.canUndo(); }),
        makeButton("Redo",
            function (e, obj) { e.diagram.commandHandler.redo(); },
            function (o) { return o.diagram.commandHandler.canRedo(); })
    );


    /* 
                        TEMPLATES
     */
    //Template de la paleta
    let paletteTemplate = WENT(go.Node, "Table", nodeStyle(),
        WENT(go.Panel, "Vertical",
            WENT(go.Picture, new go.Binding("source", "image"), {
                width: 110, height: 110,
                imageStretch: go.GraphObject.Uniform
            }),
            WENT(go.TextBlock,
                new go.Binding("text", "", function (d) { return d.text; }))
        ));

    //Template de los componentes
    let componentsTemplate = WENT(go.Node, "Spot", nodeStyle(),
        WENT(go.Picture, new go.Binding("source", "image"), {
            imageStretch: go.GraphObject.Fill
        }, new go.Binding("width", "width"), new go.Binding("height", "height")),
        {
            contextMenu: nodeMenu
        },
        new go.Binding("itemArray", "items"), {
        itemTemplate: WENT(go.Panel, "Position", { stretch: go.GraphObject.Fill },
            WENT(go.Shape, "Rectangle",
                {
                    desiredSize: new go.Size(11, 11),
                    fill: "transparent", stroke: null,
                    toMaxLinks: 1,
                    cursor: "pointer",
                    fromLinkable: true,
                    toLinkable: true,
                    mouseEnter: function (e, port) { if (!e.diagram.isReadOnly) port.fill = "red"; },
                    mouseLeave: function (e, port) { port.fill = "transparent"; }
                }, new go.Binding("portId", "name"),
                new go.Binding("position", "", function (d) { return new go.Point(d.pos.x, d.pos.y); })))
    });

    //Template de las líneas
    let linesTemplate = WENT(go.Link, {
        routing: go.Link.Orthogonal,
        corner: 4,
        curve: go.Link.JumpGap,
        cursor: "pointer",
        selectable: true,
        relinkableFrom: true,
        relinkableTo: true,
        reshapable: true,
        resegmentable: true,
        mouseEnter: function (e, link) { link.elt(0).stroke = "rgba(0, 151, 156, 0.3)"; },
        mouseLeave: function (e, link) { link.elt(0).stroke = "transparent"; },
        contextMenu: lineMenu
    }, new go.Binding("points").makeTwoWay(),
        WENT(go.Shape, { isPanelMain: true, stroke: "transparent", strokeWidth: 8 }),
        WENT(go.Shape, { isPanelMain: true, stroke: "rgb(0, 151, 156)", strokeWidth: 5 })
    );

    //Asignación del template (nodos) al diagrama
    for (let i = 0; i < components.length; i++) {
        diagram.nodeTemplateMap.add(components[i].category, componentsTemplate);
    }
    //Asignación del template (líneas) al diagrama
    diagram.linkTemplate = linesTemplate;


    /* 
                        PALETA
     */
    //Creación de la paleta
    let palette = new go.Palette("listComponents");
    palette.nodeTemplate = paletteTemplate;
    //Llenado de la paleta
    palette.model = new go.GraphLinksModel(components);


    /* 
                        OVERVIEW
     */
    WENT(go.Overview, "div-overview", {
        observed: diagram
    });


    //Carga diagrama
    loadDiagram(savedModel);
    layout();

    document.getElementById("divDiagramCode").style.visibility = "hidden";
    document.getElementById("btnSwitch").addEventListener("click", switchCanvas);
}

export const saveDiagram = () => {
    diagram.isModified = false;
}

function loadDiagram(savedModel) {
    diagram.model = go.Model.fromJson(savedModel);
}

function layout() {
    diagram.layoutDiagram(true);
}

export const getModelJson = () => {
    return diagram.model.toJson();
}

export const getImage_B64 = () => {
    let img = diagram.makeImageData({ scale: 1, background: "white", type: "image/png" });

    return img.split(',')[1];
}

function changeColor(e, obj) {
    alert("Próximamente solo en cines...");
}

function loadInfo(e, obj) {
    let contextmenu = obj.part;
    let nodedata = contextmenu.data;
    let fileInfo = require("../json/ComponentsInfo/" + nodedata.category + "/" + nodedata.category + ".json");
    onMoreInfo = {
        active: true,
        title: fileInfo.title,
        overview: fileInfo.overview,
        characteristics: fileInfo.characteristics,
        links: fileInfo.links
    };
    window.editorPage.updateState(true);
}

function myCallback(blob) {
    var url = window.URL.createObjectURL(blob);
    var filename = "diagram.png";

    var a = document.createElement("a");
    a.style = "display: none";
    a.href = url;
    a.download = filename;

    // IE 11
    if (window.navigator.msSaveBlob !== undefined) {
        window.navigator.msSaveBlob(blob, filename);
        return;
    }

    document.body.appendChild(a);
    requestAnimationFrame(function () {
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    });
}

export const makeBlob = () => {
    return diagram.makeImageData({ background: "white", returnType: "blob", callback: myCallback });
}

function switchCanvas() {
    let c1 = document.getElementById("divDiagram");
    let tp = document.getElementById("toolP");
    let c2 = document.getElementById("divDiagramCode");
    let bs = document.getElementById("btnSwitch");
    if (cw === 1) {
        c1.style.visibility = "hidden";
        tp.style.visibility = "hidden";
        c2.style.visibility = "visible";
        bs.innerHTML = "Diagram";
        cw = 2;
    }
    else if (cw === 2) {
        c1.style.visibility = "visible";
        tp.style.visibility = "visible";
        c2.style.visibility = "hidden";
        bs.innerHTML = "Code";
        cw = 1;
    }
}
