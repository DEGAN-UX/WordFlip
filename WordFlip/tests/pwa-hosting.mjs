import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';

const root=path.resolve(import.meta.dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const html=read('dist/index.html');
const manifest=JSON.parse(read('dist/manifest.webmanifest'));
const worker=read('dist/sw.js');

for(const pathname of ['/','/WordFlip/']){
  const scope=new URL(pathname,'https://example.test');
  assert.equal(new URL(manifest.start_url,scope).href,scope.href);
  assert.equal(new URL(manifest.scope,scope).href,scope.href);
  for(const icon of manifest.icons){
    const url=new URL(icon.src,scope);
    assert.ok(url.pathname.startsWith(scope.pathname));
    assert.ok(fs.existsSync(path.join(root,'dist',url.pathname.slice(scope.pathname.length))));
  }

  const handlers={};
  const storage=new Map();
  const opened=[];
  const deleted=[];
  let claimed=false,skipped=false;
  const cache={
    addAll:async urls=>{
      for(const item of urls){
        const url=new URL(item);
        assert.equal(url.origin,scope.origin);
        assert.ok(url.pathname.startsWith(scope.pathname),'precache escaped the app directory');
        const file=url.pathname.slice(scope.pathname.length)||'index.html';
        assert.ok(fs.existsSync(path.join(root,'dist',file)),file+' is missing');
        storage.set(url.href,'cached:'+file);
      }
    },
    match:async request=>storage.get(typeof request==='string'?request:request.url),
    put:async()=>{}
  };
  const context={
    URL,Response,
    self:{
      registration:{scope:scope.href},
      addEventListener:(name,fn)=>{handlers[name]=fn;},
      clients:{claim:async()=>{claimed=true;}},
      skipWaiting:()=>{skipped=true;}
    },
    caches:{
      open:async name=>{opened.push(name);return cache;},
      keys:async()=>[opened[0],opened[0].replace(/:[^:]+$/,':old'),'wordflip:%2Fother-app%2F:old','unrelated-cache'],
      delete:async name=>{deleted.push(name);return true;}
    },
    fetch:async()=>{throw new Error('offline');}
  };
  vm.runInNewContext(worker,context);
  let task;
  handlers.install({waitUntil:p=>{task=p;}});
  await task;
  assert.equal(skipped,false,'installation must wait for the user to accept an update');
  handlers.activate({waitUntil:p=>{task=p;}});
  await task;
  assert.equal(claimed,true);
  assert.deepEqual(deleted,[opened[0].replace(/:[^:]+$/,':old')],'delete only obsolete caches for this app path');
  handlers.message({data:{type:'SKIP_WAITING'}});
  assert.equal(skipped,true);

  async function offline(relative,mode='cors'){
    let response;
    const tasks=[];
    handlers.fetch({
      request:{method:'GET',url:new URL(relative,scope).href,mode},
      waitUntil:p=>tasks.push(p),
      respondWith:p=>{response=p;}
    });
    const result=await response;
    await Promise.all(tasks);
    return result;
  }
  for(const file of ['cards.json','italian-cards.json','croatian-cards.json']){
    assert.equal(await offline(file),'cached:'+file);
  }
  assert.equal(await offline('?utm_source=share','navigate'),'cached:index.html');
  const script=html.match(/src="(app\.js\?v=[^"]+)"/)[1];
  assert.equal(await offline(script),'cached:app.js');
  let intercepted=false;
  handlers.fetch({
    request:{method:'GET',url:'https://elsewhere.test/file',mode:'cors'},
    waitUntil:()=>{},respondWith:()=>{intercepted=true;}
  });
  assert.equal(intercepted,false);
  if(pathname!=='/'){
    handlers.fetch({
      request:{method:'GET',url:'https://example.test/other-app/file',mode:'cors'},
      waitUntil:()=>{},respondWith:()=>{intercepted=true;}
    });
    assert.equal(intercepted,false);
  }
}

// Verify registration and update acceptance, including an app opened before its
// first worker installation. That session must reload for a later accepted update.
for(const hadController of [false,true]){
  const handlers={};
  const elements=[];
  let registrationArgs,reloads=0,posted;
  const classList={contains:()=>false};
  const registration={
    waiting:{postMessage:message=>{posted=message;}},
    update:async()=>{},
    addEventListener:()=>{}
  };
  const document={
    body:{classList,append:()=>{}},
    createElement:()=>{const el={append:()=>{},setAttribute:()=>{}};elements.push(el);return el;},
    getElementById:()=>null,
    addEventListener:()=>{},
    hidden:false
  };
  vm.runInNewContext(read('dist/update-manager.js'),{
    navigator:{serviceWorker:{
      controller:hadController?{}:null,
      addEventListener:(name,fn)=>{handlers[name]=fn;},
      register:async(...args)=>{registrationArgs=args;return registration;}
    }},
    document,MutationObserver:class{observe(){}},
    location:{reload:()=>{reloads++;}},setInterval:()=>{}
  });
  await Promise.resolve();
  assert.equal(new URL(registrationArgs[0],'https://example.test/WordFlip/').pathname,'/WordFlip/sw.js');
  assert.equal(registrationArgs[1].scope,'./');
  assert.equal(elements[0].hidden,false);
  if(!hadController){
    handlers.controllerchange();
    assert.equal(reloads,0);
  }
  elements[2].onclick();
  assert.equal(posted.type,'SKIP_WAITING');
  handlers.controllerchange();
  assert.equal(reloads,1);
}

// Build in an isolated copy: HTML-only, manifest-only and worker-only edits
// must all produce a new worker, while an unchanged build stays identical.
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'wordflip-pwa-'));
try{
  fs.cpSync(path.join(root,'dist'),path.join(temp,'dist'),{recursive:true});
  for(const file of ['build-assets.mjs','sw.template.js']){
    fs.copyFileSync(path.join(root,file),path.join(temp,file));
  }
  const build=()=>{
    execFileSync(process.execPath,[path.join(temp,'build-assets.mjs')],{stdio:'pipe'});
    return fs.readFileSync(path.join(temp,'dist/sw.js'),'utf8');
  };
  let previous=build();
  assert.equal(build(),previous,'unchanged builds must have stable versions');
  fs.appendFileSync(path.join(temp,'dist/index.html'),'\n<!-- changed page -->\n');
  let next=build();assert.notEqual(next,previous);previous=next;
  const manifestPath=path.join(temp,'dist/manifest.webmanifest');
  const changedManifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
  changedManifest.description+=' (updated)';
  fs.writeFileSync(manifestPath,JSON.stringify(changedManifest));
  next=build();assert.notEqual(next,previous);previous=next;
  fs.appendFileSync(path.join(temp,'sw.template.js'),'\n// changed worker\n');
  next=build();assert.notEqual(next,previous);
}finally{
  fs.rmSync(temp,{recursive:true,force:true});
}
console.log('PWA hosting checks passed: subdirectory/root install, offline data, isolated caches, update acceptance and build invalidation.');
