import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import './style.css';

const sample={artist_name:'Mira Sol',track_title:'Glass Tides',genre:'deep house / downtempo',moods:'warm, nocturnal, reflective',influences:'Four Tet, early Bonobo',release_date:new Date(Date.now()+14*86400000).toISOString().slice(0,10),about:'Independent producer based in Montreal. I build tracks from field recordings and hardware synths.',links:'https://soundcloud.com/example/glass-tides'};
const tabs=['Curators','Bios','Pitches','Schedule','Usage'];
const genreSuggestions=['deep house','melodic techno','tech house','drum & bass','ambient','downtempo','lo-fi','UK garage','hyperpop','synthwave','industrial techno','afro house'];
const moodSuggestions=['dreamy','euphoric','dark','hypnotic','nostalgic','late-night','melancholic','uplifting','raw','cinematic','warm','glitchy'];
const presets=[
 {name:'Melodic techno single',genre:'melodic techno',moods:'euphoric, hypnotic, late-night',about:'A melodic techno project built around evolving synth lines and patient, late-night builds.'},
 {name:'Lo-fi ambient EP',genre:'lo-fi ambient',moods:'dreamy, warm, melancholic',about:'A collection of lo-fi ambient sketches shaped by soft tape textures and field recordings.'},
 {name:'Club-ready house edit',genre:'house / tech house',moods:'groovy, uplifting, raw',about:'A club-focused house edit with a warm low end and a direct, dancefloor-ready arrangement.'}
];

function App(){
 const [form,setForm]=useState({artist_name:'',track_title:'',genre:'',moods:'',influences:'',release_date:'',about:'',links:''});
 const [session]=useState(()=>{let id=sessionStorage.getItem('rk-session');if(!id){id=crypto.randomUUID();sessionStorage.setItem('rk-session',id)}return id});
 const [result,setResult]=useState(null),[tab,setTab]=useState('Curators'),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const update=(key,value)=>setForm({...form,[key]:value});
 async function generate(e){e.preventDefault();setBusy(true);setError('');try{const response=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,session_id:session})});const data=await response.json();if(!response.ok)throw Error(data.detail||'Could not generate release kit');setResult(data);setTab('Curators')}catch(err){setError(err.message)}finally{setBusy(false)}}
 const fill=()=>setForm(sample);
 const applyPreset=preset=>setForm(current=>({...current,genre:preset.genre,moods:preset.moods,about:preset.about}));
 const appendSuggestion=(key,value)=>setForm(current=>{const values=current[key].split(',').map(item=>item.trim()).filter(Boolean);if(values.some(item=>item.toLocaleLowerCase()===value.toLocaleLowerCase()))return current;return {...current,[key]:[...values,value].join(', ')}});
 return <main>
  <header><div className="brand"><span>RK</span> RELEASE KIT AGENT <span className="waveform" aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i}/>)}</span></div><div className="badge">INDEPENDENT ARTIST TOOLKIT</div></header>
  <section className="hero"><div className="eyebrow">YOUR NEXT RELEASE, READY TO TRAVEL</div><h1>Make noise.<br/><i>Make it known.</i></h1><p>One track brief in. A complete, personal release kit out.</p></section>
  <div className="sound-divider" aria-hidden="true"><svg viewBox="0 0 1200 32" preserveAspectRatio="none"><defs><linearGradient id="wave-stroke"><stop stopColor="#8b5cf6"/><stop offset="1" stopColor="#9fd8ff"/></linearGradient></defs><path d="M0 16 C70 16 80 7 145 16 S220 25 285 16 365 7 430 16 510 25 575 16 655 7 720 16 800 25 865 16 945 7 1010 16 1090 25 1200 16"/></svg></div>
  <div className="layout">
   <form className="form card" onSubmit={generate}>
    <div className="formhead"><div><small>01 — YOUR RELEASE</small><h2>Track details</h2></div><button type="button" className="subtle" onClick={fill}>✳ Fill example</button></div>
    <div className="preset-row"><span className="preset-label">QUICK START</span><div className="preset-list">{presets.map(preset=><button type="button" className="preset-chip" key={preset.name} onClick={()=>applyPreset(preset)}>{preset.name}</button>)}</div></div>
    <div className="grid">
     <label>Artist name<input required maxLength="80" value={form.artist_name} onChange={e=>update('artist_name',e.target.value)} placeholder="e.g. Mira Sol" title="For example: Mira Sol"/></label>
     <label>Track title<input required maxLength="100" value={form.track_title} onChange={e=>update('track_title',e.target.value)} placeholder="e.g. Glass Tides" title="For example: Glass Tides"/></label>
     <label>Genre / subgenre<input required maxLength="100" value={form.genre} onChange={e=>update('genre',e.target.value)} placeholder="e.g. deep house, ambient techno"/><SuggestionChips items={genreSuggestions} value={form.genre} onPick={value=>appendSuggestion('genre',value)} label="Genre ideas"/></label>
     <label>Mood words<input required maxLength="200" value={form.moods} onChange={e=>update('moods',e.target.value)} placeholder="e.g. warm, nocturnal, reflective"/><SuggestionChips items={moodSuggestions} value={form.moods} onPick={value=>appendSuggestion('moods',value)} label="Mood ideas"/></label>
     <label>Influences<input maxLength="240" value={form.influences} onChange={e=>update('influences',e.target.value)} placeholder="Bonobo, Four Tet, early Burial" title="For example: Bonobo, Four Tet, early Burial"/><span className="field-hint">Name artists, tracks, or eras that capture the sound or voice you want the kit to echo.</span></label>
     <label>Release date<input required type="date" value={form.release_date} onChange={e=>update('release_date',e.target.value)} placeholder="YYYY-MM-DD" title="Choose a date, for example 2026-08-21"/></label>
     <label className="full">A little about you<textarea maxLength="500" rows="3" value={form.about} onChange={e=>update('about',e.target.value)} placeholder="e.g. Montreal producer making late-night tracks from field recordings"/><span className="field-hint">Share your story, process, or sample phrases so the kit can echo your voice.</span></label>
     <label className="full">Links<input maxLength="500" value={form.links} onChange={e=>update('links',e.target.value)} placeholder="e.g. https://soundcloud.com/artist/track" title="Paste a private stream, artist page, or social link"/></label>
    </div>
    <div className="foot"><span>We only use details you provide.</span><button className="primary" disabled={busy}>{busy?<span className="loading-state" role="status"><span className="equalizer" aria-hidden="true">{Array.from({length:7},(_,i)=><i key={i}/>)}</span><span className="loading-status"><span>Matching curators&#8230;</span><span>Writing your bio&#8230;</span><span>Drafting pitches&#8230;</span><span>Scheduling captions&#8230;</span></span></span>:<>Build my release kit <b>&#8599;</b></>}</button></div>
    {error&&<div className="error">{error}</div>}
   </form>
   <section className="results card"><div className="resulthead"><div><small>02 — YOUR KIT</small><h2>{result?form.track_title:'A whole campaign, in one place.'}</h2></div><span className="spark">✳</span></div>{!result?<div className="empty"><div className="orbit">♫</div><p>Your curator matches, artist copy,<br/>personal pitches and post plan<br/>will land here.</p><small>FILL IN YOUR TRACK DETAILS TO BEGIN</small></div>:<><nav>{tabs.map(x=><button className={tab===x?'active':''} onClick={()=>setTab(x)} key={x}>{x}</button>)}</nav><div className="output">{tab==='Curators'&&result.outputs.curators.matches.map((x,i)=><article className="match" key={x.name}><div className="matchtitle"><b>{String(i+1).padStart(2,'0')}　{x.name}</b><span>{x.type}</span></div><p>{x.reason}</p><small>{x.submission_notes} · {x.contact_style}</small></article>)}{tab==='Bios'&&<><h3>Short bio</h3><p>{result.outputs.bios.short_bio}</p><h3>Long bio</h3><p>{result.outputs.bios.long_bio}</p><h3>Track description</h3><p>{result.outputs.bios.track_description}</p></>}{tab==='Pitches'&&result.outputs.pitches.pitches.map(x=><article className="match" key={x.curator_name}><b>{x.curator_name}{x.subject&&<>: {x.subject}</>}</b><p className="preserve">{x.body}</p></article>)}{tab==='Schedule'&&result.outputs.schedule.schedule.map(x=><article className="match" key={x.day}><div className="matchtitle"><b>DAY {x.day} · {x.phase}</b><span>{x.date} / {x.platform}</span></div><p>{x.caption}</p><small>{x.hashtags.join(' ')}</small></article>)}{tab==='Usage'&&<><h3>Run tokens & cost</h3><Usage usage={result.usage} total={result.total_usage}/><p className="note">Rates: $0.10 input, $0.01 cached input, $0.125 cache write, and $0.50 output per million tokens.</p></>}</div><div className="download"><button onClick={()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([toMarkdown(result)],{type:'text/markdown;charset=utf-8'}));a.download='release-kit.md';a.click()}}>↓ Download kit</button><span>RUN {new Date(result.timestamp).toLocaleString()}</span></div></>}</section>
  </div>
  <footer>BUILT FOR THE INDEPENDENT SOUND. <span>✳</span> MADE TO MOVE.</footer>
 </main>;
}

function SuggestionChips({items,value,onPick,label}){
 const selected=new Set(value.split(',').map(item=>item.trim().toLocaleLowerCase()).filter(Boolean));
 return <span className="suggestion-group"><span className="suggestion-label">{label}</span><span className="suggestion-list">{items.map(item=><button type="button" className={`suggestion-chip${selected.has(item.toLocaleLowerCase())?' selected':''}`} aria-pressed={selected.has(item.toLocaleLowerCase())} key={item} onClick={()=>onPick(item)}>{item}</button>)}</span></span>;
}

function md(value){return String(value??'').replaceAll('|','\\|').replaceAll('\r','').replaceAll('\n',' ')}
function toMarkdown(kit){
 const {inputs,outputs,usage,total_usage:total}=kit;
 const lines=[`# Release Kit: ${md(inputs.artist_name)} - ${md(inputs.track_title)}`,'',`**Genre:** ${md(inputs.genre)}  `,`**Moods:** ${md((inputs.moods||[]).join(', '))}  `,`**Release date:** ${md(inputs.release_date)}`];
 if(inputs.influences?.length)lines.push(`**Influences:** ${md(inputs.influences.join(', '))}`);
 if(inputs.about)lines.push('',md(inputs.about));
 if(inputs.links)lines.push('',`**Links:** ${md(inputs.links)}`);
 lines.push('','## Curator Matches','');
 for(const [i,c] of outputs.curators.matches.entries())lines.push(`### ${i+1}. ${md(c.name)} - ${md(c.type)}`,`- Fit: ${md(c.reason)}`,`- Subgenres: ${md((c.subgenres||[]).join(', '))}`,`- Vibe tags: ${md((c.vibe_tags||[]).join(', '))}`,`- Submission notes: ${md(c.submission_notes)}`,`- Contact: ${md(c.contact_style)}`,'');
 lines.push('## Artist Bio','',`### Short bio`,'',outputs.bios.short_bio,'',`### Long bio`,'',outputs.bios.long_bio,'',`### Track description`,'',outputs.bios.track_description,'','## Curator Pitches','');
 for(const pitch of outputs.pitches.pitches)lines.push(`### ${md(pitch.curator_name)}${pitch.subject?` - ${md(pitch.subject)}`:''}`,'',pitch.body,'');
 lines.push('## 14-Day Social Schedule','');
 for(const post of outputs.schedule.schedule)lines.push(`### Day ${post.day} - ${md(post.date)} - ${md(post.phase)} - ${md(post.platform)}`,'',post.caption,'',md((post.hashtags||[]).join(' ')),'');
 lines.push('## Token Usage','','| Agent | Input | Cached input | Cache write | Output | Cost (USD) |','|---|---:|---:|---:|---:|---:|');
 for(const [name,row] of Object.entries(usage))lines.push(`| ${md(name)} | ${row.input_tokens} | ${row.cached_input_tokens||0} | ${row.cache_write_tokens||0} | ${row.output_tokens} | $${Number(row.cost_usd||0).toFixed(6)} |`);
 lines.push(`| **Total** | **${total.input_tokens}** | **${total.cached_input_tokens||0}** | **${total.cache_write_tokens||0}** | **${total.output_tokens}** | **$${Number(total.cost_usd||0).toFixed(6)}** |`);
 return lines.join('\n')+'\n';
}
function Usage({usage,total}){return <table><thead><tr><th>Agent</th><th>Input</th><th>Cached</th><th>Cache write</th><th>Output</th><th>Cost</th></tr></thead><tbody>{Object.entries(usage).map(([name,x])=><tr key={name}><td>{name}</td><td>{x.input_tokens}</td><td>{x.cached_input_tokens||0}</td><td>{x.cache_write_tokens||0}</td><td>{x.output_tokens}</td><td>{money(x.cost_usd)}</td></tr>)}<tr className="total"><td>Total</td><td>{total.input_tokens}</td><td>{total.cached_input_tokens||0}</td><td>{total.cache_write_tokens||0}</td><td>{total.output_tokens}</td><td>{money(total.cost_usd)}</td></tr></tbody></table>}
function money(x){return `$${Number(x||0).toFixed(6)}`}
createRoot(document.getElementById('root')).render(<App/>);
