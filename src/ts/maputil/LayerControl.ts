import * as L from 'leaflet'
import { Action } from '../../../../treecomponent/src/ts/Action';
import { Tree } from '../../../../treecomponent/src/ts/Tree';
import { RadioGroupTreeNode, SelectionMode, SelectionStatus, TreeNode, TreeNodeParam } from '../../../../treecomponent/src/ts/TreeNode';
import { CategorieLayer, CategorieLayerOptions, Category } from './CategorieLayer';


export class BaseLayerDefinition {
    id?:string;
    name:string;
    layer:L.TileLayer;
	// url:string;
    // attribution:string;
    bounds?:L.LatLngBounds;
}

export class LayerControlOptions implements L.ControlOptions {
    baseLayer?:L.TileLayer;
    baseLayers?:BaseLayerDefinition[];    
    baseLayerId?:string;
    position?: L.ControlPosition;
    className?:string;
}


export class LayerControl extends L.Control {


    static catNodeParam:TreeNodeParam = {
        attName2Render:'bezeichnung',
        selectMode: SelectionMode.MULTI
    }

    /*
    baseLayerDefinitions:BaseLayerDefinition[] = [{
        id: 'topPlusOpen',
        name: 'TopPlusOpen (Normalausgabe)',
        url: 'https://sgx.geodatenzentrum.de/wmts_topplus_web_open/tile/1.0.0/web/default/WEBMERCATOR/{z}/{y}/{x}.png',
        attribution: '© <a href="http://www.bkg.bund.de/" target="_blank">Bundesamt für Kartographie und Geodäsie</a> 2020, <a href="http://sg.geodatenzentrum.de/web_public/Datenquellen_TopPlus_Open.pdf" target="_blank">Datenquellen</a>'
    },{
        id: 'topPlusOpenGray',
        name: 'TopPlusOpen (Graustufen)',
        // url:'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        url: 'https://sgx.geodatenzentrum.de/wmts_topplus_web_open/tile/1.0.0/web_grau/default/WEBMERCATOR/{z}/{y}/{x}.png',
        attribution: '© <a href="http://www.bkg.bund.de/" target="_blank">Bundesamt für Kartographie und Geodäsie</a> 2020, <a href="http://sg.geodatenzentrum.de/web_public/Datenquellen_TopPlus_Open.pdf" target="_blank">Datenquellen</a>'
    },{
        id: 'osm',
        name: 'OpenStreetMap DE',
        url: 'https://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" rel="noopener" target="_blank">OpenStreetMap</a> contributors'
    }];*/
    baseLayerDefinitions:BaseLayerDefinition[];
    baseLayerDefinition:BaseLayerDefinition;

    map: L.Map;
    tree:Tree;
    baseLayer: L.TileLayer;
    className: string;

    categorieLayers: { [id: string] : CategorieLayer<any, any>; } = {};
    categorieLayerNodes: { [id: string] : TreeNode; } = {};

    constructor(options?:LayerControlOptions) {
        super(options);
        if (options.className) {
            this.className = options.className;
        }
        if (options.baseLayers) {
            this.baseLayerDefinitions = options.baseLayers;
        }
        if (options.baseLayer) {
            this.baseLayer = options.baseLayer;
        }
        // if (options.baseLayers) {
        //     this.baseLayerDefinitions = options.baseLayers;
        //     let baseLayerDef:BaseLayerDefinition;
        //     if (options.baseLayerId) {
        //         baseLayerDef = this._findBaseLayerDefinition(options.baseLayerId);
        //     }
        //     if (!baseLayerDef) {
        //         baseLayerDef = options.baseLayers[0];
        //     }
        //     this.baseLayer = new L.TileLayer(baseLayerDef.url);
        //     this.baseLayerDefinition = baseLayerDef;
        // }
        this._createTree();
    }




    nodeChanged(group:string, node:TreeNode, sel:SelectionStatus) {
        console.info(`nodeChanged ${group} ${node.data.name}, ${SelectionStatus[sel]}`);
    }

    baseLayerChanged(node:TreeNode, sel:SelectionStatus) {
        console.info(`baseLayerChanged ${node.data.name}, ${SelectionStatus[sel]}`);
        console.info('baseLayerChanged old', this.baseLayer);
        const nBaseLayer = node.data.layer;        
        if (this.baseLayer) { 
            if (this.baseLayer===nBaseLayer) {
                return;
            }          
            this.baseLayer.remove();
        }
        if (this.map) {
            console.info('baseLayerChanged new', nBaseLayer);
            this.map.addLayer(nBaseLayer);
            this.baseLayer = nBaseLayer;
        }
    }

    private _createTree() {
        console.info("_createTree");
        this.tree = new Tree(null, {selectMode:SelectionMode.MULTI});
        const count = this.baseLayerDefinitions? this.baseLayerDefinitions.length : 0;
        if (count>0) {
            const baseLayerNodes:TreeNode[] = [];
            for (let i=0; i<count; i++) {
                baseLayerNodes.push(new TreeNode(this.baseLayerDefinitions[i], null, null));
                if (this.baseLayer && this.baseLayerDefinitions[i].layer===this.baseLayer) {
                    this.baseLayerDefinition = this.baseLayerDefinitions[i];
                }
            }
            console.info(baseLayerNodes);
            const baseLNode = new RadioGroupTreeNode({name:"Grundkarte"}, baseLayerNodes);
            baseLNode.onSelectionChange.subscribe((node, sel) =>this.baseLayerChanged(node,sel));
            this.tree.addNode(baseLNode);
            
        }
        console.info("before setSeled")
        this.tree.selectNode(this.baseLayerDefinition);
        this.tree.onSelectionChange.subscribe((node, sel) =>this.nodeChanged('tree', node,sel));

        for (const title in this.categorieLayers) {
            this._addCategorieLayerToTree(title, this.categorieLayers[title]);
        }
    }

    _addCategorieLayerToTree(title:string, categorieLayer: CategorieLayer<any, any>) {     
        console.info(`_addCategorieLayerToTree ${this.tree}`);
        if (this.tree) {
            const categories = categorieLayer.getCategories();
            const treeNode = new TreeNode(title);
            this.tree.addNode(treeNode);
            this.addCategories(treeNode, categories);
            this.categorieLayerNodes[title] = treeNode;
            // treeNode.onSelectionChange.subscribe((node, status)=>this._categorieSelected(title, node, status));
            treeNode.onSelectionChange.subscribe((node, status)=>this._categorieSelected(title, treeNode, status));
        }
    }    

    onAdd(map:L.Map):HTMLElement	{
        console.info("LayerControl.onAdd");
        if (!this.tree) {
            this._createTree();
        }
        
        console.info("addbaseLayer", this.baseLayer);
        // if (this.baseLayer) {
        //     map.addLayer(this.baseLayer);
        // }
        this.map = map;
        this.map.addEventListener("movestart", (ev)=>{
            // console.info("movestart");
        });
        
        this.map.addEventListener("moveend", (ev)=>{
            // console.info("moveend");
        });
        const dom = this.tree._render();
        if (this.className) {
            dom.classList.add(this.className);
        }
            // dom.addEventListener("mousedown", (ev)=>{
            //     console.info("mousedown");
            //     ev.stopPropagation();
            //     return false;
            // });
        dom.addEventListener("pointermove", (ev)=>{
            ev.stopPropagation();
            return true;
        });        
        dom.addEventListener("dragstart", (ev)=>{
            console.info("dragstart", ev);
            // ev.stopPropagation();
            // return false;
        });
        dom.addEventListener("drag", (ev)=>{
            console.info("drag");
            // ev.stopPropagation();
            // return false;
        });        
        dom.addEventListener("wheel", (ev)=>{
            // console.info("wheel");
            ev.stopPropagation();
            return false;
        });
        return dom;
    }
    onRemove(map:L.Map){
        console.info("LayerControl.onRemove");      
        this.map = null;
    }

    _findBaseLayerDefinition(baseLayerId:string):BaseLayerDefinition {
        for (let i=0; i<this.baseLayerDefinitions.length; i++) {
            if (this.baseLayerDefinitions[i].id.toLowerCase()===baseLayerId.toLowerCase()) {
                return this.baseLayerDefinitions[i];
            }
        }
        return undefined;
    }


    showCategorie(title: string, item: any) {
        console.info("showCategorie", item);
        const node:TreeNode = this.categorieLayerNodes[title];
        if (node) {
            node.selectNode(item.id, 'id');
        }
    }

    showMarker(title: string, id: any, prop: string) {
        const layer = this.categorieLayers[title];
        if (layer) {
            layer.showMarker(id, prop);
        }
        
    }

    addCategorieLayer(title:string, categorieLayer: CategorieLayer<any, any>) {
        this.categorieLayers[title] = categorieLayer;
        console.info('addCategorieLayer');
        if (this.tree) {
            this._addCategorieLayerToTree(title, categorieLayer);
            // const categories = categorieLayer.getCategories();
            // const treeNode = new TreeNode(title);
            // this.tree.addNode(treeNode);
            // this.addCategories(categories, treeNode);
            // treeNode.onSelectionChange.subscribe((node, status)=>this._categorieSelected(title, node, status));
            // this.map.addLayer(categorieLayer);
        }
    }
    private _categorieSelected(layerTitle:string, node: TreeNode, status: SelectionStatus): void {
        console.info("_categorieSelected", node, status);
        const selectedCats = this._findSelected(node.childs);        
        const categoryLayer = this.categorieLayers[layerTitle];
        if (categoryLayer) {
            categoryLayer.setKategories(selectedCats);
        }
    }

    private _findSelected(nodes:TreeNode[]):number[][] {
        const ids = [];
        for (let i=0; i<nodes.length; i++) {
            if (nodes[i].getSelectionsStatus()===SelectionStatus.SELECTED) {
                ids.push([nodes[i].data.id]);
            } else {
                if (nodes[i].getSelectionsStatus()===SelectionStatus.INDETERMINATE) {
                    const chIds = this._findSelected(nodes[i].childs);
                    for (let j=0; j<chIds.length; j++) {
                        ids.push([nodes[i].data.id, ...chIds[j]]);
                    }
                }
            }
        }
        return ids;
    }

    private addCategories(base:Tree|TreeNode, categories:Category[]) {
        for (let i=0; i<categories.length; i++) {
            const treeNode = new TreeNode(categories[i], null, LayerControl.catNodeParam);
            if (categories[i].childs) {
                this.addCategories(treeNode, categories[i].childs);
            }
            base.addNode(treeNode);
        }
    }
}

/*
export class LayerManager extends L.Evented {


    options:LayerControlOptions = {
        baseLayers : [{
			id: 'topPlusOpen',
			name: 'TopPlusOpen (Normalausgabe)',
			url: 'https://sgx.geodatenzentrum.de/wmts_topplus_web_open/tile/1.0.0/web/default/WEBMERCATOR/{z}/{y}/{x}.png',
			attribution: '© <a href="http://www.bkg.bund.de/" target="_blank">Bundesamt für Kartographie und Geodäsie</a> 2020, <a href="http://sg.geodatenzentrum.de/web_public/Datenquellen_TopPlus_Open.pdf" target="_blank">Datenquellen</a>'
		},{
			id: 'topPlusOpenGray',
			name: 'TopPlusOpen (Graustufen)',
			// url:'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
			url: 'https://sgx.geodatenzentrum.de/wmts_topplus_web_open/tile/1.0.0/web_grau/default/WEBMERCATOR/{z}/{y}/{x}.png',
			attribution: '© <a href="http://www.bkg.bund.de/" target="_blank">Bundesamt für Kartographie und Geodäsie</a> 2020, <a href="http://sg.geodatenzentrum.de/web_public/Datenquellen_TopPlus_Open.pdf" target="_blank">Datenquellen</a>'
		},{
			id: 'osm',
			name: 'OpenStreetMap DE',
			url: 'https://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png',
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" rel="noopener" target="_blank">OpenStreetMap</a> contributors'
        }],
        fallbackBaseLayerId:'topPlusOpen'
    }

    map:L.Map;

    tree:Tree
    baseLayer: any;


    constructor(map:L.Map, options?:LayerControlOptions ) {
        super();        
        this.options = {...this.options, ...options};
        this.tree = new Tree(null, null);
        // this.layerswitcher.setBaseLayers(this.options.baseLayers);

        // this.layerswitcher.on(LayerswitcherPane.BASELAYER_SELECTION_CHANGEEVENT, this._baseLayerSelected, this);
        // this.layerswitcher.on(LayerswitcherPane.LAYER_SELECT_EVENT, this._layerSelected, this);
        // this.layerswitcher.on(LayerswitcherPane.LAYER_UNSELECT_EVENT, this._layerUnselected, this);

        let baseLayerDef = this.options.baseLayer;
        if (!baseLayerDef && this.options.baseLayerId) {
            baseLayerDef = this.getBaseLayerDefinition(this.options.baseLayerId);
        }
        if (!baseLayerDef) {
            baseLayerDef = this.options.baseLayers[0];
        }
        this.baseLayer = new L.TileLayer(baseLayerDef);
        
        map.addLayer(this.baseLayer);
        this.tree.selectNode(baseLayerDef);
        

        // map.on("zoomend", this._mapViewChanged, this);
        // map.on("moveend", this._mapViewChanged, this);
        this.map = map;
    }

    getBaseLayerDefinition(baseLayerId:string):BaseLayerDefinition {
        for (let i=0; i<this.options.baseLayers.length; i++) {
            if (this.options.baseLayers[i].id.toLowerCase()===baseLayerId.toLowerCase()) {
                return this.options.baseLayers[i];
            }
        }
        return undefined;
    }

    // setBaseLayer(layer:BaseLayerDefinition|string) {
    //     if (layer instanceof BaseLayerDefinition) {
    //         this.layerswitcher.setSelectedBaseLayer(layer);
    //     }
    //     else {
    //         const baseLayerDef = this.getBaseLayerDefinition(layer);
    //         if (baseLayerDef) {
    //             this.layerswitcher.setSelectedBaseLayer(baseLayerDef);
    //         }
    //         else {
    //             throw new Error('BaseLayerDefinition "'+layer+'" not found.');
    //         }
    //     }
    // }

    // _baseLayerSelected(evt:BaseLayerSelectEvent) {
    //     console.info("baseLayerSelected ", evt);
    //     if (this.baseLayer) {
    //         if (this.baseLayer.getId()===evt.baseLayer.id) {
    //             return;
    //         }
    //         this.baseLayer.remove();
    //         console.info("baseLayer " + this.baseLayer.getId() + " removed.");
    //     }
    //     this.baseLayer = new CachedTileLayer(evt.baseLayer, {
	// 		attribution: evt.baseLayer.attribution
	// 	}).addTo(this.app.map);
    // }

    // _layerSelected(evt:LayerSelectEvent) {
    //     evt.layer.addTo(this.app.map);
    // }
    // _layerUnselected(evt:LayerSelectEvent) {
    //     evt.layer.remove();
    // }

}*/