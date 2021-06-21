require('leaflet');
require('@glartek/leaflet.markercluster');

import * as L from 'leaflet';
import { MarkerView } from './MarkerListView';
import { MenuControl } from './MenuControl';
import { View } from './ViewControl';

export interface CategoryMarkerOptions<T extends L.LatLngExpression> extends L.MarkerOptions {
    selectIcon?: L.Icon;
    standardIcon?: L.Icon;
    iconFactory?: IconFactory<T>;
}

export function createIcon(code:number):L.Icon {
    return <L.Icon>L.divIcon(
        {html: '<i class="afas">'+String.fromCharCode(code)+'</i>', 
        iconSize: new L.Point(20, 20),
        iconAnchor: new L.Point(10,10),
        className: 'mapDivIcon'}
    );
}
export function createSelectedIcon(code:number):L.Icon {
    return <L.Icon>L.divIcon(
        {html: '<i class="afas">'+String.fromCharCode(code)+'</i>', 
        iconSize: new L.Point(40, 40),
        iconAnchor: new L.Point(20,20),
        className: 'mapDivIconHighligted'}
    );
}												 
export interface Category {
    id: any,
    parentId: any,
    bezeichnung: string,
    childs: Category[],
    icon?: string
}


export interface CategorieLayerOptions<T extends L.LatLngExpression, N> extends L.MarkerClusterGroupOptions {
    categorieUrl:string,
    url:string,
    selector: CategorieSelector<T, N>,
    popupFactory: PopupCreator<T>;
    iconFactory?: IconFactory<T>;
}



export type Path<T> = T[];

export interface CategorieSelector<T, N> {
    isOfCategory(data:T, katId:Path<N>[]):boolean;
}

export interface PopupCreator<T extends L.LatLngExpression> {
    // build(categories:[], marker:CategoryMarker<T>):L.Content;
	renderDataView(categories:Category[], marker:CategoryMarker<T>):HTMLElement;
    renderListItem(categories:Category[], marker:CategoryMarker<T>):HTMLElement;
    getTitle?(categories:Category[], data:T):string;

}

export interface IconFactory<T extends L.LatLngExpression> {  
    createIcons(categories:Category[]):void;  
	getIconsForData(data:T):{icon:L.Icon, selectedIcon:L.Icon};
}

export class CategoryMarker<T extends L.LatLngExpression> extends L.Marker {
    visible:boolean=false;

    static icon = createIcon(0xf024);
	static selectedIcon = createSelectedIcon(0xf024);												 
    parentLayer: CategorieLayer<T, any>;
    data: T;
	private _clickHandler: (ev: any) => void;    
	selected = false;				 
    spiderfiedCallCount: number = 0;

    constructor(parentLayer:CategorieLayer<T, any>, data:T, options:CategoryMarkerOptions<T>) {
        super(data, options);
        this.data = data;
        this.parentLayer = parentLayer;
        
        if (options.iconFactory) {
            const iconSet = options.iconFactory.getIconsForData(data);
            this.options['standardIcon'] = iconSet.icon;
            this.options['selectIcon'] = iconSet.selectedIcon;
            this.setIcon(iconSet.icon);
        } else {
            if (!options || !options.icon) {
                this.options['standardIcon'] = CategoryMarker.icon;
                this.setIcon(CategoryMarker.icon);
            }
            if (!options || !options.selectIcon) {
                this.options['selectIcon'] = CategoryMarker.selectedIcon;
            }
        }
    }

    onAdd(map: L.Map):this { 
        if (this.selected) {
            console.error("onAdd", this.data["id"], map);
        }
        this._clickHandler = (ev)=>this.parentLayer.mapItemClicked(this, ev);        
        this.on('click', this._clickHandler);
        this["added"] = true;
        return super.onAdd(map);
    }

    

    onRemove(map: L.Map): this {
        if (this.selected) {
            console.error("onRemove", this.data["id"]);
        }
        
        this.unbindPopup();
        if (this._clickHandler) {
            this.off('click', this._clickHandler);
        }
        this["added"] = false;
        this.spiderfiedCallCount = 0;
        return super.onRemove(map);
    }

    setVisible(visible:boolean) {
        this.visible=visible;
    }

    isVisible():boolean {
        return this.visible;
    }
    
    highLight(highlight: boolean) {
        console.info('CategoryMarker.highlight', this.data['id'], highlight);
        this.selected = highlight;
        if (highlight) {
            this.setIcon((<CategoryMarkerOptions<T>>this.options).selectIcon);
        } else {
            this.setIcon((<CategoryMarkerOptions<T>>this.options).standardIcon);
        } 
    }	
    
    spiderfied() {
        this.spiderfiedCallCount++;
    }

}

export class CategorieLayer<T extends L.LatLngExpression, N> extends L.MarkerClusterGroup {


    categorieUrl:string;
    url:string;

    categories:Category[];

    selectedCategories:Path<N>[];

    data: T;
    selector: CategorieSelector<T, N>;
    popupFactory: PopupCreator<T>;
    iconFactory: IconFactory<T>

	markerMap:{ [id: number] : CategoryMarker<T>; } = {};													 
    markers:CategoryMarker<T>[] = []; 
	selectedMarker: CategoryMarker<T>;
    foundMarkers: CategoryMarker<T>[]; 
    map: L.Map;	
    
    spiderfiedCluster: L.Layer;
    highlightedMarker: CategoryMarker<T>;

    // private _ZoomEndHandler: (ev: any) => void;

    constructor(options?:CategorieLayerOptions<T, N>) {
        super(options);
        this.categorieUrl = options.categorieUrl;
        this.url = options.url;
        this.selector = options.selector;
        this.popupFactory = options.popupFactory;
        this.iconFactory = options.iconFactory;
        this.on('clusterclick', (evt)=>this.clusterClicked(evt));
        this.on('animationend', (evt)=>{console.info('animationend', evt);});
        // this._ZoomEndHandler = (evt)=>this._zoomEnd(evt);
    }
/*
    _zoomEnd(evt:L.LeafletEvent) {
        console.info(`zoomEnd ${this.highlightedMarker}`);
        super["_zoomEnd"](evt);

        if (this.highlightedMarker) {
            console.info("0000001");
            window.setTimeout(()=>{
                console.info("000000w");
                const visibleOne:any = this.getVisibleParent(this.highlightedMarker);
                console.log(`visibleOne ${visibleOne}`);
                if (visibleOne) {
                    if (visibleOne !== this.highlightedMarker) {
                        window.setTimeout(()=>{
                            visibleOne.spiderfy();
                            console.info("spiderfiy called", (visibleOne !== this.highlightedMarker));
                        });
                    }
                }
            });
        }
    }

*/
    _animationEnd(evt) {
        console.info('_animationEnd called');
        super["_animationEnd"](evt);   
        if (this.highlightedMarker && !this["added"]) {
            window.setTimeout(()=>{
                this.spiderfySelected();
            }, 100);
        } else {
            console.info('spiderfy not called');
        }
        console.info('_animationEnd done');
    }

    spiderfySelected() {
        if (this.highlightedMarker && !this["added"]) {
            const visibleOne:any = this.getVisibleParent(this.highlightedMarker);
            console.log(`spiderfySelected visibleOne ${this.highlightedMarker?.data["id"]} ${this["_inZoomAnimation"]} 
            spiderfiedCallCount=${this.highlightedMarker.spiderfiedCallCount}  added=${this.highlightedMarker["added"]}`, visibleOne);
            if (visibleOne) {
              if (visibleOne !== this.highlightedMarker) {
                console.info("go to call spiderfiy",visibleOne !== this.highlightedMarker);
                visibleOne.spiderfy();
                this.highlightedMarker.spiderfied();
                console.info("spiderfiy called",visibleOne !== this.highlightedMarker);
              }
            }
        }
    }

    _XanimationEnd(evt) {
        super["_animationEnd"](evt);
        window.setTimeout(()=>{
        const animNr:number = this["_inZoomAnimation"];
        if (this.highlightedMarker && animNr === 0) {
            console.log(`_animationEnd visibleOne ${this.highlightedMarker?.data["id"]} ${this["_inZoomAnimation"]} ${this.highlightedMarker["added"]}`);
            
            if (this.highlightedMarker && !this.highlightedMarker["added"]) {            

            const visibleOne:any = this.getVisibleParent(this.highlightedMarker);
                console.log(`_animationEnd visibleOne ${this.highlightedMarker?.data["id"]} ${this["_inZoomAnimation"]} ${this.highlightedMarker.spiderfiedCallCount}`, visibleOne);
                if (visibleOne) {                
                    if (visibleOne !== this.highlightedMarker) {           
                        console.info("go to call spiderfiy", (visibleOne !== this.highlightedMarker));
                        visibleOne.spiderfy();
                        this.highlightedMarker.spiderfied();
                        console.info("spiderfiy called", (visibleOne !== this.highlightedMarker));

                        this["_forceLayout"]();
                        
                    }
                }
            }
        }
        },30);
        
    }
   

    clusterClicked(evt:L.LeafletEvent) {
        console.info('clusterClicked', this.spiderfiedCluster, evt);
        const clickedCluster = evt.propagatedFrom;
        if (this.spiderfiedCluster) {
            // 
            if (clickedCluster!==this.spiderfiedCluster) {
                clickedCluster.spiderfy();    
                this.spiderfiedCluster = clickedCluster;
            } else {
                (<any>this.spiderfiedCluster).unspiderfy();
                this.spiderfiedCluster = undefined;
            }
        } else {
            clickedCluster.spiderfy();    
            this.spiderfiedCluster = clickedCluster; 
        }
        console.info(evt.type);
    }

    loadCategories() {
        window.fetch(this.categorieUrl).then((response)=>{
            response.json().then( data => {
                this.categories = data;
                this.fire("CategoriesLoaded");
                this._loadData();
                if (this.iconFactory) {
                    this.iconFactory.createIcons(data);
                }
            })
        });
    }
    private _loadData() {
        window.fetch(this.url).then((response)=>{
            response.json().then( data => {
                this.data = data;
                
                for (let i=0; i<data.length; i++) {
                    const s = this.popupFactory?.getTitle(this.categories, data[i]);
				    const marker = new CategoryMarker(this, data[i], {iconFactory:this.iconFactory, title:s});
                    this.markers.push(marker);
                    this.markerMap[data[i].id] = marker;										
                }
                // console.error("dataLength="+data.length+"  "+this.markers.length);
                this._update();
            })
        });
    }

    onAdd(map:L.Map):this {
        super.onAdd(map);
        this.map = map;
        map.on('zoomend', (evt)=>{console.info(`zoomEnd ${this.map.getZoom()}`)});
        map.on('zoomstart', (evt)=>{console.info(`zoomstart ${this.map.getZoom()}`)});
        map.on('zoomlevelschange', (evt)=>{console.info(`zoomlevelschange ${this.map.getZoom()}`)});
        map.on('moveend', (evt)=>{console.info(`moveend ${this.map.getZoom()}`)});
        return this;
    }	
    onRemove(map:L.Map):this {
        super.onRemove(map);
        this.map = undefined;
        return this;
    }

    private _findMarker(value:any, prop:string) {
        const markers = this.markers;        
        for (let i=0, count=markers.length; i<count; i++) {
            const marker = markers[i];
            if (marker.data[prop]===value) { 
                return marker;
            } 
        }
    }

    async findMarkers(att:string, value:any):Promise<CategoryMarker<T>[]> {
        const response = await window.fetch(this.url+"/search?"+att+"="+value);
        const data:number[] = await response.json();
        const result:CategoryMarker<T>[] = [];
        for (let i=0; i<data.length; i++) {
            const marker = this.markerMap[data[i]];
            if (marker) {
                result.push(marker);
                if (!marker.isVisible()) {
                    if (!this.foundMarkers) {
                        this.foundMarkers = [];
                    }
                    this.foundMarkers.push(marker);
                    // this.addLayer(marker);
                }
            }
        }
        return result;
    }

    addLayer(layer:L.Layer) {
        console.info(`CategorieLayer.addLayer ${this.getLayers().length}`);
        return super.addLayer(layer)
    }

    removeSearchResults() {
        console.info("removeSearchResults");
        if (this.foundMarkers) {
            this.foundMarkers.forEach(item=>{this.removeLayer(item)});
            this.foundMarkers = undefined;
        }
    }
    mapItemClicked(marker: CategoryMarker<T>, ev: L.LeafletEvent): void {
        console.info("mapItemClicked", marker, ev);

        // console.log(this.getVisibleParent(marker));
        console.info(`marker.selected ${marker.selected}`)

		if (marker.selected) {
            if (this.map.getZoom()) {
                console.info(this.map.getZoom());
                // this.map.setZoomAround(marker.data, 18);  

                const lat = (<any>marker.data).lat;
                const lng = (<any>marker.data).lng; 
                const c = new L.LatLng(lat, lng);

                
                // this.map.once("zoomend", (evt)=>{
                //      console.info(`Moveend lat: ${(<any>marker.data).lat} lng:${(<any>marker.data).lng}   newCenter=${this.map.getCenter()}`);
                // //     // this.map.setView([lat, lng]);
                //      this._map.setView(c);
                //      super.refreshClusters();
                // });
                // // this.map.setZoom(18);
                
                console.info(`Moveto lat: ${lat} lng:${lng}  mrker=${marker.getLatLng()}`);
                console.info(`Moveto lat: ${c}  mrker=${marker.getLatLng()}`);
                // this.map.setView([lat, lng], 17, {animate:false});
                
                this._map.setView(c, 18);

                this.once('animationend', (evt)=>{
                    console.info('animationend');
                    window.setTimeout(()=>{this.map.setView(c)});
                });
                // this.map.setZoom(18);
                // this._map.setView(c);
               
                // this._map.setView([lat, lng], 18);
                // this._map.setZoomAround([lat, lng], 18);

                   
                
            } else {
                MenuControl.DISPATCHER.onItemOnMapUnselection.dispatch(this, marker);
            }
            // this.selectedMarker = undefined;
        } else {
            // if (this.selectedMarker) {
            //     MenuControl.DISPATCHER.onItemOnMapSelection.dispatch(this, undefined);
            //     this.selectedMarker = undefined;
            // }
            MenuControl.DISPATCHER.onItemOnMapSelection.dispatch(this, marker);
            this.selectedMarker = marker;
        }																   
    }    
    // mapItemClicked(marker: CategoryMarker<T>, ev: L.LeafletEvent): void {
    //     console.info("mapItemClicked", marker.data['id'], ev); 
    //     const unselect = marker===this.selectedMarker;
    //     if (this.selectedMarker) {
    //         //rtr this._unselectMarker(this.selectedMarker);
    //         MenuControl.DISPATCHER.onItemOnMapSelection.dispatch(this, undefined);
    //         this.selectedMarker = undefined;
    //     }
    //     if (!unselect) {
    //         //rtr this._selectMarker(marker);
    //         this.selectedMarker = marker;
    //         MenuControl.DISPATCHER.onItemOnMapSelection.dispatch(this, marker);
    //     }
        
    // }     


    highlightMarker(marker:CategoryMarker<T>, highlight:boolean) {
        if (highlight) {
            this.highlightedMarker = marker;
            const visibleOne:any = this.getVisibleParent(marker);
            console.log(`highlightMarker ${visibleOne}`);
            if (visibleOne) {
                if (visibleOne !== marker) {
                    visibleOne.spiderfy();
                }
            }
        } else {
            this.highlightedMarker = undefined;
        }
        marker.highLight(highlight);
    }

    highlightMarkerOk(marker:CategoryMarker<T>, highlight:boolean) {
        console.info(`highlightMarker ${marker.data['id']} ${highlight}`);
        if (highlight) {
            this.removeLayer(marker);            
            marker.options["oldPane"] = marker.options.pane;
            marker.options.pane = 'highlightPane';
            this._map.addLayer(marker);
            marker.highLight(highlight);
        } else {            
            this._map.removeLayer(marker);
            const oldPane = marker.options["oldPane"];
            if (oldPane) {
                marker.options.pane = oldPane;
            }
            this.addLayer(marker);
            marker.highLight(highlight);
        }
    }

    highlightMarkerOrg(marker:CategoryMarker<T>, highlight:boolean) {
        console.info(`highlightMarker ${marker.data['id']} ${highlight}`);
        if (highlight) {
            this.removeLayer(marker);            
            marker.options["oldPane"] = marker.options.pane;
            marker.options.pane = 'highlightPane';
            this._map.addLayer(marker);
            marker.highLight(highlight);
        } else {            
            this._map.removeLayer(marker);
            this._map.removeLayer(marker);
            const oldPane = marker.options["oldPane"];
            if (oldPane) {
                marker.options.pane = oldPane;
            }
            this.addLayer(marker);
            marker.highLight(highlight);
        }
    }

    // _selectMarker(marker: CategoryMarker<T>) {
    //     this.selectedMarker = new CategoryMarker<T>(this, marker.data);            
    //     this._map.addLayer(this.selectedMarker);
    //     this.selectedMarker.highLight(true);
    //     if (this._map.getZoom()<12) {
    //         this._map.setZoomAround(marker.getLatLng(), 12);
    //     } else {
    //         this._map.panTo(marker.getLatLng());
    //     }
    //     this.fire("itemselected", {marker:marker});
    // }

    // unselectMarker(marker: CategoryMarker<T>) {
    //     marker.remove();
    //     this.selectedMarker = undefined;
    //     this.fire("itemunselected", {marker:marker});
    // }

    // _unselectMarker(marker: CategoryMarker<T>) {
    //     marker.remove();
    //     this.fire("itemunselected", {marker:marker});
    // }

    findMarker(value:any, prop:string):CategoryMarker<T> {
        return this._findMarker(value, prop);
    }

    // selectMarker(value:any, prop:string):CategoryMarker<T> {
    //     console.info("selectMarker");
    //     const marker = this._findMarker(value, prop);
    //     if (this.selectedMarker) {
    //         this.selectedMarker.remove();
    //         this.selectedMarker = null;
    //         this.fire("itemunselected", {marker:marker});
    //     }
    //     if (marker) {
    //         this.selectedMarker = new CategoryMarker<T>(this, marker.data);            
    //         this._map.addLayer(this.selectedMarker);
    //         this.selectedMarker.highLight(true);
    //         if (this._map.getZoom()<12) {
    //             this._map.setZoomAround(marker.getLatLng(), 12);
    //         } else {
    //             this._map.panTo(marker.getLatLng());
    //         }
    //         this.fire("itemselected", {marker:marker});
    //     }        
    //     return marker;
    // }																			

    showMarker(value:any, prop:string):CategoryMarker<T> {
        console.info("showMarker");
        const marker = this._findMarker(value, prop);
        if (marker) {
            if (!marker.isVisible()) {
                this.addLayer(marker);
            }
            if (this._map.getZoom()<12) {
                this._map.setZoomAround(marker.getLatLng(), 12);
            } else {
                this._map.panTo(marker.getLatLng());
            }
        }
        return marker;
    }
    renderData(marker:CategoryMarker<T>, highLightOnly:boolean):View {
        return new MarkerView(this, marker, highLightOnly);
    }
    
    getItems(path:Path<any>): CategoryMarker<any>[] {
        console.info("_update");
        const selector = this.selector;
        const markers = this.markers;

        const results:CategoryMarker<T>[] = [];
        for (let i=0, count=markers.length; i<count; i++) {
            const marker = markers[i];
            
            if (selector.isOfCategory(marker.data, [path])) {
                results.push(marker);
            }
        }
        return results;
    }					   

    _update() {
        // console.info("_update");
        const selector = this.selector;
        const markers = this.markers;

        if (this.selectedCategories) {

            const selectedCats = this.selectedCategories;
            // let s = "\n";
            // for (let i=0; i<selectedCats.length; i++) {
            //     s += i.toString()+"\t"+selectedCats[i]+"\n";
            // }
            // console.info("_categorieSelected", s, "markers.length="+markers.length);
            console.error(markers.length);
            for (let i=0, count=markers.length; i<count; i++) {
                const marker = markers[i];
                
                if (selector.isOfCategory(marker.data, selectedCats)) {
                    if (!marker.isVisible()) {
                        // console.info(marker.data["id"], selector.isOfCategory(marker.data, this.selectedCategories));
                        this.addLayer(marker);
                        marker.setVisible(true);
                    }
                }
                else {
                    if (marker.isVisible()) {
                        console.info(marker.data["id"], selector.isOfCategory(marker.data, this.selectedCategories));
                        this.removeLayer(marker);
                        marker.setVisible(false);
                    }
                }
            }
        } else {
            for (let i=0, count=markers.length; i<count; i++) {
                const marker = markers[i];
                if (marker.isVisible()) {
                    this.removeLayer(marker);
                    marker.setVisible(false);
                }
            }
        }
    }

    setKategories(ids:Path<N>[]) {
        this.selectedCategories = ids;        
        this._update();

        
    }
    
    getCategories() {
        return this.categories;
    }


}