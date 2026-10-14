import wordmark from "../assets/brand/txtnote.png";
import mark from "../assets/brand/txt.png";

export const TXTNOTE_WORDMARK = wordmark;
export const TXT_MARK = mark;

export function TxtNoteWordmark({ className = "", alt = "TxtNote" }) {
  return <img src={wordmark} alt={alt} className={className} draggable={false} />;
}

export function TxtNoteMark({ className = "", alt = "TxtNote" }) {
  return <img src={mark} alt={alt} className={className} draggable={false} />;
}
