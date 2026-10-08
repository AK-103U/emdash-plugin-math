/**
 * Client-side behaviour for emdash-plugin-math.
 *
 * Exported as a source string rather than shipped as a module, because the
 * `page:fragments` hook injects it inline. One script serves the whole page;
 * both features use event delegation, so they work for formulas that exist at
 * load time and for any inserted later.
 *
 * The script is deliberately dependency-free and defensive: it runs on every
 * public page of a site that may have no formulas at all.
 */

import { MATH_CONFIG_GLOBAL } from "./index.js";

/**
 * Build the inline script for a given config global name.
 *
 * Kept as a function so the global name has exactly one definition, in
 * `src/index.ts`, shared by the hook that writes it and this script that
 * reads it.
 */
export function buildClientScript(globalName: string = MATH_CONFIG_GLOBAL): string {
	return `(function(){
var CFG=window.${globalName}||{};
if(CFG.copyable===false&&CFG.copyButton===false)return;

/* --- Copy: rewrite the clipboard when the selection is inside a formula --- */

if(CFG.copyable!==false){
document.addEventListener("copy",function(e){
  var sel=window.getSelection();
  if(!sel||sel.rangeCount===0)return;
  var n=sel.getRangeAt(0).commonAncestorContainer;
  if(n.nodeType===3)n=n.parentNode;
  if(!n||!n.closest)return;
  var m=n.closest("[data-latex]");
  if(!m)return;                       /* not a formula: leave the copy alone */
  var latex=m.getAttribute("data-latex");
  if(!latex)return;
  if(CFG.delimiters){
    var display=m.classList.contains("emdash-math");
    latex=display?"$$"+latex+"$$":"$"+latex+"$";
  }
  e.clipboardData.setData("text/plain",latex);
  e.preventDefault();
});
}

/* --- Copy button --- */

if(CFG.copyButton!==false){
var LABEL="Copy",DONE="Copied";

function attach(root){
  var els=(root||document).querySelectorAll("[data-latex]");
  for(var i=0;i<els.length;i++){
    var el=els[i];
    if(el.querySelector(".emdash-math__copy"))continue;
    if(el.getAttribute("data-math-error")==="1")continue;
    el.appendChild(makeButton(el));
  }
}

function makeButton(el){
  var b=document.createElement("button");
  b.type="button";
  b.className="emdash-math__copy";
  b.textContent=LABEL;
  b.setAttribute("aria-label","Copy LaTeX source");
  b.addEventListener("click",function(){
    var latex=el.getAttribute("data-latex")||"";
    if(CFG.delimiters)latex="$$"+latex+"$$";
    var done=function(){
      b.textContent=DONE;
      b.setAttribute("data-done","1");
      setTimeout(function(){
        b.textContent=LABEL;
        b.removeAttribute("data-done");
      },1600);
    };
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(latex).then(done,function(){});
    }
  });
  return b;
}

if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded",function(){attach(document);});
}else{
  attach(document);
}
}

/* --- Keyboard access --- */

/* A formula is not focusable, so the copy button is the only tab stop.
   Nothing extra is needed: it is a real <button> in the tab order. */
})();`;
}
