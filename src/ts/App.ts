
// const L = import("leaflet");
// const L = require("leaflet");

import {Map, TileLayer} from 'leaflet';
import { FacilityPopupFactory, FacilitySelector } from './data/Facility';
import { CategorieLayer } from './maputil/CategorieLayer';
import { BaseLayerDefinition, LayerControl, LayerControlOptions } from './maputil/LayerControl';
import { MenuControl } from './maputil/MenuControl';
import { getJSON } from './util/HtmlUtil';

export class App {

    map: Map;
    baseLayerCtrl: LayerControl;
    categorieLayerCtrl: LayerControl;
    menuCtrl: MenuControl;
    // categorieLayer: CategorieLayer<any, any>;

	mapViewChanged(evt: L.LeafletEvent) {
		const viewParam = {
			center: this.map.getCenter(),
			zoomLevel: this.map.getZoom()
		}
		if (window.localStorage) {
			window.localStorage.setItem("viewParam", JSON.stringify(viewParam));
		}
	}

	_getStoredViewParam(): { center: L.LatLng, zoomLevel: number } {
		if (window.localStorage) {
			const s = window.localStorage.getItem("viewParam")
			if (s) {
				return JSON.parse(s)
			}
		}
		return null;
	}    

    initMap() {


        const map = this.map = new Map('map', <L.MapOptions>{
            zoomControl: false,
            // contextmenu: true,
            // contextmenuItems: this.menuItems,
            attributionControl: true
        });

        const baseLayers:BaseLayerDefinition[] = [
            {
                id: 'orka',
                name: 'ORKa.MV – Offene Regionalkarte Mecklenburg-Vorpommern',
                layer: new TileLayer(
                    'https://www.orka-mv.de/geodienste/orkamv/tiles/1.0.0/orkamv/GLOBAL_WEBMERCATOR/{z}/{x}/{y}.png',
                    {attribution: 'Kartenbild © Hanse- und Universitätsstadt Rostock (<a rel="license" target="_blank" href="https://creativecommons.org/licenses/by/4.0/deed.de">CC BY 4.0</a>)'})
            },{
                id: 'topPlusOpen',
                name: 'TopPlusOpen (Normalausgabe)',
                layer: new TileLayer(
                    'https://sgx.geodatenzentrum.de/wmts_topplus_web_open/tile/1.0.0/web/default/WEBMERCATOR/{z}/{y}/{x}.png',
                    {attribution: '© <a href="http://www.bkg.bund.de/" target="_blank">Bundesamt für Kartographie und Geodäsie</a> 2020, <a href="http://sg.geodatenzentrum.de/web_public/Datenquellen_TopPlus_Open.pdf" target="_blank">Datenquellen</a>'})
            },{
                id: 'topPlusOpenGray',
                name: 'TopPlusOpen (Graustufen)',
                layer: new TileLayer(
                    'https://sgx.geodatenzentrum.de/wmts_topplus_web_open/tile/1.0.0/web_grau/default/WEBMERCATOR/{z}/{y}/{x}.png',
                    {attribution: '© <a href="http://www.bkg.bund.de/" target="_blank">Bundesamt für Kartographie und Geodäsie</a> 2020, <a href="http://sg.geodatenzentrum.de/web_public/Datenquellen_TopPlus_Open.pdf" target="_blank">Datenquellen</a>'})
            },{
                id: 'osm',
                name: 'OpenStreetMap DE',
                layer: new TileLayer(
                    'https://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png',
                    {attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" rel="noopener" target="_blank">OpenStreetMap</a> contributors'})
            }
        ]


        const layerCtrlOptions:LayerControlOptions = {
            baseLayers : baseLayers,
            baseLayer: baseLayers[0].layer,
            position: 'topleft',
            className: 'flex-no-shrink'
        }

        
        this.baseLayerCtrl = new LayerControl(layerCtrlOptions);
        this.categorieLayerCtrl = new LayerControl({position: 'topleft'});

        this.menuCtrl = new MenuControl({
            position:'topleft', 
            baseLayerCtrl:this.baseLayerCtrl,
            categorieLayerCtrl: this.categorieLayerCtrl,
            searchFct: (s, cb)=>this._search(s, cb)
        });
        map.addControl(this.menuCtrl);

        map.addLayer(baseLayers[0].layer);
        

        
        

        // this.map.addLayer( 
        //     new TileLayer('https://sgx.geodatenzentrum.de/wmts_topplus_web_open/tile/1.0.0/web/default/WEBMERCATOR/{z}/{y}/{x}.png')
        // )

        const storedViewParam = this._getStoredViewParam();
        if (storedViewParam) {
            this.map.setView(storedViewParam.center, storedViewParam.zoomLevel);
        } else {
            this.map.setView([51.60340695109007, 13.488503153898543], 10);
        }
        this.map.setView([51.60340695109007, 13.488503153898543], 10);
        
        const categorieLayer = new CategorieLayer({
            categorieUrl:'/kategories',
            url: '/facilities',
            selector: new FacilitySelector(),
            popupFactory: new FacilityPopupFactory(),
            disableClusteringAtZoom: 15
        });
        
        categorieLayer.once("CategoriesLoaded", (evt)=>{
            console.info('App CategoriesLoaded', categorieLayer);
            this.categorieLayerCtrl.addCategorieLayer("Kategories", categorieLayer);
            this.map.addLayer(categorieLayer);
        });
        categorieLayer.loadCategories();
        

        this.map.on("zoomend", this.mapViewChanged, this);
        this.map.on("moveend", this.mapViewChanged, this);
        console.info("Map initialisiert");
   }

    private _search(query: string, cb: (results: any[]) => any): void {
        console.info("hgsdf");
        const params = {
            searchTxt: query.toLowerCase()
        }

        getJSON(
            '/search',
            params,
            (data:any) => { cb(data) }
        )
    }   

    start() {
        console.info("App startet");
        this.initMap();
    }
}