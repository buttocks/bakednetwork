/* Strict multipart recognition. Preserve metadata; never join unrelated numbered episodes.
   A complete group starts at 1, has no gaps or duplicate indices, and matches any declared total.
   Unresolved parts stay in the catalog but are withheld from automatic scheduling. */
export function multipartInfo(p) {
  if(!p || typeof p.title!=='string')return null;
  const title=p.title.trim();
  // Known standalone song title, not a divided video.
  if(/^Billy Idol\s*[-–—:]\s*White Wedding\s+(?:Pt\.?|Part)\s*1$/i.test(title))return null;
  const m=title.match(/^(.*?)[\s_\-–—:.(\[]+(?:part|pt\.?|disc|disk|cd)[\s._-]*(\d{1,3})(?:\s*(?:of|\/)\s*(\d{1,3}))?\s*[)\]]?\s*$/i);
  if(!m||!m[1].trim())return null;
  const part=Number(m[2]),total=m[3]?Number(m[3]):null;
  if(part<1||part>100||total!==null&&(total<part||total>100))return null;
  const base=m[1].normalize('NFKC').toLowerCase().replace(/[\s_\-–—:.,]+/g,' ').trim();
  if(base.length<5)return null;
  // Different uploaders/providers can have different cuts of the same program.
  const owner=String(p.source_channel||p.owner||'').normalize('NFKC').toLowerCase().trim();
  const provider=String(p.source||p.type||'').toLowerCase();
  const key=[provider,owner,base].join('|');
  return {key,base,part,total};
}
export function multipartBlocks(items){
 const grouped=new Map(),blocks=[],unresolved=[];
 for(const p of items){
  const info=multipartInfo(p);
  if(!info){blocks.push({parts:[p],duration:p.duration||0,source:p.source,url:p.url});continue;}
  if(!grouped.has(info.key))grouped.set(info.key,[]);
  grouped.get(info.key).push({p,...info});
 }
 for(const [key,rows] of grouped){
  rows.sort((a,b)=>a.part-b.part);
  const totals=[...new Set(rows.map(r=>r.total).filter(n=>n!==null))];
  const complete=rows.length>=2&&rows.every((r,i)=>r.part===i+1)&&totals.length<=1&&(!totals.length||totals[0]===rows.length);
  if(!complete){unresolved.push({key,parts:rows.map(r=>r.part),expected:totals[0]||null,items:rows.map(r=>r.p)});continue;}
  const parts=rows.map(r=>r.p);
  blocks.push({parts,duration:parts.reduce((s,p)=>s+(p.duration||0),0),source:parts[0].source,url:parts[0].url,group:key});
 }
 return {blocks,unresolved};
}
