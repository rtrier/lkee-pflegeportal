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

    dom:HTMLElement;

    constructor(layer:CategorieLayer<any, any>, marker:CategoryMarker<any>) {
        this.layer = layer;
        this.marker = marker;
    }

    getDom() {
        if (!this.dom) {
            this.dom = this.layer.popupFactory.renderDataView(this.layer.categories, this.marker);
        }
        return this.dom;
    }

    onAdd(view:ViewControl) {
        console.info('MarkerView.onAdd', this.layer.map);
        this.layer.highlightMarker(this.marker, true);
        if (this.layer.map) {
            this.layer.map.panTo(this.marker.getLatLng());
        }
    }
    onRemove() {
        console.info('MarkerView.remove');
        this.layer.highlightMarker(this.marker, false);
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
                    itemDom.addEventListener('click', (ev)=>this.listEntryClicked({dom:<HTMLElement>ev.target, item:marker}));
                    itemDom.addEventListener('pointerenter', (ev)=>this.listEntryEnter(marker));
                    itemDom.addEventListener('pointerleave', (ev)=>this.listEntryLeave(marker));
                });
            }
            else {
                createHtmlElement("p", divList).innerHTML = "Es wurde nichts gefunden";
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
    listEntryClicked(entry:ListEntry<any>): any {
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


    onAdd(parent:ViewControl) {        
        console.info('MarkerListView.onAdd');
    }
    onRemove() {
        if (this.geoJson) {
            this.geoJson.remove();
        }
        console.info('MarkerListView.onRemove');
    }    

}
