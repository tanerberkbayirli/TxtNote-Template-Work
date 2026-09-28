/**
 * What the "Ekle" menu offers. Same look for every type — the mindmap is told
 * apart by its icon, not a second colour language.
 */

import { CalendarDays, FileText, Folder, GraduationCap, ListTodo, Waypoints } from "lucide-react";

export const NOTE_TYPE_OPTIONS = [
  {
    noteType: "standard",
    label: "Standart Not",
    description: "Başlık ve serbest yazı alanı olan klasik not.",
    icon: FileText,
  },
  {
    noteType: "todo",
    label: "To-Do",
    description: "Görev listesi — klasik işaret veya günlük hedefi olan süreç.",
    icon: ListTodo,
  },
  {
    noteType: "diary",
    label: "Günlük",
    description: "Her güne ayrı sayfa; alttaki tarihlerle veya takvimle gez.",
    icon: CalendarDays,
  },
  {
    noteType: "mindmap",
    label: "Haritalandırmalı Not",
    description: "2D tuval — kartları ve noktaları sürükle, oklarla bağla.",
    icon: Waypoints,
  },
  {
    noteType: "academic",
    label: "Akademik Yazı",
    description: "Makale ve tez — başlık, yazar, özet; PDF veya Word içe ve dışa aktar.",
    icon: GraduationCap,
  },
  {
    noteType: "folder",
    label: "Dosya",
    description: "Not tutmaz — notları gruplar. Sürükleyip içine bırak.",
    icon: Folder,
    dividerBefore: true,
  },
];

/** Not türleri that live in the Ekle şablon panel instead of the type list. */
const EKLE_TEMPLATE_NOTE_TYPES = new Set(["mindmap", "academic"]);

export const EKLE_NOTE_TYPE_OPTIONS = NOTE_TYPE_OPTIONS.filter(
  (option) => !EKLE_TEMPLATE_NOTE_TYPES.has(option.noteType),
);
