import * as L from 'leaflet';
import { createHtmlElement } from '../util/HtmlUtil';
import { MarkerView } from './MarkerListView';
import { MenuControl } from './MenuControl';

export interface View {
    getDom():HTMLElement;
    onAdd?(parent:ViewControl):void;
    onRemove?():void;
}

export interface ViewControlOptions extends L.ControlOptions {
    home?:View;
}

export class TextView {
    dom:HTMLElement;
    constructor(innerHtml:string) {
        const d = this.dom = document.createElement('div');
        d.className = 'text_view';
        d.innerHTML = innerHtml;
        
    }
    getDom():HTMLElement {
        return this.dom;
    }
}

export class ViewControl extends L.Control {


    dom: HTMLElement;
    navigationArea: HTMLElement;
    contentArea: HTMLElement;

    contentHistory:View[] = [];
    counter: number = 0;
    navBttn: HTMLElement;
    anchorBack: HTMLAnchorElement;

    currentView: View;

    home:View;

    constructor(options:ViewControlOptions) {
        super(options);
        this.home = options.home;
        const div = this.dom = document.createElement('div');
        div.id = 'viewctrl';
        div.className = 'viewctrl';
        const navArea = this.navigationArea = document.createElement('div');
        navArea.className = 'viewctrl-nav';        
        const navSpan = this.navBttn = document.createElement('span');
        navArea.appendChild(navSpan);
        const anchorBack = this.anchorBack = document.createElement('a') ;
        anchorBack.className = '';
        navSpan.appendChild(anchorBack);
        navSpan.addEventListener('click', (ev)=>this._backBttnClicked());
        
        this.contentArea = document.createElement('div');
        this.contentArea.className = 'viewctrl-content';

        div.appendChild(this.navigationArea);
        div.appendChild(this.contentArea);
        if (this.home) {
            this.contentArea.appendChild(this.home.getDom());
        }
        // const fnStopPropagation = (ev)=> {
        //     ev.stopPropagation();
        //     return false;
        // }
        // div.addEventListener("pointermove", fnStopPropagation); 
        // div.addEventListener("click", fnStopPropagation);
        // div.addEventListener("mouseup", fnStopPropagation);
        // div.addEventListener("pointerup", fnStopPropagation);
        // div.addEventListener("wheel", fnStopPropagation);
    }
    private _backBttnClicked(): any {
        this.goBack();
    }

    getContainer() {
        return this.dom;
    }

    addTo(map:L.Map):this {
        return super.addTo(map);
    }

    onAdd(map:L.Map):HTMLElement {
        return this.dom;
    }	

    onRemove(map:L.Map) {
    }

    clear() {
        let view:View;
        while (view=this.contentHistory.pop()) {
            if (view.onRemove) {
                view.onRemove();
            }
        }
        this.contentHistory = [];
        if (this.contentArea.firstChild) {
            this.contentArea.removeChild(this.contentArea.firstChild);
        }
        if (this.dom.contains(this.navigationArea)) {
            this.dom.removeChild(this.navigationArea);
        }
    }

    /**
     * replace the current view
     * 
     * the current view will be removed
     * @param v 
     */
     replaceContentRoot(v:View) {
        console.info("replaceContentRoot");
        this._setContent(v, 'root');
    }


    /**
     * replace the current view
     * 
     * the current view will be removed
     * @param v 
     */
    replaceCurrentContent(v:View) {
        console.info("replaceCurrentContent");
        this._setContent(v, 'leaf');
    }
    /**
     * appends and show the view. the current view will be shown if go back is called
     * @param v 
     */
    appendContent(v:View) {        
        const replace = (this.currentView && v.constructor.name === this.currentView.constructor.name) ? 'leaf' : 'no';        
        console.info(`appendContent replace=${replace}`, v?.constructor?.name, this.currentView?.constructor?.name, this.currentView);
        this._setContent(v, replace);
    }

    private _setContent(view:View, replace:'no'|'leaf'|'root'):void {
        console.info(`setContent replace=${replace}`);

        const dom = view.getDom();
        dom.id='view_'+this.counter;
        this.counter++;

        if (replace === 'leaf') {
            const size = this.contentHistory.length;
            if (size>0) {
                this.contentHistory[size-1] = view;
            } else {
                this.contentHistory.push(view);    
            }
            if (this.currentView && this.currentView.onRemove) {
                this.currentView.onRemove();
            }
        } else if (replace === 'root') {
            this.clear();
            this.contentHistory.push(view); 
        } else {
            this.contentHistory.push(view);
        }

        if (this.contentArea.firstChild) {
            // console.info(`setContent ${this.contentArea.firstChild['id']} => ${dom.id}`);
            this.contentArea.replaceChild(dom, this.contentArea.firstChild);            
        } else {
            // console.info(`setContent none => ${dom.id} (addNavArea)`)
            this.dom.insertBefore(this.navigationArea, this.contentArea);
            this.contentArea.appendChild(dom);            
        }

        if (view.onAdd) {            
            view.onAdd(this);
        }        
        this.currentView = view;


        // console.info(`setContent done ${this.contentHistory.length}`, this.contentHistory);
        if (this.contentHistory.length===1) {
            // this.anchorBack.classList.replace('back', 'close');
            this.anchorBack.className = 'close';
            this.anchorBack.title = "schließen";

            this.anchorBack.innerHTML = "";
            console.info("this.anchorBack.innerHTML="+this.anchorBack.innerHTML);
        } else {
            // this.anchorBack.classList.replace('close', 'back');
            this.anchorBack.className = 'back';
            this.anchorBack.title = "zurück";
            // this.anchorBack.innerHTML = "<span>zurück</span>";
        }
        MenuControl.DISPATCHER.onViewItemChange.dispatch(this, {view:view, type:'added'});
    }

    goBack():void {
        console.info(`goBack ${this.contentHistory.length}`, this.contentHistory);
        if (this.contentArea.firstChild) {
            const currentContent = this.contentHistory.pop();            
            if (currentContent) {
                if (this.contentHistory.length>0) {
                    const lastContent = this.currentView = this.contentHistory[this.contentHistory.length-1];
                    // console.info(`goBack ${currentContent.getDom()['id']} => ${lastContent.getDom()['id']}`, currentContent, lastContent);
                    this.contentArea.replaceChild(lastContent.getDom(), this.contentArea.firstChild);
                }
                else {
                    // console.info(`goBack ${currentContent['id']} => none removeNavArea`);
                    this.contentArea.removeChild(currentContent.getDom());     
                    if (this.home) {
                        this.contentArea.appendChild(this.home.getDom());
                    } else {
                        // console.info('remove navArea');
                        this.dom.removeChild(this.navigationArea);
                    }
                }
                if (currentContent.onRemove) {
                    currentContent.onRemove();
                }
                MenuControl.DISPATCHER.onViewItemChange.dispatch(this, {view:currentContent, type:'removed'});
            }
        }


        if (this.contentHistory.length === 0) {
            this.anchorBack.className = '';
        } else if (this.contentHistory.length === 1) {
            this.anchorBack.className = 'close';
            this.anchorBack.innerHTML = '';
        } else {
            this.anchorBack.className = 'back';
        }
        console.info(`goBack done ${this.contentHistory.length}`, this.contentHistory);
    } 
 
    // addLegend(dom: HTMLElement) {
    //     console.error('addLegend', dom)
    //     this.dom.parentElement.appendChild(dom);
    // }

}
