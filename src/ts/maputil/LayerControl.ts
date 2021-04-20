import * as L from 'leaflet'
import { EventDispatcher } from 'strongly-typed-events';
import { Tree } from '../../../../treecomponent/src/ts/Tree';
import { RadioGroupTreeNode, SelectionMode, SelectionStatus, TreeNode, TreeNodeParam } from '../../../../treecomponent/src/ts/TreeNode';
import { NodeRenderer } from '../tree/TreeNode';
import { createHtmlElement } from '../util/HtmlUtil';
import { CategorieLayer, Category, CategoryMarker, Path } from './CategorieLayer';
import { MarkerListView } from './MarkerListView';
import { View } from './ViewControl';



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

function createLegendItem(data) {
    if (data.icon) {
        const lgrndItem = createHtmlElement('div', null, 'legenditem');
        const img = createHtmlElement('img', lgrndItem);
        img.src = 'images/'+ data.icon;
        return lgrndItem;
    } else {
        return null;
    }
}

const layerRenderer: NodeRenderer = {    
    render: (node: TreeNode) => {
        // console.info(`nodeRenderer`, node.data);
        const layer = node.data;
        const div = document.createElement("div");
        if (typeof node.data === 'string') {
            div.innerHTML = node.data;
            div.dataset.tooltip = node.data;
            div.setAttribute("data-tooltip", node.data);
            div.title = node.data;
        }
        else {
            const txt = node.data['bezeichnung'];
            if (!txt) {
                debugger
            }
            const span = createHtmlElement('span', div);
            span.innerHTML = txt;
            div.setAttribute("data-tooltip", txt);
            div.title = txt;
        }
        div.className = 'tooltip';

        const legendItem = createLegendItem(node.data);            
        if (legendItem) {
            div.appendChild(legendItem);
            legendItem.classList.add('legend-item');                
        }
        return div
    }
}

export class LayerControl extends L.Control {

    static catNodeParam:TreeNodeParam = {
        attName2Render:'bezeichnung',
        selectMode: SelectionMode.MULTI,
        nodeRenderer: layerRenderer
    }

    baseLayerDefinitions:BaseLayerDefinition[];
    baseLayerDefinition:BaseLayerDefinition;

    map: L.Map;
    tree:Tree;
    baseLayer: L.TileLayer;
    className: string;

    categorieLayers: { [id: string] : CategorieLayer<any, any>; } = {};
    categorieLayerNodes: { [id: string] : TreeNode; } = {};
    dom: HTMLDivElement;

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
        this._createTree();
       
    }


    // nodeChanged(group:string, node:TreeNode, sel:SelectionStatus) {
    //     // console.info(`nodeChanged ${group} ${node.data.name}, ${SelectionStatus[sel]}`);
    // }

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
                const baseLayerNode = new TreeNode(this.baseLayerDefinitions[i], null, null);
                // baseLayerNode.onSelectionChange.subscribe((node, sel) =>this.baseLayerChanged(node,sel));
                baseLayerNodes.push(baseLayerNode);
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
        // rtr this.tree.onSelectionChange.subscribe((node, sel) =>this.nodeChanged('tree', node,sel));

        for (const title in this.categorieLayers) {
            this._addCategorieLayerToTree(title, this.categorieLayers[title]);
        }
    }

    _addCategorieLayerToTree(title:string, categorieLayer: CategorieLayer<any, any>) {     
        console.info(`_addCategorieLayerToTree ${this.tree}`);
        if (this.tree) {
            const categories = categorieLayer.getCategories();
            const treeNode = new TreeNode(title, undefined, {expandOnlyOneNode:true});
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
       
        this.map = map;
        this.map.addEventListener("movestart", (ev)=>{});
        this.map.addEventListener("moveend", (ev)=>{});
        const dom = this.dom = this.tree._render();
        if (this.className) {
            dom.classList.add(this.className);
        }
        const fnStopPropagation = (ev:Event)=>{
            ev.stopPropagation();
            return true;
        };
        dom.addEventListener("pointermove", fnStopPropagation);        
        dom.addEventListener("dragstart", fnStopPropagation);
        dom.addEventListener("drag", fnStopPropagation);
        dom.addEventListener("wheel", fnStopPropagation);
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

    selectBaseLaye(baseLayer:BaseLayerDefinition) {
        console.info("this.setBaseLayer", baseLayer);
        // this.baseLayerDefinition = baseLayer;
        this.tree.selectNode(baseLayer);
    }


    getContainer() {
        return this.dom;
    }

    findCategorie(title: string, item: Category):TreeNode[] {
        console.info("findCategorie", item);
        const node:TreeNode = this.categorieLayerNodes[title];        
        if (node) {
            return node.findNode(item.id, 'id');
        }
    }

    getItemListView(title: string, item: Category):View {
        console.info("findItemsOfCategorie", item);
        const node:TreeNode = this.categorieLayerNodes[title];        
        if (node) {
            const nodes = node.findNode(item.id, 'id');
            if (nodes) {
                const path = [];
                for (let i=nodes.length-2; i>=0; i--) {
                    path.push(nodes[i].data.id)
                }
                console.info("path", path);
                const layer = this.categorieLayers[title];
                if (layer) {
                    const markers = layer.getItems(path);                    
                    return new MarkerListView(undefined, layer, markers);
                }
            }
        }
    }

    findItemsOfCategorie(title: string, item: Category):CategoryMarker<any>[] {
        console.info("findItemsOfCategorie", item);
        const node:TreeNode = this.categorieLayerNodes[title];        
        if (node) {
            const nodes = node.findNode(item.id, 'id');
            if (nodes) {
                const path = [];
                for (let i=nodes.length-2; i>=0; i--) {
                    path.push(nodes[i].data.id)
                }
                console.info("path", path);
                const layer = this.categorieLayers[title];
                if (layer) {
                    return layer.getItems(path);
                }
            }
        }
    }    

    showCategorie(title: string, item: any) {
        console.info("showCategorie", item);
        const node:TreeNode = this.categorieLayerNodes[title];
        if (node) {
            node.selectNode(item.id, 'id');
        }
    }

    showMarker(title: string, id: any, prop: string) {
        console.info(`showmarker(${title}, ${id}, ${prop})`)
        const layer = this.categorieLayers[title];
        if (layer) {
            const marker = layer.showMarker(id, prop);
        }
    }

    getItems(title: string, path: Path<any>):CategoryMarker<any>[] {
        console.info(`getItems(${title}, ${path})`)
        const layer = this.categorieLayers[title];
        return layer.getItems(path);
    }

    // selectMarker(title: string, id: any, prop: string):CategoryMarker<any> {
    //     console.info(`highlightMarker(${title}, ${id}, ${prop})`)
    //     const layer = this.categorieLayers[title];
    //     if (layer) {
    //         return layer.selectMarker(id, prop);
    //     }
    //     return undefined;
    // }

    addCategorieLayer(title:string, categorieLayer: CategorieLayer<any, any>, options:{showAll?:boolean, expandTree:boolean}) {
        this.categorieLayers[title] = categorieLayer;
        console.info('addCategorieLayer');
        if (this.tree) {
            this._addCategorieLayerToTree(title, categorieLayer);
            if (options.showAll) {
                this.tree.selectNode(title);
            }
            if (options.expandTree) {
                this.tree.nodes[0].expand(true);                
            }
            // const categories = categorieLayer.getCategories();
            // const treeNode = new TreeNode(title);
            // this.tree.addNode(treeNode);
            // this.addCategories(categories, treeNode);
            // treeNode.onSelectionChange.subscribe((node, status)=>this._categorieSelected(title, node, status));
            // this.map.addLayer(categorieLayer);
        }
    }
    private _categorieSelected(layerTitle:string, node: TreeNode, status: SelectionStatus): void {
        // console.info("_categorieSelected", node, status);
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
            base.addNode(treeNode);
            if (categories[i].childs) {
                this.addCategories(treeNode, categories[i].childs);
            }
            
        }
    }
}

