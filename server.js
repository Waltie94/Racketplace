const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const ROOT = __dirname;
const PUBLIC = path.join(ROOT,'public');
const DATA_DIR = path.join(ROOT,'data');
const UPLOADS = path.join(ROOT,'uploads');
const DB_FILE = path.join(DATA_DIR,'db.json');

for(const d of [DATA_DIR,UPLOADS]) fs.mkdirSync(d,{recursive:true});
if(!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({listings:[]},null,2));

const PORT = Number(process.env.PORT || 3000);

function readDB(){ return JSON.parse(fs.readFileSync(DB_FILE,'utf8')); }
function writeDB(db){ fs.writeFileSync(DB_FILE,JSON.stringify(db,null,2)); }
function json(res,status,data){
  const body=JSON.stringify(data);
  res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Content-Length':Buffer.byteLength(body)});
  res.end(body);
}
function body(req){
  return new Promise((resolve,reject)=>{
    let raw='';
    req.on('data',c=>{ raw+=c; if(raw.length>12_000_000){req.destroy();reject(new Error('Payload too large'));}});
    req.on('end',()=>{ try{resolve(raw?JSON.parse(raw):{});}catch(e){reject(e);} });
    req.on('error',reject);
  });
}
function clean(s,max=255){return String(s??'').trim().slice(0,max);}
function sellerToken(){ return crypto.randomBytes(24).toString('hex'); }

async function route(req,res){
  const u=new URL(req.url,`http://${req.headers.host}`);
  if(req.method==='GET' && u.pathname==='/api/listings'){
    return json(res,200,readDB().listings);
  }

  if(req.method==='POST' && u.pathname==='/api/listings'){
    try{
      const b=await body(req);
      const price=Number(b.price);
      if(!b.title || !b.sellerName || !b.contactValue || !Number.isFinite(price) || price<=0)
        return json(res,400,{error:'Missing required listing information'});
      const db=readDB();
      const token=sellerToken();
      const listing={
        id: clean(b.id,80),
        title:clean(b.title,100),
        cat:clean(b.cat,30),
        sport:b.sport?clean(b.sport,30):null,
        gender:b.gender?clean(b.gender,30):null,
        condition:clean(b.condition,30),
        price:Math.round(price*100)/100,
        images:Array.isArray(b.images)?b.images.slice(0,5):[],
        description:clean(b.description,1000),
        location:clean(b.location,120),
        sellerName:clean(b.sellerName,100),
        contactMethod:clean(b.contactMethod,30),
        contactValue:clean(b.contactValue,120),
        postedAt:Date.now(),
        sellerToken:token
      };
      db.listings.unshift(listing); writeDB(db);
      return json(res,201,{ok:true,id:listing.id,sellerToken:token});
    }catch(e){return json(res,400,{error:e.message});}
  }

  if(req.method==='DELETE' && u.pathname.startsWith('/api/listings/')){
    const id=decodeURIComponent(u.pathname.split('/').pop());
    const token=req.headers['x-seller-token']||'';
    const db=readDB();
    const item=db.listings.find(x=>x.id===id);
    if(!item) return json(res,404,{error:'Listing not found'});
    if(item.sellerToken!==token) return json(res,403,{error:'Not authorised'});
    db.listings=db.listings.filter(x=>x.id!==id); writeDB(db);
    return json(res,200,{ok:true});
  }

  if(req.method==='GET'){
    let file=u.pathname==='/'?path.join(PUBLIC,'index.html'):path.join(PUBLIC,u.pathname.replace(/^\/+/,''));
    if(!file.startsWith(PUBLIC)) return res.writeHead(403).end();
    if(!fs.existsSync(file)) return res.writeHead(404).end('Not found');
    const ext=path.extname(file);
    const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json'};
    res.writeHead(200,{'Content-Type':types[ext]||'application/octet-stream'}); return fs.createReadStream(file).pipe(res);
  }
  res.writeHead(404); res.end('Not found');
}
http.createServer(route).listen(PORT,()=>console.log(`RacketPlace running at http://localhost:${PORT}`));
