import type { PluginWorkspacePanelProps } from "@getpaseo/plugin/client";
import { Icon } from "@getpaseo/plugin/client/react-native";
import { createContext, useContext, useState, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

type Theme = PluginWorkspacePanelProps["theme"];
const ThemeContext = createContext<Theme | null>(null);
export const PanelTheme = ThemeContext.Provider;

export function useUi() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error("PanelTheme is required");
  const c = theme.colors;
  return {
    c,
    text: { color: c.foreground, fontSize: 14, lineHeight: 21 },
    muted: { color: c.foregroundMuted, fontSize: 13, lineHeight: 20 },
    label: { color: c.foreground, fontSize: 13, lineHeight: 20, fontWeight: "600" as const },
    field: { color: c.foreground, backgroundColor: c.surface0, borderColor: c.border, borderWidth: 1, borderRadius: 8, padding: 12, minHeight: 44, fontSize: 14 },
  };
}

export function Button({ label, onPress, icon, primary = false, quiet = false, disabled = false }: {
  label: string; onPress: () => void; icon?: string; primary?: boolean; quiet?: boolean; disabled?: boolean;
}) {
  const { c } = useUi();
  const color = primary ? c.accentForeground : c.foreground;
  return <Pressable accessibilityRole="button" accessibilityLabel={label} aria-disabled={disabled} disabled={disabled} onPress={onPress}
    style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, minHeight: 44,
      paddingHorizontal: 12, paddingVertical: 9, borderRadius: 8, borderWidth: 1,
      borderColor: primary ? c.accent : quiet ? "transparent" : c.border,
      backgroundColor: primary ? c.accent : pressed ? c.surface2 : quiet ? "transparent" : c.surface0,
      opacity: disabled ? 0.45 : pressed ? 0.8 : 1 })}>
    {icon ? <Icon name={icon} size={15} color={color} /> : null}
    <Text style={{ color, fontSize: 13, lineHeight: 20, fontWeight: "500", flexShrink: 1 }}>{label}</Text>
  </Pressable>;
}

export function Badge({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "success" | "warning" | "danger" | "active" }) {
  const { c } = useUi();
  const color = { neutral: c.foregroundMuted, success: c.statusSuccess, warning: c.statusWarning, danger: c.statusDanger, active: c.accent }[tone];
  return <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 6, backgroundColor: c.surface2, alignSelf: "flex-start" }}>
    <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: color }} />
    <Text style={{ color: c.foreground, fontSize: 12, lineHeight: 18 }}>{label}</Text>
  </View>;
}

export function Card({ children }: { children: ReactNode }) {
  const { c } = useUi();
  return <View style={{ borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 18, gap: 16, backgroundColor: c.surface0 }}>{children}</View>;
}

export function Disclosure({ title, children, initialOpen = false }: { title: string; children: ReactNode; initialOpen?: boolean }) {
  const { c, label } = useUi();
  const [open, setOpen] = useState(initialOpen);
  return <View style={{ gap: open ? 10 : 0 }}>
    <Pressable accessibilityRole="button" accessibilityLabel={title} aria-expanded={open} onPress={() => setOpen(!open)}
      style={{ minHeight: 44, flexDirection: "row", gap: 8, alignItems: "center" }}>
      <Icon name={open ? "ChevronDown" : "ChevronRight"} size={16} color={c.foregroundMuted} />
      <Text style={{ ...label, flexShrink: 1 }}>{title}</Text>
    </Pressable>
    {open ? children : null}
  </View>;
}

export function Notice({ children, error = false }: { children: ReactNode; error?: boolean }) {
  const { c, text } = useUi();
  return <View style={{ flexDirection: "row", alignItems: "flex-start", padding: 12, gap: 9, borderRadius: 8, backgroundColor: c.surface1, borderLeftWidth: 3, borderLeftColor: error ? c.statusDanger : c.accent }}>
    <Icon name={error ? "CircleAlert" : "Info"} size={16} color={error ? c.statusDanger : c.accent} />
    <Text accessibilityRole={error ? "alert" : undefined} accessibilityLiveRegion="polite" selectable style={{ ...text, flex: 1 }}>{children}</Text>
  </View>;
}

export const row = { flexDirection: "row" as const, flexWrap: "wrap" as const, alignItems: "center" as const, gap: 8 };
