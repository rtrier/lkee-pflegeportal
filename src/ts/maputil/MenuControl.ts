/*
<a class="menu-button" style=""><div class="menu-button-block"></div></a>
*/
import * as L from 'leaflet';
import { DomUtil } from 'leaflet';
import { EventDispatcher } from 'strongly-typed-events';
import autocomplete from '../util/Autocompleter';
import { createHtmlElement } from '../util/HtmlUtil';
import { CategorieLayer, CategorieLayerOptions, Category, CategoryMarker } from './CategorieLayer';
import { LayerControl } from './LayerControl';
import { MarkerListView } from './MarkerListView';
import { TextView, View, ViewControl } from './ViewControl';



export class MenuControlOptions implements L.ControlOptions {   
    parent?:HTMLElement; 
    position?: L.ControlPosition;    
    baseLayerCtrl?:LayerControl;
    categorieLayerCtrl:LayerControl;
    searchFct?: (s: string, cb: (results: any[]) => any)=>void;
    viewsHome?:View;
}

class Dispatcher {
    onListViewItemSelection = new EventDispatcher<MarkerListView, CategoryMarker<any>>();
    onItemOnMapSelection = new EventDispatcher<CategorieLayer<any, any>, CategoryMarker<any>>();
    onItemOnMapUnselection = new EventDispatcher<CategorieLayer<any, any>, CategoryMarker<any>>();

    onViewItemChange =  new EventDispatcher<ViewControl, {view:View, type:'added'|'removed'}>();
}


export class MenuControl extends L.Control {

    static DISPATCHER = new Dispatcher();

    map:L.Map;
    dom: HTMLElement;
    baseLayerCtrl:LayerControl;
    categorieLayerCtrl:LayerControl;
    searchFct: (s: string, cb: (results: any[]) => any)=>void;

    closed:boolean = true;
    categorieLayers: { [id: string] : CategorieLayer<any, any>; } = {};

    viewCtrl: ViewControl;
    topDiv: HTMLElement;
    mainDiv: HTMLElement;
    footerDiv: HTMLElement;
    
    searchBox: HTMLInputElement;
    isMenuOpen: boolean;

    foundArea: L.GeoJSON<any>;
    // selectedMarker: any;
    parent: HTMLElement;

    viewsHome: View;
    legendDom: HTMLElement;

    constructor(options:MenuControlOptions) {
        super(options);
        this.parent = options.parent;
        this.baseLayerCtrl=options.baseLayerCtrl;
        this.categorieLayerCtrl=options.categorieLayerCtrl;        
        this.searchFct = options.searchFct;
        this.viewsHome = options.viewsHome;
        this._subscribe();
    }
    private _subscribe() {
        console.info("subs onListViewItemSelection");
        MenuControl.DISPATCHER.onListViewItemSelection.subscribe((sender, item)=>this.onListViewItemSelection(sender, item))
        MenuControl.DISPATCHER.onItemOnMapSelection.subscribe((sender, item)=>this.onItemOnMapSelection(sender, item))
        MenuControl.DISPATCHER.onItemOnMapUnselection.subscribe((sender, item)=>this.onItemOnMapUnselection(sender, item))

        MenuControl.DISPATCHER.onViewItemChange.subscribe((sender, item)=>this.onViewItemChanged(sender, item))
    }

    

    addCategorieLayer(categorieLayer:CategorieLayer<any, any>, showAll:boolean) {
        categorieLayer.once("CategoriesLoaded", (evt)=>{            
            this.categorieLayerCtrl.addCategorieLayer("Kategories", categorieLayer, {
                showAll:showAll,
                expandTree:true,
                hideRoot:true
            });
            this.map.addLayer(categorieLayer);
            // this.viewCtrl.addLegend(this.createLegend(categorieLayer));
            this.legendDom = this.createLegend(categorieLayer);
            this.footerDiv.appendChild(this.legendDom);
        });
        categorieLayer.loadCategories();
        this.categorieLayers["Kategories"] = categorieLayer;   
        
    }
    // itemSelected(ev: L.LeafletEvent): void {
    //     console.info("MenuCtrl.itemSelected", ev);
    //     const layer:CategorieLayer<any, any> = ev.target;
    //     const marker:CategoryMarker<any> = (<any>ev).marker;
    //     this.showData(layer, marker);        
    // }
    // itemUnselected(ev: L.LeafletEvent): void {
    //     console.info("itemUnselected", ev);
    //     this.viewCtrl.goBack();
    // }    

    // setContentView(v:View):void {
    //     this.viewCtrl.setContentView(v);  
    // }

    createLegend(categorieLayer:CategorieLayer<any, any>):HTMLElement {
        console.info('createLegend', categorieLayer.categories);     
        const dom = createHtmlElement('div', undefined, 'legende');
        const header = createHtmlElement('div', dom, 'header');
        header.innerHTML = 'Legende';        
        // const tbl = createHtmlElement('table', dom);
        const categories = categorieLayer.categories;
        for (let i=0, count=categories.length; i<count; i++) {
            const row = createHtmlElement('div', dom);
            // const cell01 = createHtmlElement('td', row);
            const img = createHtmlElement('img', row);
            img.src = 'images/' + categories[i].icon;
            const cell02 = createHtmlElement('span', row);
            cell02.innerText = categories[i].bezeichnung;
        }
        return dom;
    }
    
    onListViewItemSelection(sender: MarkerListView, item: CategoryMarker<any>): void {
        console.info('onListViewItemSelection', sender, item);
        // RGRTRT sender.layer.highlightMarker(item, true);
        this.showData(sender.layer, item, false);        
    }

    onItemOnMapSelection(sender: CategorieLayer<any, any>, item: CategoryMarker<any>): void {
        console.info('onItemOnMapSelection', sender, item);
        // if (this.selectedMarker) {
        //     this.onItemOnMapUnselection(sender, this.selectedMarker)
        // }
        if (item) {
            this.showData(sender, item, false);
            // this.selectedMarker = item;    
        } else {
            this.viewCtrl.goBack();
        }
    }  

    onItemOnMapUnselection(sender: CategorieLayer<any, any>, item: CategoryMarker<any>): void {
        console.info('onItemOnMapUnSelection', sender, item);
        this.viewCtrl.goBack();
        // this.selectedMarker = undefined;
    }

    onViewItemChanged(sender: ViewControl, item: { view: View; type: "added" | "removed"; }): void {
        console.info('onViewItemChanged', item);
        if (sender.contentHistory.length === 0) {
            if (!sender.home) {
                this.openMenu();
            }
            this.searchBox.value = '';
        }
    }


    showData(layer: CategorieLayer<any, any>, marker: CategoryMarker<any>, replace:boolean) {
        console.info(`showData replace=${replace}`);
        this.closeMenu();
        if (replace) {
            this.viewCtrl.replaceCurrentContent(layer.renderData(marker, false));
        } else {
            this.viewCtrl.appendContent(layer.renderData(marker, true));
        }
    }

    addTo(map:L.Map):this {   
        if (this.parent) {
            const dom = this.onAdd(map);
            // this.parent.appendChild(this.onAdd(map));
            this.parent.appendChild(dom);
            this.mainDiv.appendChild(this.viewCtrl.onAdd(map));            
            // this.footerDiv.appendChild(this.legendDom);
        } else {
            super.addTo(map);        
            map.addControl(this.viewCtrl);
        }
        this.searchBox.focus();
        return this;
    }


    onAdd(map:L.Map):HTMLElement	{

        this.map = map;
        if (!this.dom) {
            const div = createHtmlElement('div', undefined, "mapctrl");
            const divTop = this.topDiv = createHtmlElement('div', div, "mapctrl-top closed");
            
            const anchor = createHtmlElement('a', divTop, 'menu-button');
            anchor.addEventListener('pointerup', (p)=>this._menuClicked(p));
            createHtmlElement('div', anchor);

            const searchWrapper = document.createElement('div');
            searchWrapper.className = 'search-wrapper';
            divTop.appendChild(searchWrapper);

            const searchBox = this.searchBox = document.createElement('input');
            searchWrapper.appendChild(searchBox);
            searchBox.type = 'text';
            // searchBox.addEventListener('keyup', (ev)=>this._searchInput(ev));
            searchBox.addEventListener('focusin', (ev)=>this._searchFocusIn(ev));
            searchBox.placeholder = 'Suche: Schlagwort oder Adresse';

            const searchBoxClear = document.createElement('i');
            searchBoxClear.className = 'search-input-clear';
            searchWrapper.appendChild(searchBoxClear);
            searchBoxClear.addEventListener('click', (ev)=>{
                searchBox.value = '';
                this.viewCtrl.clear();
            });

            const viewMain = this.mainDiv = createHtmlElement('div', div, "mapctrl-main");
            const footerDiv = this.footerDiv = createHtmlElement('div', div, "mapctrl-footer");

            div.addEventListener("pointermove", (ev)=>{
                ev.stopPropagation();
                return true;
            }); 
            div.addEventListener("dblclick", (ev)=>{
                // console.info("click");
                ev.cancelBubble = true;
                ev.stopPropagation();               
                return true;
            });
            div.addEventListener("click", (ev)=>{
                // console.info("click");
                ev.cancelBubble = true;
                ev.stopPropagation();               
                return true;
            });
            div.addEventListener("mouseup", (ev)=>{
                // console.info("mouseup");
                ev.stopPropagation();               
                return true;
            });
            div.addEventListener("pointerup", (ev)=>{
                // console.info("pointerup");
                ev.stopPropagation();               
                return true;
            });
            div.addEventListener("wheel", (ev)=>{
                ev.stopPropagation();
                return true;
            }); 
            this.dom = div;

            this.viewCtrl = new ViewControl({position: 'topleft', home: this.viewsHome});
            // const content = this.contentArea = document.createElement('div');
            // content.className = 'mapctrl-content';
            // this.dom.appendChild(content);


            autocomplete(searchBox, {
                onSelect: (item: any, input: HTMLInputElement) => this._found(item, input),
                onSearchStart: (input: HTMLInputElement)=>this._searchStart(input),
                fetch : this.searchFct,
                showOnFocus: true,
                labelAttr : 'bezeichnung'
            });
            
        }
         
        return this.dom;
    }
    private _searchStart(input: HTMLInputElement): void {
        this.clearResults();
    }
    clearResults() {        
        this.viewCtrl.clear();
        this.categorieLayerCtrl.categorieLayers["Kategories"].removeSearchResults();
        if (this.foundArea) {
            this.foundArea.remove();
            this.foundArea = undefined;
        }
    }
    /**
     * verarbeitet das Suchergebnis
     * 
     * @param item 
     * @param input 
     */
    private _found(item: any, input: HTMLInputElement): void {
        console.info("_found", item);
        if (item.group==='Kategorie') {
            console.info('_foundKategorie', item);
            this.categorieLayerCtrl.showCategorie("Kategories", item);    
            this.closeMenu(); 
            // const markers = this.categorieLayerCtrl.getItemList("Kategories", item);      
            // const view = this.categorieLayerCtrl.getItemListView("Kategories", item);
            const view = this.categorieLayerCtrl.getItemListView("Kategories", item);
            this.viewCtrl.replaceContentRoot(view);
        } else if (item.group==='Ort') {
            console.info('_foundOrt', item);
        } else if (item.group==='Einrichtung') {
            console.info('_foundEinrichtung', item); 
            const layer = this.categorieLayerCtrl.categorieLayers["Kategories"];
            if (layer) {
                const marker = layer.findMarker(item.id, "id");
                if (marker) {
                    // this.showData(layer, marker, true);
                    this.closeMenu();
                    this.viewCtrl.replaceContentRoot(layer.renderData(marker, false));
                }
            }
        } else if (item.group==='Gemeinden' || item.group==='Ortsteile') {
            // console.info('Gemeinden|Ortsteile', item);
            // const geoJ = this.showVerwaltungsgrenze(item);       
            this.closeMenu();     
            const geoJ = this.showOrtschaft(item);
            console.info('found', item);
            const catL = this.categorieLayerCtrl.categorieLayers["Kategories"];
            catL.findMarkers(item.table, item.id).then(
                markers=>{
                    const view = (markers?.length>0) ?
                        new MarkerListView(geoJ, catL, markers) :
                        new TextView('Es wurde leider nichts gefunden.');
                    this.viewCtrl.replaceContentRoot(view);
                }
            );            
        } else if ( item.group==='Strassen') {
            const geoJ = this.showOrtschaft(item);
        } else if (item.group==='Hausnummern') {
            this.showMarker(item);
        } else {
            const geoJ = this.showOrtschaft(item);
            console.info('found', item);
            const catL = this.categorieLayerCtrl.categorieLayers["Kategories"];
            catL.findMarkers(item.table, item.id).then(
                markers=>{
                    const view = new MarkerListView(geoJ, catL, markers);
                    this.viewCtrl.replaceContentRoot(view);
                }
            );
        } 
    }
    
    showMarker(item: any):L.GeoJSON {
        if (this.foundArea) {
            this.foundArea.remove();
            this.foundArea = undefined;
        }
        const geoJ = this.foundArea = L.geoJSON(item.geom, {
            style: function (feature) {
                return {color: '#888888', dashArray: '10 8', fillColor:'#555555'};
            }});
        this.map.addLayer(geoJ);

        console.info("zoom: "+this.map.getZoom());
        if (this.map.getZoom()<12) {
            this.map.setZoomAround({lng:item.geom.coordinates[0], lat:item.geom.coordinates[1]}, 12);
        } else {
            this.map.panTo({lng:item.geom.coordinates[0], lat:item.geom.coordinates[1]});
        }
        console.info("added item ", item.geom);
        return geoJ;
    }

    showVerwaltungsgrenze(item: any):L.GeoJSON {
        console.info("showVerwaltungsgrenze", item);
        const geoJ = this.foundArea = L.geoJSON(item.geom, {
            style: function (feature) {
                return {color: '#888888', dashArray: '10 8', fillColor:'#555555'};
            }});
        this.map.addLayer(geoJ);
        console.info(geoJ.getBounds());
        console.info(this.map.getBounds());
        this.map.fitBounds(geoJ.getBounds());
        return geoJ;
    }

    showOrtschaft(item: any):L.GeoJSON {
        console.info("showOrtschaft", item);
        const geoJ = this.foundArea = L.geoJSON(item.geom, {
            style: function (feature) {
                return {color: '#888888', dashArray: '10 8', fillColor:'#555555'};
            }});
        this.map.addLayer(geoJ);
        console.info(geoJ.getBounds());
        console.info(this.map.getBounds());
        this.map.fitBounds(geoJ.getBounds());
        return geoJ;
    }
    
    private _searchFocusIn(ev: FocusEvent): any {
        console.info('_searchFocusIn', ev);

												  
									 
    }
    
    private _menuClicked(p: PointerEvent): any {
        console.info('_menuClicked');
        if (this.closed) {
            this.openMenu();
        } else {
           this.closeMenu();            
        }
    }

    closeMenu() {
        if (this.isMenuOpen) {
            this.closed = true;
            this.topDiv.classList.replace('opened', 'closed');            
            if (this.parent) {
                if (this.baseLayerCtrl) {
                    this.baseLayerCtrl.getContainer().remove();
                }
                this.categorieLayerCtrl.getContainer().remove();
                this.mainDiv.appendChild(this.viewCtrl.onAdd(this.map));
            } else {
                if (this.baseLayerCtrl) {
                    this.map.removeControl(this.baseLayerCtrl);
                }
                this.map.removeControl(this.categorieLayerCtrl);
                this.map.addControl(this.viewCtrl);
            }
            // this.contentArea.style.display = '';            
            this.isMenuOpen = false;
        }
    }
    // openMenu() {
    //     if (!this.isMenuOpen) {
    //         this.closed = false;
    //         this.topDiv.classList.replace('closed', 'opened');
    //         if (this.parent) {
    //             if (this.baseLayerCtrl) {
    //                 this.parent.appendChild(this.baseLayerCtrl.onAdd(this.map));
    //             }
    //             this.parent.appendChild(this.categorieLayerCtrl.onAdd(this.map));
    //             this.viewCtrl.getContainer().remove();
    //         } else {
    //             if (this.baseLayerCtrl) {
    //                 this.map.addControl(this.baseLayerCtrl);
    //             }
    //             this.map.addControl(this.categorieLayerCtrl);
    //             this.map.removeControl(this.viewCtrl);
    //         }
    //         // this.contentArea.style.display = 'none';            
    //         this.isMenuOpen = true;
    //     }
    // }
    openMenu() {
        if (!this.isMenuOpen) {
            this.closed = false;
            this.topDiv.classList.replace('closed', 'opened');
            if (this.mainDiv) {
                if (this.baseLayerCtrl) {
                    this.mainDiv.appendChild(this.baseLayerCtrl.onAdd(this.map));
                }
                this.mainDiv.appendChild(this.categorieLayerCtrl.onAdd(this.map));
                this.viewCtrl.getContainer().remove();
            } else {
                if (this.baseLayerCtrl) {
                    this.map.addControl(this.baseLayerCtrl);
                }
                this.map.addControl(this.categorieLayerCtrl);
                this.map.removeControl(this.viewCtrl);
            }
            // this.contentArea.style.display = 'none';            
            this.isMenuOpen = true;
        }
    }
    onRemove(map:L.Map) {
        this.map = null;
    }
}