import {mmToTwip} from './units.js';
/** Word's measured justification budget, expressed in CSS px. It depends on the
 * final word, so one paragraph-wide negative word-spacing cannot reproduce it.
 * Values are font-independent for the measured TNR/Arial/Calibri programs.
 * Word probe: orchestration/tools/word-justify-probe.ps1. No university constants.
 * 11.10.2026 re-probe (82 random TNR/Arial lines, 10–12 pt): the 25 % space
 * branch is exact (Word breaks 0.002 pt past it); the short-final-word branch
 * was 0.33–0.43 pt too strict, i.e. it lacked a constant half CSS pixel. */
export function wordFitBudget(gaps,space,lastWord){
  return Math.max(0,Math.min(.25*gaps*space,.36*(lastWord+space)-gaps*.04*96/72+.5));
}
/** Word's fit test has no extra tolerance beyond float noise: a line 0.03 pt over
 * the budget breaks (AKÜ SBE "kurumsal", 15 cm measure). */
export const WORD_FIT_EPSILON=.0015*96/72;
/** Word measures against the DOCX page geometry, whose page width and margins are each
 * rounded to twips (export.js), not against the exact CSS mm width: 210 - 30 - 25 mm is
 * 439.37 pt in CSS but 8788 tw = 439.40 pt in Word (engine-word-justify J03). Returns
 * Word's measure minus the CSS one, in CSS px; 0 when the DOCX uses other margins. */
export function wordMeasureDeltaPx(page){
  const m=page?.margins;
  if(!m||page.docxMargins||!(page.widthMm>0))return 0;
  const css=page.widthMm-(m.leftMm||0)-(m.rightMm||0);
  const word=(mmToTwip(page.widthMm)-mmToTwip(m.leftMm||0)-mmToTwip(m.rightMm||0))/20;
  return (word-css*72/25.4)*96/72;
}

/** Word may break a line after a hyphen that joins two letters or digits ("damage-related" -> "damage-" / "related"); the spaceless
 * continuation is not a justification gap. Offsets stay exact. */
export function hyphenBreakOffsets(text,start,end){
  const joins=ch=>ch!==undefined&&/[\p{L}\p{N}]/u.test(ch);
  const cuts=[];
  for(let i=start+1;i<end-1;i++)if((text[i]==='-'||text[i]==='‐')&&joins(text[i-1])&&joins(text[i+1]))cuts.push(i+1);
  return cuts;
}

/** Split oversized tokens by glyph advance, retaining exact source offsets.
 * A zero-space continuation is not a justification gap. */
export function splitOversizedWords(words,width,text,advance,firstIndent=0){
  return words.flatMap((word,index)=>{
    const firstMeasure=Math.max(1,width-(index===0?firstIndent:0));
    if(word.width<=firstMeasure)return [word];
    const parts=[];let start=word.start;
    while(start<word.end){let end=start;const measure=start===word.start?firstMeasure:width;
      for(const glyph of text.slice(start,word.end)){
        const next=end+glyph.length;
        if(end>start&&advance(start,next)>measure)break;end=next;
      }
      parts.push({...word,start,end,width:advance(start,end),space:start===word.start?word.space:0,fragment:true});start=end;
    }return parts;
  });
}

/** Words contain source offsets, natural advances and the preceding space's
 * advance. Output boundaries never become authored breaks. */
export function fitWordLines(words,width,firstIndent=0,leading=null){
  const lines=[];let start=0;
  while(start<words.length){
    const measure=Math.max(1,width-(start===0?firstIndent:0));
    // Indentation typed as spaces is part of the first line: Word keeps it in the line width and squeezes it with the other
    // spaces (SRC10 SQL listing: 7 leading spaces, 15 spaces all 0.21 pt narrow at 9 pt). Each one is a justification gap.
    const lead=start===0&&leading?.count>0?leading:null;
    let end=start+1,natural=words[start].width+(lead?lead.width:0),spaces=lead?lead.width:0,gaps=lead?lead.count:0;
    while(end<words.length){
      const next=natural+words[end].space+words[end].width;
      const nextSpaces=spaces+words[end].space,nextGaps=gaps+(words[end].space>0?1:0);
      if(next>measure+(nextGaps?wordFitBudget(nextGaps,nextSpaces/nextGaps,words[end].width):0)+WORD_FIT_EPSILON)break;
      natural=next;spaces=nextSpaces;gaps=nextGaps;end++;
    }
    // Minimal compression guarantees the chosen prefix fits, without letting the
    // next word borrow compression from a previous line. An overfull final line
    // is compressed too; a shorter final line retains natural spaces.
    // Browser inline advances round independently at run boundaries. Reserve
    // half a CSS pixel when a fitted line would otherwise sit exactly on its
    // edge; justification re-expands non-final lines to the measured width.
    const compression=!gaps?0:Math.max(0,(natural-measure+.5)/gaps);
    lines.push({start,end,natural,measure,compression});start=end;
  }
  return lines;
}
