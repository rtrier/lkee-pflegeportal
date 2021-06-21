
import {Control, Icon, Map, Polygon, TileLayer} from 'leaflet';
import { FacilityIconFactory, FacilityPopupFactory, FacilitySelector } from './data/Facility';
import { lkee } from './LKEE';
import { CategorieLayer } from './maputil/CategorieLayer';
import { InfoView } from './maputil/InfoView';
import { BaseLayerDefinition, LayerControl, LayerControlOptions } from './maputil/LayerControl';
import { MenuControl } from './maputil/MenuControl';
import { View, ViewControl } from './maputil/ViewControl';
import { getJSON } from './util/HtmlUtil';

const host = window.location.href.indexOf("localhost")>0 ? '' : '/pflegeportal';
// const host = '';								
export class App {

    map: Map;
    baseLayerCtrl: LayerControl;
    categorieLayerCtrl: LayerControl;
    menuCtrl: MenuControl;

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
                id: 'webatlas',
                name: 'WebAtlasDE',
                layer: new TileLayer(                   
                    'https://sgx.geodatenzentrum.de/wmts_webatlasde.light/tile/1.0.0/webatlasde.light/default/DE_EPSG_3857_LIGHT/{z}/{y}/{x}.png',
                    {    "minZoom": 5,
                    "maxZoom": 15,
                    "zoomOffset": -5,
                        attribution: '© <a href="http://www.bkg.bund.de/" target="_blank">Bundesamt für Kartographie und Geodäsie</a> 2020, <a href="http://sg.geodatenzentrum.de/web_public/Datenquellen_TopPlus_Open.pdf" target="_blank">Datenquellen</a>'})
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
            baseLayer: baseLayers[1].layer,
            position: 'topleft',
            className: 'flex-no-shrink'
        }
        
        this.baseLayerCtrl = new LayerControl(layerCtrlOptions);
        this.categorieLayerCtrl = new LayerControl({position: 'topleft'});

        this.menuCtrl = new MenuControl({
			parent: document.getElementById('ctrl'),										
            position:'topleft', 
            // baseLayerCtrl:this.baseLayerCtrl,
            categorieLayerCtrl: this.categorieLayerCtrl,
            searchFct: (s, cb)=>this._search(s, cb),
            viewsHome: new InfoView()
        });
        map.addControl(this.menuCtrl);

        map.addLayer(baseLayers[1].layer);

        // this.menuCtrl.openMenu();

        const storedViewParam = this._getStoredViewParam();
        if (storedViewParam) {
            this.map.setView(storedViewParam.center, storedViewParam.zoomLevel);
        } else {
            this.map.setView([51.60340695109007, 13.488503153898543], 10);
        }
        this.map.setView([51.60340695109007, 13.488503153898543], 10);
		this.map.createPane("highlightPane").style.zIndex = '625';
        				
        // const clusterIcon = new Icon({
        //     iconUrl: 'images/empty.svg',
        //     iconSize: [40, 40],
        //     className: 'icon-cluster'
        // });
        
        const categorieLayer = new CategorieLayer({
            categorieUrl:host+'/kategories',
            url: host+'/facilities',
            selector: new FacilitySelector(),
            popupFactory: new FacilityPopupFactory(),
            // disableClusteringAtZoom: 15,
            iconFactory: new FacilityIconFactory(),
            zoomToBoundsOnClick:false,
            disableClusteringAtZoom:17
            // ,
            // iconCreateFunction: function(cluster) {
            //     return clusterIcon;
            // }
        });
		this.menuCtrl.addCategorieLayer(categorieLayer, false);
        
        /*

        categorieLayer.once("CategoriesLoaded", (evt)=>{
            console.info('App CategoriesLoaded', categorieLayer);
            this.categorieLayerCtrl.addCategorieLayer("Kategories", categorieLayer);
            this.map.addLayer(categorieLayer);
        });
        categorieLayer.loadCategories();
        */

        this.map.on("zoomend", this.mapViewChanged, this);
        this.map.on("moveend", this.mapViewChanged, this);
        console.info("Map initialisiert");

        this.map.addLayer(new Polygon(lkee));

        map.addControl(new Control.Zoom({position:'topright'}));
        map.addControl(new Control.Scale({imperial:false, position:'bottomright'}));
   }

    private _search(query: string, cb: (results: any[]) => any): void {
        // console.info(`_search ${query}`);
        const params = {
            searchTxt: query.toLowerCase()
        }
        getJSON(
            host+'/search',
            params,
            (data:any) => { cb(data) }
        )
    }   

    start() {
        console.info("App startet");
        this.initMap();
    }



}