'use strict';
require('dotenv').config();
const crypto=require('node:crypto'),path=require('node:path'),fs=require('node:fs');
const express=require('express'),helmet=require('helmet'),cookieParser=require('cookie-parser'),Database=require('better-sqlite3');
const {rateLimit}=require('express-rate-limit');
const app=express(),PORT=Number(process.env.PORT||3000),ROOT=path.resolve(__dirname,'..');
const DATA=path.join(__dirname,'data'),DBFILE=path.join(DATA,'brokengpt.sqlite');
const SESSION_MS=30*24*60*60*1000,COOKIE='brokengpt_session',PROD=process.env.NODE_ENV==='production';
if(process.env.TRUST_PROXY==='1')app.set('trust proxy',1);
fs.mkdirSync(DATA,{recursive:true,mode:0o700});
const db=new Database(DBFILE);db.pragma('journal_mode=WAL');db.pragma('foreign_keys=ON');
db.exec(`
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,username TEXT NOT NULL COLLATE NOCASE UNIQUE,password_salt TEXT NOT NULL,password_hash TEXT NOT NULL,created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,csrf_hash TEXT NOT NULL,expires_at INTEGER NOT NULL,created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
CREATE TABLE IF NOT EXISTS provider_keys(user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,provider TEXT NOT NULL,encrypted_value TEXT NOT NULL,iv TEXT NOT NULL,auth_tag TEXT NOT NULL,updated_at INTEGER NOT NULL,PRIMARY KEY(user_id,provider));
`);
const key=()=>/^[a-f0-9]{64}$/i.test(process.env.BROKENGPT_ENCRYPTION_KEY||'')?Buffer.from(process.env.BROKENGPT_ENCRYPTION_KEY,'hex'):null;
const sha=v=>crypto.createHash('sha256').update(v).digest('hex');
const cookieOptions=()=>({httpOnly:true,secure:PROD,sameSite:'strict',path:'/',maxAge:SESSION_MS});
const fail=(res,status,error)=>res.status(status).json({error});
function encrypt(value){const k=key();if(!k)throw Error('Encryption is not configured');const iv=crypto.randomBytes(12),c=crypto.createCipheriv('aes-256-gcm',k,iv),data=Buffer.concat([c.update(value,'utf8'),c.final()]);return{encrypted_value:data.toString('base64'),iv:iv.toString('base64'),auth_tag:c.getAuthTag().toString('base64')};}
function decrypt(row){const k=key();if(!k)throw Error('Encryption is not configured');const d=crypto.createDecipheriv('aes-256-gcm',k,Buffer.from(row.iv,'base64'));d.setAuthTag(Buffer.from(row.auth_tag,'base64'));return Buffer.concat([d.update(Buffer.from(row.encrypted_value,'base64')),d.final()]).toString('utf8');}
function newSession(userId,res){const token=crypto.randomBytes(32).toString('base64url'),csrf=crypto.randomBytes(24).toString('base64url'),now=Date.now();db.prepare('INSERT INTO sessions VALUES(?,?,?,?,?)').run(sha(token),userId,sha(csrf),now+SESSION_MS,now);res.cookie(COOKIE,token,cookieOptions());return csrf;}
function auth(req,res,next){const token=req.cookies?.[COOKIE];if(!token)return fail(res,401,'Please sign in first.');const row=db.prepare('SELECT s.token_hash,s.user_id,s.csrf_hash,s.expires_at,u.username FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=?').get(sha(token));if(!row||row.expires_at<Date.now()){if(row)db.prepare('DELETE FROM sessions WHERE token_hash=?').run(row.token_hash);res.clearCookie(COOKIE,cookieOptions());return fail(res,401,'Your session expired. Please sign in again.');}req.auth=row;next();}
function csrf(req,res,next){const supplied=req.get('x-csrf-token')||'';const a=Buffer.from(sha(supplied)),b=Buffer.from(req.auth.csrf_hash);if(!supplied||a.length!==b.length||!crypto.timingSafeEqual(a,b))return fail(res,403,'Security check failed. Refresh the page and try again.');next();}
const PROVIDERS=Object.freeze({
  openai:{kind:'openai',url:'https://api.openai.com/v1/chat/completions'},
  gemini:{kind:'gemini'},
  anthropic:{kind:'anthropic',url:'https://api.anthropic.com/v1/messages'},
  xai:{kind:'compatible',url:'https://api.x.ai/v1/chat/completions'},
  deepseek:{kind:'compatible',url:'https://api.deepseek.com/chat/completions'},
  mistral:{kind:'compatible',url:'https://api.mistral.ai/v1/chat/completions'},
  openrouter:{kind:'compatible',url:'https://openrouter.ai/api/v1/chat/completions'},
  groq:{kind:'compatible',url:'https://api.groq.com/openai/v1/chat/completions'},
  qwen:{kind:'compatible',url:'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions'},
  perplexity:{kind:'compatible',url:'https://api.perplexity.ai/chat/completions'},
  together:{kind:'compatible',url:'https://api.together.xyz/v1/chat/completions'},
  fireworks:{kind:'compatible',url:'https://api.fireworks.ai/inference/v1/chat/completions'}
});
const provider=v=>typeof v==='string'&&Object.prototype.hasOwnProperty.call(PROVIDERS,v)?v:null;
function messagesOk(items){if(!Array.isArray(items)||!items.length||items.length>40)return null;const out=[];for(const m of items){if(!m||!['user','assistant','system'].includes(m.role)||typeof m.content!=='string'||m.content.length>12000)return null;out.push({role:m.role,content:m.content});}return out;}
app.disable('x-powered-by');app.use(cookieParser());app.use(helmet({crossOriginResourcePolicy:{policy:'same-origin'},contentSecurityPolicy:{directives:{'style-src':["'self'","'unsafe-inline'"],'img-src':["'self'",'data:','blob:']}}}));app.use(express.json({limit:'28mb',strict:true}));
app.use((req,res,next)=>/^\/(?:backend|node_modules|\.env|package\.json)(?:\/|$)/i.test(req.path)?res.sendStatus(404):next());
const authLimit=rateLimit({windowMs:15*60*1000,limit:8,standardHeaders:'draft-7',legacyHeaders:false});
const apiLimit=rateLimit({windowMs:60*1000,limit:30,standardHeaders:'draft-7',legacyHeaders:false});
app.get('/api/health',(_req,res)=>res.json({ok:true,service:'BROKENGPT API',version:'0.1.0'}));
app.post('/api/auth/register',authLimit,(req,res)=>{const username=typeof req.body?.username==='string'?req.body.username.trim():'';const password=typeof req.body?.password==='string'?req.body.password:'';if(!/^[a-zA-Z0-9_]{3,24}$/.test(username))return fail(res,400,'Username must be 3–24 characters using letters, numbers, or underscores.');if(password.length<10||password.length>128)return fail(res,400,'Password must be 10–128 characters.');const salt=crypto.randomBytes(16),passwordHash=crypto.scryptSync(password,salt,64).toString('hex'),id=crypto.randomUUID();try{db.prepare('INSERT INTO users VALUES(?,?,?,?,?)').run(id,username,salt.toString('hex'),passwordHash,Date.now());}catch(e){if(String(e.code).includes('SQLITE_CONSTRAINT'))return fail(res,409,'That username is already taken.');throw e;}res.status(201).json({user:{id,username},csrfToken:newSession(id,res)});});
app.post('/api/auth/login',authLimit,(req,res)=>{const username=typeof req.body?.username==='string'?req.body.username.trim():'';const password=typeof req.body?.password==='string'?req.body.password:'';const u=db.prepare('SELECT id,username,password_salt,password_hash FROM users WHERE username=? COLLATE NOCASE').get(username);const salt=u?Buffer.from(u.password_salt,'hex'):Buffer.alloc(16),expected=u?Buffer.from(u.password_hash,'hex'):Buffer.alloc(64),actual=crypto.scryptSync(password.slice(0,128),salt,64);if(!u||!crypto.timingSafeEqual(actual,expected))return fail(res,401,'Username or password is incorrect.');res.json({user:{id:u.id,username:u.username},csrfToken:newSession(u.id,res)});});
app.get('/api/auth/me',auth,(req,res)=>{const token=crypto.randomBytes(24).toString('base64url');db.prepare('UPDATE sessions SET csrf_hash=? WHERE token_hash=?').run(sha(token),req.auth.token_hash);res.json({user:{id:req.auth.user_id,username:req.auth.username},csrfToken:token});});
app.post('/api/auth/logout',auth,csrf,(req,res)=>{db.prepare('DELETE FROM sessions WHERE token_hash=?').run(req.auth.token_hash);res.clearCookie(COOKIE,cookieOptions());res.json({ok:true});});
app.get('/api/providers',auth,(req,res)=>{const rows=db.prepare('SELECT provider,updated_at FROM provider_keys WHERE user_id=?').all(req.auth.user_id),map=Object.fromEntries(rows.map(r=>[r.provider,{connected:true,updatedAt:r.updated_at}]));res.json({providers:Object.fromEntries(Object.keys(PROVIDERS).map(name=>[name,map[name]||{connected:false}]))});});
app.put('/api/providers/:provider/key',auth,csrf,(req,res)=>{const p=provider(req.params.provider),apiKey=typeof req.body?.apiKey==='string'?req.body.apiKey.trim():'';if(!p)return fail(res,404,'Provider is not supported yet.');if(apiKey.length<12||apiKey.length>500||/\s/.test(apiKey))return fail(res,400,'Enter a valid provider API key.');let secret;try{secret=encrypt(apiKey);}catch{return fail(res,503,'Provider key storage is not configured on this server yet.');}db.prepare('INSERT INTO provider_keys(user_id,provider,encrypted_value,iv,auth_tag,updated_at) VALUES(@user_id,@provider,@encrypted_value,@iv,@auth_tag,@updated_at) ON CONFLICT(user_id,provider) DO UPDATE SET encrypted_value=excluded.encrypted_value,iv=excluded.iv,auth_tag=excluded.auth_tag,updated_at=excluded.updated_at').run({user_id:req.auth.user_id,provider:p,...secret,updated_at:Date.now()});res.json({ok:true,provider:p,message:'Provider key encrypted and saved on this server.'});});
app.delete('/api/providers/:provider/key',auth,csrf,(req,res)=>{const p=provider(req.params.provider);if(!p)return fail(res,404,'Provider is not supported yet.');db.prepare('DELETE FROM provider_keys WHERE user_id=? AND provider=?').run(req.auth.user_id,p);res.json({ok:true,provider:p});});

function studyImagesOk(items){
  if(items===undefined)return [];
  if(!Array.isArray(items)||items.length>8)return null;
  let total=0;const out=[];
  for(const item of items){
    if(!item||!['image/jpeg','image/png','image/webp'].includes(item.mimeType)||typeof item.data!=='string'||!/^([A-Za-z0-9+/]+={0,2})$/.test(item.data))return null;
    if(item.data.length>4_500_000)return null;
    total+=item.data.length;if(total>22_000_000)return null;
    out.push({mimeType:item.mimeType,data:item.data,label:typeof item.label==='string'?item.label.slice(0,160):'Study attachment'});
  }
  return out;
}
app.post('/api/study',auth,csrf,apiLimit,async(req,res)=>{
  const p=provider(req.body?.provider),model=typeof req.body?.model==='string'?req.body.model.trim():'';
  const prompt=typeof req.body?.prompt==='string'?req.body.prompt.trim():'';
  const grade=typeof req.body?.grade==='string'?req.body.grade.slice(0,80):'Not specified';
  const subject=typeof req.body?.subject==='string'?req.body.subject.slice(0,100):'Not specified';
  const images=studyImagesOk(req.body?.images);
  if(!['openai','gemini'].includes(p))return fail(res,400,'Study Mode image requests currently support OpenAI or Gemini only.');
  if(!/^[a-zA-Z0-9._:-]{2,100}$/.test(model))return fail(res,400,'Enter a valid model identifier.');
  if(prompt.length<3||prompt.length>9000)return fail(res,400,'Your study question must be 3–9,000 characters.');
  if(!images)return fail(res,400,'Use up to 8 supported images (JPEG, PNG, or WebP), with a total upload size under 22 MB.');
  const row=db.prepare('SELECT * FROM provider_keys WHERE user_id=? AND provider=?').get(req.auth.user_id,p);
  if(!row)return fail(res,400,'Connect this provider in Settings first.');
  let secret;try{secret=decrypt(row);}catch{return fail(res,503,'The server cannot decrypt the saved provider key.');}
  const tutor='You are BROKENGPT Study Mode, a patient and encouraging tutor. Teach at the learner level: '+grade+'. Subject: '+subject+'. Start with a simple explanation, then break the idea into small steps, define unfamiliar words, and give a worked example where useful. If the learner attached textbook pages, homework, diagrams, or video frames, inspect them carefully and explain what is actually visible. Do not invent unreadable text; ask for a clearer image when needed. Do not simply give homework answers: show the method and help the learner understand. Adapt to the requested task. For quizzes, ask one question at a time and wait for the learner. Be supportive, never shame the learner, and keep the answer organized.';
  try{
    let response,data,reply='';
    if(p==='openai'){
      const content=[{type:'text',text:prompt},...images.map(img=>({type:'image_url',image_url:{url:'data:'+img.mimeType+';base64,'+img.data,detail:'high'}}))];
      response=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+secret,'Content-Type':'application/json'},body:JSON.stringify({model,messages:[{role:'system',content:tutor},{role:'user',content}],max_tokens:2400}),signal:AbortSignal.timeout(90000)});
      data=await response.json().catch(()=>({}));
      if(!response.ok)return fail(res,response.status===401?401:502,data.error?.message||'Study request failed. Check whether this model supports image input and your provider usage limits.');
      reply=data.choices?.[0]?.message?.content||'';
      if(Array.isArray(reply))reply=reply.map(part=>part.text||'').join('\n');
      return res.json({provider:p,model,reply,usage:data.usage||null});
    }
    const parts=[{text:prompt},...images.map(img=>({inlineData:{mimeType:img.mimeType,data:img.data}}))];
    response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':secret},body:JSON.stringify({systemInstruction:{parts:[{text:tutor}]},contents:[{role:'user',parts}],generationConfig:{maxOutputTokens:2400}}),signal:AbortSignal.timeout(90000)});
    data=await response.json().catch(()=>({}));
    if(!response.ok)return fail(res,[401,403].includes(response.status)?401:502,data.error?.message||'Study request failed. Check image support for this Gemini model and your usage limits.');
    reply=(data.candidates?.[0]?.content?.parts||[]).map(x=>x.text||'').join('\n');
    return res.json({provider:p,model,reply,usage:data.usageMetadata||null});
  }catch(error){return fail(res,502,error.name==='TimeoutError'?'The tutor took too long to respond. Try a smaller attachment or another model.':'Could not reach the AI provider. Try again later.');}
});

app.post('/api/chat',auth,csrf,apiLimit,async(req,res)=>{
  const p=provider(req.body?.provider),model=typeof req.body?.model==='string'?req.body.model.trim():'',msgs=messagesOk(req.body?.messages);
  if(!p)return fail(res,400,'Choose a supported AI provider.');
  if(!/^[a-zA-Z0-9._:/-]{2,160}$/.test(model))return fail(res,400,'Enter a valid model identifier.');
  if(!msgs)return fail(res,400,'Messages must contain 1–40 valid entries, each under 12,000 characters.');
  const row=db.prepare('SELECT * FROM provider_keys WHERE user_id=? AND provider=?').get(req.auth.user_id,p);
  if(!row)return fail(res,400,'Connect this provider in Settings first.');
  let secret;try{secret=decrypt(row);}catch{return fail(res,503,'The server cannot decrypt the saved provider key. Check its encryption configuration.');}
  try{
    let response,data,reply='';
    if(p==='openai'){
      response=await fetch(PROVIDERS.openai.url,{method:'POST',headers:{Authorization:'Bearer '+secret,'Content-Type':'application/json'},body:JSON.stringify({model,messages:msgs,max_tokens:1800}),signal:AbortSignal.timeout(60000)});
      data=await response.json().catch(()=>({}));
      if(!response.ok)return fail(res,[401,403].includes(response.status)?401:502,data.error?.message||'OpenAI request failed. Check the key, model, and usage limits.');
      return res.json({provider:p,model,reply:data.choices?.[0]?.message?.content||'',usage:data.usage||null});
    }
    if(p==='gemini'){
      const contents=msgs.filter(m=>m.role!=='system').map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]})),system=msgs.filter(m=>m.role==='system').map(m=>m.content).join('\n\n'),body={contents,generationConfig:{maxOutputTokens:1800}};
      if(system)body.systemInstruction={parts:[{text:system}]};
      response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':secret},body:JSON.stringify(body),signal:AbortSignal.timeout(60000)});
      data=await response.json().catch(()=>({}));
      if(!response.ok)return fail(res,[401,403].includes(response.status)?401:502,data.error?.message||'Gemini request failed. Check the key, model, and usage limits.');
      reply=(data.candidates?.[0]?.content?.parts||[]).map(x=>x.text||'').join('\n');
      return res.json({provider:p,model,reply,usage:data.usageMetadata||null});
    }
    if(p==='anthropic'){
      const system=msgs.filter(m=>m.role==='system').map(m=>m.content).join('\n\n');
      const body={model,max_tokens:1800,messages:msgs.filter(m=>m.role!=='system').map(m=>({role:m.role,content:m.content}))};
      if(system)body.system=system;
      response=await fetch(PROVIDERS.anthropic.url,{method:'POST',headers:{'x-api-key':secret,'anthropic-version':'2023-06-01','Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(60000)});
      data=await response.json().catch(()=>({}));
      if(!response.ok)return fail(res,[401,403].includes(response.status)?401:502,data.error?.message||'Claude request failed. Check the key, model, and usage limits.');
      reply=(data.content||[]).filter(x=>x.type==='text').map(x=>x.text||'').join('\n');
      return res.json({provider:p,model,reply,usage:data.usage||null});
    }
    const config=PROVIDERS[p];
    response=await fetch(config.url,{method:'POST',headers:{Authorization:'Bearer '+secret,'Content-Type':'application/json'},body:JSON.stringify({model,messages:msgs,max_tokens:1800}),signal:AbortSignal.timeout(60000)});
    data=await response.json().catch(()=>({}));
    if(!response.ok)return fail(res,[401,403].includes(response.status)?401:502,data.error?.message||p.toUpperCase()+' request failed. Check the key, model ID, and provider usage limits.');
    reply=data.choices?.[0]?.message?.content||'';
    return res.json({provider:p,model,reply,usage:data.usage||null});
  }catch(e){
    return fail(res,502,e.name==='TimeoutError'?'The provider took too long to respond. Try again.':'Could not reach the AI provider. Try again later.');
  }
});

const mediaLimit=rateLimit({windowMs:60*60*1000,limit:5,standardHeaders:'draft-7',legacyHeaders:false});
function openAIKeyFor(userId){const row=db.prepare('SELECT * FROM provider_keys WHERE user_id=? AND provider=?').get(userId,'openai');if(!row)return null;return decrypt(row);}
app.post('/api/creative/image',auth,csrf,mediaLimit,async(req,res)=>{
  const prompt=typeof req.body?.prompt==='string'?req.body.prompt.trim():'';
  const model=typeof req.body?.model==='string'?req.body.model:'gpt-image-2.6-flare';
  const size=typeof req.body?.size==='string'?req.body.size:'1024x1024';
  const quality=typeof req.body?.quality==='string'?req.body.quality:'medium';
  const allowedModels=['gpt-image-2.6-flare','gpt-image-2.6-sunburst','gpt-image-2','gpt-image-1.5'];
  if(prompt.length<3||prompt.length>3000)return fail(res,400,'Image prompt must be 3–3000 characters.');
  if(!allowedModels.includes(model))return fail(res,400,'Choose a supported GPT Image model.');
  if(!['1024x1024','1024x1536','1536x1024'].includes(size))return fail(res,400,'Choose a supported image size.');
  if(!['low','medium','high'].includes(quality))return fail(res,400,'Choose low, medium, or high quality.');
  let secret;try{secret=openAIKeyFor(req.auth.user_id);}catch{return fail(res,503,'The saved OpenAI key cannot be decrypted. Check server encryption settings.');}
  if(!secret)return fail(res,400,'Connect an OpenAI key in Settings first.');
  try{
    const upstream=await fetch('https://api.openai.com/v1/images/generations',{method:'POST',headers:{Authorization:'Bearer '+secret,'Content-Type':'application/json'},body:JSON.stringify({model,prompt,n:1,size,quality}),signal:AbortSignal.timeout(180000)});
    const data=await upstream.json().catch(()=>({}));
    if(!upstream.ok)return fail(res,upstream.status===401?401:502,data.error?.message||'Image generation failed. Check model access, organization verification, and API usage limits.');
    const image=data.data?.[0]?.b64_json;
    if(!image)return fail(res,502,'The image provider returned no image data.');
    res.json({model,size,quality,imageDataUrl:'data:image/png;base64,'+image,usage:data.usage||null});
  }catch(error){fail(res,502,error.name==='TimeoutError'?'Image generation timed out. Try again later.':'Could not reach the image provider.');}
});
app.post('/api/creative/video',auth,csrf,mediaLimit,async(req,res)=>{
  const prompt=typeof req.body?.prompt==='string'?req.body.prompt.trim():'';
  const model=typeof req.body?.model==='string'?req.body.model:'sora-2';
  const size=typeof req.body?.size==='string'?req.body.size:'1280x720';
  const seconds=String(req.body?.seconds||'4');
  if(prompt.length<3||prompt.length>3000)return fail(res,400,'Video prompt must be 3–3000 characters.');
  if(!['sora-2','sora-2-pro'].includes(model))return fail(res,400,'Choose Sora 2 or Sora 2 Pro.');
  if(!['4','8','12','16','20'].includes(seconds))return fail(res,400,'Choose a supported clip length.');
  const sizes=model==='sora-2'?['1280x720','720x1280']:['1280x720','720x1280','1920x1080','1080x1920','1792x1024','1024x1792'];
  if(!sizes.includes(size))return fail(res,400,'That resolution is not supported for the selected video model.');
  let secret;try{secret=openAIKeyFor(req.auth.user_id);}catch{return fail(res,503,'The saved OpenAI key cannot be decrypted. Check server encryption settings.');}
  if(!secret)return fail(res,400,'Connect an OpenAI key in Settings first.');
  try{
    const upstream=await fetch('https://api.openai.com/v1/videos',{method:'POST',headers:{Authorization:'Bearer '+secret,'Content-Type':'application/json'},body:JSON.stringify({model,prompt,size,seconds}),signal:AbortSignal.timeout(60000)});
    const data=await upstream.json().catch(()=>({}));
    if(!upstream.ok)return fail(res,upstream.status===401?401:502,data.error?.message||'Video job could not start. Check Sora API access and usage limits.');
    res.status(202).json({id:data.id,status:data.status,progress:data.progress||0,model:data.model||model,seconds:data.seconds||seconds,size:data.size||size});
  }catch(error){fail(res,502,error.name==='TimeoutError'?'Could not start the video job in time.':'Could not reach the video provider.');}
});
app.get('/api/creative/video/:id',auth,async(req,res)=>{
  const id=req.params.id;
  if(!/^video_[A-Za-z0-9_-]{8,100}$/.test(id))return fail(res,400,'Invalid video job ID.');
  let secret;try{secret=openAIKeyFor(req.auth.user_id);}catch{return fail(res,503,'The saved OpenAI key cannot be decrypted.');}
  if(!secret)return fail(res,400,'Connect an OpenAI key in Settings first.');
  try{
    const upstream=await fetch('https://api.openai.com/v1/videos/'+encodeURIComponent(id),{headers:{Authorization:'Bearer '+secret},signal:AbortSignal.timeout(30000)});
    const data=await upstream.json().catch(()=>({}));
    if(!upstream.ok)return fail(res,502,data.error?.message||'Could not check the video job.');
    res.json({id:data.id,status:data.status,progress:data.progress||0,error:data.error?.message||null});
  }catch{return fail(res,502,'Could not check video status.');}
});
app.get('/api/creative/video/:id/content',auth,async(req,res)=>{
  const id=req.params.id;
  if(!/^video_[A-Za-z0-9_-]{8,100}$/.test(id))return fail(res,400,'Invalid video job ID.');
  let secret;try{secret=openAIKeyFor(req.auth.user_id);}catch{return fail(res,503,'The saved OpenAI key cannot be decrypted.');}
  if(!secret)return fail(res,400,'Connect an OpenAI key in Settings first.');
  try{
    const upstream=await fetch('https://api.openai.com/v1/videos/'+encodeURIComponent(id)+'/content',{headers:{Authorization:'Bearer '+secret},signal:AbortSignal.timeout(180000)});
    if(!upstream.ok){const data=await upstream.json().catch(()=>({}));return fail(res,502,data.error?.message||'Video download is not ready yet.');}
    res.setHeader('Content-Type','video/mp4');res.setHeader('Content-Disposition','attachment; filename="brokengpt-video.mp4"');res.setHeader('Cache-Control','no-store');
    const {Readable}=require('node:stream');Readable.fromWeb(upstream.body).pipe(res);
  }catch{return fail(res,502,'Could not download the completed video.');}
});

app.use('/api',(_req,res)=>fail(res,404,'API route not found.'));
app.use(express.static(ROOT,{dotfiles:'deny',index:'index.html',etag:true,maxAge:PROD?'1h':0}));
app.get('*',(_req,res)=>res.sendFile(path.join(ROOT,'index.html')));
app.listen(PORT,()=>{console.log('BROKENGPT server listening on port '+PORT);if(!key())console.warn('Set BROKENGPT_ENCRYPTION_KEY before enabling provider-key storage.');});
