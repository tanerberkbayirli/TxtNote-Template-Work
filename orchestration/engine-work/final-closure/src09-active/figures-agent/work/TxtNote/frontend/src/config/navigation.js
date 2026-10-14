/**
 * Sidebar navigation links. Add a destination here and in Canvas.
 */

import { HelpCircle, Palette, Settings, Sparkles, Trash2, User } from "lucide-react";

export const NAV_LINKS = [
  { id: "settings", label: "Ayarlar", icon: Settings },
  { id: "profile", label: "Profil", icon: User },
  { id: "appearance", label: "Görünüm", icon: Palette },
  { id: "premium", label: "Premium'a geç", icon: Sparkles, highlight: true },
  { id: "help", label: "Yardım ve destek", icon: HelpCircle },
  { id: "trash", label: "Çöp kutusu", icon: Trash2 },
];
