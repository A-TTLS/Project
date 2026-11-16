/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'react-native-web' {
  const all: any;
  export default all;
  export const View: any;
  export const Text: any;
  export const Image: any;
  export const Pressable: any;
  export const ScrollView: any;
  export const StyleSheet: any;
  export const TextInput: any;
  export const Switch: any;
  export const SafeAreaView: any;
  export const useWindowDimensions: any;
  export const ActivityIndicator: any;
  export type StyleProp<T> = any;
  export type ViewStyle = any;
  export type TextStyle = any;
}

declare module 'react-native' {
  const all: any;
  export default all;
  export const View: any;
  export const Text: any;
  export const Image: any;
  export const Pressable: any;
  export const ScrollView: any;
  export const StyleSheet: any;
  export const TextInput: any;
  export const Switch: any;
  export const SafeAreaView: any;
  export const useWindowDimensions: any;
  export const ActivityIndicator: any;
  export type StyleProp<T> = any;
  export type ViewStyle = any;
  export type TextStyle = any;
}
