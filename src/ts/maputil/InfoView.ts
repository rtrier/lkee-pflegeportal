import { createHtmlElement } from "../util/HtmlUtil";
import { View, ViewControl } from "./ViewControl";



export class InfoView implements View {

    div = createHtmlElement('div');
    html = `Geben Sie etwas in das Suchfeld ein oder öffnen Sie das <a class="menu-button closed" href="#showMenu"><div></div></a> und wählen dort die anzuzeigenden Angebote.`
    handler:(evt:MouseEvent)=>void;

    constructor(html?:string) {
        this.div.innerHTML = html || this.html;
        this.div.className = "info_view closed";
    }
    
    getDom(): HTMLElement {
        return this.div;
        
    }

    onAdd?(parent: ViewControl): void {
        const nodeList =  this.div.querySelectorAll('a');
        const hdl = this.handler = (evt:MouseEvent) => this.onClick(evt);
        nodeList.forEach(element => {            
            element.addEventListener('click', hdl);
        });
    }
    onRemove(): void {
        const nodeList =  this.div.querySelectorAll('a');
        const hdl = this.handler;
        if (hdl) {
            nodeList.forEach(element => {
                element.removeEventListener('click', hdl);
            });
        }
    }

    onClick(evt:MouseEvent) {
        const target = evt.target;
        if (target instanceof HTMLAnchorElement) {
            console.info('Clicked=>"'+target.href+'"');
        }
        evt.preventDefault();
        evt.stopImmediatePropagation();
    }
    
}