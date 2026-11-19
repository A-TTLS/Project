import React, { useEffect, useState } from 'react';
import { View, TextInput, Pressable, ScrollView } from 'react-native-web';
import { searchFood, type FoodItem } from '../services/trendsService';
import { Row, Txt, Pill, c } from '../ui';

// Member 5 · Search the Malaysian & campus food database (food_catalog).
// Used inside Manual Entry: picking a food fills in the form for the user.

const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverages'];

interface Props {
  onPick: (food: FoodItem) => void;
}

export default function FoodSearch({ onPick }: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [results, setResults] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  // Search when the text or category changes, after typing pauses.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const found = await searchFood(query, category);
        if (!cancelled) setResults(found);
      } catch {
        if (!cancelled) setError('Food database is not available right now.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, query ? 250 : 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, category, open]);

  if (!open) {
    return (
      <Pressable
        onPress={() => setOpen(true)}
        style={{ borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 10, backgroundColor: c.bg }}
      >
        <Txt s={13} color={c.mute}>🔍 Search food database (e.g. nasi lemak, mamak)</Txt>
      </Pressable>
    );
  }

  return (
    <View style={{ gap: 8 }}>
      <TextInput
        autoFocus
        value={query}
        onChangeText={setQuery}
        placeholder="Search food, place or tag…"
        style={{ borderWidth: 1, borderColor: c.ink, borderRadius: 12, padding: 10, fontSize: 14, outlineStyle: 'none' } as any}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Row style={{ gap: 6 }}>
          {CATEGORIES.map((cat) => (
            <Pill key={cat} active={category === cat} onPress={() => setCategory(cat)}>
              {cat}
            </Pill>
          ))}
        </Row>
      </ScrollView>

      <ScrollView style={{ maxHeight: 220 }}>
        {loading && results.length === 0 ? <Txt s={12} color={c.mute}>Searching…</Txt> : null}
        {error ? <Txt s={12} color="#C0392B">{error}</Txt> : null}
        {!loading && !error && results.length === 0 ? (
          <Txt s={12} color={c.mute}>No foods found. You can still type the meal in below.</Txt>
        ) : null}

        {results.map((food) => (
          <Pressable
            key={food.id}
            onPress={() => {
              onPick(food);
              setOpen(false);
              setQuery('');
            }}
            style={{ paddingVertical: 8, borderBottomWidth: 1, borderColor: c.line }}
          >
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Txt s={13} w="700" numberOfLines={1}>{food.name}</Txt>
                <Txt s={11} color={c.mute} numberOfLines={1}>
                  {food.serving_size}{food.location_hint ? ` · ${food.location_hint}` : ''}
                </Txt>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Txt s={13} w="800">{food.calories} kcal</Txt>
                <Txt s={10} color={c.mute}>
                  P {Math.round(Number(food.protein_g))} · C {Math.round(Number(food.carbs_g))} · F {Math.round(Number(food.fat_g))}
                </Txt>
              </View>
            </Row>
          </Pressable>
        ))}
      </ScrollView>

      <Pressable onPress={() => setOpen(false)}>
        <Txt s={12} w="700" color={c.mute}>Close search</Txt>
      </Pressable>
    </View>
  );
}
