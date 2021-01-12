require('leaflet');
require('@glartek/leaflet.markercluster');

import * as L from 'leaflet';
// import {MarkerClusterGroup} from "@glartek/leaflet.markercluster";

function createIcon(code:number):L.Icon {
    return <L.Icon>L.divIcon(
        {html: '<i class="afas">'+String.fromCharCode(code)+'</i>', 
        iconSize: new L.Point(20, 20),
        iconAnchor: new L.Point(0,0),
        className: 'mapDivIcon'}
    );
}

export interface Category {
    id: number,
    parentId: number,
    bezeichnung: string,
    childs: Category[]
}


export interface CategorieLayerOptions<T extends L.LatLngExpression, N> extends L.MarkerClusterGroupOptions {
    categorieUrl:string,
    url:string,
    selector: CategorieSelector<T, N>,
    popupFactory: PopupCreator<T>;
}

export type Path<T> = T[];

export interface CategorieSelector<T, N> {
    isOfCategory(data:T, katId:Path<N>[]):boolean;
}

export interface PopupCreator<T extends L.LatLngExpression> {
    build(categories:[], marker:CategoryMarker<T>):L.Content;
}

/*
export class CategoryPopup<T extends L.LatLngExpression> extends L.Popup {
    marker: CategoryMarker<T>;

    constructor(marker:CategoryMarker<T>, options:L.PopupOptions) {
        super(options);
    }

}
*/
export class CategoryMarker<T extends L.LatLngExpression> extends L.Marker {
    visible:boolean=false;

    static icon = createIcon(0xf024);
    parentLayer: CategorieLayer<T, any>;
    data: T;

    constructor(parentLayer:CategorieLayer<T, any>, data:T, icon?:L.Icon) {
        super(data);
        this.data = data;
        this.parentLayer = parentLayer;
        if (!icon) {
            icon = CategoryMarker.icon;
        }
        this.setIcon(icon);
    }

    onAdd(map: L.Map):this {     
        console.info("onAdd", this.data);
        // this.bindPopup(layer=>this.parentLayer.popupFactory.build(<any>layer));
        this.on('click', (ev)=>this.parentLayer.mapItemClicked(this, ev));
        // this.visible=true;
        return super.onAdd(map);
    }

    

    onRemove(map: L.Map): this {
        console.info("onRemove", this.data);
        this.unbindPopup();
        // this.visible=false;
        return super.onRemove(map);
    }

    setVisible(visible:boolean) {
        this.visible=visible;
    }

    isVisible():boolean {
        return this.visible;
    }


    // showDetails(event: Event) {
    //     try {
    //         this.closePopup();
    //         this.poiLayer.showDetails(this.poi);
    //     }
    //     catch (ex) {
    //         console.error(ex)
    //     }
    // }

}


// export class CategorieLayer<T extends L.LatLngExpression> extends L.LayerGroup {
export class CategorieLayer<T extends L.LatLngExpression, N> extends L.MarkerClusterGroup {


    categorieUrl:string;
    url:string;

    categories:Category[];

    selectedCategories:Path<N>[];

    data: T;
    selector: CategorieSelector<T, N>;
    popupFactory: PopupCreator<T>;

    markers:CategoryMarker<T>[] = []; 

    constructor(options?:CategorieLayerOptions<T, N>) {
        super(options);
        this.categorieUrl = options.categorieUrl;
        this.url = options.url;
        this.selector = options.selector;
        this.popupFactory = options.popupFactory;
    }

    loadCategories() {
        window.fetch(this.categorieUrl).then((response)=>{
            response.json().then( data => {
                this.categories = data;
                this.fire("CategoriesLoaded");
                this._loadData();
            })
        });
    }
    private _loadData() {
        window.fetch(this.url).then((response)=>{
            response.json().then( data => {
                this.data = data;
                for (let i=0; i<data.length; i++) {
                    this.markers.push(new CategoryMarker(this, data[i]));
                }
                this._update();
            })
        });
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

    mapItemClicked(marker: CategoryMarker<T>, ev: L.LeafletEvent): void {
        console.info("mapItemClicked", marker, ev);
    }    

    showMarker(value:any, prop:string) {
        const marker = this._findMarker(value, prop);
        if (marker) {
            if (!marker.isVisible()) {
                this.addLayer(marker);
            }
            this._map.setZoomAround(marker.getLatLng(), 10);
        }
    }

    _update() {
        console.info("_update");
        const selector = this.selector;
        const markers = this.markers;



        if (this.selectedCategories) {

            const selectedCats = this.selectedCategories;
            // let s = "\n";
            // for (let i=0; i<selectedCats.length; i++) {
            //     s += i.toString()+"\t"+selectedCats[i]+"\n";
            // }
            // console.info("_categorieSelected", s, "markers.length="+markers.length);

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