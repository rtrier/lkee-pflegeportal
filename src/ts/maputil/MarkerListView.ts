import { createHtmlElement } from "../util/HtmlUtil";
import { CategorieLayer, CategoryMarker} from "./CategorieLayer";
import { MenuControl } from "./MenuControl";
import { View, ViewControl } from "./ViewControl";

export type ListEntry<T> = {
    item:T;
    dom:HTMLElement;
}

export class MarkerView implements View {

    layer: CategorieLayer<any, any>;
    marker: CategoryMarker<any>;
    highLightOnly:boolean;

    dom:HTMLElement;
    // private _clickClosure: (evt: MouseEvent) => void;
    private _lastClickPos: number[];

    /**
     * 
     * 
     * 
     * @param layer 
     * @param marker 
     * @param highLightOnly if true the marker will not added to the layer
     */
    constructor(layer:CategorieLayer<any, any>, marker:CategoryMarker<any>, highLightOnly:boolean) {
        this.layer = layer;
        this.marker = marker;
        this.highLightOnly = highLightOnly;
    }

    getDom() {
        if (!this.dom) {
            this.dom = this.layer.popupFactory.renderDataView(this.layer.categories, this.marker);
        }
        return this.dom;
    }

    onAdd(view:ViewControl) {
        console.info(`MarkerView.onAdd highLightOnly=${this.highLightOnly}`, this.layer.map);
        if (this.highLightOnly) {
            this.layer.highlightMarker(this.marker, true);
            if (this.layer.map) {
                this.layer.map.panTo(this.marker.getLatLng());
            }
        } else {
            if (this.layer.map) {
                this.layer.addLayer(this.marker);
                this.layer.highlightMarker(this.marker, true);
                this.layer.map.panTo(this.marker.getLatLng());
            }
        }
        // if (this.dom) {
        //     this._clickClosure = (evt:MouseEvent)=>{                
        //         if ('mousedown' === evt.type) {
        //             this._lastClickPos = [evt.pageX, evt.pageY];
        //         } else {
        //             if ('mouseup' === evt.type) {
        //                 if (this._lastClickPos) {                            
        //                     const diffX = Math.abs(evt.pageX - this._lastClickPos[0]);
        //                     const diffY = Math.abs(evt.pageY - this._lastClickPos[1]);
        //                     if (diffX < 10 && diffY < 10) {
        //                         view.goBack();
        //                     }
        //                 }
        //                 this._lastClickPos = null;
        //             }
        //         }
        //     };
        //     this.dom.addEventListener('mousedown', this._clickClosure);
        //     this.dom.addEventListener('mouseup', this._clickClosure);
        // }
    }
    onRemove() {
        console.info(`MarkerView.onRemove highLightOnly=${this.highLightOnly}`, this.layer.map);
        this.layer.highlightMarker(this.marker, false);
        if (!this.highLightOnly) {
            this.layer.removeLayer(this.marker);
        }
        // if (this._clickClosure) {
        //     this.dom.removeEventListener('mousedown', this._clickClosure);
        //     this.dom.removeEventListener('mouseup', this._clickClosure);
        // }
    }
}

export class MarkerListView implements View {
    layer: CategorieLayer<any, any>;
    markers: CategoryMarker<any>[];
    selectedListEntry: ListEntry<any>;
    dom: HTMLDivElement;
    geoJson: L.GeoJSON<any>;

    constructor(geoJ:L.GeoJSON, layer:CategorieLayer<any, any>, markers:CategoryMarker<any>[]) {
        this.layer = layer;
        this.markers = markers;
        this.geoJson = geoJ;
    }

    getDom():HTMLElement {
        if (!this.dom) {
            const divList = document.createElement('div');
            divList.className = 'list-item-view';
            const markers = this.markers;
            const pop = this.layer.popupFactory;
            
            if (markers && markers.length>0) {            
                markers.forEach(marker=>{
                    const itemDom = pop.renderListItem(this.layer.categories, marker)
                    divList.appendChild(itemDom);
                    itemDom.className =  'list-item';
                    itemDom.addEventListener('click', (ev)=>this.listEntryClicked({dom:<HTMLElement>ev.target, item:marker}, ev));
                    itemDom.addEventListener('pointerenter', (ev)=>this.listEntryEnter(marker));
                    itemDom.addEventListener('pointerleave', (ev)=>this.listEntryLeave(marker));
                });
            }
            else {
                createHtmlElement("p", divList).innerHTML = "&nbsp;Es wurde nichts gefunden";
            }
            this.dom = divList;
        }
        return this.dom;
    }



    listEntryLeave(marker: CategoryMarker<any>): any {
        // console.info('listEntryLeave', marker);
    }
    listEntryEnter(marker: CategoryMarker<any>): any {
        // console.info('listEntryEnter', marker);
    }
    listEntryClicked(entry:ListEntry<any>, evt:MouseEvent): any {
        console.info("listEntryClicked", entry, evt);
        const target = <HTMLElement>evt.target;
        // if target is a link we do nothing
        if (target.tagName !== 'a') {
            if (this.selectedListEntry) {
                this.selectedListEntry.dom.classList.remove('selected');
                if (this.selectedListEntry===entry) {        
                    this.selectedListEntry = undefined;        
                    MenuControl.DISPATCHER.onListViewItemSelection.dispatch(this, undefined);                
                } 
            }
            this.selectedListEntry = entry;        
            MenuControl.DISPATCHER.onListViewItemSelection.dispatch(this, entry.item);
            console.info('listEntryClicked', entry);
        }
    }


    onAdd(parent:ViewControl) {        
        console.info('MarkerListView.onAdd', this.markers?.length, this.layer?.getLayers()?.length);
        if (this.markers) {
            this.layer.addLayers(this.markers);
        }
    }
    onRemove() {
        console.info('MarkerListView.onRemove', this.markers?.length, this.layer?.getLayers()?.length);
        if (this.geoJson) {
            this.geoJson.remove();
        }
        if (this.markers) {
            this.layer.removeLayers(this.markers);
        }
        console.info('MarkerListView.removed', this.markers?.length, this.layer?.getLayers()?.length);
    }    

}
