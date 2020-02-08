import * as go from 'gojs';

const componentsList = require("../json/componentsList.json");

export let onMoreInfo = {
    active: false,
    title: "",
    overview: [],
    characteristics: [],
    links: []
};

let GO, diagram, diagramCode, cw = 1;
export const initDiagram = (savedModel) => {
    GO = go.GraphObject.make;

    diagram = GO(go.Diagram, "divDiagram", {
        "undoManager.isEnabled": true,
        "toolManager.mouseWheelBehavior": go.ToolManager.WheelZoom,
        initialAutoScale: go.Diagram.Uniform,
        initialContentAlignment: go.Spot.Center
    });
    diagramCode = GO(go.Diagram, "divDiagramCode", {
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
    let sharedToolTip = GO("ToolTip", {
        "Border.figure": "RoundedRectangle"
    }, GO(go.TextBlock, { margin: 2 },
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
        return GO("ContextMenuButton",
            GO(go.TextBlock, text),
            { click: action },
            visiblePredicate ? new go.Binding("visible", "", function (o, e) { return o.diagram ? visiblePredicate(o, e) : false; }).ofObject() : {});
    };
    var nodeMenu =
        GO("ContextMenu",
            makeButton("Copy",
                function (e, obj) { e.diagram.commandHandler.copySelection(); }),
            makeButton("Delete",
                function (e, obj) { e.diagram.commandHandler.deleteSelection(); }),
            GO(go.Shape, "LineH", { strokeWidth: 2, height: 1, stretch: go.GraphObject.Horizontal }),
            makeButton("More Info...",
                function (e, obj) { loadInfo(e, obj) })
        );
    let lineMenu =
        GO("ContextMenu",
            makeButton("Delete",
                function (e, obj) { e.diagram.commandHandler.deleteSelection(); }),
            makeButton("Change Color",
                function (e, obj) { changeColor(e, obj) })
        );
    diagram.contextMenu = GO("ContextMenu",
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
    let paletteTemplate = GO(go.Node, "Table", nodeStyle(),
        GO(go.Panel, "Vertical",
            GO(go.Picture, new go.Binding("source", "image"), {
                width: 110, height: 110,
                imageStretch: go.GraphObject.Uniform
            }),
            GO(go.TextBlock,
                new go.Binding("text", "", function (d) { return d.text; }))
        ));
        let paletteCodeTemplate = GO(go.Node, "Table",)

    //Template de los componentes
    let componentsTemplate = GO(go.Node, "Spot", nodeStyle(),
        GO(go.Picture, new go.Binding("source", "image"), {
            imageStretch: go.GraphObject.Fill
        }, new go.Binding("width", "width"), new go.Binding("height", "height")),
        {
            contextMenu: nodeMenu
        },
        new go.Binding("itemArray", "items"), {
        itemTemplate: GO(go.Panel, "Position", { stretch: go.GraphObject.Fill },
            GO(go.Shape, "Rectangle",
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
    let linesTemplate = GO(go.Link, {
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
        GO(go.Shape, { isPanelMain: true, stroke: "transparent", strokeWidth: 8 }),
        GO(go.Shape, { isPanelMain: true, stroke: "rgb(0, 151, 156)", strokeWidth: 5 })
    );

    //Asignación del template (nodos) al diagrama
    for (let i = 0; i < components.length; i++) {
        diagram.nodeTemplateMap.add(components[i].category, componentsTemplate);
    }
    //diagram.nodeTemplateMap.add("c1", componentsTemplate);
    //diagram.nodeTemplateMap.add("c2", componentsTemplate);
    //Asignación del template (líneas) al diagrama
    diagram.linkTemplate = linesTemplate;


    /* 
                        PALETA
     */
    //Creación de la paleta
    let palette = new go.Palette("listComponents");
    let pIO = new go.Palette("pIO");
    let pSRL = new go.Palette("pSRL");
    palette.nodeTemplate = paletteTemplate;
    //Llenado de la paleta
    palette.model = new go.GraphLinksModel(components);


    /* 
                        OVERVIEW
     */
    let overview = GO(go.Overview, "div-overview", {
        observed: diagram
    });
    let overviewCode = GO(go.Overview, "div-overviewCode", {
        observed: diagramCode
    });


    /* 
                        INFO MODAL
     */


    //Carga diagrama
    loadDiagram(savedModel);
    layout();

    document.getElementById("divDiagramCode").style.visibility = "hidden";
    document.getElementById("listSentences").style.visibility = "hidden";
    document.getElementById("div-overviewCode").style.visibility = "hidden";
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
    var blob = diagram.makeImageData({ background: "white", returnType: "blob", callback: myCallback });
}

function switchCanvas() {
    let c1 = document.getElementById("divDiagram");
    let c1p = document.getElementById("listComponents");
    let c1o = document.getElementById("div-overview");
    let c2 = document.getElementById("divDiagramCode");
    let c2p = document.getElementById("listSentences");
    let c2o = document.getElementById("div-overviewCode");
    let bs = document.getElementById("btnSwitch");
    let dt = document.getElementById("divTitle");
    let ds = document.getElementById("divSearchC");
    
    if (cw === 1) {
        c1.style.visibility = "hidden";
        c1p.style.visibility = "hidden";
        c1o.style.visibility = "hidden";
        ds.style.visibility = "hidden";
        c2.style.visibility = "visible";
        c2p.style.visibility = "visible";
        c2o.style.visibility = "visible";
        bs.innerHTML = "Diagram";
        dt.innerHTML = "Blocks";

        cw = 2;
    }
    else if (cw === 2) {
        c1.style.visibility = "visible";
        c1p.style.visibility = "visible";
        c1o.style.visibility = "visible";
        ds.style.visibility = "visible";
        c2.style.visibility = "hidden";
        c2p.style.visibility = "hidden";
        c2o.style.visibility = "hidden";
        bs.innerHTML = "Code";
        dt.innerHTML = "Components";
        
        cw = 1;
    }
}