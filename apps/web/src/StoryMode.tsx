import { useEffect, useState } from 'react';
import { getLevel } from '@mmdp/core';
import { STORIES, storyMinimumLevel, storyWordCount, type Story } from '@mmdp/core/stories';
import { stopPronunciation } from './pronunciation';
import './stories.css';

export function StoryLibrary({level,onSelect,onBack}: {level:number;onSelect:(story:Story)=>void;onBack:()=>void}) {
  const stage=getLevel(level).stage;
  return <main className="app-shell stories-shell">
    <button className="text-button" onClick={onBack}>← Inicio</button>
    <header className="stories-heading"><p className="eyebrow">Un ratito para imaginar</p><h1>Historias para crecer</h1>
      <p>Lee a tu ritmo, conversa y descubre algo nuevo.</p><span className="level-pill">Nivel {level} · Etapa {stage} de 8</span>
    </header>
    <p className="story-guidance">Puedes leer con una persona adulta. Las primeras historias tienen frases cortas; cada etapa trae nuevos retos.</p>
    <section className="stories-grid" aria-label="Biblioteca de historias">
      {STORIES.map(story=> {
        const unlocked=story.stage<=stage;
        return <button key={story.id} className={'story-tile '+(unlocked?'':'story-locked')} disabled={!unlocked} onClick={()=>onSelect(story)}>
          <span className="story-stage">Etapa {story.stage} · {unlocked ? storyWordCount(story)+' palabras' : 'Desde el nivel '+storyMinimumLevel(story)}</span>
          <strong>{story.title}</strong><span>{story.value}</span><small>{unlocked?'Leer historia →':'Se abre al avanzar'}</small>
        </button>;
      })}
    </section>
  </main>;
}

export function StoryReader({story,onBack}: {story:Story;onBack:()=>void}) {
  const [page,setPage]=useState(0);
  const [large,setLarge]=useState(false);
  const [answers,setAnswers]=useState<Record<number,number>>({});
  const [speechStatus,setSpeechStatus]=useState('');
  const [speaking,setSpeaking]=useState(false);
  const inQuestions=page===story.pages.length;
  useEffect(()=> {
    stopPronunciation();setSpeaking(false);setSpeechStatus('');
    return ()=>stopPronunciation();
  },[page,story.id]);
  function listen() {
    stopPronunciation();
    if(!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance==='undefined') {
      setSpeechStatus('Este dispositivo no tiene lectura en voz alta disponible. Puedes leer con alguien.'); return;
    }
    const utterance=new SpeechSynthesisUtterance(story.pages[page]);
    utterance.lang='es-419';utterance.rate=story.stage<=2?0.76:0.88;
    const voice=window.speechSynthesis.getVoices().find(v=>v.lang.startsWith('es'));
    if(voice) utterance.voice=voice;
    utterance.onend=()=>setSpeaking(false);
    utterance.onerror=(event)=> {
      setSpeaking(false);
      if(event.error!=='canceled' && event.error!=='interrupted') setSpeechStatus('La voz no está disponible ahora. Puedes seguir leyendo el texto.');
    };
    setSpeechStatus('');setSpeaking(true);window.speechSynthesis.speak(utterance);
  }
  return <main className="app-shell stories-shell">
    <button className="text-button" onClick={onBack}>← Historias</button>
    <header className="stories-heading"><p className="eyebrow">{story.value}</p><h1>{story.title}</h1>
      <p>{inQuestions?'Vamos a conversar':'Página '+(page+1)+' de '+story.pages.length}</p>
    </header>
    {!inQuestions ? <>
      <div className="story-tools">
        <button className="secondary" aria-pressed={large} onClick={()=>setLarge(!large)}>{large?'Letra habitual':'Letra más grande'}</button>
        <button className="secondary" onClick={listen} disabled={speaking}>Escuchar esta página</button>
        {speaking && <button className="secondary" onClick={()=>{stopPronunciation();setSpeaking(false);}}>Detener audio</button>}
      </div>
      {speechStatus && <p role="status">{speechStatus}</p>}
      <article className={'story-paper '+(large?'story-large':'')} aria-label="Texto de la historia" key={page}>
        {story.pages[page].split('\n').map((paragraph,index)=><p key={index}>{paragraph}</p>)}
      </article>
      <div className="story-navigation">
        <button className="secondary" disabled={page===0} onClick={()=>setPage(page-1)}>Página anterior</button>
        <button className="primary" onClick={()=>setPage(page+1)}>{page===story.pages.length-1?'Pensar sobre la historia':'Página siguiente'}</button>
      </div>
      <aside className="story-vocabulary"><h2>Palabras que nos ayudan</h2><dl>{story.vocabulary.map(v=><div key={v.word}><dt>{v.word}</dt><dd>{v.meaning}</dd></div>)}</dl></aside>
    </> : <section className="story-questions" aria-label="Comprensión y conversación">
      {story.questions.map((question,index)=> {
        const choice=answers[index];const correct=choice===question.answer;
        return <fieldset key={index}><legend>{question.prompt}</legend><div className="story-options">
          {question.options.map((option,optionIndex)=><button className={'secondary '+(choice===optionIndex?'story-choice':'')} aria-pressed={choice===optionIndex} key={option} onClick={()=>setAnswers({...answers,[index]:optionIndex})}>{option}</button>)}
        </div>{choice!==undefined && <p role="status">{correct?'¡Lo encontraste! '+question.explanation:'Puedes volver al texto y probar otra respuesta.'}</p>}</fieldset>;
      })}
      <aside className="story-conversation"><h2>Para conversar</h2><p>{story.talk}</p><h2>Algo que aprendimos</h2><p>{story.knowledge}</p></aside>
      <div className="story-navigation"><button className="secondary" onClick={()=>setPage(0)}>Volver a leer</button><button className="primary" onClick={onBack}>Elegir otra historia</button></div>
    </section>}
  </main>;
}
