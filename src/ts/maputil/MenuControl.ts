/*
<a class="menu-button" style=""><div class="menu-button-block"></div></a>
*/
import * as L from 'leaflet';
import autocomplete from '../util/Autocompleter';
import { createHtmlElement } from '../util/HtmlUtil';
import { LayerControl } from './LayerControl';


export class MenuControlOptions implements L.ControlOptions {
    position?: L.ControlPosition;    
    baseLayerCtrl:LayerControl;
    categorieLayerCtrl:LayerControl;
    searchFct?: (s: string, cb: (results: any[]) => any)=>void;
}

export class MenuControl extends L.Control {

    map:L.Map;
    dom: HTMLElement;
    baseLayerCtrl:LayerControl;
    categorieLayerCtrl:LayerControl;
    searchFct: (s: string, cb: (results: any[]) => any)=>void;

    closed:boolean = true;

    constructor(options:MenuControlOptions) {
        super(options);
        this.baseLayerCtrl=options.baseLayerCtrl;
        this.categorieLayerCtrl=options.categorieLayerCtrl;        
        this.searchFct = options.searchFct;
    }

    onAdd(map:L.Map):HTMLElement	{
        console.info("MenuControl.onAdd");
        this.map = map;
        if (!this.dom) {
            const div = createHtmlElement('div', undefined, "menu-ctrl closed");
            const anchor = createHtmlElement('a', div, 'menu-button');
            anchor.addEventListener('pointerup', (p)=>this._menuClicked(p));
            createHtmlElement('div', anchor);
            const searchBox = document.createElement('input');
            div.appendChild(searchBox);
            searchBox.type = 'text';
            searchBox.addEventListener('keyup', (ev)=>this._searchInput(ev));
            searchBox.addEventListener('focusin', (ev)=>this._searchFocusIn(ev));
            div.addEventListener("pointermove", (ev)=>{
                ev.stopPropagation();
                return true;
            }); 
            this.dom = div;

            autocomplete(searchBox, {
                onSelect: (item: any, input: HTMLInputElement) => this._found(item, input),
                fetch : this.searchFct,
                labelAttr : 'bezeichnung'
            });
        }
         
        return this.dom;
    }
    private _found(item: any, input: HTMLInputElement): void {        
        if (item.group==='Kategorie') {
            console.info('_foundKategorie', item);
            this.categorieLayerCtrl.showCategorie("Kategories", item);
        } else if (item.group==='Ort') {
            console.info('_foundOrt', item);
        } else if (item.group==='Einrichtung') {
            console.info('_foundEinrichtung', item);
            this.categorieLayerCtrl.showMarker("Kategories", item.id, "id");
        }        
    }




    
    private _searchFocusIn(ev: FocusEvent): any {
        console.info('_searchFocusIn', ev);
    }
    private _searchInput(ev: KeyboardEvent): any {
        console.info('_searchInput');
    }

    private _menuClicked(p: PointerEvent): any {
        console.info('_menuClicked');
       
        if (this.closed) {
            this.closed = false;
            this.dom.classList.replace('closed', 'opened');
            this.map.addControl(this.baseLayerCtrl);
            this.map.addControl(this.categorieLayerCtrl);

        } else {
            this.closed = true;
            this.dom.classList.replace('opened', 'closed');            
            this.map.removeControl(this.baseLayerCtrl);
            this.map.removeControl(this.categorieLayerCtrl);           
        }
        
    }

    onRemove(map:L.Map){
        console.info("MenuControl.onRemove");
        this.map = null;
    }
}