/** Shared source of truth for the template gallery and Ekle shortcuts. */

import {
  CalendarCheck,
  CalendarDays,
  FileText,
  Layers3,
  ListTodo,
  Waypoints,
} from "lucide-react";
import { createId } from "./id.js";
import { todoDayKey, TODO_KIND_CLASSIC } from "./todoProgress.js";

export const TEMPLATE_LIBRARY_TAB_ID = "system:templates";

export const TEMPLATE_CATEGORIES = [
  { id: "discover", label: "Keşfet" },
  { id: "planning", label: "Planlama" },
  { id: "learning", label: "Öğrenme" },
  { id: "daily", label: "Günlük" },
  { id: "academic", label: "Akademik" },
  { id: "community", label: "Topluluk" },
];

const classicTodo = (text) => ({
  id: createId("todo"),
  kind: TODO_KIND_CLASSIC,
  text,
  done: false,
  failed: false,
});

export const TEMPLATES = [
  {
    id: "standard-note",
    name: "Standart Not",
    description: "Fikirlerini ve serbest biçimli notlarını hızlıca yaz.",
    category: "community",
    noteType: "standard",
    icon: FileText,
    seed: () => ({}),
  },
  {
    id: "normal-todo",
    name: "Normal To-Do",
    description: "Tamamlanacak işleri sade bir kontrol listesinde topla.",
    category: "planning",
    noteType: "todo",
    icon: ListTodo,
    seed: () => ({}),
  },
  {
    id: "daily-todo",
    name: "Günlük To-Do",
    description: "Günün görevlerini tarih çubuğuyla gez; kalıcı işaretle aynı listeyi her güne taşı.",
    category: "planning",
    noteType: "todo",
    icon: CalendarCheck,
    seed: () => {
      const todos = [
        classicTodo("Bugünün en önemli işi"),
        classicTodo("Kısa bir mola ver"),
        classicTodo("Günü değerlendir"),
      ];
      return {
        title: "Günlük To-Do",
        todoDaily: true,
        todos,
        todoPlan: {
          persistent: false,
          days: { [todoDayKey()]: todos.map((todo) => ({ ...todo })) },
          marks: {},
        },
      };
    },
  },
  {
    id: "daily-journal",
    name: "Günlük",
    description: "Her gün için ayrı bir sayfada düşüncelerini ve anılarını sakla.",
    category: "daily",
    noteType: "diary",
    icon: CalendarDays,
    seed: () => ({}),
  },
  {
    id: "flashcards",
    name: "Flashcards",
    description: "Soru-cevap kartlarıyla bilgilerini düzenle ve tekrar et.",
    category: "learning",
    noteType: "flashcards",
    icon: Layers3,
    seed: () => ({
      title: "Flashcards",
      flashcards: { cards: [] },
    }),
  },
  {
    id: "mapped-note",
    name: "Haritalandırmalı Not",
    description: "Kavramları iki boyutlu bir tuvalde ilişkilendir.",
    category: "learning",
    noteType: "mindmap",
    icon: Waypoints,
    seed: () => ({}),
  },
];

export const DEFAULT_PINNED_TEMPLATE_IDS = ["standard-note", "normal-todo", "daily-todo"];

export const TEMPLATE_IDS = new Set(TEMPLATES.map((template) => template.id));

export const templateById = (templateId) =>
  TEMPLATES.find((template) => template.id === templateId) ?? null;

export const sanitizeTemplateIds = (ids) =>
  Array.isArray(ids)
    ? [...new Set(ids.filter((id) => typeof id === "string" && TEMPLATE_IDS.has(id)))]
    : [];

const normalizeSearchText = (value) =>
  String(value ?? "")
    .trim()
    .toLocaleLowerCase("tr-TR");

export const filterTemplates = (templates, query, categoryId = "discover") => {
  const needle = normalizeSearchText(query);
  return templates.filter((template) => {
    if (categoryId !== "discover" && template.category !== categoryId) return false;
    if (!needle) return true;
    return normalizeSearchText(`${template.name} ${template.description}`).includes(needle);
  });
};

export const createTemplateSeed = (templateId) => {
  const template = templateById(templateId);
  return template ? template.seed() : null;
};
