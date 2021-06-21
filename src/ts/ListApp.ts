import { Facility, FacilityPopupFactory } from "./data/Facility";
import { CategorieLayer, Category } from "./maputil/CategorieLayer";
import { createHtmlElement } from "./util/HtmlUtil";

export class ListApp {
    host:string;

    categories:Category[];

    popupFactory = new FacilityPopupFactory();

    data: Facility[];

    listDom:HTMLDivElement;
    detailDom:HTMLDivElement;

    itemNr:number;
    itemDom: HTMLElement;
    rightBttn: HTMLButtonElement;
    leftBttn: HTMLButtonElement;
    listContentDiv: HTMLDivElement;
    scrollPos: number;
    textArea: HTMLLabelElement;
    

    constructor(host:string) {
        this.host = host;
    }

    start() {
        this.loadCategories();
    }

    loadCategories() {
        window.fetch(this.host+'/kategories').then((response)=>{
            response.json().then( data => {
                this.categories = data;
                this._loadData();
            })
        });
    }
    private _loadData() {
        window.fetch(this.host+'/facilities').then((response)=>{            
            response.json().then( data => {
                const dom = this.listDom = document.createElement('div');
                dom.className = 'listmain';                
                const contentDiv = this.listContentDiv = createHtmlElement('div', dom, 'listcenter list-item-view');
                this.data = data;
                for (let i=0; i<data.length; i++) {
                    const itemDom = this.popupFactory.renderListItem(this.categories, this.data[i]);
                    itemDom.addEventListener('click', (evt)=>this.itemClicked(evt, i));
                    itemDom.classList.add('list-item');
                    contentDiv.appendChild(itemDom);
                }
                document.body.appendChild(dom);
            })
        });
    }
    itemClicked(evt: MouseEvent, itemNr:number): void {
        this.scrollPos = this.listContentDiv.scrollTop;
        if (!this.detailDom) {
            const detailDom = this.detailDom =  document.createElement('div');
            detailDom.className = 'detailmain';

            const leftDiv = createHtmlElement('div', detailDom, 'left-div');
            const leftButtn = this.leftBttn = createHtmlElement('button', leftDiv);
            leftButtn.innerText = '<<';
            leftButtn.addEventListener("click", (evt)=>this.goPrev());
            const backBttn = createHtmlElement('button', leftDiv);
            backBttn.innerHTML = 'zurück';
            backBttn.addEventListener('click', ()=>this.goBack());

            const itemDom = this.itemDom = this.popupFactory.renderDataView(this.categories, this.data[itemNr]);
            itemDom.classList.add('itemdetail');
            detailDom.appendChild(itemDom);

            const rightDiv = createHtmlElement('div', detailDom, 'right-div');
            const rightBttn =  this.rightBttn = createHtmlElement('button', rightDiv);
            rightBttn.innerText = '>>';
            rightBttn.addEventListener("click", (evt)=>this.goNext());

            const textArea = this.textArea = createHtmlElement("label", rightDiv);
            textArea.innerText = "gid="+this.data[itemNr].id;
        } else {
            const itemDom = this.popupFactory.renderDataView(this.categories, this.data[itemNr]);
            itemDom.classList.add('itemdetail');
            this.itemDom.replaceWith(itemDom);
            this.itemDom = itemDom;
            this.textArea.innerText = "gid="+this.data[itemNr].id;
        }

        this.itemNr = itemNr;
        this.leftBttn.disabled = (itemNr===0);
        this.rightBttn.disabled = (itemNr===this.data.length-1);
        this.listDom.replaceWith(this.detailDom);
    }
    goBack(): any {
        this.detailDom.replaceWith(this.listDom);
        this.listContentDiv.scrollTop = this.scrollPos;
    }
    goPrev(): any {        
        this.itemNr = this.itemNr - 1;
        const itemDom = this.popupFactory.renderDataView(this.categories, this.data[this.itemNr]);
        itemDom.classList.add('itemdetail');
        this.itemDom.replaceWith(itemDom);
        this.textArea.innerText = "gid="+this.data[this.itemNr].id;
        this.itemDom = itemDom;
        this.rightBttn.disabled = false;
        if (this.itemNr===0) {
            this.leftBttn.disabled = true;
        }
        
    }
    goNext(): any {              
        this.itemNr = this.itemNr + 1;
        const itemDom = this.popupFactory.renderDataView(this.categories, this.data[this.itemNr]);
        itemDom.classList.add('itemdetail');
        this.itemDom.replaceWith(itemDom);
        this.textArea.innerText = "gid="+this.data[this.itemNr].id;
        this.itemDom = itemDom;
        this.leftBttn.disabled = false;
        if (this.itemNr===(this.data.length-1)) {
            this.rightBttn.disabled = true;
        }
    }
    
}