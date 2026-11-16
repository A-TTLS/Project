import { Icon, legacyAssets as assets, type IconName } from './components/Icons';
export { assets, type IconName, Icon };
import React, { type ReactNode } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native-web";


export const colors = {
  background: "#faf9f6",
  ink: "#1e293b",
  muted: "#64748b",
  border: "#eaede9",
  white: "#ffffff",
  yellow: "#fdf0a6",
  mint: "#ddf3d5",
  mintInk: "#4a7051",
  sky: "#d8f0fa",
  skyInk: "#40718a",
  skyLine: "#bbdce9",
  error: "#b4533f",
  primary: "#10b981",
};

// Wireframe shorthand color palette
export const c = {
  bg: '#F7F6F2',
  card: '#FFFFFF',
  line: '#D9D9D9',
  block: '#E6E6E6',
  ink: '#1F2A44',
  mute: '#7A8399',
  yellow: '#FFEFA0',
  green: '#DDF0D3',
  mint: '#DDF0D3',
  blue: '#D8EDF8',
  red: '#FBDAD6',
  dark: '#3E6B52',
};

export const fonts = {
  interRegular: "'Inter', sans-serif",
  interMedium: "'Inter', sans-serif",
  interSemiBold: "'Inter', sans-serif",
  interBold: "'Inter', sans-serif",
  interExtraBold: "'Inter', sans-serif",
  jakartaExtraBold: "'Plus Jakarta Sans', sans-serif",
};



// Wireframe Typography & Layout Primitives
export const Txt = ({ s = 14, w = '400', color = c.ink, style, children, ...rest }: any) => (
  <Text {...rest} style={[{ fontSize: s, fontWeight: w, color, fontFamily: fonts.interRegular }, style]}>
    {children}
  </Text>
);

export const Card = ({ bg = c.card, style, children }: { bg?: string; style?: ViewStyle | ViewStyle[]; children?: ReactNode }) => (
  <View style={[st.card, { backgroundColor: bg }, style as any]}>{children}</View>
);

export const Ph = ({ w, h, r = 12, label, style }: { w?: number | string; h: number; r?: number; label?: string; style?: ViewStyle }) => (
  <View style={[{ width: w as any, height: h, borderRadius: r, backgroundColor: c.block, alignItems: 'center', justifyContent: 'center' }, style]}>
    {label ? <Txt s={11} color={c.mute}>{label}</Txt> : null}
  </View>
);

export const Avatar = ({ size = 40, label }: { size?: number; label?: string }) => (
  <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c.yellow, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.line }}>
    {label ? <Txt s={size * 0.38} w="700">{label}</Txt> : <Icon name="user" size={size * 0.55} />}
  </View>
);

export const Pill = ({ children, active, bg, onPress }: { children: ReactNode; active?: boolean; bg?: string; onPress?: () => void }) => (
  <Pressable onPress={onPress} style={[st.pill, { backgroundColor: bg ?? (active ? c.yellow : c.card) }]}>
    <Txt s={12} w={active ? '700' : '500'}>{children}</Txt>
  </Pressable>
);

export const Btn = ({ children, bg = c.yellow, onPress, style, disabled = false }: { children: ReactNode; bg?: string; onPress?: () => void; style?: ViewStyle; disabled?: boolean }) => (
  <Pressable
    disabled={disabled}
    onPress={disabled ? undefined : onPress}
    style={({ pressed }) => [st.btn, { backgroundColor: bg, opacity: disabled ? 0.55 : 1 }, pressed && !disabled && { opacity: 0.8 }, style]}
  >
    <Txt w="700">{children}</Txt>
  </Pressable>
);

export const IconBox = ({ size = 36, label = '', onPress }: { size?: number; label?: string; onPress?: () => void }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: c.card,
        borderWidth: 1,
        borderColor: c.line,
        alignItems: 'center',
        justifyContent: 'center',
        cursor: onPress ? ('pointer' as any) : undefined,
      },
      pressed && { opacity: 0.7 },
    ]}
  >
    {label === 'cal' ? <Icon name="calendar" size={size * 0.52} color={c.ink} /> :
     label === 'bell' ? <Icon name="bell" size={size * 0.52} color={c.ink} /> :
     label === 'camera' ? <Icon name="camera" size={size * 0.52} color={c.ink} /> :
     label === 'flash' ? <Icon name="sparkles" size={size * 0.52} color={c.ink} /> :
     label === 'img' ? <Icon name="sprout" size={size * 0.52} color={c.ink} /> :
     label === 'flip' ? <Icon name="arrow" size={size * 0.52} color={c.ink} /> :
     label === 'settings' || label === '⚙' ? <Icon name="settings" size={size * 0.52} color={c.ink} /> :
     label === 'wallet' ? <Icon name="gift" size={size * 0.52} color={c.ink} /> :
     label === 'edit' ? <Icon name="edit" size={size * 0.52} color={c.ink} /> :
     label === 'trash' ? <Icon name="trash" size={size * 0.52} color="#C0504A" /> :
     label === 'plus' ? <Icon name="plus" size={size * 0.52} color={c.ink} /> :
     label === 'lock' ? <Icon name="lock" size={size * 0.52} color={c.ink} /> :
     label === 'mail' ? <Icon name="mail" size={size * 0.52} color={c.ink} /> :
     <Txt s={12} color={c.mute}>{label}</Txt>}
  </Pressable>
);

export const Row = ({ style, children }: { style?: ViewStyle | ViewStyle[]; children?: ReactNode }) => (
  <View style={[{ flexDirection: 'row', alignItems: 'center' }, style as any]}>{children}</View>
);

export const Ring = ({ size = 56, label, progress = 0.91 }: { size?: number; label?: string; progress?: number }) => (
  <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: Math.max(3, size / 16), borderColor: c.dark, alignItems: 'center', justifyContent: 'center' }}>
    {label ? <Txt s={size / 4} w="700">{label}</Txt> : null}
  </View>
);

export const Title = ({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) => (
  <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
    <View style={{ flex: 1, paddingRight: 12 }}>
      <Txt s={26} w="800">{title}</Txt>
      {sub ? <Txt s={13} color={c.mute} style={{ marginTop: 4 }}>{sub}</Txt> : null}
    </View>
    {right}
  </Row>
);

export const Segmented = ({ items, active, onSelect }: { items: string[]; active: number; onSelect?: (index: number) => void }) => (
  <Row style={st.seg}>
    {items.map((t, i) => (
      <Pressable
        key={t}
        onPress={() => onSelect && onSelect(i)}
        style={[st.segItem, i === active && { backgroundColor: c.card }]}
      >
        <Txt s={12} w={i === active ? '700' : '500'} color={i === active ? c.ink : c.mute}>{t}</Txt>
      </Pressable>
    ))}
  </Row>
);

export const SectionHead = ({ title, right }: { title: string; right?: string }) => (
  <Row style={{ justifyContent: 'space-between', marginTop: 20, marginBottom: 10 }}>
    <Txt s={16} w="800">{title}</Txt>
    {right ? <Txt s={12} color={c.mute}>{right}</Txt> : null}
  </Row>
);

export const TABS = ['Home', 'Social', 'Scan', 'Trend', 'Profile'];

export const TabBar = ({ active, onSelectTab }: { active: string; onSelectTab?: (tab: string) => void }) => {
  const tabsConfig = [
    { name: 'Home', icon: 'home', label: 'Home' },
    { name: 'Social', icon: 'social', label: 'Social' },
    { name: 'Scan', icon: 'camera', label: 'Scan' },
    { name: 'Trend', icon: 'trend', label: 'Trends' },
    { name: 'Profile', icon: 'profile', label: 'Profile' },
  ];

  return (
    <Row style={st.tabbar}>
      {tabsConfig.map((item) => {
        const isScan = item.name === 'Scan';
        const isSelected = item.name === active || (item.name === 'Social' && active.startsWith('Social')) || (item.name === 'Trend' && active.startsWith('Trend'));
        return (
          <Pressable
            key={item.name}
            onPress={() => onSelectTab && onSelectTab(item.name)}
            style={{ alignItems: 'center', flex: 1, marginTop: isScan ? -22 : 0, cursor: 'pointer' as any }}
          >
            <View
              style={{
                width: isScan ? 54 : 38,
                height: isScan ? 54 : 32,
                borderRadius: isScan ? 27 : 16,
                backgroundColor: isScan ? c.yellow : isSelected ? '#FFEFA0' : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 2,
                borderWidth: isScan ? 3 : 0,
                borderColor: '#ffffff',
                boxShadow: isScan ? '0 4px 10px rgba(0,0,0,0.18)' : undefined,
              }}
            >
              <Icon
                name={item.icon}
                size={isScan ? 24 : 18}
                color={isSelected || isScan ? c.ink : c.mute}
              />
            </View>
            <Txt s={10} w={isSelected ? '800' : '600'} color={isSelected ? c.ink : c.mute}>
              {item.label}
            </Txt>
          </Pressable>
        );
      })}
    </Row>
  );
};

export const Screen = ({
  tab,
  children,
  footer,
  onSelectTab,
}: {
  tab?: string;
  children: ReactNode;
  footer?: ReactNode;
  onSelectTab?: (tab: string) => void;
}) => (
  <View
    style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: c.bg,
      position: 'relative',
      paddingBottom: tab ? 120 : 40,
    }}
  >
    <View
      style={{
        width: '100%',
        maxWidth: 580,
        marginHorizontal: 'auto' as any,
        paddingHorizontal: 20,
        paddingTop: 24,
      }}
    >
      {children}
    </View>
    {footer}
    {tab ? <TabBar active={tab} onSelectTab={onSelectTab} /> : null}
  </View>
);

export const MealRow = ({
  meta,
  name,
  kcal,
  onPress,
  onDelete,
}: {
  meta: string;
  name: string;
  kcal: string;
  onPress?: () => void;
  onDelete?: () => void;
}) => (
  <Card style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, padding: 12 }}>
    <Ph w={68} h={68} label="MEAL" />
    <View style={{ flex: 1, marginHorizontal: 12 }}>
      <Txt s={11} color={c.mute}>{meta}</Txt>
      <Txt s={15} w="700" style={{ marginVertical: 2 }}>{name}</Txt>
      <Txt s={12} color={c.mute}>{kcal}</Txt>
    </View>
    {onDelete ? (
      <IconBox label="✕" onPress={onDelete} size={30} />
    ) : (
      <IconBox label="+" onPress={onPress} size={30} />
    )}
  </Card>
);

export const Post = ({
  user,
  place,
  kcal,
  caption,
  pct,
  streak = 1,
  avatarUrl,
  image,
  likes = 124,
  liked = false,
  comments = [],
  onLike,
  onAddComment,
}: {
  user: string;
  place: string;
  kcal: string;
  caption: string;
  pct: string;
  streak?: number;
  avatarUrl?: string;
  image?: string;
  likes?: number;
  liked?: boolean;
  comments?: string[];
  onLike?: () => void;
  onAddComment?: (text: string) => void;
}) => {
  const [commentInput, setCommentInput] = React.useState('');
  return (
    <Card style={{ marginBottom: 16 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Row>
          <Avatar size={36} />
          <View style={{ marginLeft: 10 }}>
            <Txt w="700">{user}</Txt>
            <Txt s={11} color={c.mute}>{place}</Txt>
          </View>
        </Row>
        <Pill active>{streak}d streak</Pill>
      </Row>
      <Row style={{ justifyContent: 'space-between', marginVertical: 10 }}>
        <Txt s={12} w="700">{kcal}</Txt>
        <Txt s={11} color={c.mute}>{pct}</Txt>
      </Row>
      {image ? (
        <View style={{ width: '100%', height: 200, borderRadius: 16, overflow: 'hidden', backgroundColor: '#e2e8f0', marginVertical: 4 }}>
          <img
            src={image}
            alt={caption || 'Meal photo'}
            className="object-cover w-full h-full"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </View>
      ) : (
        <Ph h={180} r={16} label="MEAL PHOTO" />
      )}
      <Row style={{ marginTop: 10, justifyContent: 'space-between' }}>
        <Pressable onPress={onLike} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Txt s={14}>{liked ? '❤️' : '🤍'}</Txt>
          <Txt s={12} w="600">{likes} likes</Txt>
        </Pressable>
        <Txt s={12} color={c.mute}>{comments.length} comments</Txt>
      </Row>
      <Txt s={13} style={{ marginVertical: 8 }}>{caption}</Txt>

      {comments.map((cm, i) => (
        <Row key={i} style={{ backgroundColor: c.bg, borderRadius: 10, padding: 8, marginBottom: 4 }}>
          <Txt s={11}>{cm}</Txt>
        </Row>
      ))}

      <Row style={{ marginTop: 10 }}>
        <Avatar size={24} />
        <Pressable
          onPress={() => {
            const input = prompt('Add a comment:');
            if (input && onAddComment) onAddComment(input);
          }}
          style={{ flex: 1, marginLeft: 8, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: c.bg, borderRadius: 16 }}
        >
          <Txt s={12} color={c.mute}>Add a comment...</Txt>
        </Pressable>
      </Row>
    </Card>
  );
};

// Onboarding and Landing Form Action Primitives
export function ActionButton({
  icon,
  label,
  primary = false,
  onPress,
  style,
  disabled = false,
}: {
  icon?: IconName;
  label: string;
  primary?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        st.action,
        primary ? st.primaryAction : st.secondaryAction,
        pressed && st.pressed,
        disabled && st.disabledAction,
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={20} /> : null}
      <Text style={st.actionLabel}>{label}</Text>
    </Pressable>
  );
}

export function Page({ children }: { children: ReactNode }) {
  return (
    <View style={st.page}>
      <View style={st.pageColumn}>{children}</View>
    </View>
  );
}

export function PageHeader({
  title,
  subtitle,
  onBack,
}: {
  title: string;
  subtitle: string;
  onBack?: () => void;
}) {
  return (
    <View style={st.heading}>
      <View style={st.headingRow}>
        {onBack ? (
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            onPress={onBack}
            style={({ pressed }) => [st.backButton, pressed && st.pressed]}
          >
            <Icon name="arrowLeft" size={20} />
          </Pressable>
        ) : null}
        <Text style={st.headingTitle}>{title}</Text>
      </View>
      <Text style={st.headingSubtitle}>{subtitle}</Text>
    </View>
  );
}

export function StepBar({ step }: { step: 1 | 2 }) {
  return (
    <View style={st.stepBar}>
      <View style={st.stepSegment} />
      <View style={[st.stepSegment, step < 2 && st.stepIdle]} />
    </View>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <Text style={st.fieldLabel}>{children}</Text>;
}

const st = StyleSheet.create({
  card: { borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#EFEFEF', backgroundColor: c.card },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, marginRight: 8, borderWidth: 1, borderColor: '#EEE', cursor: 'pointer' as any },
  btn: { height: 48, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, cursor: 'pointer' as any },
  seg: { backgroundColor: '#EDECE6', borderRadius: 999, padding: 4, marginBottom: 16 },
  segItem: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 999, cursor: 'pointer' as any },
  tabbar: {
    position: 'fixed' as any,
    maxWidth: 540,
    left: 20,
    right: 20,
    marginHorizontal: 'auto' as any,
    bottom: 20,
    height: 70,
    borderRadius: 35,
    backgroundColor: c.card,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: c.line,
    justifyContent: 'space-between',
    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
    zIndex: 90,
  },
  page: {
    minHeight: "100vh",
    width: "100%",
    backgroundColor: colors.background,
    alignItems: "center",
  },
  pageColumn: {
    width: "100%",
    maxWidth: 520,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 20,
  },
  action: {
    width: "100%",
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 32,
    cursor: "pointer" as any,
  },
  primaryAction: {
    borderColor: colors.yellow,
    backgroundColor: colors.yellow,
  },
  secondaryAction: {
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  disabledAction: {
    opacity: 0.5,
    cursor: "not-allowed" as any,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.99 }],
  },
  actionLabel: {
    color: colors.ink,
    fontFamily: fonts.interBold,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21.75,
  },
  heading: {
    width: "100%",
    gap: 8,
  },
  headingRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 32,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer" as any,
  },
  headingTitle: {
    flex: 1,
    minWidth: 1,
    color: colors.ink,
    fontFamily: fonts.jakartaExtraBold,
    fontSize: 25,
    fontWeight: "800",
    lineHeight: 36.25,
  },
  headingSubtitle: {
    width: "100%",
    color: colors.muted,
    fontFamily: fonts.interRegular,
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20.3,
  },
  stepBar: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
  },
  stepSegment: {
    flex: 1,
    minWidth: 1,
    height: 5,
    borderRadius: 5,
    backgroundColor: colors.yellow,
  },
  stepIdle: {
    backgroundColor: colors.border,
  },
  fieldLabel: {
    color: colors.muted,
    fontFamily: fonts.interSemiBold,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17.4,
  },
});
