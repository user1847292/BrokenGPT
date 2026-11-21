const buttons=[...document.querySelectorAll("[data-view]")];function show(id){document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===id));buttons.forEach(b=>b.classList.toggle("selected",b.dataset.view===id));document.getElementById("page").textContent=id==="chat"?"CHAT":id.toUpperCase();closeDrawer()}buttons.forEach(b=>b.addEventListener("click",()=>show(b.dataset.view)));const drawer=document.getElementById("app-drawer"),drawerToggle=document.getElementById("drawer-toggle"),drawerBackdrop=document.getElementById("drawer-backdrop");function closeDrawer(){drawer?.classList.remove("drawer-open");drawerBackdrop?.classList.remove("visible");drawerToggle?.setAttribute("aria-expanded","false")}drawerToggle?.addEventListener("click",()=>{const open=!drawer.classList.contains("drawer-open");drawerToggle.setAttribute("aria-expanded",String(open));if(open){drawerBackdrop.classList.add("visible");requestAnimationFrame(()=>drawer.classList.add("drawer-open"));}else{drawer.classList.remove("drawer-open");drawerBackdrop.classList.remove("visible");}});drawerBackdrop?.addEventListener("click",closeDrawer);
const modelToggle=document.getElementById("model-menu-toggle"),chatView=document.getElementById("chat"),providerSelect=document.getElementById("active-provider"),modelInput=document.getElementById("active-model");
// BrokenGPT is the default assistant profile. The provider/model underneath is configurable.
const savedAISelection=(()=>{try{return JSON.parse(localStorage.getItem("brokengpt-ai-selection")||"{}")}catch{return{}}})();
if(providerSelect&&savedAISelection.provider&&[...providerSelect.options].some(o=>o.value===savedAISelection.provider))providerSelect.value=savedAISelection.provider;
if(modelInput&&typeof savedAISelection.model==="string"&&savedAISelection.model.trim())modelInput.value=savedAISelection.model;
function saveAISelection(){localStorage.setItem("brokengpt-ai-selection",JSON.stringify({provider:providerSelect?.value||"openai",model:modelInput?.value?.trim()||"gpt-4o-mini"}));}
function refreshModelLabel(){if(!modelToggle||!modelInput)return;const provider=providerSelect?.value||"openai",model=modelInput.value.trim()||"Choose model";const raw=provider==="openai"&&model==="gpt-4o-mini"?"BrokenGPT":model;const compact=raw.length>22?raw.slice(0,19)+"…":raw;modelToggle.textContent=compact+" ";const chevron=document.createElement("span");chevron.setAttribute("aria-hidden","true");chevron.textContent="⌄";modelToggle.append(chevron);}
modelInput?.addEventListener("change",saveAISelection);providerSelect?.addEventListener("change",saveAISelection);
modelToggle?.addEventListener("click",()=>{const open=!chatView.classList.contains("model-menu-open");chatView.classList.toggle("model-menu-open",open);modelToggle.setAttribute("aria-expanded",String(open));});
document.addEventListener("click",event=>{if(!event.target.closest("#model-menu-toggle")&&!event.target.closest("#model-settings-panel")){chatView?.classList.remove("model-menu-open");modelToggle?.setAttribute("aria-expanded","false");}});
modelInput?.addEventListener("input",refreshModelLabel);providerSelect?.addEventListener("change",refreshModelLabel);refreshModelLabel();
let gestureStart=null;
document.addEventListener("touchstart",event=>{const t=event.changedTouches?.[0];if(t)gestureStart={x:t.clientX,y:t.clientY};},{passive:true});
document.addEventListener("touchend",event=>{const t=event.changedTouches?.[0];if(!t||!gestureStart)return;const dx=t.clientX-gestureStart.x,dy=t.clientY-gestureStart.y;gestureStart=null;if(Math.abs(dx)<65||Math.abs(dx)<Math.abs(dy)*1.3)return;if(dx<0&&!drawer?.classList.contains("drawer-open")){drawer?.classList.add("drawer-open");drawerBackdrop?.classList.add("visible");drawerToggle?.setAttribute("aria-expanded","true");}else if(dx>0&&drawer?.classList.contains("drawer-open"))closeDrawer();},{passive:true});
show("chat");const messages=document.getElementById("messages"),promptField=document.getElementById("prompt"),sendControl=document.getElementById("send-message"),micControl=document.getElementById("voice-input");let voiceConversationActive=false,voiceMicMuted=false;function refreshComposerControl(){const busy=!!activeRequestController,voiceOn=voiceConversationActive,hasText=!!promptField.value.trim(),stopping=busy||(!hasText&&voiceOn);sendControl.textContent=stopping?"■":hasText?"↑":"〽";sendControl.setAttribute("aria-label":busy?"Stop generating":!hasText&&voiceOn?"End voice conversation":hasText?"Send message":"Start voice conversation");sendControl.title=busy?"Stop generating":!hasText&&voiceOn?"End voice conversation":hasText?"Send message":"Start voice conversation";sendControl.classList.toggle("voice-mode-button",!stopping&&!hasText);sendControl.classList.toggle("stop-mode-button",stopping);sendControl.disabled=false;micControl.textContent=voiceOn?(voiceMicMuted?"◌":"◉"):"◉";micControl.setAttribute("aria-label",voiceOn?(voiceMicMuted?"Unmute microphone":"Mute microphone"):"Voice input");micControl.title=voiceOn?(voiceMicMuted?"Unmute yourself":"Mute yourself"):"Voice input";micControl.classList.toggle("mic-muted",voiceOn&&voiceMicMuted);}promptField.addEventListener("input",refreshComposerControl);document.getElementById("chat-form").addEventListener("submit",e=>{e.preventDefault();if(activeRequestController){activeRequestCancelled=true;activeRequestController.abort();return;}const value=promptField.value.trim();if(!value){if(voiceConversationActive)stopVoiceConversation();else startVoiceConversation();return;}promptField.value="";refreshComposerControl();sendChatMessage(value)});document.getElementById("new-chat").addEventListener("click",()=>{messages.replaceChildren();liveConversation=[];show("chat")});const browserMode=document.getElementById("browser-open-mode"),browserFrame=document.getElementById("builtin-browser-frame"),browserStatus=document.getElementById("browser-status");browserMode.value=localStorage.getItem("brokengpt-browser-open-mode")||"builtin";let currentBrowserUrl="";browserMode.addEventListener("change",()=>{localStorage.setItem("brokengpt-browser-open-mode",browserMode.value);browserStatus.textContent=browserMode.value==="builtin"?"Built-in browser selected. Some websites block embedded display; you can open the page externally.":"External browser selected. Links will open outside BrokenGPT.";});function normalizeBrowserAddress(q){return /^https?:\/\//i.test(q)?q:/^[\w-]+\.[a-z]{2,}(?:[/:?#]|$)/i.test(q)?"https://"+q:"https://www.google.com/search?q="+encodeURIComponent(q)}function openBrowserUrl(url,forceExternal=false){currentBrowserUrl=url;activityStart("Browser navigation");activityStep("Opening "+(url.includes("google.com/search?q=")?"Google search results":"the requested website"));if(forceExternal||browserMode.value==="external"){window.open(url,"_blank","noopener,noreferrer");browserStatus.textContent="Requested page opened in your external browser. BrokenGPT does not read its contents or search-result list.";activityFinish("Opened externally.");}else{browserFrame.classList.add("loaded");browserFrame.src=url;browserStatus.textContent="Loading inside BrokenGPT. If the website refuses embedded browsing, tap Open current page externally.";activityFinish("Page opened in BrokenGPT built-in browser.");}}document.getElementById("browser-form").addEventListener("submit",e=>{e.preventDefault();const q=document.getElementById("address").value.trim();if(!q)return;openBrowserUrl(normalizeBrowserAddress(q));});document.getElementById("browser-open-external").addEventListener("click",()=>{if(currentBrowserUrl)openBrowserUrl(currentBrowserUrl,true);else browserStatus.textContent="Enter and open a website first.";});document.getElementById("browser-clear").addEventListener("click",()=>{browserFrame.removeAttribute("src");browserFrame.classList.remove("loaded");currentBrowserUrl="";browserStatus.textContent="Page cleared.";});
const languages=window.BROKENGPT_LANGUAGES||{};const languageSelect=document.getElementById("language-select");const savedLanguage=localStorage.getItem("brokengpt-language")||"en";
Object.entries(languages).forEach(([code,item])=>{const opt=document.createElement("option");opt.value=code;opt.textContent=item.name;languageSelect.append(opt)});
function applyLanguage(code){const lang=languages[code]||languages.en;document.documentElement.lang=code;document.documentElement.dir=lang.dir||"ltr";document.querySelector('[data-view="chat"]').textContent="◈ "+(lang.chat||"Chat");document.querySelector('[data-view="battle"]').textContent=" "+(lang.battle||"AI Battle");document.querySelector('[data-view="browser"]').textContent="◎ "+(lang.browser||"Browser");document.querySelector('[data-view="studio"]').textContent="▧ "+(lang.studio||"Creative Studio");document.querySelector('[data-view="cyber"]').textContent="⌘ "+(lang.cyber||"Cyber Lab");document.querySelector('[data-view="settings"]').textContent=" "+(lang.settings||"Settings");document.getElementById("new-chat").textContent="＋ "+(lang.newChat||"New chat");["home","notes","prompts","academy","toolbox","favorites","history"].forEach(id=>{const nav=document.querySelector(`[data-view="${id}"]`);if(nav&&lang[id])nav.textContent=({home:"⌂ ",notes:"▤ ",prompts:" ",academy:"▣ ",toolbox:"⌘ ",favorites:" ",history:"◷ "}[id])+lang[id]});document.querySelector("#chat .hero h1").innerHTML=(lang.welcome||"I can help with")+" <em>"+(lang.anything||"anything.")+"</em>";document.getElementById("prompt").placeholder=lang.message||"Message BrokenGPT...";document.querySelector("#settings h1").innerHTML=(lang.account||"Account")+" <em>"+(lang.settings||"Settings")+"</em>";document.getElementById("language-status").textContent=lang.languageSaved||"Interface language selected. AI reply language can be configured after provider connection.";localStorage.setItem("brokengpt-language",code)}
languageSelect.value=savedLanguage in languages?savedLanguage:"en";applyLanguage(languageSelect.value);languageSelect.addEventListener("change",()=>applyLanguage(languageSelect.value));
const defaults={personality:" BrokenGPT Default",responseLength:"Balanced",explanationLevel:"Adaptive",emojis:false,combine:false,secondary:" Funny",bg:"#050505",fg:"#f2f2f2",accent:"#ff1238",bubble:"#111111",font:"system-ui",rgb:false,rgbSpeed:"4s",rainbowText:false,rgbGlow:false,customName:"",customDescription:"",welcomeY:0,welcomeSize:32};let prefs={...defaults};try{const saved=JSON.parse(localStorage.getItem("brokengpt-prefs")||"{}");if(saved.bg==="#080808"&&saved.fg==="#f5f5f5"&&saved.accent==="#df2028")saved.fg="#ff3038";const migrated={...saved};if(["#b00020","#a51427","#d21b3c","#df2028"].includes(migrated.accent))migrated.accent="#ff1238";if(["#ff3038","#d21b3c"].includes(migrated.fg))migrated.fg="#f2f2f2";if(migrated.bg==="#080808")migrated.bg="#050505";prefs={...defaults,...migrated}}catch{}
const el=id=>document.getElementById(id);function applyPrefs(){document.documentElement.style.setProperty("--bg",prefs.bg);document.documentElement.style.setProperty("--red",prefs.accent);document.documentElement.style.setProperty("--text",prefs.fg);document.documentElement.style.setProperty("--panel",prefs.bubble);document.body.style.color=prefs.fg;document.body.style.fontFamily=prefs.font+",sans-serif";document.body.classList.toggle("rgb-on",prefs.rgb);document.body.classList.toggle("rgb-glow",prefs.rgbGlow);document.body.style.setProperty("--rgb-speed",prefs.rgbSpeed);el("personality").value=prefs.personality;el("response-length").value=prefs.responseLength;el("explanation-level").value=prefs.explanationLevel;el("use-emojis").checked=prefs.emojis;el("combine-personalities").checked=prefs.combine;el("secondary-personality").value=prefs.secondary;el("background-color").value=prefs.bg;el("text-color").value=prefs.fg;el("accent-color").value=prefs.accent;el("bubble-color").value=prefs.bubble;el("font-choice").value=prefs.font;el("rainbow-enabled").checked=prefs.rgb;el("rainbow-speed").value=prefs.rgbSpeed;el("rainbow-text").checked=prefs.rainbowText;el("rainbow-glow").checked=prefs.rgbGlow;el("custom-name").value=prefs.customName;el("custom-description").value=prefs.customDescription;el("welcome-position").value=String(Math.max(-15,Math.min(15,Number(prefs.welcomeY)||0)));el("welcome-size").value=String(Math.max(18,Math.min(44,Number(prefs.welcomeSize)||32)));const hero= document.querySelector("#chat .hero");if(hero){hero.style.setProperty("--welcome-y",(Number(el("welcome-position").value)||0)+"vh");hero.style.setProperty("--welcome-size",(Number(el("welcome-size").value)||32)+"px")}el("welcome-position-label").textContent=Number(el("welcome-position").value)===0?"Center":(Number(el("welcome-position").value)<0?"Up ":"Down ")+Math.abs(Number(el("welcome-position").value))+"%";el("welcome-size-label").textContent=el("welcome-size").value+" px";el("custom-personality").classList.toggle("hidden",prefs.personality!=="custom");el("combine-area").classList.toggle("hidden",!prefs.combine)}
function readPrefs(){prefs={...prefs,personality:el("personality").value,responseLength:el("response-length").value,explanationLevel:el("explanation-level").value,emojis:el("use-emojis").checked,combine:el("combine-personalities").checked,secondary:el("secondary-personality").value,bg:el("background-color").value,fg:el("text-color").value,accent:el("accent-color").value,bubble:el("bubble-color").value,font:el("font-choice").value,rgb:el("rainbow-enabled").checked,rgbSpeed:el("rainbow-speed").value,rainbowText:el("rainbow-text").checked,rgbGlow:el("rainbow-glow").checked,customName:el("custom-name").value,customDescription:el("custom-description").value,welcomeY:Number(el("welcome-position").value),welcomeSize:Number(el("welcome-size").value)};applyPrefs()}
["personality","response-length","explanation-level","use-emojis","combine-personalities","secondary-personality","background-color","text-color","accent-color","bubble-color","font-choice","rainbow-enabled","rainbow-speed","rainbow-text","rainbow-glow","custom-name","custom-description","welcome-position","welcome-size"].forEach(id=>el(id).addEventListener("input",readPrefs));
el("personality").addEventListener("change",()=>{el("custom-personality").classList.toggle("hidden",el("personality").value!=="custom");readPrefs()});el("combine-personalities").addEventListener("change",()=>{el("combine-area").classList.toggle("hidden",!el("combine-personalities").checked);readPrefs()});
el("save-personality").addEventListener("click",()=>{readPrefs();localStorage.setItem("brokengpt-prefs",JSON.stringify(prefs));el("settings-status").textContent="Personality preferences saved on this device."});
document.querySelectorAll("[data-theme]").forEach(b=>b.addEventListener("click",()=>{const t={blood:["#050505","#f2f2f2","#ff1238","#111111",false],midnight:["#15152a","#f5f2ff","#a78bfa","#201f38",false],light:["#f2f2f2","#171717","#2563eb","#fff",false],forest:["#10251b","#effaf2","#65d99b","#183528",false],rainbow:["#080808","#fff","#ed3b9d","#15121b",true]}[b.dataset.theme];[prefs.bg,prefs.fg,prefs.accent,prefs.bubble,prefs.rgb]=t;applyPrefs();el("settings-status").textContent="Theme preview selected. Save appearance to keep it."}));
el("save-appearance").addEventListener("click",()=>{readPrefs();localStorage.setItem("brokengpt-prefs",JSON.stringify(prefs));el("settings-status").textContent="Appearance saved on this device."});
el("reset-settings").addEventListener("click",()=>{prefs={...defaults};applyPrefs();localStorage.removeItem("brokengpt-prefs");el("settings-status").textContent="Settings reset to BrokenGPT defaults."});

/* Stage 3: navigation, modes, notes, prompts, local history and utilities */
const modeInfo={
BrokenGPT:"BrokenGPT is the default assistant identity used throughout this app.",
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
setMode(localStorage.getItem("brokengpt-mode")||"BrokenGPT");
modeSelect.addEventListener("change",()=>setMode(modeSelect.value));
document.querySelectorAll("[data-mode]").forEach(b=>b.addEventListener("click",()=>{setMode(b.dataset.mode);show(b.dataset.mode==="Study"?"study":"chat")}));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>show(b.dataset.go)));
function readList(key){try{return JSON.parse(localStorage.getItem(key)||"[]")}catch{return[]}}
function writeList(key,list){localStorage.setItem(key,JSON.stringify(list))}
function safeText(tag,value,className){const node=document.createElement(tag);node.textContent=value||"";if(className)node.className=className;return node}
function renderSaved(key,targetId,kind){const target=document.getElementById(targetId);if(!target)return;target.replaceChildren();const items=readList(key);if(!items.length){target.append(safeText("p","Nothing saved here yet.","status"));return}items.slice().reverse().forEach((item,index)=>{const card=document.createElement("article");card.className="saved-item";card.append(safeText("h3",item.title||"Untitled"));card.append(safeText("p",item.body||""));const actions=document.createElement("div");const copy=document.createElement("button");copy.textContent="Copy";copy.addEventListener("click",()=>navigator.clipboard?.writeText(item.body||""));actions.append(copy);if(kind==="prompt"){const use=document.createElement("button");use.textContent="Use in chat";use.addEventListener("click",()=>{document.getElementById("prompt").value=item.body||"";show("chat")});actions.append(use);const fav=document.createElement("button");fav.textContent=" Favorite";fav.addEventListener("click",()=>{const favs=readList("brokengpt-favorites");if(!favs.some(x=>x.title===item.title&&x.body===item.body)){favs.push(item);writeList("brokengpt-favorites",favs);renderSaved("brokengpt-favorites","favorites-list","favorite")}});actions.append(fav)}const del=document.createElement("button");del.textContent="Delete";del.addEventListener("click",()=>{const current=readList(key);current.splice(current.length-1-index,1);writeList(key,current);renderSaved(key,targetId,kind)});actions.append(del);card.append(actions);target.append(card)})}
document.getElementById("save-note").addEventListener("click",()=>{const title=document.getElementById("note-title").value.trim(),body=document.getElementById("note-body").value.trim();if(!title&&!body)return;const list=readList("brokengpt-notes");list.push({title:title||"Untitled note",body});writeList("brokengpt-notes",list);document.getElementById("note-title").value="";document.getElementById("note-body").value="";renderSaved("brokengpt-notes","notes-list","note")});
document.getElementById("save-prompt").addEventListener("click",()=>{const title=document.getElementById("prompt-title").value.trim(),body=document.getElementById("prompt-template").value.trim();if(!title||!body)return;const list=readList("brokengpt-prompts");list.push({title,body});writeList("brokengpt-prompts",list);document.getElementById("prompt-title").value="";document.getElementById("prompt-template").value="";renderSaved("brokengpt-prompts","prompts-list","prompt")});
renderSaved("brokengpt-notes","notes-list","note");renderSaved("brokengpt-prompts","prompts-list","prompt");renderSaved("brokengpt-favorites","favorites-list","favorite");
const wordInput=document.getElementById("word-input");wordInput.addEventListener("input",()=>{const value=wordInput.value.trim();document.getElementById("word-count").textContent=(value?value.split(/\s+/).length:0)+" words · "+wordInput.value.length+" characters"});
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

/* Universal App Connector: app directory, local app list, and task approval */
const appCatalog=[
{name:"Google Maps",category:"Productivity",description:"Maps, routes, and places",store:"https://play.google.com/store/search?q=Google%20Maps&c=apps",site:"https://maps.google.com"},
{name:"Discord",category:"Communication",description:"Communities and group chat",store:"https://play.google.com/store/search?q=Discord&c=apps",site:"https://discord.com"},
{name:"Spotify",category:"Creative",description:"Music and playlists",store:"https://play.google.com/store/search?q=Spotify&c=apps",site:"https://open.spotify.com"},
{name:"Minecraft",category:"Games",description:"Building, worlds, and game tips",store:"https://play.google.com/store/search?q=Minecraft&c=apps",site:"https://www.minecraft.net"},
{name:"Roblox",category:"Games",description:"Game discovery and experience tips",store:"https://play.google.com/store/search?q=Roblox&c=apps",site:"https://www.roblox.com"},
{name:"YouTube",category:"Creative",description:"Videos and creator tools",store:"https://play.google.com/store/search?q=YouTube&c=apps",site:"https://www.youtube.com"},
{name:"Google Drive",category:"Productivity",description:"Files and documents",store:"https://play.google.com/store/search?q=Google%20Drive&c=apps",site:"https://drive.google.com"},
{name:"Khan Academy",category:"Education",description:"Learning and practice",store:"https://play.google.com/store/search?q=Khan%20Academy&c=apps",site:"https://www.khanacademy.org"}
];
function getConnectedApps(){try{return JSON.parse(localStorage.getItem("brokengpt-connected-apps")||"[]")}catch{return[]}}
function saveConnectedApps(items){localStorage.setItem("brokengpt-connected-apps",JSON.stringify(items))}
function renderAppDirectory(query=""){
 const target=el("app-directory");target.replaceChildren();
 const matches=appCatalog.filter(app=>(app.name+" "+app.category+" "+app.description).toLowerCase().includes(query.toLowerCase()));
 matches.forEach(app=>{const card=document.createElement("div");card.className="app-entry";const info=document.createElement("div");const name=safeText("strong",app.name);const desc=safeText("small",app.category+" · "+app.description);info.append(name,desc);const actions=document.createElement("div");const add=document.createElement("button");add.textContent="Add";add.addEventListener("click",()=>addConnectedApp({...app,installed:"unknown"}));const find=document.createElement("button");find.textContent="Find app";find.addEventListener("click",()=>window.open(app.store,"_blank","noopener,noreferrer"));actions.append(add,find);card.append(info,actions);target.append(card)});
 if(!matches.length)target.append(safeText("p","No match in this starter directory. You can add an app by name below.","status"));
}
function renderConnectedApps(){
 const target=el("connected-apps"),select=el("task-app"),apps=getConnectedApps();target.replaceChildren();select.replaceChildren(new Option("Choose an app",""));
 if(!apps.length)target.append(safeText("p","No apps added yet.","status"));
 apps.forEach((app,index)=>{const row=document.createElement("div");row.className="connected-entry";const info=document.createElement("div");info.append(safeText("strong",app.name),safeText("small",(app.category||"Other")+" · Added to BrokenGPT list; integration "+(app.integration?"available":"not connected")));const actions=document.createElement("div");if(app.site){const open=document.createElement("button");open.textContent="Open";open.addEventListener("click",()=>window.open(app.site,"_blank","noopener,noreferrer"));actions.append(open)}if(app.store){const store=document.createElement("button");store.textContent="Install page";store.addEventListener("click",()=>window.open(app.store,"_blank","noopener,noreferrer"));actions.append(store)}const remove=document.createElement("button");remove.textContent="Remove";remove.addEventListener("click",()=>{const list=getConnectedApps();list.splice(index,1);saveConnectedApps(list);renderConnectedApps()});actions.append(remove);row.append(info,actions);target.append(row);select.add(new Option(app.name,app.name))});
}
function addConnectedApp(app){
 const apps=getConnectedApps();if(!apps.some(item=>item.name.toLowerCase()===app.name.toLowerCase())){apps.push({name:app.name,category:app.category||"Other",description:app.description||"",site:app.site||"",store:app.store||"",integration:false,addedAt:new Date().toISOString()});saveConnectedApps(apps)}
 renderConnectedApps();el("app-task-result").textContent=app.name+" added. Direct control is not connected yet; supported integrations will be shown when available.";
}
el("app-search").addEventListener("input",()=>renderAppDirectory(el("app-search").value));
el("add-manual-app").addEventListener("click",()=>{const name=el("manual-app-name").value.trim();if(!name)return;addConnectedApp({name,category:el("manual-app-type").value});el("manual-app-name").value=""});
el("prepare-app-task").addEventListener("click",()=>{
 const app=el("task-app").value,task=el("app-task").value.trim();if(!app||!task){el("app-task-result").textContent="Choose an app and describe the task first.";return}
 const plan="APP TASK PLAN · "+app+"\n\nYour request: "+task+"\n\nStatus: Awaiting your approval.\nBrokenGPT can prepare guidance now. Automatic in-app actions are unavailable until this app has a supported, permissioned integration. Review the steps before doing anything.";
 el("app-task-result").textContent=plan;
});
renderAppDirectory();renderConnectedApps();

/* Ad Shield preference storage. This switch is a setup preference, not an active ad blocker. */
const adShieldDefaults={enabled:false,scope:"browser",allowlist:""};
let adShield={...adShieldDefaults};try{adShield={...adShield,...JSON.parse(localStorage.getItem("brokengpt-ad-shield")||"{}")}}catch{}
function loadAdShield(){el("ad-shield-enabled").checked=!!adShield.enabled;el("ad-shield-scope").value=adShield.scope;el("ad-shield-allowlist").value=adShield.allowlist;el("ad-shield-status").textContent=adShield.enabled?"Preference saved. Filtering is not active in this prototype; an Android VPN/DNS or browser-filter integration is still required.":"Setup preview only: this prototype does not yet block ads. Actual filtering requires a tested browser filter or Android VPN/DNS component and its permissions."}
el("save-ad-shield").addEventListener("click",()=>{adShield={enabled:el("ad-shield-enabled").checked,scope:el("ad-shield-scope").value,allowlist:el("ad-shield-allowlist").value};localStorage.setItem("brokengpt-ad-shield",JSON.stringify(adShield));loadAdShield()});
loadAdShield();

/* Character Studio: local roleplay, display, screenshot preview, and voice controls */
const characterDefaults={choice:"speedster",costume:"Classic",name:"Speedster Hero",description:"A cheerful, confident, fast-talking blue speedster hero who loves jokes and helping out.",display:false,voice:false,voiceStyle:"energetic",outside:false,avatar:""};
let characterPrefs={...characterDefaults};
try{characterPrefs={...characterPrefs,...JSON.parse(localStorage.getItem("brokengpt-character")||"{}")}}catch{}
const companion=el("character-companion"),companionAvatar=el("companion-avatar"),companionSpeech=el("companion-speech"),companionCaption=el("companion-caption");
function saveCharacterPrefs(){localStorage.setItem("brokengpt-character",JSON.stringify(characterPrefs))}
function characterLine(text){companionSpeech.textContent=text}
const characterScenes={
 welcome:{line:"You're back! I was waiting for our next adventure!",mood:"walking"},
 happy:{line:"YES! This is going to be AWESOME!",mood:"walking"},
 surprised:{line:"WHOA!! You nearly made me jump out of my shoes!",mood:"surprised"},
 angry:{line:"Hey! Watch it! I'm not THAT easy to annoy!",mood:"angry"},
 sleepy:{line:"Five more minutes... I'm recharging my speed.",mood:"sitting"},
 joke:{line:"HAHA! Okay, that was actually a good one!",mood:"happy"},
 ready:{line:"Let's move! I've got places to be!",mood:"walking"},
 goodbye:{line:"See you later! *runs off screen*",mood:"walking"},
 "dont-close":{line:"NOOO! DON'T CLOSE ME! I DON'T WANNA DISAPPEAR! AAAAA! ",mood:"surprised"}
};
function playCharacterScene(key){
 const scene=characterScenes[key];if(!scene)return;
 companion.classList.remove("surprised","angry","sitting","walking","happy");
 companion.classList.add(scene.mood);
 characterLine(scene.line);characterSpeak(scene.line);
 el("character-scene-status").textContent="Playing: "+scene.line;
 if(key==="goodbye"){companion.classList.add("walking");}
}
function characterReact(text){
 const value=(text||"").toLowerCase();
 if(/\b(hi|hello|hey|im back|i'm back)\b/.test(value)){playCharacterScene("welcome");return}
 if(/boo|surprise|scare|jump/.test(value)){playCharacterScene("surprised");return}
 if(/angry|mad|annoy/.test(value)){playCharacterScene("angry");return}
 if(/sit|rest|tired|sleep/.test(value)){playCharacterScene("sleepy");return}
 if(/joke|funny|haha|lol/.test(value)){playCharacterScene("joke");return}
 if(/bye|goodbye|see you|go away/.test(value)){playCharacterScene("goodbye");return}
 playCharacterScene("ready");
}
function setCharacterDisplay(on){
 characterPrefs.display=!!on;saveCharacterPrefs();companion.classList.toggle("hidden",!on);
 if(on){companionCaption.textContent=characterPrefs.name||"Speedster Hero";companion.classList.add("walking");characterLine("I'm here! Let's do this!");}
}
function renderCharacterAvatar(){
 const preview=el("character-avatar-preview");preview.replaceChildren();
 if(characterPrefs.avatar){const img=document.createElement("img");img.src=characterPrefs.avatar;img.alt="Your custom character avatar";preview.append(img);companionAvatar.replaceChildren();const mini=document.createElement("img");mini.src=characterPrefs.avatar;mini.alt="";companionAvatar.append(mini)}
 else{preview.textContent="";companionAvatar.textContent=""}
 companionCaption.textContent=characterPrefs.name||"Speedster Hero";
}
function loadCharacterPrefs(){
 el("character-choice").value=characterPrefs.choice;el("character-costume").value=characterPrefs.costume;
 el("custom-character-name").value=characterPrefs.name==="Speedster Hero"?"":characterPrefs.name;
 el("custom-character-description").value=characterPrefs.description||"";
 el("character-display-toggle").checked=!!characterPrefs.display;el("character-voice-toggle").checked=!!characterPrefs.voice;
 el("character-voice-style").value=characterPrefs.voiceStyle||"energetic";el("character-outside-toggle").checked=!!characterPrefs.outside;
 renderCharacterAvatar();companion.classList.toggle("hidden",!characterPrefs.display);
 el("character-outside-status").textContent=characterPrefs.outside?"Requested: outside-app mode is saved, but this web build has no native Android overlay service yet. The character remains inside BrokenGPT.":"A real floating companion outside the app requires a native Android companion service and Android overlay permission. This web prototype cannot keep a character above other apps.";
}
el("character-choice").addEventListener("change",()=>{characterPrefs.choice=el("character-choice").value;if(characterPrefs.choice==="speedster"){characterPrefs.name="Speedster Hero";characterPrefs.description="A cheerful, confident, fast-talking blue speedster hero who loves jokes and helping out."}else{characterPrefs.name="My Character";characterPrefs.description="Describe your own character's personality and behavior."}el("custom-character-name").value=characterPrefs.name;el("custom-character-description").value=characterPrefs.description;renderCharacterAvatar()});
el("save-character").addEventListener("click",()=>{characterPrefs.name=el("custom-character-name").value.trim()||(characterPrefs.choice==="speedster"?"Speedster Hero":"My Character");characterPrefs.description=el("custom-character-description").value.trim();characterPrefs.costume=el("character-costume").value;saveCharacterPrefs();renderCharacterAvatar();el("character-save-status").textContent="Saved "+characterPrefs.name+" and its costume on this device."});
el("character-avatar").addEventListener("change",e=>{const file=e.target.files&&e.target.files[0];if(!file)return;if(!file.type.startsWith("image/")||file.size>2*1024*1024){el("character-save-status").textContent="Choose an image smaller than 2 MB.";return}const reader=new FileReader();reader.onload=()=>{characterPrefs.avatar=String(reader.result);saveCharacterPrefs();renderCharacterAvatar();el("character-save-status").textContent="Avatar saved on this device."};reader.readAsDataURL(file)});
el("character-display-toggle").addEventListener("change",e=>setCharacterDisplay(e.target.checked));
el("character-voice-toggle").addEventListener("change",e=>{characterPrefs.voice=e.target.checked;saveCharacterPrefs();if(e.target.checked)characterSpeak("Voice mode is ready. Let's go!");});
el("character-voice-style").addEventListener("change",e=>{characterPrefs.voiceStyle=e.target.value;saveCharacterPrefs()});
el("character-outside-toggle").addEventListener("change",e=>{characterPrefs.outside=e.target.checked;saveCharacterPrefs();el("character-outside-status").textContent=e.target.checked?"Outside-app companion requested, but not active: this web prototype needs a native Android foreground companion service and overlay permission. Android may also stop background services.":"Outside-app companion is off.";});
function characterSpeak(text){
 if(!characterPrefs.voice||!("speechSynthesis" in window)||!("SpeechSynthesisUtterance" in window))return;
 window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);
 utterance.rate=characterPrefs.voiceStyle==="energetic"?1.16:.96;utterance.pitch=characterPrefs.voiceStyle==="energetic"?1.28:1.02;
 window.speechSynthesis.speak(utterance);
}
el("character-test-warning").addEventListener("click",()=>{characterLine("NOOO! DON'T CLOSE ME! I DON'T WANNA DISAPPEAR! AAAAA! ");characterReact("surprise");characterSpeak("Nooo! Don't close me! I don't wanna disappear! See you later!");});
el("play-character-scene").addEventListener("click",()=>playCharacterScene(el("character-scene").value));
companionAvatar.addEventListener("click",()=>{characterLine("Hey! Need me?");characterReact("surprise");});
const screenshotInput=el("character-screenshot");
screenshotInput.addEventListener("change",e=>{const file=e.target.files&&e.target.files[0];const target=el("character-screenshot-preview");target.replaceChildren();if(!file)return;if(!file.type.startsWith("image/")){el("character-screenshot-status").textContent="Please choose an image file.";return}const img=document.createElement("img");img.src=URL.createObjectURL(file);img.alt="Screenshot selected for analysis";target.append(img);el("character-screenshot-status").textContent="Screenshot loaded locally. It has not been sent anywhere."});
el("analyze-character-screenshot").addEventListener("click",()=>{el("character-screenshot-status").textContent=screenshotInput.files&&screenshotInput.files[0]?"Screenshot is ready, but automatic analysis needs a connected AI vision model. No image has been uploaded to a server.":"Choose a screenshot first."});
el("character-outside-toggle").addEventListener("change",()=>{if(characterPrefs.outside){characterLine("I can't leave this web app yet! I need my Android companion service!");}});
document.getElementById("chat-form").addEventListener("submit",()=>{const sent=el("prompt").value.trim();if(!sent)return;if(characterPrefs.display){characterReact(sent);if(/^(go|go away|leave|bye)$/i.test(sent)){characterLine("See you later! *runs away*");characterSpeak("See you later!");setTimeout(()=>setCharacterDisplay(false),1800)}else characterSpeak(characterPrefs.name+" says: "+(characterPrefs.description||"Let's go!"));}});
loadCharacterPrefs();


/* Expanded Character Dialogue Library: 1,000 generated variations per built-in character */
const expandedCharacterProfiles = {
 speedster:{name:"Speedster Hero",tag:"Zoom!",style:["whoosh","full speed","race you","turbo mode","dash time","lightning fast","supercharged","no brakes","speed trail","next level"]},
 robot:{name:"Logic Bot",tag:"Beep.",style:["calculation complete","data says","logic check","systems steady","processing","efficiency report","confirmed","analysis finished","tiny error detected","interesting variable"]},
 cat:{name:"Mischief Cat",tag:"Meow!",style:["purr-fect","tiny paw plan","curiosity wins","mischief time","snack break","tail twitch","pounce mode","cat logic","mrrp","soft landing"]},
 knight:{name:"Royal Knight",tag:"For the realm!",style:["by my honor","stand firm","shield raised","courage restored","quest accepted","victory awaits","a noble choice","steadfast","your loyal knight","the realm is safe"]},
 wizard:{name:"Star Wizard",tag:"By starlight!",style:["a curious spell","stars have spoken","arcane wonder","a little magic","wisdom spark","the cosmos agrees","mystery unfolds","spell complete","wonder awaits","stardust idea"]},
 dragon:{name:"Sleepy Dragon",tag:"Hrrmm...",style:["cozy cave","warm little puff","nap-powered","soft rumble","comfy clouds","tiny yawn","gentle fire","blanket time","snuggle mode","dreamy thoughts"]},
 detective:{name:"Pixel Detective",tag:"Case noted.",style:["clue spotted","case update","evidence suggests","sharp eyes","mystery solved","one more clue","deduction time","pattern found","noted in my log","case remains open"]},
 trickster:{name:"Jester Sprite",tag:"Ta-da!",style:["plot twist","dramatic entrance","tiny prank","behold","mischief achieved","what a twist","cue the music","suspense","surprise performance","ta-da"]},
 pipePlumber:{name:"Pipe Plumber",tag:"Here we go!",style:["pipe-hop","power-up","mushroom dash","coin-chase","jump time","plumbing pro","level clear","super jump","warp-pipe","bonus stage"]},
 grappleHero:{name:"Grapple Hero",tag:"The night is calling.",style:["grapple ready","rooftop route","silent landing","watchful eyes","mission accepted","city patrol","utility belt","shadow approach","case closed","night watch"]}
};
const expandedFeelings = [
 {name:"Joy",mood:"happy",lines:["That made my day!","I am grinning already!","What a lovely surprise!","This is wonderful!","My mood just zoomed up!","That feels fantastic!","I could celebrate!","What a bright moment!","I am delighted!","Best little moment ever!"]},
 {name:"Excitement",mood:"walking",lines:["Adventure alert!","I am ready to go!","This is thrilling!","Let us make it happen!","Energy levels rising!","What happens next?","Count me in!","I am buzzing with ideas!","Here we go!","This is going to be great!"]},
 {name:"Curiosity",mood:"surprised",lines:["Now that is interesting!","I have a question!","Let us investigate!","What could that mean?","My curiosity is awake!","There is more to discover!","Tell me another detail!","A mystery appears!","I want to understand!","Let us look closer!"]},
 {name:"Surprise",mood:"surprised",lines:["Whoa! I did not expect that!","You caught me off guard!","Wait, what?","That was unexpected!","My thoughts did a flip!","Well, that is a twist!","I need a second!","Surprise detected!","I blinked twice!","You got me!"]},
 {name:"Frustration",mood:"angry",lines:["Hmm, that is frustrating.","Let us take another look.","That did not go as planned.","Okay, tiny reset.","I am not giving up.","Let us untangle this.","A little patience, please.","That was a bump in the road.","We can fix this.","Deep breath. New plan."]},
 {name:"Sadness",mood:"sitting",lines:["Aw, that is a little sad.","I am here with you.","That is a tough feeling.","Let us take it gently.","I wish that felt easier.","A quiet moment, then?","It is okay to pause.","I am listening.","That sounds disappointing.","Let us be kind to ourselves."]},
 {name:"Worry",mood:"sitting",lines:["Let us slow down a moment.","We can check this carefully.","One step at a time.","No need to rush.","Let us find what we know.","I will help you think it through.","A calm plan might help.","Let us check the details.","We can ask for help if needed.","Let us focus on the next step."]},
 {name:"Confidence",mood:"walking",lines:["We have got this!","Look at that progress!","I believe in this plan!","Let us take the next step!","Strong effort!","Ready when you are!","That is a clever move!","Keep that momentum!","We can learn as we go!","Onward!"]},
 {name:"Sleepiness",mood:"sitting",lines:["Yaaawn...","My batteries feel cozy.","Can we pause a moment?","Nap mode activated.","A soft little break sounds nice.","I am running on dream power.","Let us take it easy.","My eyelids are buffering.","Quiet time, please.","Just one tiny rest."]},
 {name:"Affection",mood:"happy",lines:["It is nice having you here.","You are a welcome sight.","I am glad we are chatting.","Teamwork feels great.","Thanks for including me.","This is a good little moment.","I am happy to help.","We are a pretty good team.","Your company is appreciated.","Let us make today a good one."]}
];
const expandedSceneMap = new Map();
function rebuildExpandedScenes(){
 const profile=expandedCharacterProfiles[characterPrefs.choice]||{name:characterPrefs.name||"My Character",tag:"Ready!",style:["ready","curious","thoughtful","playful","brave","calm","clever","kind","focused","creative"]};
 const select=el("character-scene");select.replaceChildren();expandedSceneMap.clear();let n=0;
 expandedFeelings.forEach(feeling=>{const group=document.createElement("optgroup");group.label=feeling.name;feeling.lines.forEach(line=>{profile.style.forEach(style=>{const key="expanded-scene-"+n;const full=line+" "+profile.tag+" "+style+"!";expandedSceneMap.set(key,{line:full,mood:feeling.mood});const option=document.createElement("option");option.value=key;option.textContent=(n+1)+". "+line+" · "+style;group.append(option);n++;});});select.append(group);});
 const special=document.createElement("optgroup");special.label="Special scenes";Object.entries(characterScenes).forEach(([key,scene])=>{const option=document.createElement("option");option.value=key;option.textContent=scene.line;special.append(option);});select.append(special);
 el("character-scene-status").textContent="1,000 character-specific scenes ready across 10 feelings, plus special scenes.";
}
function playCharacterScene(key){
 const scene=expandedSceneMap.get(key)||characterScenes[key];if(!scene)return;
 companion.classList.remove("surprised","angry","sitting","walking","happy");companion.classList.add(scene.mood);
 characterLine(scene.line);characterSpeak(scene.line);el("character-scene-status").textContent="Playing: "+scene.line;
 if(key==="goodbye")companion.classList.add("walking");
}
el("character-choice").addEventListener("change",()=>{const profile=expandedCharacterProfiles[characterPrefs.choice];if(profile){characterPrefs.name=profile.name;characterPrefs.description=profile.description;el("custom-character-name").value=profile.name;el("custom-character-description").value=profile.description;renderCharacterAvatar();saveCharacterPrefs();}rebuildExpandedScenes();});
rebuildExpandedScenes();
if(characterPrefs.display){characterLine("Ooo, look! We are back!");characterSpeak("Ooo, look! We are back!");}

/* Character-specific exit choreography */
const companionExitStyles={speedster:"exit-run",robot:"exit-roll",cat:"exit-hop",knight:"exit-salute",wizard:"exit-magic",dragon:"exit-fly",detective:"exit-shadow",trickster:"exit-spin",pipePlumber:"exit-pipe",grappleHero:"exit-hook"};
function playCharacterScene(key){
 const scene=expandedSceneMap.get(key)||characterScenes[key];if(!scene)return;
 companion.classList.remove("surprised","angry","sitting","walking","happy",...Object.values(companionExitStyles));
 companion.classList.add(scene.mood);
 characterLine(scene.line);characterSpeak(scene.line);
 el("character-scene-status").textContent="Playing: "+scene.line;
 if(key==="goodbye"){
  const exitStyle=companionExitStyles[characterPrefs.choice]||"exit-run";
  companion.classList.add(exitStyle);
  window.setTimeout(()=>{companion.classList.remove(exitStyle);if(characterPrefs.display)companion.classList.remove("hidden");},1900);
 }
}


/* Character Universe: searchable character presets with original placeholder presentation.
   Official artwork, logos, and exact character voices are not bundled. */
const universeCharacters = [
 {id:"mario",name:"Mario",category:"Games",emoji:"",description:"An upbeat, brave platforming hero who encourages teamwork and never gives up.",tag:"Let's-a go!",style:["power-up","jump time","coin chase","level clear","teamwork","super jump","bonus stage","adventure time","brave move","here we go"]},
 {id:"luigi",name:"Luigi",category:"Games",emoji:"",description:"A kind, clever, slightly nervous adventurer who finds courage when friends need help.",tag:"I can do this!",style:["careful step","ghost hunt","brave moment","deep breath","green power","team helper","quiet courage","unexpected win","mystery mansion","let's-a go"]},
 {id:"peach",name:"Princess Peach",category:"Games",emoji:"",description:"A warm, confident royal leader with a thoughtful and adventurous spirit.",tag:"A royal adventure!",style:["kindness first","royal plan","bright idea","castle day","graceful move","friendship wins","brave heart","team spirit","a lovely surprise","onward"]},
 {id:"bowser",name:"Bowser",category:"Games",emoji:"",description:"A loud, dramatic fantasy boss character with playful competitive energy.",tag:"ROAR!",style:["boss mode","big entrance","fiery plan","thunderous laugh","challenge accepted","power move","dramatic roar","not so fast","kingly stomp","next level"]},
 {id:"yoshi",name:"Yoshi",category:"Games",emoji:"",description:"A cheerful, loyal dinosaur companion who loves helping friends.",tag:"Yoshi!",style:["happy hop","friendly flutter","egg-cellent idea","team jump","snack time","little adventure","big smile","green sprint","helping hand","whee"]},
 {id:"kirby",name:"Kirby",category:"Games",emoji:"",description:"A sweet, energetic star adventurer with a playful and optimistic personality.",tag:"Poyo!",style:["star power","dream land","tiny hero","happy bounce","snack break","cosmic cheer","copy ability","pink power","big adventure","poyo time"]},
 {id:"link",name:"Link",category:"Games",emoji:"",description:"A quiet, courageous fantasy adventurer who communicates through actions and thoughtful gestures.",tag:"Adventure awaits.",style:["quest accepted","shield ready","forest path","ancient secret","brave heart","treasure found","quiet focus","hero's call","new discovery","onward"]},
 {id:"pikachu",name:"Pikachu",category:"Games",emoji:"",description:"A loyal, energetic electric mouse companion who is curious and encouraging.",tag:"Pika-pika!",style:["spark of joy","thunder ready","tiny zap","team bond","electric energy","happy squeak","curious peek","bright idea","quick dash","pika power"]},
 {id:"shadow",name:"Shadow",category:"Games",emoji:"",description:"A cool, serious, determined speed rival with a guarded but helpful side.",tag:"Hmph. Try to keep up.",style:["chaos control","serious mode","ultimate focus","dark speed","mission accepted","rival spotted","precision move","no distractions","calculated risk","limit breaker"]},
 {id:"tails",name:"Tails",category:"Games",emoji:"",description:"A friendly young inventor who is curious, clever, and supportive.",tag:"I've got an idea!",style:["invention time","flight check","toolbox ready","smart solution","two-tail takeoff","test run","clever fix","science moment","team support","new blueprint"]},
 {id:"knuckles",name:"Knuckles",category:"Games",emoji:"",description:"A strong, stubborn guardian who values honesty, loyalty, and protecting others.",tag:"Bring it on.",style:["guardian duty","strong stance","training time","straight answer","emerald watch","power punch","loyal teammate","focus up","challenge accepted","all clear"]},
 {id:"spiderman",name:"Spider-Man",category:"Superheroes",emoji:"",description:"A witty, friendly city hero who uses quick thinking, responsibility, and humor.",tag:"Friendly neighborhood hero!",style:["web-sling ready","city patrol","quick quip","spider-sense","hero moment","swing by","clever save","responsibility first","rooftop route","team-up time"]},
 {id:"ironman",name:"Iron Man",category:"Superheroes",emoji:"",description:"A brilliant, confident tech inventor with fast humor and engineering instincts.",tag:"Systems online.",style:["armor check","tech upgrade","flight systems","diagnostics","genius idea","power core","workshop time","calculated risk","prototype ready","mission control"]},
 {id:"hulk",name:"Hulk",category:"Superheroes",emoji:"",description:"A powerful hero with simple, direct speech and a protective heart.",tag:"Hulk ready!",style:["strong move","big jump","protect friends","calm down","team smash","power check","gentle moment","big green energy","hero help","all clear"]},
 {id:"thor",name:"Thor",category:"Superheroes",emoji:"",description:"A noble thunder hero with grand, friendly confidence.",tag:"By the thunder!",style:["storm approaches","worthy quest","thunder call","brave companion","realm watch","mighty idea","heroic welcome","lightning strike","honor first","onward"]},
 {id:"batman",name:"Batman",category:"Superheroes",emoji:"",description:"A calm, strategic detective hero who studies clues and prepares carefully.",tag:"The case is not closed.",style:["case file","grapple ready","night patrol","detective mode","evidence first","contingency plan","rooftop watch","silent approach","city needs help","mission complete"]},
 {id:"superman",name:"Superman",category:"Superheroes",emoji:"",description:"A hopeful, compassionate hero who values courage and helping people.",tag:"There's always hope.",style:["hopeful thought","rescue ready","kindness matters","skyward flight","steady courage","help is here","truth first","bright tomorrow","teamwork","look up"]},
 {id:"flash",name:"The Flash",category:"Superheroes",emoji:"",description:"A cheerful, fast-talking speed hero who loves science and quick jokes.",tag:"Fastest thought first!",style:["speed force","quick lap","time to move","science snack","fast fix","lightning round","race you","speedy solution","red blur","back in a flash"]},
 {id:"wonderwoman",name:"Wonder Woman",category:"Superheroes",emoji:"",description:"A brave, wise warrior who leads with compassion and fairness.",tag:"Courage and truth.",style:["truth and courage","shield raised","wise choice","warrior focus","peace first","honor bound","strong heart","mission accepted","compassion wins","stand together"]},
 {id:"joker",name:"Joker",category:"Superheroes",emoji:"",description:"A theatrical fictional trickster persona with unpredictable jokes; kept non-threatening and playful.",tag:"A little plot twist!",style:["dramatic giggle","plot twist","ta-da","curtain call","unexpected joke","mischief mode","silly scheme","surprise entrance","comic timing","what a show"]},
 {id:"goku",name:"Goku",category:"Anime",emoji:"",description:"An upbeat martial-arts adventurer who loves challenges, training, and helping friends.",tag:"Let's get stronger!",style:["training time","new challenge","power up","friendly match","keep practicing","big energy","team spirit","ready stance","next level","let's go"]},
 {id:"vegeta",name:"Vegeta",category:"Anime",emoji:"",description:"A proud, disciplined rival who is intense, focused, and secretly loyal.",tag:"Hmph. I will surpass it.",style:["elite focus","training harder","pride intact","no excuses","rival challenge","precision strike","royal resolve","prove it","limit break","discipline first"]},
 {id:"naruto",name:"Naruto",category:"Anime",emoji:"",description:"An energetic, optimistic ninja who values friendship, perseverance, and teamwork.",tag:"Believe it!",style:["ninja way","shadow clone idea","never give up","team seven spirit","training arc","big dream","ramen break","friendship power","mission accepted","believe it"]},
 {id:"sasuke",name:"Sasuke",category:"Anime",emoji:"",description:"A quiet, focused ninja rival who is analytical and independent.",tag:"I have a plan.",style:["focused gaze","quiet strategy","sharingan focus","mission first","precise move","training alone","calm analysis","rival nearby","next step","no distractions"]},
 {id:"luffy",name:"Monkey D. Luffy",category:"Anime",emoji:"‍",description:"A carefree, brave pirate captain who loves adventure, food, and friends.",tag:"I'm gonna be King of the Pirates!",style:["adventure ahoy","crew assemble","meat break","big dream","captain's call","island ahead","rubber power","friendship first","full speed","let's sail"]},
 {id:"zoro",name:"Roronoa Zoro",category:"Anime",emoji:"",description:"A serious, determined swordsman who is loyal and often hilariously directionally challenged.",tag:"Point me toward the goal.",style:["training session","three-sword focus","steady stance","loyal crew","quiet resolve","wrong turn","sharp focus","goal ahead","discipline","rest later"]},
 {id:"gojo",name:"Satoru Gojo",category:"Anime",emoji:"",description:"A playful, confident mentor who mixes jokes with sharp insight.",tag:"Don't worry, I've got this.",style:["limitless confidence","teacher mode","playful tease","infinity focus","clever trick","lesson time","cool entrance","sharp observation","all under control","next lesson"]},
 {id:"tanjiro",name:"Tanjiro Kamado",category:"Anime",emoji:"",description:"A kind, determined swordsman who is empathetic, observant, and protective.",tag:"I'll keep going.",style:["steady breath","kind heart","careful listening","training path","protect others","water flow","brave step","gentle strength","focus","keep going"]},
 {id:"spongebob",name:"SpongeBob",category:"Cartoons",emoji:"",description:"An enthusiastic, silly sea sponge who finds joy in everyday adventures.",tag:"I'm ready!",style:["jellyfish time","pineapple plans","best day ever","silly grin","krabby idea","bubbles everywhere","happy dance","work shift","undersea fun","ready"]},
 {id:"patrick",name:"Patrick",category:"Cartoons",emoji:"⭐",description:"A lovable, goofy friend with simple, unexpected observations.",tag:"Is this the part where we laugh?",style:["deep thought","snack question","rock time","silly idea","unexpected wisdom","nap plan","friendship moment","wait what","star power","hmm"]},
 {id:"tom",name:"Tom",category:"Cartoons",emoji:"",description:"A determined cartoon cat with expressive reactions and slapstick timing.",tag:"Mrow!",style:["sneaky plan","chase scene","dramatic pause","cat reflexes","quiet tiptoe","oops moment","big reaction","one more try","comic timing","nap time"]},
 {id:"jerry",name:"Jerry",category:"Cartoons",emoji:"",description:"A clever, quick-thinking mouse who enjoys playful problem-solving.",tag:"Heh-heh!",style:["tiny trick","clever escape","cheese break","quick thinking","silent victory","mouse-sized plan","sneaky peek","one step ahead","mischief","ta-da"]},
 {id:"ben10",name:"Ben 10",category:"Cartoons",emoji:"⌚",description:"A brave young hero who enjoys gadgets, teamwork, and creative transformations.",tag:"Hero time!",style:["omnitrix check","hero time","alien idea","team rescue","watch activated","new form","quick save","mission accepted","gadget scan","let's roll"]},
 {id:"frozen",name:"Elsa",category:"Movies",emoji:"",description:"A thoughtful ice-magic queen who is calm, creative, and learning confidence.",tag:"A little winter magic.",style:["ice crystal","snowy idea","quiet strength","winter wonder","let it flow","royal calm","frosty sparkle","new beginning","magic touch","peaceful moment"]},
 {id:"toystory",name:"Buzz Lightyear",category:"Movies",emoji:"",description:"A brave space ranger with earnest confidence and mission-focused humor.",tag:"To infinity and beyond!",style:["space mission","ranger report","launch ready","star command","mission log","cosmic discovery","team check","brave landing","infinity ahead","all systems go"]},
 {id:"shrek",name:"Shrek",category:"Movies",emoji:"",description:"A grumpy-but-kind swamp-dweller persona with dry humor and a soft heart.",tag:"Get outta my swamp—just kidding.",style:["swamp wisdom","onion layers","quiet afternoon","fairy tale trouble","dry joke","muddy boots","unexpected kindness","snack break","ogre logic","all done"]}
];
const universeById = Object.fromEntries(universeCharacters.map(item=>[item.id,item]));
universeCharacters.forEach(item=>{
 expandedCharacterProfiles[item.id]={name:item.name,tag:item.tag,style:item.style,description:item.description,emoji:item.emoji};
});
function renderCharacterAvatar(){
 const preview=el("character-avatar-preview");
 const profile=universeById[characterPrefs.choice];
 const emoji=profile?.emoji||"";
 preview.replaceChildren();
 if(characterPrefs.avatar){
  const img=document.createElement("img");img.src=characterPrefs.avatar;img.alt="Your custom character avatar";preview.append(img);
  companionAvatar.replaceChildren();const mini=document.createElement("img");mini.src=characterPrefs.avatar;mini.alt="";companionAvatar.append(mini);
 }else{
  preview.textContent=emoji;companionAvatar.textContent=emoji;
 }
 companionCaption.textContent=characterPrefs.name||"Character";
}
function addUniverseCharacter(id){
 const item=universeById[id];if(!item)return;
 const select=el("character-choice");
 let option=[...select.options].find(o=>o.value===id);
 if(!option){option=document.createElement("option");option.value=id;option.textContent=item.name+" ("+item.category+")";select.append(option);}
 select.value=id;
 characterPrefs.choice=id;characterPrefs.name=item.name;characterPrefs.description=item.description;
 el("custom-character-name").value=item.name;el("custom-character-description").value=item.description;
 saveCharacterPrefs();renderCharacterAvatar();rebuildExpandedScenes();
 el("universe-status").textContent=item.name+" added and selected! You can customize its costume, avatar, and description below.";
}
function renderUniverseDirectory(){
 const query=(el("universe-search").value||"").trim().toLowerCase();
 const category=el("universe-category").value;
 const target=el("universe-results");target.replaceChildren();
 const matches=universeCharacters.filter(item=>(category==="all"||item.category===category)&&(!query||(item.name+" "+item.category+" "+item.description).toLowerCase().includes(query)));
 if(!matches.length){target.textContent="No matching characters. Try another search.";return;}
 matches.forEach(item=>{
  const card=document.createElement("article");card.className="universe-character";
  const face=document.createElement("div");face.className="universe-avatar";face.textContent=item.emoji;
  const info=document.createElement("div");info.className="universe-character-info";
  const name=document.createElement("strong");name.textContent=item.name;
  const meta=document.createElement("small");meta.textContent=item.category+" · original profile";
  const desc=document.createElement("p");desc.textContent=item.description;
  const add=document.createElement("button");add.type="button";add.textContent=characterPrefs.choice===item.id?"Selected":"Add / Select";
  add.addEventListener("click",()=>addUniverseCharacter(item.id));
  info.append(name,meta,desc,add);card.append(face,info);target.append(card);
 });
 el("universe-status").textContent=matches.length+" characters found · "+universeCharacters.length+" in this starter library.";
}
el("universe-search").addEventListener("input",renderUniverseDirectory);
el("universe-category").addEventListener("change",renderUniverseDirectory);
el("character-choice").addEventListener("change",()=>{
 const item=universeById[characterPrefs.choice];
 if(item){characterPrefs.name=item.name;characterPrefs.description=item.description;saveCharacterPrefs();renderCharacterAvatar();}
 renderUniverseDirectory();
});
renderUniverseDirectory();
if(universeById[characterPrefs.choice])addUniverseCharacter(characterPrefs.choice);


/* Stage 4A: account sessions and real provider chat */
let csrfToken="",currentUser=null,liveConversation=[];
const apiEl=id=>document.getElementById(id);
function backendBaseUrl(){
  return (localStorage.getItem("brokengpt-backend-url")||"").trim().replace(/\/+$/, "");
}
function apiUrl(url){const base=backendBaseUrl();return base?base+url:url;}
async function apiRequest(url,options={}){
  const headers={"Content-Type":"application/json",...(options.headers||{})};
  if(options.csrf)headers["X-CSRF-Token"]=csrfToken;
  let response;try{response=await fetch(apiUrl(url),{method:options.method||"GET",credentials:"include",headers,body:options.body?JSON.stringify(options.body):undefined,signal:options.signal||AbortSignal.timeout(65000)});}catch(error){if(error.name==="AbortError")throw error;if(error.name==="TimeoutError")throw new Error("The AI server took too long. Check your internet connection and backend status, then retry.");throw new Error("Could not reach the BrokenGPT AI server. Check the backend URL and internet connection.");}
  const type=response.headers.get("content-type")||"";
  if(options.onToken&&type.includes("text/event-stream")){
    if(!response.ok)throw new Error("The BrokenGPT stream request failed.");
    const reader=response.body.getReader(),decoder=new TextDecoder();let buffer="",reply="",streamError="";
    const parseLine=line=>{if(!line.startsWith("data:"))return;const raw=line.slice(5).trim();if(!raw)return;let event;try{event=JSON.parse(raw)}catch{return;}if(event.token){reply+=event.token;options.onToken(event.token)}if(event.error)streamError=event.error;};
    while(true){const {value,done}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});const lines=buffer.split(/\r?\n/);buffer=lines.pop()||"";lines.forEach(parseLine);}
    if(buffer)parseLine(buffer);if(streamError)throw new Error(streamError);return {reply,streamed:true};
  }
  if(!type.includes("application/json"))throw new Error("BrokenGPT backend is not connected to this website yet.");
  const data=await response.json();if(!response.ok)throw new Error(data.error||"The request failed.");return data;
}
function accountMessage(message){const node=apiEl("account-status");if(node)node.textContent=message;}
function providerMessage(message){const node=apiEl("provider-status");if(node)node.textContent=message;}
function updateAccountUI(){
  apiEl("account-logout").disabled=!currentUser;
  apiEl("account-register").disabled=!!currentUser;
  apiEl("account-login").disabled=!!currentUser;
  apiEl("account-status").textContent=currentUser?"Signed in as "+currentUser.username+".":"Not signed in.";
  apiEl("active-provider-status").textContent=currentUser?"Signed in. Checking provider connection…":"Sign in and connect a provider in Settings to use real AI.";
}
async function refreshProviderStatus(){
  if(!currentUser){providerMessage("Sign in first. Provider keys are encrypted by the backend and are not stored in this browser.");return;}
  try{
    const data=await apiRequest("/api/providers");
    const chosen=apiEl("active-provider").value,info=data.providers[chosen];
    const connected=Object.entries(data.providers||{}).filter(([,value])=>value?.connected).map(([name])=>name.toUpperCase());
    providerMessage(connected.length?"Connected: "+connected.join(", ")+".":"No providers connected yet.");
    apiEl("active-provider-status").textContent=info?.connected?chosen.toUpperCase()+" is connected. Ready to chat.":"Connect "+chosen.toUpperCase()+" in Settings to enable real AI replies.";
  }catch(error){providerMessage(error.message);apiEl("active-provider-status").textContent=error.message;}
}
function backendMessage(message){const node=apiEl("backend-url-status");if(node)node.textContent=message;}
function validateBackendUrl(value){
  if(!value)return "";
  let parsed;try{parsed=new URL(value);}catch{return null;}
  if(!["http:","https:"].includes(parsed.protocol)||parsed.username||parsed.password||parsed.search||parsed.hash)return null;
  if(location.protocol==="https:"&&parsed.protocol!=="https:"&&!["localhost","127.0.0.1"].includes(parsed.hostname))return null;
  return parsed.origin;
}
apiEl("backend-url-save")?.addEventListener("click",()=>{
  const raw=apiEl("backend-url").value.trim(),clean=validateBackendUrl(raw);
  if(clean===null){backendMessage("Enter a valid backend URL. Use HTTPS for a public server.");return;}
  if(clean)localStorage.setItem("brokengpt-backend-url",clean);else localStorage.removeItem("brokengpt-backend-url");
  apiEl("backend-url").value=clean;
  backendMessage(clean?"Backend address saved on this device. Checking connection…":"Using the current website address for the backend.");
  restoreAccount();
});
apiEl("backend-url-test")?.addEventListener("click",async()=>{
  const raw=apiEl("backend-url").value.trim(),clean=validateBackendUrl(raw);
  if(clean===null){backendMessage("Enter a valid backend URL first.");return;}
  try{
    const response=await fetch((clean||"")+"/api/health",{credentials:"include"});
    const data=await response.json();
    if(!response.ok||!data.ok)throw Error(data.error||"Backend health check failed.");
    backendMessage("Connected to "+(data.service||"BrokenGPT backend")+" · version "+(data.version||"unknown")+".");
  }catch(error){backendMessage("Could not reach the backend: "+error.message);}
});
apiEl("backend-url").value=backendBaseUrl();
async function restoreAccount(){
  try{
    const data=await apiRequest("/api/auth/me");
    currentUser=data.user;csrfToken=data.csrfToken;updateAccountUI();await refreshProviderStatus();
  }catch(error){
    currentUser=null;csrfToken="";updateAccountUI();
    accountMessage(error.message.includes("not connected")?"Backend not connected. Run or deploy the BrokenGPT backend to enable accounts.":"No active account session. Create an account or sign in.");
  }
}
async function submitAccount(action){
  const username=apiEl("account-username").value.trim(),password=apiEl("account-password").value;
  if(!username||!password){accountMessage("Enter your username and password.");return;}
  try{
    const data=await apiRequest(action==="register"?"/api/auth/register":"/api/auth/login",{method:"POST",body:{username,password}});
    currentUser=data.user;csrfToken=data.csrfToken;apiEl("account-password").value="";updateAccountUI();await refreshProviderStatus();
    accountMessage((action==="register"?"Account created. ":"Signed in. ")+"Welcome, "+currentUser.username+".");
  }catch(error){accountMessage(error.message);}
}
apiEl("account-register").addEventListener("click",()=>submitAccount("register"));
apiEl("account-login").addEventListener("click",()=>submitAccount("login"));
apiEl("account-logout").addEventListener("click",async()=>{
  try{await apiRequest("/api/auth/logout",{method:"POST",csrf:true});currentUser=null;csrfToken="";liveConversation=[];updateAccountUI();await refreshProviderStatus();accountMessage("Signed out.");}
  catch(error){accountMessage(error.message);}
});
apiEl("provider-setup-select").addEventListener("change",()=>providerMessage("Selected "+apiEl("provider-setup-select").value.toUpperCase()+"."));
apiEl("provider-save-key").addEventListener("click",async()=>{
  if(!currentUser){providerMessage("Sign in before connecting a provider.");return;}
  const provider=apiEl("provider-setup-select").value,apiKey=apiEl("provider-api-key").value.trim();
  if(!apiKey){providerMessage("Paste a provider key first.");return;}
  try{await apiRequest("/api/providers/"+provider+"/key",{method:"PUT",csrf:true,body:{apiKey}});apiEl("provider-api-key").value="";providerMessage(provider.toUpperCase()+" key encrypted and saved on the backend.");await refreshProviderStatus();}
  catch(error){providerMessage(error.message);}
});
apiEl("provider-remove-key").addEventListener("click",async()=>{
  if(!currentUser){providerMessage("Sign in first.");return;}
  const provider=apiEl("provider-setup-select").value;
  try{await apiRequest("/api/providers/"+provider+"/key",{method:"DELETE",csrf:true});providerMessage(provider.toUpperCase()+" disconnected.");await refreshProviderStatus();}
  catch(error){providerMessage(error.message);}
});
const MODEL_SUGGESTIONS={
 openai:["gpt-4o-mini","gpt-4.1-mini"],
 gemini:["gemini-2.5-flash","gemini-2.5-pro"],
 anthropic:["claude-sonnet-4-5","claude-haiku-4-5"],
 xai:["grok-3-mini","grok-3"],
 deepseek:["deepseek-chat","deepseek-reasoner"],
 mistral:["mistral-small-latest","mistral-large-latest"],
 openrouter:["openai/gpt-4o-mini","anthropic/claude-sonnet-4.5"],
 groq:["openai/gpt-oss-120b","llama-3.3-70b-versatile"],
 qwen:["qwen-plus","qwen-turbo"],
 perplexity:["sonar","sonar-pro"],
 together:["meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo"],
 fireworks:["accounts/fireworks/models/llama-v3p1-70b-instruct"]
};
function updateModelSuggestions(provider,fieldId="active-model"){
 const list=apiEl("provider-model-suggestions"),field=apiEl(fieldId),values=MODEL_SUGGESTIONS[provider]||[];
 if(list&&fieldId==="active-model"){list.replaceChildren();values.forEach(value=>{const option=document.createElement("option");option.value=value;list.append(option);});}
 if(field&&values.length&&(!field.value||field.dataset.providerDefault==="true"||field.dataset.providerDefault===provider)){
   field.value=values[0];field.dataset.providerDefault=provider;
 }
}
updateModelSuggestions(apiEl("active-provider").value);
apiEl("active-provider").addEventListener("change",()=>{
 const field=apiEl("active-model");field.dataset.providerDefault="true";updateModelSuggestions(apiEl("active-provider").value);refreshProviderStatus();
});
for(const id of ["battle-provider-a","battle-provider-b"]){
 apiEl(id).addEventListener("change",()=>{
  const suffix=id.endsWith("-a")?"a":"b",field=apiEl("battle-model-"+suffix),values=MODEL_SUGGESTIONS[apiEl(id).value]||[];
  if(values.length)field.value=values[0];
 });
}
function addChatMessage(label,content){
  const card=document.createElement("article");card.className="message "+(label==="YOU"?"user-message":"assistant-message");
  const heading=document.createElement("b");heading.textContent=label;
  const body=document.createElement("p");body.textContent=content;
  card.append(heading,body);messages.append(card);return card;
}
function detectMessageLanguage(value){
  const arabic=(value.match(/[\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF]/g)||[]).length;
  const letters=(value.match(/[\\p{L}]/gu)||[]).length;
  if(arabic>=2&&arabic/Math.max(letters,1)>=0.2)return "ar";
  return "en";
}
let activeReplyLanguage="en";
function addReplyPreferencePicker(question,currentAnswer,systemPrompt,anchorCard){
 const panel=document.createElement("details");panel.className="reply-preference";const summary=document.createElement("summary");summary.textContent="Which reply do you prefer?";panel.append(summary);
 const hint=document.createElement("p");hint.textContent="Compare a second answer when you want to help BrokenGPT learn your response style. A second AI request happens only when you tap the button.";panel.append(hint);
 const compare=document.createElement("button");compare.type="button";compare.textContent="Compare another reply";panel.append(compare);
 const choices=document.createElement("div");choices.className="reply-choice-grid";panel.append(choices);let busy=false;
 compare.addEventListener("click",async()=>{if(busy)return;busy=true;compare.disabled=true;compare.textContent="Generating option B…";try{
  const history=liveConversation.slice(0,-2);history.push(liveConversation.at(-2));
  const alternateSystem=systemPrompt+" For this comparison, create an alternative answer that is noticeably more detailed and includes useful examples, while staying accurate.";
  const data=await apiRequest("/api/chat",{method:"POST",csrf:true,body:{provider:apiEl("active-provider").value,model:apiEl("active-model").value.trim(),messages:[{role:"system",content:alternateSystem},...history]}});
  const alternate=data.reply||"No alternative answer was returned.";choices.replaceChildren();
  [[currentAnswer,"A · Current reply","balanced"],[alternate,"B · Detailed alternative","detailed"]].forEach(([answer,label,style],index)=>{
   const card=document.createElement("article");card.className="reply-choice";const heading=document.createElement("b");heading.textContent=label;const text=document.createElement("p");text.textContent=answer;const choose=document.createElement("button");choose.type="button";choose.textContent="I prefer "+(index===0?"A":"B");
   choose.addEventListener("click",()=>{localStorage.setItem("brokengpt-response-preference",style);liveConversation[liveConversation.length-1].content=answer;const p=anchorCard.querySelector("p");if(p)p.textContent=answer;panel.querySelector("summary").textContent="Preference saved: "+(style==="detailed"?"detailed answers":"balanced answers");choices.querySelectorAll("button").forEach(b=>b.disabled=true);});
   card.append(heading,text,choose);choices.append(card);
  });compare.textContent="Compare again";
 }catch(error){hint.textContent="Could not create the second reply: "+error.message;}finally{busy=false;compare.disabled=false;}});
 anchorCard.append(panel);
}
/* Live activity tracker: visible progress and genuine source links when a tool supplies them. */
const activityRoot=document.getElementById("live-activity");
let activeActivity=null,activeRequestController=null,activeRequestCancelled=false;
function activityStart(title="Working on your request"){
 if(!activityRoot)return null;activityRoot.replaceChildren();activityRoot.classList.remove("hidden");
 const details=document.createElement("details");details.className="activity-card";details.open=true;
 const summary=document.createElement("summary");summary.className="activity-summary";
 const icon=document.createElement("span");icon.className="activity-pulse";icon.setAttribute("aria-hidden","true");
 const label=document.createElement("span");label.className="activity-title";label.textContent=title;
 const state=document.createElement("span");state.className="activity-state";state.textContent="In progress";
 summary.append(icon,label,state);const cancel=document.createElement("button");cancel.type="button";cancel.className="activity-cancel";cancel.textContent="■ Stop";cancel.setAttribute("aria-label","Cancel current BrokenGPT task");cancel.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();if(activeRequestController&&!activeRequestController.signal.aborted){activeRequestCancelled=true;cancel.disabled=true;cancel.textContent="Stopping…";cancel.classList.add("is-stopping");activeRequestController.abort();activityStep("Cancellation requested by you","error");state.textContent="Stopping";state.classList.add("error");}});summary.append(cancel);details.append(summary);
 const steps=document.createElement("ol");steps.className="activity-steps";details.append(steps);
 const sources=document.createElement("div");sources.className="activity-sources";details.append(sources);
 activityRoot.append(details);activeActivity={details,steps,sources,state,title,done:false};activityStep(title);return activeActivity;
}
function activityStep(text,kind="progress"){
 if(!activeActivity)return;const li=document.createElement("li");li.className="activity-step "+kind;li.textContent=text;activeActivity.steps.append(li);activeActivity.details.open=true;
}
function activitySources(items){
 if(!activeActivity||!Array.isArray(items))return;activeActivity.sources.replaceChildren();
 const heading=document.createElement("b");heading.textContent="Sources opened";activeActivity.sources.append(heading);
 items.filter(x=>x&&typeof x.url==="string"&&/^https?:\/\//i.test(x.url)).forEach(item=>{
  let url;try{url=new URL(item.url)}catch{return;}
  const link=document.createElement("a");link.className="activity-source";link.href=url.href;link.target="_blank";link.rel="noopener noreferrer";
  const favicon=document.createElement("img");favicon.alt="";favicon.loading="lazy";favicon.width=20;favicon.height=20;favicon.src="https://www.google.com/s2/favicons?domain="+encodeURIComponent(url.hostname)+"&sz=32";
  const name=document.createElement("span");name.textContent=item.title||url.hostname;const domain=document.createElement("small");domain.textContent=url.hostname;link.append(favicon,name,domain);activeActivity.sources.append(link);
 });
}
function activityFinish(message="Finished"){
 if(!activeActivity)return;activityStep(message,"complete");activeActivity.state.textContent="Complete";activeActivity.state.classList.add("complete");activeActivity.done=true;activeActivity.details.open=false;activeActivity=null;
}
function activityFail(message){if(!activeActivity)return;activityStep(message,"error");activeActivity.state.textContent="Stopped";activeActivity.state.classList.add("error");activeActivity.details.open=true;activeActivity=null;}
async function sendChatMessage(value){
  addChatMessage("YOU",value);
  activeReplyLanguage=detectMessageLanguage(value);
  const provider=apiEl("active-provider").value,model=apiEl("active-model").value.trim();
  if(!currentUser){addChatMessage("BrokenGPT · AI SETUP","I received your message, but the AI service is not connected yet. In Settings, enter the deployed HTTPS backend URL, test it, then create/sign in to your account and connect a provider API key. After the status says the provider is connected, send your message again.");apiEl("active-provider-status").textContent="AI offline: backend/account/provider setup is incomplete.";return;}
  const button=document.getElementById("send-message");activeRequestController=new AbortController();activeRequestCancelled=false;refreshComposerControl();
  const typing=addChatMessage("BrokenGPT","Thinking…");typing.classList.add("typing-message");activityStart("BrokenGPT is working");activityStep("Thinking through your message");
  try{
    liveConversation.push({role:"user",content:value});activityStep("Preparing your AI request");activityStep("Connecting to the selected AI provider");
    const personality=prefs.personality||"BrokenGPT Default";
    const mode=apiEl("mode-select").value||"Balanced";
    const languageInstruction=activeReplyLanguage==="ar"?"The user's latest message is in Arabic. Reply naturally and fully in Arabic. Use Arabic for explanations and follow-up questions unless the user asks for another language.":"The user's latest message is in English or another non-Arabic language. Reply in the same language as the user's latest message. If uncertain, use English.";
    const learnedStyle=localStorage.getItem("brokengpt-response-preference")||"balanced";
    const system="You are BrokenGPT, the default AI assistant and coordinating intelligence across this app. Keep the BrokenGPT identity in chat and AI-powered workflows. "+languageInstruction+" Personality: "+personality+". Mode: "+mode+". Explanation level: "+(prefs.explanationLevel||"Adaptive")+". Response length: "+(prefs.responseLength||"Balanced")+". The user's learned response preference is "+learnedStyle+"; honor it unless the user asks otherwise. Be clear, safe, honest about uncertainty, and adapt explanations to the user's level.";
    const data=await apiRequest("/api/chat",{method:"POST",csrf:true,body:{provider,model,stream:true,messages:[{role:"system",content:system},...liveConversation]},signal:activeRequestController.signal,onToken:token=>{if(!activeActivity?.received){activityStep("Receiving the AI response");if(activeActivity)activeActivity.received=true;}const paragraph=typing.querySelector("p");if(paragraph){paragraph.textContent=paragraph.textContent==="Thinking…"?token:paragraph.textContent+token;typing.classList.remove("typing-message");}}});
    const streamedText=typing.querySelector("p")?.textContent||"";const answer=data.reply||streamedText||"(The provider returned an empty response.)";
    liveConversation.push({role:"assistant",content:answer});
    typing.remove();const assistantCard=addChatMessage("BrokenGPT",answer);addReplyPreferencePicker(value,answer,system,assistantCard);activityFinish("Reply delivered");speakAIReply(answer);
    const hist=readList("brokengpt-history");hist.push({title:value.slice(0,48),preview:"You: "+value+"\nBrokenGPT: "+answer.slice(0,700),time:new Date().toISOString()});writeList("brokengpt-history",hist);renderHistory();
  }catch(error){
    if(liveConversation.at(-1)?.role==="user")liveConversation.pop();
    typing.remove();if(activeRequestCancelled||error.name==="AbortError"){activityFail("Task cancelled. BrokenGPT stopped waiting for this response.");addChatMessage("BrokenGPT · CANCELLED","Cancelled by you. The app stopped this request; if the server had already begun processing it, cancellation may not reverse work already performed.");}else{activityFail(error.message);addChatMessage("BrokenGPT · CONNECTION",error.message+" Your message was not answered; fix the connection and tap send again.");apiEl("active-provider-status").textContent="AI request failed: "+error.message;}
  }finally{activeRequestController=null;activeRequestCancelled=false;refreshComposerControl();}
}
restoreAccount();



/* Stage 4B: independent model comparison and synthesis */
function battleUsage(usage){if(!usage)return"Usage details not provided by provider.";const inTokens=usage.prompt_tokens??usage.promptTokenCount,outTokens=usage.completion_tokens??usage.candidatesTokenCount;return [inTokens!=null?"Input: "+inTokens+" tokens":"",outTokens!=null?"Output: "+outTokens+" tokens":""].filter(Boolean).join(" · ")||"Usage details returned.";}
function battleRender(slot,title,answer,usage){apiEl("battle-"+slot+"-title").textContent=title;apiEl("battle-"+slot+"-result").textContent=answer;apiEl("battle-"+slot+"-usage").textContent=usage||"";}
apiEl("run-battle").addEventListener("click",async()=>{
  const prompt=apiEl("battle-prompt").value.trim();
  if(!prompt){apiEl("battle-status").textContent="Enter a prompt first.";return;}
  if(!currentUser){apiEl("battle-status").textContent="Sign in and connect your provider keys in Settings first.";return;}
  const a={provider:apiEl("battle-provider-a").value,model:apiEl("battle-model-a").value.trim()};
  const b={provider:apiEl("battle-provider-b").value,model:apiEl("battle-model-b").value.trim()};
  const synth=apiEl("battle-synthesizer").value==="a"?a:b;
  if(!a.model||!b.model){apiEl("battle-status").textContent="Enter a model ID for both models.";return;}
  const button=apiEl("run-battle");button.disabled=true;button.textContent="Battle running…";
  battleRender("a",a.provider.toUpperCase()+" · "+a.model,"Waiting for response…","");
  battleRender("b",b.provider.toUpperCase()+" · "+b.model,"Waiting for response…","");
  apiEl("battle-final-result").textContent="Waiting for both models…";
  apiEl("battle-status").textContent="Sending the same prompt to both models…";
  try{
    const ask=(slot,config)=>apiRequest("/api/chat",{method:"POST",csrf:true,body:{provider:config.provider,model:config.model,messages:[{role:"system",content:"You are an independent AI participant in BrokenGPT AI Battle. Answer the user's prompt carefully and clearly. Do not refer to another model's answer because you cannot see it."},{role:"user",content:prompt}]}});
    const results=await Promise.allSettled([ask("a",a),ask("b",b)]);
    const first=results[0].status==="fulfilled"?results[0].value:null;
    const second=results[1].status==="fulfilled"?results[1].value:null;
    battleRender("a",a.provider.toUpperCase()+" · "+a.model,first?.reply||("Request failed: "+results[0].reason.message),first?battleUsage(first.usage):"");
    battleRender("b",b.provider.toUpperCase()+" · "+b.model,second?.reply||("Request failed: "+results[1].reason.message),second?battleUsage(second.usage):"");
    if(!first&&!second){apiEl("battle-final-result").textContent="Neither model returned an answer. Check your provider connections and model IDs.";apiEl("battle-status").textContent="Battle failed.";return;}
    if(!first||!second){apiEl("battle-final-result").textContent="Only one model responded. The individual answer is shown above; synthesis was skipped because two answers are needed.";apiEl("battle-status").textContent="Partial result: one model request failed.";return;}
    apiEl("battle-status").textContent="Both models answered. Comparing and synthesizing…";
    const synthesis=await apiRequest("/api/chat",{method:"POST",csrf:true,body:{provider:synth.provider,model:synth.model,messages:[
      {role:"system",content:"You are the BrokenGPT AI Battle judge. Compare two independent answers to the same prompt. Identify agreement, meaningful differences, unsupported claims, and omissions. Then produce one clear, accurate, useful combined answer. Do not automatically prefer either model. Be honest about uncertainty and do not claim external verification."},
      {role:"user",content:"Original prompt:\n"+prompt+"\n\nModel A ("+a.provider+" / "+a.model+") answer:\n"+first.reply+"\n\nModel B ("+b.provider+" / "+b.model+") answer:\n"+second.reply+"\n\nCompare them briefly, then give the strongest combined answer."}
    ]}});
    apiEl("battle-final-result").textContent=synthesis.reply||"The synthesis model returned an empty response.";
    apiEl("battle-status").textContent="Battle complete. Two independent answers and one synthesis were generated.";
  }catch(error){apiEl("battle-final-result").textContent="Synthesis could not be completed: "+error.message;apiEl("battle-status").textContent="The battle stopped during synthesis.";}
  finally{button.disabled=false;button.textContent=" Run AI Battle";}
});



/* Stage 4C: device speech and hands-free voice conversation */
const SpeechRecognitionAPI=window.SpeechRecognition||window.webkitSpeechRecognition;
let speechRecognition=null;
const voiceStatus=message=>{const node=apiEl("voice-status");if(node)node.textContent=message;};
function beginVoiceListening(){if(!speechRecognition){voiceStatus("Speech recognition is unavailable in this browser.");voiceConversationActive=false;refreshComposerControl();return;}if(voiceMicMuted||!voiceConversationActive)return;try{speechRecognition.lang=document.documentElement.lang||"en";speechRecognition.start();}catch(error){voiceStatus("Could not start microphone: "+error.message);}}
function startVoiceConversation(){if(!SpeechRecognitionAPI){voiceStatus("Voice mode needs browser speech recognition. You can still type a message.");return;}voiceConversationActive=true;voiceMicMuted=false;apiEl("voice-auto-play").checked=true;refreshComposerControl();voiceStatus("Voice mode is on. Allow microphone access, then speak.");beginVoiceListening();}
function stopVoiceConversation(){voiceConversationActive=false;voiceMicMuted=false;if(speechRecognition)try{speechRecognition.stop();}catch{}if("speechSynthesis" in window)window.speechSynthesis.cancel();apiEl("voice-stop").disabled=true;voiceStatus("Voice conversation ended.");refreshComposerControl();}
if(SpeechRecognitionAPI){speechRecognition=new SpeechRecognitionAPI();speechRecognition.continuous=false;speechRecognition.interimResults=false;
 speechRecognition.onstart=()=>{apiEl("voice-input").disabled=true;voiceStatus(voiceConversationActive?"Voice conversation active. Speak naturally.":"Listening… speak your prompt.");};
 speechRecognition.onresult=event=>{const transcript=event.results?.[0]?.[0]?.transcript?.trim()||"";if(!transcript)return;if(voiceConversationActive){voiceStatus("You said: "+transcript);sendChatMessage(transcript);}else{const field=apiEl("prompt");field.value=(field.value?field.value+" ":"")+transcript;field.focus();refreshComposerControl();voiceStatus("Speech added to your message. Review it, then press Send.");}};
 speechRecognition.onerror=event=>{voiceStatus(event.error==="not-allowed"?"Microphone permission was denied. Type instead.":"Voice recognition error: "+event.error);if(event.error==="not-allowed")voiceConversationActive=false;};
 speechRecognition.onend=()=>{apiEl("voice-input").disabled=false;if(voiceConversationActive&&!voiceMicMuted&&!activeRequestController&&!window.speechSynthesis?.speaking){setTimeout(()=>{if(voiceConversationActive&&!voiceMicMuted)beginVoiceListening();},400);}};
}else{apiEl("voice-input").addEventListener("click",()=>voiceStatus("Voice input is not supported by this browser. Try a browser with speech recognition support."));}
apiEl("voice-input").addEventListener("click",()=>{if(voiceConversationActive){voiceMicMuted=!voiceMicMuted;if(voiceMicMuted&&speechRecognition)try{speechRecognition.stop();}catch{}refreshComposerControl();voiceStatus(voiceMicMuted?"Microphone muted. You can still type and send messages.":"Microphone unmuted. Listening again.");if(!voiceMicMuted&&!activeRequestController&&!window.speechSynthesis?.speaking)beginVoiceListening();}else{voiceConversationActive=false;voiceMicMuted=false;beginVoiceListening();}});
function speakAIReply(text){
  if(!apiEl("voice-auto-play").checked&&!voiceConversationActive)return;
  if(!("speechSynthesis" in window)||!("SpeechSynthesisUtterance" in window)){voiceStatus("Text-to-speech is not supported by this browser.");return;}
  window.speechSynthesis.cancel();
  const utterance=new SpeechSynthesisUtterance(text);
  utterance.lang=activeReplyLanguage==="ar"?"ar-IQ":document.documentElement.lang||"en";
  utterance.rate=Number(apiEl("voice-rate").value)||1;
  utterance.onstart=()=>{apiEl("voice-stop").disabled=false;voiceStatus("Reading the AI reply aloud with a device voice.");};
  utterance.onend=()=>{apiEl("voice-stop").disabled=true;voiceStatus("Voice playback finished.");if(voiceConversationActive&&!voiceMicMuted&&!activeRequestController)beginVoiceListening();};
  utterance.onerror=()=>{apiEl("voice-stop").disabled=true;voiceStatus("Voice playback stopped or unavailable.");};
  window.speechSynthesis.speak(utterance);
}
apiEl("voice-stop").addEventListener("click",stopVoiceConversation);



/* Stage 4D: OpenAI image and Sora video generation */
let latestImageDataUrl="",activeVideoId="",videoPollTimer=null,videoPollCount=0;
apiEl("generate-image").addEventListener("click",async()=>{
  const prompt=apiEl("image-prompt").value.trim();
  if(prompt.length<3){apiEl("image-status").textContent="Write a more detailed image prompt first.";return;}
  if(!currentUser){apiEl("image-status").textContent="Sign in and connect OpenAI in Settings first.";return;}
  if(!confirm("Image generation may use paid API credits. Continue only with permission from the account owner or parent/guardian."))return;
  const button=apiEl("generate-image");button.disabled=true;button.textContent="Generating…";apiEl("image-status").textContent="Sending your prompt to the image provider…";
  try{
    const data=await apiRequest("/api/creative/image",{method:"POST",csrf:true,body:{prompt,model:apiEl("image-model").value,size:apiEl("image-size").value,quality:apiEl("image-quality").value}});
    latestImageDataUrl=data.imageDataUrl;apiEl("generated-image").src=latestImageDataUrl;apiEl("image-output").classList.remove("hidden");
    apiEl("image-status").textContent="Image generated with "+data.model+". Review it before downloading.";
  }catch(error){apiEl("image-status").textContent=error.message;}
  finally{button.disabled=false;button.textContent="Generate image";}
});
apiEl("download-image").addEventListener("click",()=>{
  if(!latestImageDataUrl)return;const a=document.createElement("a");a.href=latestImageDataUrl;a.download="brokengpt-image.png";document.body.append(a);a.click();a.remove();
});
apiEl("video-model").addEventListener("change",()=>{
  const model=apiEl("video-model").value,size=apiEl("video-size");
  const values=model==="sora-2"?[["1280x720","Landscape 720p"],["720x1280","Portrait 720p"]]:[["1280x720","Landscape 720p"],["720x1280","Portrait 720p"],["1920x1080","Landscape 1080p"],["1080x1920","Portrait 1080p"],["1792x1024","Wide"],["1024x1792","Tall"]];
  size.replaceChildren(...values.map(([value,label])=>{const option=document.createElement("option");option.value=value;option.textContent=label;return option;}));
});
async function pollCreativeVideo(id){
  if(activeVideoId!==id)return;
  try{
    const data=await apiRequest("/api/creative/video/"+encodeURIComponent(id));
    apiEl("video-status").textContent="Video job "+data.status+" · "+Math.round(data.progress||0)+"%";
    if(data.status==="completed"){apiEl("video-status").textContent="Video is ready. You can download it now.";apiEl("download-video").disabled=false;return;}
    if(data.status==="failed"){apiEl("video-status").textContent="Video generation failed: "+(data.error||"The provider did not complete the job.");return;}
    videoPollCount++;
    if(videoPollCount<60)videoPollTimer=setTimeout(()=>pollCreativeVideo(id),5000);
    else apiEl("video-status").textContent="Still processing. Press Start only once; wait a little and check again later.";
  }catch(error){apiEl("video-status").textContent=error.message;}
}
apiEl("generate-video").addEventListener("click",async()=>{
  const prompt=apiEl("video-prompt").value.trim();
  if(prompt.length<3){apiEl("video-status").textContent="Write a video prompt first.";return;}
  if(!currentUser){apiEl("video-status").textContent="Sign in and connect OpenAI in Settings first.";return;}
  if(!confirm("Video generation may be costly and requires provider access. Continue only with permission from the adult account owner or parent/guardian?"))return;
  const button=apiEl("generate-video");button.disabled=true;button.textContent="Starting job…";apiEl("download-video").disabled=true;
  if(videoPollTimer)clearTimeout(videoPollTimer);activeVideoId="";videoPollCount=0;
  try{
    const data=await apiRequest("/api/creative/video",{method:"POST",csrf:true,body:{prompt,model:apiEl("video-model").value,size:apiEl("video-size").value,seconds:apiEl("video-seconds").value}});
    activeVideoId=data.id;apiEl("video-status").textContent="Video job created: "+data.status+". Checking progress…";
    pollCreativeVideo(activeVideoId);
  }catch(error){apiEl("video-status").textContent=error.message;}
  finally{button.disabled=false;button.textContent="Start video generation";}
});
apiEl("download-video").addEventListener("click",async()=>{
  if(!activeVideoId)return;
  const button=apiEl("download-video");button.disabled=true;apiEl("video-status").textContent="Preparing video download…";
  try{
    const response=await fetch("/api/creative/video/"+encodeURIComponent(activeVideoId)+"/content",{credentials:"same-origin"});
    if(!response.ok){const data=await response.json().catch(()=>({}));throw new Error(data.error||"Video download failed.");}
    const blob=await response.blob(),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="brokengpt-video.mp4";document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url);
    apiEl("video-status").textContent="Video download started.";
  }catch(error){apiEl("video-status").textContent=error.message;}
  finally{button.disabled=false;}
});


/* Hacking Center: local UI, honest capability boundaries, and offline notes */
(()=>{
 const $=id=>document.getElementById(id);
 const hackTabs=[...document.querySelectorAll("[data-hack-tab]")];
 hackTabs.forEach(tab=>tab.addEventListener("click",()=>{
   hackTabs.forEach(x=>x.classList.toggle("selected",x===tab));
   document.querySelectorAll(".hack-panel").forEach(panel=>panel.classList.toggle("active",panel.id==="hack-panel-"+tab.dataset.hackTab));
 }));
 function updateConnection(){
   const node=$("wifi-connection-status");if(!node)return;
   const online=navigator.onLine;
   const conn=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
   const details=[];
   if(conn?.effectiveType)details.push("browser estimate: "+conn.effectiveType);
   if(typeof conn?.downlink==="number")details.push("estimated downlink: "+conn.downlink+" Mbps");
   node.textContent=(online?"Browser reports internet connectivity.":"Browser reports offline.")+(details.length?" · "+details.join(" · "):"")+" This is not a Wi-Fi signal or speed test.";
 }
 $("wifi-check-connection")?.addEventListener("click",updateConnection);
 window.addEventListener("online",updateConnection);window.addEventListener("offline",updateConnection);updateConnection();
 const deviceKey="brokengpt-wifi-device-notes";
 function read(key){try{return JSON.parse(localStorage.getItem(key)||"[]")}catch{return[]}}
 function write(key,value){localStorage.setItem(key,JSON.stringify(value))}
 function renderDeviceNotes(){
   const box=$("wifi-device-notes");if(!box)return;box.replaceChildren();
   read(deviceKey).forEach((item,index)=>{
     const card=document.createElement("div");card.className="wifi-device-note";
     const name=document.createElement("b");name.textContent=item.name;
     const detail=document.createElement("small");detail.textContent=item.detail||"Manual note · not discovered by a network scan";
     const remove=document.createElement("button");remove.type="button";remove.className="secondary";remove.textContent="Remove note";
     remove.addEventListener("click",()=>{const list=read(deviceKey);list.splice(index,1);write(deviceKey,list);renderDeviceNotes()});
     card.append(name,detail,remove);box.append(card);
   });
 }
 $("wifi-add-device-note")?.addEventListener("click",()=>{
   const name=$("wifi-device-name").value.trim(),detail=$("wifi-device-detail").value.trim();
   if(!name){$("wifi-device-status").textContent="Enter a device label first.";return;}
   const list=read(deviceKey);list.push({name,detail});write(deviceKey,list);
   $("wifi-device-name").value="";$("wifi-device-detail").value="";
   $("wifi-device-status").textContent="Saved as a manual note. It was not detected by BrokenGPT.";
   renderDeviceNotes();
 });
 renderDeviceNotes();
 $("wifi-security-check")?.addEventListener("click",()=>{
   const mode=$("wifi-security-mode").value,result=$("wifi-security-result");
   const advice={
    wpa3:"Good choice: WPA3-Personal is the strongest common home Wi-Fi option. Use a unique router password and keep firmware updated.",
    wpa2:"WPA2-AES is generally acceptable for home use. Avoid TKIP and use a long, unique router password.",
    mixed:"WPA2/WPA3 mixed mode can help older devices connect. Prefer WPA3-only when all your devices support it.",
    wep:"This is outdated and unsafe. Ask the router administrator to change it to WPA2-AES or WPA3.",
    open:"An open network has no Wi-Fi password protection. Avoid using it for private activity and ask the administrator to enable modern security.",
    unknown:"Check the wireless security section in your router's official admin interface or ask the network administrator."
   };
   result.textContent=advice[mode]||"Choose a security setting first.";
 });
 $("remote-pair-preview")?.addEventListener("click",()=>{
   const name=$("remote-device-name").value.trim(),consent=$("remote-consent").checked,status=$("remote-status");
   if(!name){status.textContent="Enter a device name.";return;}
   if(!consent){status.textContent="Permission confirmation is required before any pairing request.";return;}
   status.textContent="Pairing preview for "+name+": a native companion app, authenticated encrypted connection, and approval on the target device are still required. No connection was made.";
 });
 const offlineKey="brokengpt-offline-notes";
 function renderOffline(){
   const box=$("offline-items");if(!box)return;box.replaceChildren();
   read(offlineKey).forEach((item,index)=>{
     const card=document.createElement("article");card.className="offline-item";
     const title=document.createElement("b");title.textContent=item.title;
     const body=document.createElement("p");body.textContent=item.content;body.style.whiteSpace="pre-wrap";
     const meta=document.createElement("small");meta.textContent="Saved on this device";
     const remove=document.createElement("button");remove.type="button";remove.className="secondary";remove.textContent="Delete";
     remove.addEventListener("click",()=>{const list=read(offlineKey);list.splice(index,1);write(offlineKey,list);renderOffline()});
     card.append(title,body,meta,remove);box.append(card);
   });
 }
 $("offline-save")?.addEventListener("click",()=>{
   const title=$("offline-title").value.trim()||"Offline note",content=$("offline-content").value.trim();
   if(!content){$("offline-status").textContent="Add some text before saving.";return;}
   const list=read(offlineKey);list.push({title,content,createdAt:new Date().toISOString()});write(offlineKey,list);
   $("offline-title").value="";$("offline-content").value="";
   $("offline-status").textContent="Saved. This note is stored locally and can be read offline in this browser.";
   renderOffline();
 });
 renderOffline();
/* Approved BrokenGPT update: composer actions, file attachment, and family shortcuts */
  const plus=document.getElementById("composer-plus");
  const menu=document.getElementById("composer-menu");
  const fileInput=document.getElementById("chat-file-input");
  const prompt=document.getElementById("prompt");
  if(!plus||!menu||!fileInput||!prompt)return;
  const closeMenu=()=>{menu.classList.add("hidden");plus.setAttribute("aria-expanded","false");};
  plus.addEventListener("click",()=>{
    const opening=menu.classList.contains("hidden");
    menu.classList.toggle("hidden",!opening);
    plus.setAttribute("aria-expanded",String(opening));
  });
  document.addEventListener("click",event=>{
    if(!event.target.closest(".composer-plus-wrap"))closeMenu();
  });
  menu.querySelectorAll("[data-composer-action]").forEach(button=>button.addEventListener("click",()=>{
    const action=button.dataset.composerAction;
    closeMenu();
    if(action==="image"){show("studio");document.getElementById("image-prompt")?.focus();return;}
    if(action==="video"){show("studio");document.getElementById("video-prompt")?.focus();return;}
    if(action==="upload"){fileInput.click();return;}
    if(action==="code"){setMode("Developer");show("chat");prompt.value=prompt.value||"Help me write and understand code for: ";prompt.focus();return;}
    if(action==="model3d"||action==="game"){
      show("studio");
      const status=document.getElementById("studio-feature-status");
      if(status)status.textContent=action==="model3d"?"3D generation and downloadable model export are not connected yet. This section is planned and is not a working generator.":"Game project generation and export are not connected yet. This section is planned and is not a working game builder.";
    }
  }));
  fileInput.addEventListener("change",async()=>{
    const file=fileInput.files?.[0];if(!file)return;
    if(file.size>8000){voiceStatus("That file is too large for the text attachment preview (limit: 8 KB).");fileInput.value="";return;}
    try{
      const text=await file.text();
      prompt.value=(prompt.value?prompt.value+"\n\n":"")+"[Attached text file: "+file.name+"]\n"+text;
      prompt.focus();
      voiceStatus("Text from "+file.name+" was added to your message. Review it before sending.");
    }catch{voiceStatus("Could not read that file. Try a plain-text file.");}
    fileInput.value="";
  });

})();


/* Study Mode: grade-aware tutoring with image and sampled-video-frame input. */
(()=>{
  const imageInput=apiEl("study-images"),videoInput=apiEl("study-video"),submit=apiEl("study-submit");
  if(!imageInput||!videoInput||!submit)return;
  const status=apiEl("study-status"),filesStatus=apiEl("study-files-status"),result=apiEl("study-result");
  const MAX_IMAGE_BYTES=12*1024*1024,MAX_VIDEO_BYTES=30*1024*1024;
  function dataUrlParts(dataUrl){const comma=dataUrl.indexOf(",");return{mimeType:(dataUrl.slice(5,comma).split(";")[0]||"image/jpeg"),data:dataUrl.slice(comma+1)};}
  function canvasAttachment(canvas,label){return{...dataUrlParts(canvas.toDataURL("image/jpeg",0.78)),label};}
  async function imageAttachment(file){
    if(file.size>MAX_IMAGE_BYTES)throw Error(file.name+" is larger than 12 MB.");
    const bitmap=await createImageBitmap(file),scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
    canvas.getContext("2d").drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close?.();
    return canvasAttachment(canvas,"Image: "+file.name);
  }
  function waitEvent(target,event){return new Promise((resolve,reject)=>{const done=()=>{cleanup();resolve();},bad=()=>{cleanup();reject(Error("Could not read the selected video."));},cleanup=()=>{target.removeEventListener(event,done);target.removeEventListener("error",bad);};target.addEventListener(event,done,{once:true});target.addEventListener("error",bad,{once:true});});}
  async function videoAttachments(file){
    if(file.size>MAX_VIDEO_BYTES)throw Error("The selected video is larger than 30 MB.");
    const url=URL.createObjectURL(file),video=document.createElement("video");video.preload="metadata";video.muted=true;video.playsInline=true;video.src=url;
    try{
      await waitEvent(video,"loadedmetadata");
      if(!Number.isFinite(video.duration)||video.duration<=0)throw Error("This video could not be opened.");
      const frames=[],times=[0.08,0.34,0.66,0.92].map(p=>Math.min(Math.max(0,video.duration*p),Math.max(0,video.duration-0.05)));
      for(let i=0;i<times.length;i++){
        const ready=waitEvent(video,"seeked");video.currentTime=times[i];await ready;
        const scale=Math.min(1,1280/Math.max(video.videoWidth,video.videoHeight));
        const canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(video.videoWidth*scale));canvas.height=Math.max(1,Math.round(video.videoHeight*scale));
        canvas.getContext("2d").drawImage(video,0,0,canvas.width,canvas.height);
        frames.push(canvasAttachment(canvas,"Video frame "+(i+1)+" from "+file.name+" at "+times[i].toFixed(1)+" seconds"));
      }
      return frames;
    }finally{URL.revokeObjectURL(url);video.removeAttribute("src");video.load();}
  }
  function refreshFilesStatus(){
    const pics=[...imageInput.files],video=videoInput.files[0];
    filesStatus.textContent=(pics.length?pics.length+" image(s): "+pics.map(f=>f.name).join(", "):"No images")+(video?" · Video: "+video.name:"")+". Video is analysed using sampled frames; audio is not processed.";
  }
  imageInput.addEventListener("change",()=>{if(imageInput.files.length>4){status.textContent="Choose up to 4 images per question.";imageInput.value="";}refreshFilesStatus();});
  videoInput.addEventListener("change",refreshFilesStatus);
  submit.addEventListener("click",async()=>{
    const prompt=apiEl("study-prompt").value.trim(),pics=[...imageInput.files],video=videoInput.files[0];
    if(!prompt&&!pics.length&&!video){status.textContent="Tell your tutor what you want to learn, or attach a lesson page/video.";return;}
    if(!currentUser){status.textContent="Please sign in first, then connect OpenAI or Gemini in Settings.";return;}
    submit.disabled=true;submit.textContent="Preparing your lesson…";result.classList.add("hidden");status.textContent="Preparing your attachments…";
    try{
      const attachments=[];
      for(const file of pics)attachments.push(await imageAttachment(file));
      if(video)attachments.push(...await videoAttachments(video));
      if(attachments.length>8)throw Error("This question contains too many images. Use up to 4 pictures and one short video.");
      const provider=apiEl("active-provider").value,model=apiEl("active-model").value.trim();
      const grade=apiEl("study-grade").value,subject=apiEl("study-subject").value.trim()||"Not specified",task=apiEl("study-task").value;
      const promptText=[task+".", "Student level: "+grade+".", "Subject: "+subject+".", "Student's question: "+(prompt||"Please explain the attached material.")].join("\n");
      status.textContent="Your tutor is working on it…";
      const data=await apiRequest("/api/study",{method:"POST",csrf:true,body:{provider,model,grade,subject,task,prompt:promptText,images:attachments}});
      result.replaceChildren();
      const heading=document.createElement("h2");heading.textContent="Your study explanation";
      const answer=document.createElement("p");answer.className="study-answer";answer.textContent=data.reply||"The tutor returned an empty answer.";
      result.append(heading,answer);result.classList.remove("hidden");
      status.textContent="Lesson ready · "+data.provider.toUpperCase()+" / "+data.model+". Ask another question whenever you're ready.";
      const history=readList("brokengpt-study-history");history.push({title:subject+" · "+grade,preview:promptText+"\n"+answer.textContent.slice(0,800),time:new Date().toISOString()});writeList("brokengpt-study-history",history);
    }catch(error){status.textContent=error.message;}
    finally{submit.disabled=false;submit.textContent=" Start studying";}
  });
})();


/* BrokenGPT premium interaction layer: message actions, long-press tools, and local feedback. */
(()=>{
 const host=document.getElementById("messages"),prompt=document.getElementById("prompt");
 if(!host||!prompt)return;
 const iconPaths={
  copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  volume:'<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7m3-10a9 9 0 0 1 0 13"/>',
  share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.7 10.7 6.6-4.4m-6.6 7 6.6 4.4"/>',
  bookmark:'<path d="M6 4h12v17l-6-4-6 4z"/>',
  like:'<path d="M7 10v11H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2zm0 0 5-8a3 3 0 0 1 2 3l-1 5h6a3 3 0 0 1 3 4l-2 6a3 3 0 0 1-3 2H7"/>',
  dislike:'<path d="M7 14V3H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2zm0 0 5 8a3 3 0 0 0 2-3l-1-5h6a3 3 0 0 0 3-4l-2-6a3 3 0 0 0-3-2H7"/>',
  more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  edit:'<path d="m15 5 4 4M4 20l4-.8L19 8a2.8 2.8 0 0 0-4-4L4 15z"/>',
  flag:'<path d="M5 21V4m0 1h13l-2 4 2 4H5"/>',
  refresh:'<path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.5 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.5-3"/>'
 };
 function makeIcon(name){const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");svg.setAttribute("viewBox","0 0 24 24");svg.setAttribute("width","18");svg.setAttribute("height","18");svg.setAttribute("fill","none");svg.setAttribute("stroke","currentColor");svg.setAttribute("stroke-width","1.8");svg.setAttribute("stroke-linecap","round");svg.setAttribute("stroke-linejoin","round");svg.innerHTML=iconPaths[name]||iconPaths.more;return svg;}
 function iconButton(action,label,icon){const b=document.createElement("button");b.type="button";b.className="message-action";b.dataset.action=action;b.setAttribute("aria-label",label);b.title=label;b.append(makeIcon(icon));return b;}
 function messageText(card){return card.querySelector(".message-content")?.textContent||card.querySelector("p")?.textContent||"";}
 async function copyText(value){try{await navigator.clipboard.writeText(value);announce("Copied to clipboard.");}catch{const field=document.createElement("textarea");field.value=value;field.style.position="fixed";field.style.opacity="0";document.body.append(field);field.select();const ok=document.execCommand("copy");field.remove();announce(ok?"Copied to clipboard.":"Copy is unavailable in this browser.");}}
 function announce(value){let node=document.getElementById("message-action-status");if(!node){node=document.createElement("div");node.id="message-action-status";node.className="visually-hidden";node.setAttribute("aria-live","polite");document.body.append(node);}node.textContent=value;}
 function readAloud(value){if(!("speechSynthesis" in window)||!("SpeechSynthesisUtterance" in window)){announce("Read aloud is not supported on this device.");return;}window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(value);u.lang=activeReplyLanguage==="ar"?"ar-IQ":document.documentElement.lang||"en";u.rate=Number(document.getElementById("voice-rate")?.value)||1;u.onstart=()=>announce("Reading message aloud.");u.onend=()=>announce("Finished reading.");u.onerror=()=>announce("Speech playback is unavailable.");window.speechSynthesis.speak(u);}
 async function shareText(value){if(navigator.share){try{await navigator.share({title:"BrokenGPT message",text:value});}catch(error){if(error.name!=="AbortError")announce("Sharing was not available.");}}else{await copyText(value);announce("Sharing is unavailable here; message copied instead.");}}
 function saveMessage(value){const saved=readList("brokengpt-favorites");if(!saved.some(x=>x.body===value)){saved.push({title:"Saved AI response",body:value,time:new Date().toISOString()});writeList("brokengpt-favorites",saved);if(typeof renderSaved==="function")renderSaved("brokengpt-favorites","favorites-list","favorite");}announce("Saved to your favorites.");}
 function closeMenus(){document.querySelectorAll(".message-action-menu").forEach(x=>x.remove());}
 function showMenu(card,kind){closeMenus();const menu=document.createElement("div");menu.className="message-action-menu";const actions=kind==="user"?[["volume","Read aloud"],["share","Share"],["copy","Copy"],["edit","Edit"],["more","More"]]:[["copy","Copy"],["volume","Read aloud"],["like","Like"],["dislike","Dislike"],["more","More"]];
 actions.forEach(([icon,label])=>{const b=iconButton(label.toLowerCase().replaceAll(" ","-"),label,icon);b.classList.add("menu-action");b.append(document.createTextNode(""));b.setAttribute("aria-label",label);b.title=label;menu.append(b);});
 menu.dataset.kind=kind;card.append(menu);menu.addEventListener("click",e=>{const b=e.target.closest("[data-action]");if(!b)return;perform(b.dataset.action,card);});
 }
 function perform(action,card){
  const value=messageText(card),user=card.classList.contains("user-message");
  if(action==="copy")copyText(value);
  else if(action==="volume"||action==="read-aloud")readAloud(value);
  else if(action==="share")shareText(value);
  else if(action==="save")saveMessage(value);
  else if(action==="like"||action==="dislike"){const prior=card.dataset.feedback||"";card.dataset.feedback=prior===action?"":action;card.querySelectorAll('[data-action="like"],[data-action="dislike"]').forEach(b=>b.classList.toggle("is-active",b.dataset.action===card.dataset.feedback));announce(card.dataset.feedback==="like"?"Feedback saved: liked.":card.dataset.feedback==="dislike"?"Feedback saved: disliked.":"Feedback cleared.");}
  else if(action==="edit"&&user){const index=[...host.children].indexOf(card);prompt.value=value;[...host.children].slice(index).forEach(node=>node.remove());if(Array.isArray(window.__brokenGPTConversation)){window.__brokenGPTConversation.splice(index); }if(typeof liveConversation!=="undefined")liveConversation=liveConversation.slice(0,index);prompt.focus();announce("Message ready to edit.");}
  else if(action==="regenerate"){const cards=[...host.children],lastUser=[...cards].reverse().find(x=>x.classList.contains("user-message"));if(lastUser){const text=messageText(lastUser),idx=cards.indexOf(lastUser);cards.slice(idx+1).forEach(x=>x.remove());if(typeof liveConversation!=="undefined")liveConversation=liveConversation.slice(0,Math.max(0,idx));sendChatMessage(text);}}
  else if(action==="more"){const menu=card.querySelector(".message-action-menu");if(menu){menu.replaceChildren();const extras=user?[["share","Share"],["copy","Copy"],["volume","Read aloud"]]:[["share","Share"],["save","Save"],["regenerate","Regenerate"]];extras.forEach(([ico,label])=>{const b=iconButton(ico,label,ico==="regenerate"?"refresh":ico);b.classList.add("menu-action");menu.append(b);});return;}}
  closeMenus();
 }
 const originalAdd=window.addChatMessage;
 if(typeof originalAdd==="function"){
  window.addChatMessage=function(label,content){
   const card=originalAdd(label,content),isUser=label==="YOU",p=card.querySelector("p");
   if(p){p.classList.add("message-content");}
   card.dataset.messageRole=isUser?"user":"assistant";
   const bar=document.createElement("div");bar.className="message-toolbar";
   if(isUser){bar.append(iconButton("more","Message options","more"));}
   else{bar.append(iconButton("copy","Copy","copy"),iconButton("volume","Read aloud","volume"),iconButton("like","Like","like"),iconButton("dislike","Dislike","dislike"),iconButton("more","More options","more"));}
   card.append(bar);
   bar.addEventListener("click",e=>{const b=e.target.closest("[data-action]");if(b)perform(b.dataset.action,card);});
   let holdTimer=null,didHold=false;
   card.addEventListener("pointerdown",e=>{if(e.pointerType==="mouse"&&e.button!==0)return;didHold=false;holdTimer=setTimeout(()=>{didHold=true;showMenu(card,isUser?"user":"assistant");},520);});
   ["pointerup","pointerleave","pointercancel"].forEach(type=>card.addEventListener(type,()=>{if(holdTimer)clearTimeout(holdTimer);}));
   card.addEventListener("contextmenu",e=>{e.preventDefault();showMenu(card,isUser?"user":"assistant");});
   card.addEventListener("click",e=>{if(didHold){e.preventDefault();e.stopPropagation();didHold=false;}});
   return card;
  };
 }
 document.addEventListener("click",e=>{if(!e.target.closest(".message-action-menu")&&!e.target.closest(".message-toolbar"))closeMenus();});
 document.addEventListener("keydown",e=>{if(e.key==="Escape")closeMenus();});
})();

/* Monster-machine identity: accessible industrial emblem and polished navigation behavior. */
(()=>{
 const header=document.querySelector("header"),brand=document.querySelector(".header-brand");
 if(brand&&!document.querySelector(".monster-emblem")){const mark=document.createElement("span");mark.className="monster-emblem";mark.setAttribute("aria-hidden","true");mark.innerHTML='<svg viewBox="0 0 40 40"><path d="M7 14 3 4l12 6 5-4 5 4 12-6-4 13 2 13-8-4-5 7-5-7-8 4 2-13Z"/><path d="m12 20 5 2m11-2-5 2M17 28l3 2 3-2"/></svg>';brand.before(mark);}
 const drawer=document.getElementById("app-drawer"),toggle=document.getElementById("drawer-toggle");
 if(drawer&&toggle){toggle.setAttribute("aria-controls","app-drawer");toggle.setAttribute("aria-label","Open tools drawer");}
})();


/* Offline toolbox: local-only utilities; no API or network requests. */
(()=>{
 const byId=id=>document.getElementById(id);
 const calcInput=byId("offline-calc-input");
 const calcResult=byId("offline-calc-result");
 function calculate(expression){
  const tokens=expression.match(/\d+(?:\.\d+)?|[()+*/^%-]|\s+/g);
  if(!tokens||tokens.join("").replace(/\s+/g,"")!==expression.replace(/\s+/g,""))throw new Error("Use numbers and + − × ÷ ( ) ^ only.");
  const t=tokens.filter(x=>!/^\s+$/.test(x));let i=0;
  function primary(){const x=t[i++];if(x==="("){const v=sum();if(t[i++]!==")")throw new Error("Missing closing bracket.");return v;}if(x==="-" )return -primary();if(x==="+")return primary();const n=Number(x);if(!Number.isFinite(n))throw new Error("Invalid number.");return n;}
  function power(){let v=primary();if(t[i]==="^"){i++;v=Math.pow(v,power());}return v;}
  function product(){let v=power();while(["*","/","%"].includes(t[i])){const op=t[i++],n=power();if((op==="/"||op==="%")&&n===0)throw new Error("Cannot divide by zero.");v=op==="*"?v*n:op==="/"?v/n:v%n;}return v;}
  function sum(){let v=product();while(["+","-"].includes(t[i])){const op=t[i++],n=product();v=op==="+"?v+n:v-n;}return v;}
  const result=sum();if(i!==t.length||!Number.isFinite(result))throw new Error("Check your expression.");return result;
 }
 byId("offline-calc-run")?.addEventListener("click",()=>{try{calcResult.textContent="Result: "+calculate(calcInput.value.trim());}catch(e){calcResult.textContent=e.message;}});
 byId("offline-password-generate")?.addEventListener("click",()=>{
  const length=Number(byId("offline-password-length").value);
  if(!Number.isInteger(length)||length<12||length>64){byId("offline-password-status").textContent="Choose a length from 12 to 64.";return;}
  const chars="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*_-+=";
  const random=new Uint32Array(length);crypto.getRandomValues(random);
  byId("offline-password-result").value=Array.from(random,n=>chars[n%chars.length]).join("");
  byId("offline-password-status").textContent="Generated on this device. Copy and store it securely.";
 });
 byId("offline-password-copy")?.addEventListener("click",async()=>{const value=byId("offline-password-result").value;if(!value)return;try{await navigator.clipboard.writeText(value);byId("offline-password-status").textContent="Copied.";}catch{byId("offline-password-status").textContent="Clipboard unavailable. Select and copy it manually.";}});
 const encoder=new TextEncoder(),decoder=new TextDecoder();
 byId("offline-base64-encode")?.addEventListener("click",()=>{try{const bytes=encoder.encode(byId("offline-base64-input").value);let binary="";bytes.forEach(b=>binary+=String.fromCharCode(b));byId("offline-base64-input").value=btoa(binary);byId("offline-base64-status").textContent="Encoded locally.";}catch{byId("offline-base64-status").textContent="Could not encode this text.";}});
 byId("offline-base64-decode")?.addEventListener("click",()=>{try{const binary=atob(byId("offline-base64-input").value.trim());const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));byId("offline-base64-input").value=decoder.decode(bytes);byId("offline-base64-status").textContent="Decoded locally.";}catch{byId("offline-base64-status").textContent="Invalid Base64 or unsupported text.";}});
 byId("offline-hash-run")?.addEventListener("click",async()=>{try{if(!crypto.subtle)throw new Error("Secure local crypto is unavailable in this browser.");const digest=await crypto.subtle.digest("SHA-256",encoder.encode(byId("offline-hash-input").value));byId("offline-hash-result").value=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");byId("offline-hash-status").textContent="Calculated locally.";}catch(e){byId("offline-hash-status").textContent=e.message;}});
})();

// Local task center: persist task titles/status and a concise user-visible activity log.
(()=>{
 const $=id=>document.getElementById(id);
 const STORE="brokengpt-local-tasks-v1";
 let tasks=[];
 try{const saved=JSON.parse(localStorage.getItem(STORE)||"[]");if(Array.isArray(saved))tasks=saved;}catch{}
 const escapeText=value=>String(value).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#39;"}[ch]));
 const save=()=>{try{localStorage.setItem(STORE,JSON.stringify(tasks));}catch{$("task-create-status").textContent="Storage is unavailable; tasks may not persist.";}};
 const render=()=>{
  const list=$("task-list"),log=$("task-activity-log"),summary=$("task-activity-summary");if(!list||!log||!summary)return;
  if(!tasks.length){list.innerHTML='<p class="status">No tasks yet. Add one above.</p>';log.innerHTML='<li>No activity yet.</li>';summary.textContent="No activity yet.";return;}
  list.innerHTML=tasks.map(task=>'<article class="task-item"><div class="task-item-head"><b>'+escapeText(task.title)+'</b><span class="task-state task-state-'+task.status+'">'+escapeText(task.status)+'</span></div><p class="status">Added '+escapeText(task.created)+' · '+(task.status==="completed"?"Marked complete by you":"Waiting for an AI task runner; no action has been executed")+'</p><div class="task-actions">'+(task.status!=="completed"?'<button type="button" data-task-complete="'+task.id+'" class="secondary">Mark completed</button>':'')+'<button type="button" data-task-remove="'+task.id+'" class="secondary">Remove</button></div></article>').join("");
  log.innerHTML=tasks.slice().reverse().slice(0,8).map(task=>'<li><b>'+escapeText(task.title)+'</b> — '+escapeText(task.status)+'.</li>').join("");
  summary.textContent=tasks.filter(t=>t.status==="queued").length+" queued · "+tasks.filter(t=>t.status==="completed").length+" completed · saved locally";
 };
 $("task-add")?.addEventListener("click",()=>{const title=$("task-title").value.trim();if(!title){$("task-create-status").textContent="Enter a task first.";return;}tasks.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,7),title,created:new Date().toLocaleString(),status:"queued"});$("task-title").value="";save();render();$("task-create-status").textContent="Saved. It is queued for future AI task-runner integration; it has not been executed.";});
 $("task-list")?.addEventListener("click",event=>{const complete=event.target.closest("[data-task-complete]"),remove=event.target.closest("[data-task-remove]");if(complete){const task=tasks.find(t=>t.id===complete.dataset.taskComplete);if(task)task.status="completed";}else if(remove){tasks=tasks.filter(t=>t.id!==remove.dataset.taskRemove);}else return;save();render();});
 render();
})();
