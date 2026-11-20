const buttons=[...document.querySelectorAll("[data-view]")];function show(id){document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===id));buttons.forEach(b=>b.classList.toggle("selected",b.dataset.view===id));document.getElementById("page").textContent=id.toUpperCase()}buttons.forEach(b=>b.addEventListener("click",()=>show(b.dataset.view)));const messages=document.getElementById("messages");document.getElementById("chat-form").addEventListener("submit",e=>{e.preventDefault();const field=document.getElementById("prompt"),value=field.value.trim();if(!value)return;const user=document.createElement("p");user.textContent="You: "+value;user.className="message";messages.append(user);const reply=document.createElement("article");reply.className="message";const title=document.createElement("b");title.textContent="BROKENGPT · DEMO";const text=document.createElement("p");text.textContent="Thanks for testing BROKENGPT! This is a local sample response. Connect an AI provider through a secure backend to enable real AI replies.";reply.append(title,text);messages.append(reply);const hist=readList("brokengpt-history");hist.push({title:value.slice(0,48),preview:"You: "+value+"\\nBROKENGPT: Local demo response",time:new Date().toISOString()});writeList("brokengpt-history",hist);renderHistory();field.value=""});document.getElementById("new-chat").addEventListener("click",()=>{messages.replaceChildren();show("chat")});document.getElementById("browser-form").addEventListener("submit",e=>{e.preventDefault();const q=document.getElementById("address").value.trim();if(!q)return;const url=/^https?:\/\//i.test(q)?q:/^[\w-]+\.[a-z]{2,}/i.test(q)?"https://"+q:"https://www.google.com/search?q="+encodeURIComponent(q);window.open(url,"_blank","noopener,noreferrer")});
const languages=window.BROKENGPT_LANGUAGES||{};const languageSelect=document.getElementById("language-select");const savedLanguage=localStorage.getItem("brokengpt-language")||"en";
Object.entries(languages).forEach(([code,item])=>{const opt=document.createElement("option");opt.value=code;opt.textContent=item.name;languageSelect.append(opt)});
function applyLanguage(code){const lang=languages[code]||languages.en;document.documentElement.lang=code;document.documentElement.dir=lang.dir||"ltr";document.querySelector('[data-view="chat"]').textContent="◈ "+(lang.chat||"Chat");document.querySelector('[data-view="battle"]').textContent="⚔ "+(lang.battle||"AI Battle");document.querySelector('[data-view="browser"]').textContent="◎ "+(lang.browser||"Browser");document.querySelector('[data-view="studio"]').textContent="▧ "+(lang.studio||"Creative Studio");document.querySelector('[data-view="cyber"]').textContent="⌘ "+(lang.cyber||"Cyber Lab");document.querySelector('[data-view="settings"]').textContent="⚙ "+(lang.settings||"Settings");document.getElementById("new-chat").textContent="＋ "+(lang.newChat||"New chat");["home","notes","prompts","academy","toolbox","favorites","history"].forEach(id=>{const nav=document.querySelector(`[data-view="${id}"]`);if(nav&&lang[id])nav.textContent=({home:"⌂ ",notes:"▤ ",prompts:"✦ ",academy:"▣ ",toolbox:"⌘ ",favorites:"★ ",history:"◷ "}[id])+lang[id]});document.querySelector("#chat .hero h1").innerHTML=(lang.welcome||"I can help with")+" <em>"+(lang.anything||"anything.")+"</em>";document.getElementById("prompt").placeholder=lang.message||"Message BROKENGPT...";document.querySelector("#settings h1").innerHTML=(lang.account||"Account")+" <em>"+(lang.settings||"Settings")+"</em>";document.getElementById("language-status").textContent=lang.languageSaved||"Interface language selected. AI reply language can be configured after provider connection.";localStorage.setItem("brokengpt-language",code)}
languageSelect.value=savedLanguage in languages?savedLanguage:"en";applyLanguage(languageSelect.value);languageSelect.addEventListener("change",()=>applyLanguage(languageSelect.value));
const defaults={personality:"🤖 BROKENGPT Default",responseLength:"Balanced",explanationLevel:"Adaptive",emojis:false,combine:false,secondary:"😂 Funny",bg:"#080808",fg:"#f5f5f5",accent:"#df2028",bubble:"#121212",font:"system-ui",rgb:false,rgbSpeed:"4s",rainbowText:false,rgbGlow:false,customName:"",customDescription:""};let prefs={...defaults};try{prefs={...defaults,...JSON.parse(localStorage.getItem("brokengpt-prefs")||"{}")}}catch{}
const el=id=>document.getElementById(id);function applyPrefs(){document.documentElement.style.setProperty("--bg",prefs.bg);document.documentElement.style.setProperty("--red",prefs.accent);document.documentElement.style.setProperty("--panel",prefs.bubble);document.body.style.color=prefs.fg;document.body.style.fontFamily=prefs.font+",sans-serif";document.body.classList.toggle("rgb-on",prefs.rgb);document.body.classList.toggle("rgb-glow",prefs.rgbGlow);document.body.style.setProperty("--rgb-speed",prefs.rgbSpeed);el("personality").value=prefs.personality;el("response-length").value=prefs.responseLength;el("explanation-level").value=prefs.explanationLevel;el("use-emojis").checked=prefs.emojis;el("combine-personalities").checked=prefs.combine;el("secondary-personality").value=prefs.secondary;el("background-color").value=prefs.bg;el("text-color").value=prefs.fg;el("accent-color").value=prefs.accent;el("bubble-color").value=prefs.bubble;el("font-choice").value=prefs.font;el("rainbow-enabled").checked=prefs.rgb;el("rainbow-speed").value=prefs.rgbSpeed;el("rainbow-text").checked=prefs.rainbowText;el("rainbow-glow").checked=prefs.rgbGlow;el("custom-name").value=prefs.customName;el("custom-description").value=prefs.customDescription;el("custom-personality").classList.toggle("hidden",prefs.personality!=="custom");el("combine-area").classList.toggle("hidden",!prefs.combine)}
function readPrefs(){prefs={...prefs,personality:el("personality").value,responseLength:el("response-length").value,explanationLevel:el("explanation-level").value,emojis:el("use-emojis").checked,combine:el("combine-personalities").checked,secondary:el("secondary-personality").value,bg:el("background-color").value,fg:el("text-color").value,accent:el("accent-color").value,bubble:el("bubble-color").value,font:el("font-choice").value,rgb:el("rainbow-enabled").checked,rgbSpeed:el("rainbow-speed").value,rainbowText:el("rainbow-text").checked,rgbGlow:el("rainbow-glow").checked,customName:el("custom-name").value,customDescription:el("custom-description").value};applyPrefs()}
["personality","response-length","explanation-level","use-emojis","combine-personalities","secondary-personality","background-color","text-color","accent-color","bubble-color","font-choice","rainbow-enabled","rainbow-speed","rainbow-text","rainbow-glow","custom-name","custom-description"].forEach(id=>el(id).addEventListener("input",readPrefs));
el("personality").addEventListener("change",()=>{el("custom-personality").classList.toggle("hidden",el("personality").value!=="custom");readPrefs()});el("combine-personalities").addEventListener("change",()=>{el("combine-area").classList.toggle("hidden",!el("combine-personalities").checked);readPrefs()});
el("save-personality").addEventListener("click",()=>{readPrefs();localStorage.setItem("brokengpt-prefs",JSON.stringify(prefs));el("settings-status").textContent="Personality preferences saved on this device."});
document.querySelectorAll("[data-theme]").forEach(b=>b.addEventListener("click",()=>{const t={blood:["#080808","#f5f5f5","#df2028","#121212",false],midnight:["#15152a","#f5f2ff","#a78bfa","#201f38",false],light:["#f2f2f2","#171717","#2563eb","#fff",false],forest:["#10251b","#effaf2","#65d99b","#183528",false],rainbow:["#080808","#fff","#ed3b9d","#15121b",true]}[b.dataset.theme];[prefs.bg,prefs.fg,prefs.accent,prefs.bubble,prefs.rgb]=t;applyPrefs();el("settings-status").textContent="Theme preview selected. Save appearance to keep it."}));
el("save-appearance").addEventListener("click",()=>{readPrefs();localStorage.setItem("brokengpt-prefs",JSON.stringify(prefs));el("settings-status").textContent="Appearance saved on this device."});
el("reset-settings").addEventListener("click",()=>{prefs={...defaults};applyPrefs();localStorage.removeItem("brokengpt-prefs");el("settings-status").textContent="Settings reset to BROKENGPT defaults."});

/* Stage 3: navigation, modes, notes, prompts, local history and utilities */
const modeInfo={
Balanced:"Balanced everyday assistance.",
Turbo:"A concise, fast-response style. It does not make the model run faster.",
Genius:"A careful, structured reasoning style. It does not unlock a different model.",
Study:"A patient tutor style with examples and learning checks.",
Developer:"Programming explanations, debugging structure, and code-focused help.",
"Cyber Defense":"Defensive cybersecurity learning for systems you own or are allowed to test.",
Creative:"Brainstorming, storytelling, and imaginative design.",
Detective:"Investigate clues, separate facts from assumptions, and explain uncertainty.",
Master:"A confident, direct, command-center style."
};
const modeSelect=document.getElementById("mode-select"),modeDescription=document.getElementById("mode-description");
function setMode(mode){if(!modeInfo[mode])return;modeSelect.value=mode;modeDescription.textContent=modeInfo[mode];localStorage.setItem("brokengpt-mode",mode);document.querySelectorAll("[data-mode]").forEach(b=>b.classList.toggle("active",b.dataset.mode===mode))}
setMode(localStorage.getItem("brokengpt-mode")||"Balanced");
modeSelect.addEventListener("change",()=>setMode(modeSelect.value));
document.querySelectorAll("[data-mode]").forEach(b=>b.addEventListener("click",()=>{setMode(b.dataset.mode);show("chat")}));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>show(b.dataset.go)));
function readList(key){try{return JSON.parse(localStorage.getItem(key)||"[]")}catch{return[]}}
function writeList(key,list){localStorage.setItem(key,JSON.stringify(list))}
function safeText(tag,value,className){const node=document.createElement(tag);node.textContent=value||"";if(className)node.className=className;return node}
function renderSaved(key,targetId,kind){const target=document.getElementById(targetId);if(!target)return;target.replaceChildren();const items=readList(key);if(!items.length){target.append(safeText("p","Nothing saved here yet.","status"));return}items.slice().reverse().forEach((item,index)=>{const card=document.createElement("article");card.className="saved-item";card.append(safeText("h3",item.title||"Untitled"));card.append(safeText("p",item.body||""));const actions=document.createElement("div");const copy=document.createElement("button");copy.textContent="Copy";copy.addEventListener("click",()=>navigator.clipboard?.writeText(item.body||""));actions.append(copy);if(kind==="prompt"){const use=document.createElement("button");use.textContent="Use in chat";use.addEventListener("click",()=>{document.getElementById("prompt").value=item.body||"";show("chat")});actions.append(use);const fav=document.createElement("button");fav.textContent="☆ Favorite";fav.addEventListener("click",()=>{const favs=readList("brokengpt-favorites");if(!favs.some(x=>x.title===item.title&&x.body===item.body)){favs.push(item);writeList("brokengpt-favorites",favs);renderSaved("brokengpt-favorites","favorites-list","favorite")}});actions.append(fav)}const del=document.createElement("button");del.textContent="Delete";del.addEventListener("click",()=>{const current=readList(key);current.splice(current.length-1-index,1);writeList(key,current);renderSaved(key,targetId,kind)});actions.append(del);card.append(actions);target.append(card)})}
document.getElementById("save-note").addEventListener("click",()=>{const title=document.getElementById("note-title").value.trim(),body=document.getElementById("note-body").value.trim();if(!title&&!body)return;const list=readList("brokengpt-notes");list.push({title:title||"Untitled note",body});writeList("brokengpt-notes",list);document.getElementById("note-title").value="";document.getElementById("note-body").value="";renderSaved("brokengpt-notes","notes-list","note")});
document.getElementById("save-prompt").addEventListener("click",()=>{const title=document.getElementById("prompt-title").value.trim(),body=document.getElementById("prompt-template").value.trim();if(!title||!body)return;const list=readList("brokengpt-prompts");list.push({title,body});writeList("brokengpt-prompts",list);document.getElementById("prompt-title").value="";document.getElementById("prompt-template").value="";renderSaved("brokengpt-prompts","prompts-list","prompt")});
renderSaved("brokengpt-notes","notes-list","note");renderSaved("brokengpt-prompts","prompts-list","prompt");renderSaved("brokengpt-favorites","favorites-list","favorite");
const wordInput=document.getElementById("word-input");wordInput.addEventListener("input",()=>{const value=wordInput.value.trim();document.getElementById("word-count").textContent=(value?value.split(/\\s+/).length:0)+" words · "+wordInput.value.length+" characters"});
function renderHistory(){const target=document.getElementById("history-list");target.replaceChildren();const items=readList("brokengpt-history");if(!items.length){target.append(safeText("p","No saved conversations yet.","status"));return}items.slice().reverse().forEach(item=>{const card=document.createElement("article");card.className="saved-item";card.append(safeText("h3",item.title));card.append(safeText("p",item.preview));target.append(card)})}
document.getElementById("export-chats").addEventListener("click",()=>{const blob=new Blob([JSON.stringify(readList("brokengpt-history"),null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="brokengpt-chat-history.json";a.click();URL.revokeObjectURL(url)});
document.getElementById("clear-history").addEventListener("click",()=>{if(confirm("Clear locally saved chat history?")){writeList("brokengpt-history",[]);renderHistory()}});
renderHistory();

/* RGB Color Effects Studio controls and live preview */
const rgbIds=["rgb-mode","rgb-transition","rgb-speed-range","rgb-color-a","rgb-color-b","rgb-color-c","rgb-color-d","rgb-color-e","rgb-target-background","rgb-target-text","rgb-target-borders","rgb-target-bubbles","rgb-target-buttons"];
const rgbDefaults={rgbMode:"rainbow",rgbTransition:"smooth",rgbSpeedSeconds:8,rgbColors:["#080808","#df2028","#7b1020","#ff5259","#400814"],rgbTargets:{background:true,text:false,borders:true,bubbles:true,buttons:false}};
prefs={...rgbDefaults,...prefs,rgbColors:Array.isArray(prefs.rgbColors)?prefs.rgbColors:rgbDefaults.rgbColors,rgbTargets:{...rgbDefaults.rgbTargets,...(prefs.rgbTargets||{})}};
let rgbRandomTimer=null;
function rgbSetValue(id,value){const node=el(id);if(node)node.value=value}
function rgbReadControls(){
  prefs.rgbMode=el("rgb-mode").value;
  prefs.rgbTransition=el("rgb-transition").value;
  prefs.rgbSpeedSeconds=Number(el("rgb-speed-range").value);
  prefs.rgbColors=["a","b","c","d","e"].map((key)=>el("rgb-color-"+key).value);
  prefs.rgbTargets={background:el("rgb-target-background").checked,text:el("rgb-target-text").checked,borders:el("rgb-target-borders").checked,bubbles:el("rgb-target-bubbles").checked,buttons:el("rgb-target-buttons").checked};
  el("rgb-speed-label").textContent=prefs.rgbSpeedSeconds+" seconds";
}
function rgbPalette(){
  if(prefs.rgbMode==="rainbow")return ["#ff0000","#ff8c00","#ffee00","#18d45a","#00cfff","#3155ff","#a735e8","#ff0000"];
  if(prefs.rgbMode==="two")return prefs.rgbColors.slice(0,2);
  if(prefs.rgbMode==="multi")return prefs.rgbColors;
  return Array.from({length:5},()=>"#"+Math.floor(Math.random()*16777215).toString(16).padStart(6,"0"));
}
function applyRGBStudio(){
  if(rgbRandomTimer){clearInterval(rgbRandomTimer);rgbRandomTimer=null}
  document.body.classList.remove("rgb-on","rgb-glow","rgb-bg-active","rgb-text-active","rgb-border-active","rgb-bubble-active","rgb-buttons-active","rgb-direct-switch");
  const enabled=el("rainbow-enabled").checked;
  if(!enabled){document.body.style.removeProperty("--rgb-gradient");return}
  const targets=prefs.rgbTargets||rgbDefaults.rgbTargets;
  const applyTarget=(key,cls)=>document.body.classList.toggle(cls,!!targets[key]);
  applyTarget("background","rgb-bg-active");applyTarget("text","rgb-text-active");applyTarget("borders","rgb-border-active");applyTarget("bubbles","rgb-bubble-active");applyTarget("buttons","rgb-buttons-active");
  document.body.classList.toggle("rgb-direct-switch",prefs.rgbTransition==="switch");
  document.body.style.setProperty("--rgb-easing",prefs.rgbTransition==="switch"?"steps(1,end)":prefs.rgbTransition==="flow"?"linear":"ease-in-out");
  document.body.style.setProperty("--rgb-duration",Math.max(.5,Number(prefs.rgbSpeedSeconds)||8)+"s");
  const updateGradient=()=>{const colors=rgbPalette();document.body.style.setProperty("--rgb-gradient","linear-gradient(110deg,"+colors.join(",")+")");document.body.style.setProperty("--rgb-color-a",colors[0]);document.body.style.setProperty("--rgb-color-b",colors[1]||colors[0])};
  updateGradient();
  if(prefs.rgbMode==="random")rgbRandomTimer=setInterval(updateGradient,Math.max(500,Number(prefs.rgbSpeedSeconds)*1000));
}
function loadRGBStudio(){
  rgbSetValue("rgb-mode",prefs.rgbMode);rgbSetValue("rgb-transition",prefs.rgbTransition);rgbSetValue("rgb-speed-range",prefs.rgbSpeedSeconds);
  ["a","b","c","d","e"].forEach((key,index)=>rgbSetValue("rgb-color-"+key,prefs.rgbColors[index]));
  Object.entries(prefs.rgbTargets).forEach(([key,value])=>{const node=el("rgb-target-"+key);if(node)node.checked=!!value});
  el("rainbow-enabled").checked=!!prefs.rgb;
  rgbReadControls();applyRGBStudio();
}
rgbIds.forEach(id=>el(id).addEventListener("input",()=>{rgbReadControls();applyRGBStudio()}));
el("rainbow-enabled").addEventListener("change",()=>{prefs.rgb=el("rainbow-enabled").checked;applyRGBStudio()});
loadRGBStudio();

/* Keep RGB preview in sync with theme, save, and reset actions */
document.querySelectorAll("[data-theme]").forEach(button=>button.addEventListener("click",()=>{el("rainbow-enabled").checked=!!prefs.rgb;applyRGBStudio()}));
el("save-appearance").addEventListener("click",()=>{rgbReadControls();prefs.rgb=el("rainbow-enabled").checked;localStorage.setItem("brokengpt-prefs",JSON.stringify(prefs));applyRGBStudio()});
el("reset-settings").addEventListener("click",()=>{prefs={...defaults,...rgbDefaults};loadRGBStudio();applyRGBStudio()});
