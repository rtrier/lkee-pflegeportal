import { Content } from "leaflet";
import { CategorieSelector, CategoryMarker, Path, PopupCreator } from "../maputil/CategorieLayer";
import { createHtmlElement } from "../util/HtmlUtil";

export type FacilityOffer = {
    kat1_id: number;
    kat2_id?: number;
    kat3_id?: number;
}

export type Facility = {
    id: number;
    lat: number;
    lng: number;
    facilityOffers: FacilityOffer[];
}

function createEmailLink(email:string):HTMLElement {
    const anchor = document.createElement('a');
    anchor.href="mailto:"+email;
    anchor.innerText = email;
    return anchor;
}
function createWebLink(link:string):HTMLElement {
    const anchor = document.createElement('a');
    anchor.href=link;
    anchor.innerText = link;
    return anchor;
}

function createTelLink(telnr:string):HTMLElement {
    const anchor = document.createElement('a');
    const tel = telnr.replace(/[^\d^\+]/g, '');
    anchor.href='tel:'+tel;
    anchor.innerText = telnr;
    return anchor;
}

function createSpan(txt:string):HTMLElement {
    const span = document.createElement('span');
    span.innerText = txt;
    return span;
}


export class FacilitySelector implements CategorieSelector<Facility, string> {

    isOfCategory(data: Facility, pathes: Path<string>[]): boolean {
        if (data.facilityOffers) {
            for (let pathNr=0, pathCounts=pathes.length; pathNr<pathCounts; pathNr++) {
                for (let index = 0; index < data.facilityOffers.length; index++) {
                    const path = pathes[pathNr];
                    // console.info(path);                    
                    const element = data.facilityOffers[index];
                    // console.info('kat01_'+element.kat1_id, 'kat02_'+element.kat2_id, 'kat03_'+element.kat3_id)
                    if (path[0] === 'kat01_'+element.kat1_id) {
                        if (path.length === 1) {
                            return true;
                        } else {
                            if (path[1] === 'kat02_'+element.kat2_id) {
                                if (path.length === 2) {
                                    return true;
                                } else {
                                    if (path[2] === 'kat03_'+element.kat3_id) {
                                        return true;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return false;
    }

}

export class FacilityPopupFactory implements PopupCreator<Facility> {

    static ATT_Facilities = [
        "traeger_institution",
        "einrichtungsname",
        "telefon", "e_mail", "homepage", "plz", "ort", "strasse", "hausnummer",
        "weitere_informationen", "art_angebot_beratung",
        "telefon_alternativ", "handy", "handy_alternativ"
    ];
    static ATT_de = {
        aktenzeichen: "Aktenzeichen",
        ansprechpartner: "Ansprechpartner",
        art_angebot_beratung: "art_angebot_beratung",
        e_mail: "E-Mail",
        einrichtungsname: "Einrichtungsname",
        fachgebiet_richtung: "Fachgebiet/-richtung",
        geschlecht: "Geschlecht",
        handy: "Handy",
        handy_alternativ: "Handy alternativ",
        hausnummer: "Hausnummer",
        homepage: "Homepage",
        kapazitaet: "Kapazität",
        methode: "Methode",
        name: "Name",
        oeffnungszeiten: "Öffnungszeiten",
        ort: "Ort",
        personalanzahl: "Personalanzahl",
        personen_gesamt: "Personen gesamt",
        plz: "Plz",
        schulart_schluessel: "Schulartschlüssel",
        schultraeger: "Schulträger",
        schwerpunkte: "Schwerpunkte",
        strasse: "Straße",
        telefon: "Telefon",
        telefon_alternativ: "Telefon alternativ",
        titel: "Titel",
        traeger_institution: "Trägerinstitution",
        weitere_informationen: "weitere Informationen"        
    };
    static ATT_FacilitiesOffer = [
        "art_angebot_beratung",
        "fachgebiet_richtung",
        "methode",
        "einrichtungsname",
        "geschlecht",
        "titel",
        "name",
        "e_mail",
        "telefon",
        "ansprechpartner",
        "homepage",
        "schwerpunkte",
        "telefon_alternativ",
        "handy",
        "handy_alternativ",
        "weitere_informationen",
        "aktenzeichen",
        "personen_gesamt",
        "schulart_schluessel",
        "schultraeger",
        "oeffnungszeiten",
        "kapazitaet",
        "personalanzahl"
    ];
    static ATT_FacilitiesOffer_N = [
        "art_angebot_beratung",
        "Fachgebiet/ -richtung",
        "Methode",
        "Einrichtungsname",
        "Anrede",
        "Titel",
        "Name",
        "E-Mail",
        "Telefon",
        "Ansprechpartner",
        "Homepage",
        "Schwerpunkte",
        "Telefon alternativ",
        "Handy",
        "Handy alternativ",
        "Weitere Informationen",
        "Aktenzeichen",
        "Personen gesamt",
        "Schulart-schluessel",
        "Schulträger",
        "Öffnungszeiten",
        "Kapazität",
        "Personalanzahl"
    ];

    build(categories:[], marker: CategoryMarker<Facility>): Content {
        console.info("FacilityPopupFactory.build");
        const facility = marker.data;

        const div = document.createElement("div");
        div.className = 'popup-facility';
        div.appendChild(getHeader(facility));
        div.appendChild(getAdress(facility));
        div.appendChild(getContact(facility));
        
        console.info("FacilityPopupFactory.build", facility);
        // const tbl = createHtmlElement("table", div, "popup-facility");        
        const tbl = createHtmlElement("table", div);        
        FacilityPopupFactory.ATT_Facilities.forEach((attName)=>{
            const value = facility[attName];            
            if (value) {
                createRow(attName, value, tbl);
            }
        });
        if (facility.facilityOffers) {
            for (let i=0; i<facility.facilityOffers.length; i++) {
                // const tbl = createHtmlElement("table", div, "popup-facilityoffer");
                const tbl = createHtmlElement("table", div);
                const fOffer = facility.facilityOffers[i];
                FacilityPopupFactory.ATT_FacilitiesOffer.forEach((attName)=>{
                    const value = fOffer[attName];                
                    if (value) {
                        createRow(attName, value, tbl);
                    }
                });
            }
        }
        return div;
    }

}

function getHeader(facility:Facility):HTMLElement {
    const traeger_institution = facility['traeger_institution'];
    const einrichtungsname = facility['einrichtungsname'];
    const p = document.createElement("p");    
    let s:string;
    if (traeger_institution) {
        s = traeger_institution;
        if (einrichtungsname) {
            s += '<br>'+einrichtungsname;
        }        
    } else {
        s = einrichtungsname;
    }
    p.innerHTML = s;
    return p;
}

function getContact(facility:Facility):HTMLElement {
    
    const rows =[];
    const valueMail = facility["e_mail"];
    if (valueMail) {
        rows.push(createEmailLink(valueMail));
    }
    const valueHomepage = facility["homepage"];
    if (valueHomepage) {
        rows.push(createWebLink(valueHomepage));
    }

    const att = ["telefon", "telefon_alternativ", "handy", "handy_alternativ"];
    for (let i=0, count=att.length; i<count; i++) {
        const valuePhone = facility[att[i]];
        if (valuePhone) {
            rows.push(createTelLink(valuePhone));
        }
    }
    const p = document.createElement("p");
    for (let i=0, count=rows.length; i<count; i++) {
        if (i>0) {p.appendChild(document.createElement('br'))};
        p.appendChild(rows[i]);
    }
    return p;
}


function getKategories(facility:Facility):any[] {
    const offers = facility.facilityOffers;
    const kategories = [];
    for (let i=0; i<offers.length; i++) {
        const offer = offers[i];
        const path = [offer.kat1_id];
        if (offer.kat2_id) {path.push(offer.kat2_id);}
        if (offer.kat3_id) {path.push(offer.kat3_id);}
        if (!kategories.includes(path)) {
            kategories.push(path);
        }
    }
    return kategories;
}

function getAdress(facility:Facility):HTMLElement {
    
    const plz = facility['plz'];
    const ort = facility['ort'];
    const strasse = facility['strasse'];
    const hausnummer = facility['hausnummer'];
    const p = document.createElement("p");    
    let plzOrt:string;
    if (plz) {
        plzOrt = plz;
        if (ort) {
            plzOrt += " "+ort;
        }        
    } else {
        if (ort) {
            plzOrt = ort;
        }
    }
    let str:string;
    if (strasse) {
        str = strasse;
        if (hausnummer) {
            str += " "+hausnummer;
        }        
    }
    p.innerHTML = plzOrt+'<br>'+str;
    return p;
}

function createRow(attName:string, value:any, parent:HTMLElement):HTMLTableRowElement {
    const title = FacilityPopupFactory.ATT_de[attName];
    const row = document.createElement('tr');
    const c1 = document.createElement('td');
    c1.innerText = title;
    const c2 = document.createElement('td');
    if (attName==='e_mail') {
        c2.appendChild(createEmailLink(value))
    } else if (attName==='homepage') {
        c2.appendChild(createWebLink(value))
    } else {
        c2.innerText = value;
    }
    row.appendChild(c1);
    row.appendChild(c2);
    parent.appendChild(row);
    return row;
}

// class PoiPopup extends CategoryPopup<Facility> {



//     _container:any;

//     constructor(marker:CategoryMarker) {
//         super({offset:stdOffset});
//     }

//     onAdd(map: L.Map): this {

//         if (!this._container) {
// 			(<any>this)._initLayout();
// 		}
//         this.setContent(this._createContent);
//         hideElementsByClass("leaflet-sidebar")
//         hideElementsByClass("leaflet-control-container")
//         // rtr this.poiMarker.poiLayer.app.sidebar.hideSidebar();
//         return super.onAdd(map);
//     }

//     onRemove(map: L.Map): this {
//         showElementsByClass("leaflet-sidebar")
//         showElementsByClass("leaflet-control-container")
//         // rtr this.poiMarker.poiLayer.app.sidebar.showSidebar();
//         return super.onRemove(map);
//     }

//     _createContent():HTMLDivElement {
//         const content=document.createElement("div");
//         const poiLayer = this.poiMarker.poiLayer;
//         content.className="poi-popup";
//         const h2=document.createElement("h2");
//         h2.innerText=this.poiMarker.title;

//         const ul=<HTMLDivElement>document.createElement("div");
//         ul.className="poi-popup-menu";     
//         ul.append(this._createListElement("Details", this.poiMarker.showDetails, this.poiMarker));

//         // const actions:Array<Action> = this.poiMarker.poiLayer.popupMenuItems;
//         // for (let i=0; i<actions.length; i++) {
//         //     ul.append(this._createListElementA(actions[i]));
//         // }

//         const actions:Action[] = poiLayer.getPoiAction(this.poiMarker.poi);
//         for (let i=0; i<actions.length; i++) {
//             ul.append(this._createListElementA(actions[i]));
//         }
//         /*
//         if (poiLayer.app.canUserEdit(this.poiMarker.poi)) {
//             ul.append(this._createListElementA(poiLayer.app.poiDeleteAction));
//             ul.append(this._createListElementA(poiLayer.app.poiEditAction));
//             ul.append(this._createListElementA(poiLayer.app.poiMoveAction));
//         }
//         */
//         if (this.poiMarker.poi["pinned"])  {
//             ul.append(this._createListElement("von der Karte entfernen", (evt) => {
//                 console.info("von der Karte entfernen", evt, this);
//                 this.poiMarker.closePopup();
//                 this.poiMarker.remove();
//                 this.poiMarker.poi.set("pinned", undefined);
//             }, this));
//         }

//         content.appendChild(h2);
//         content.appendChild(ul);
//         return content;
//     }

//     _createListElementA(action:Action):HTMLElement {
//         // let li=<HTMLLIElement>document.createElement("li");
//         const liAncor=<HTMLAnchorElement>document.createElement("a");
//         liAncor.innerText=action.text;
//         liAncor.href='#';
//         if (action.disabled) {
//             liAncor.className='poi-popup-item poi-popup-item-disabled';
//         }
//         else {
//             liAncor.className='poi-popup-item';
//         }

//         const fn = (function() {
//             return function() {
//                 if (!action.disabled) {
//                     this.poiMarker.closePopup();
//                     action.callback(this.poiMarker);
//                 }
//             }
//         })();


//         L.DomEvent.on(liAncor, "click", fn, this);
//         // DomEvent.on(liAncor, "mouseover", this._onMouseOverItem, this);
//         // DomEvent.on(liAncor, "mouseout", this._onMouseOutItem, this);
//         L.DomEvent.on(liAncor, "mousedown", L.DomEvent.stopPropagation);
//         // li.appendChild(liAncor);
//         return liAncor;
//     }

//     _createListElement(text:string, fn:(event: Event)=>void, scope:any):HTMLElement  {
//         const liAncor=<HTMLAnchorElement>document.createElement("a");
//         liAncor.innerText=text;
//         liAncor.href='#';

//         liAncor.className='poi-popup-item';

//         const self = this;
//         const fn2 = (function() {            
//             return function() {
//                 fn.call(scope, self.poiMarker);
//             }
//         })();

//         L.DomEvent.on(liAncor, "click", fn2, scope);        
//         // DomEvent.on(liAncor, "mouseover", this._onMouseOverItem, this);
//         // DomEvent.on(liAncor, "mouseout", this._onMouseOutItem, this);
//         L.DomEvent.on(liAncor, "mousedown", L.DomEvent.stopPropagation);

//         // li.appendChild(liAncor);
//         return liAncor;
//     }

// }