import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native-web";
import type { UserMeasurements } from "../services/authService";
import {
  ActionButton,
  colors,
  FieldLabel,
  fonts,
  Icon,
  Page,
  PageHeader,
  StepBar,
  type IconName,
} from "../ui";

export type Gender = "Female" | "Male" | "Other";
export type Units = "metric" | "imperial";

const KG_TO_LB = 2.20462;
const CM_TO_IN = 0.393701;

const round1 = (n: number) => String(Math.round(n * 10) / 10);

/** Converts stored display values when the unit toggle changes */
export function convertUnits(m: UserMeasurements, units: Units): UserMeasurements {
  if (units === m.units) return m;
  const toImperial = units === "imperial";
  const conv = (value: string, factor: number) => {
    const n = parseFloat(value);
    if (Number.isNaN(n)) return value;
    return round1(toImperial ? n * factor : n / factor);
  };
  return {
    ...m,
    units,
    height: conv(m.height, CM_TO_IN),
    weight: conv(m.weight, KG_TO_LB),
    target: conv(m.target, KG_TO_LB),
  };
}

interface MeasurementsPageProps {
  initialValues: UserMeasurements;
  onChange: (value: UserMeasurements) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function MeasurementsPage({
  initialValues,
  onChange,
  onContinue,
  onBack,
}: MeasurementsPageProps) {
  const [errorMsg, setErrorMsg] = useState("");

  const update = (patch: Partial<UserMeasurements>) => {
    setErrorMsg("");
    onChange({ ...initialValues, ...patch });
  };

  const handleUnitToggle = (units: Units) => {
    onChange(convertUnits(initialValues, units));
  };

  const handleNext = () => {
    if (!initialValues.gender) {
      setErrorMsg("Please select your biological sex for BMR calculation.");
      return;
    }
    if (!initialValues.age || parseFloat(initialValues.age) <= 0) {
      setErrorMsg("Please enter a valid age.");
      return;
    }
    if (!initialValues.height || parseFloat(initialValues.height) <= 0) {
      setErrorMsg("Please enter your height.");
      return;
    }
    if (!initialValues.weight || parseFloat(initialValues.weight) <= 0) {
      setErrorMsg("Please enter your current weight.");
      return;
    }
    if (!initialValues.target || parseFloat(initialValues.target) <= 0) {
      setErrorMsg("Please enter your target weight.");
      return;
    }
    setErrorMsg("");
    onContinue();
  };

  const imperial = initialValues.units === "imperial";

  return (
    <Page>
      <StepBar step={1} />
      <PageHeader
        onBack={onBack}
        subtitle="Step 1 of 2 · Profile Setup"
        title="Tell us about yourself."
      />

      {errorMsg ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : null}

      <View style={styles.unitsSection}>
        <View style={styles.unitsRow}>
          <Text style={styles.unitsLabel}>Preferred units</Text>
          <View style={styles.pillSwitch}>
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: !imperial }}
              onPress={() => handleUnitToggle("metric")}
              style={[styles.pillOption, !imperial && styles.pillSelected]}
            >
              <Text style={[styles.pillText, !imperial && styles.pillTextSelected]}>
                Metric (kg/cm)
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: imperial }}
              onPress={() => handleUnitToggle("imperial")}
              style={[styles.pillOption, imperial && styles.pillSelected]}
            >
              <Text style={[styles.pillText, imperial && styles.pillTextSelected]}>
                Imperial (lb/in)
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.form}>
        {/* Sex Selection */}
        <View style={styles.field}>
          <FieldLabel>Biological Sex</FieldLabel>
          <Text style={styles.fieldHint}>
            Used by scientific equations (Mifflin-St Jeor) to estimate metabolic rate.
          </Text>
          <View style={styles.genderRow}>
            {(["Female", "Male", "Other"] as Gender[]).map((g) => {
              const selected = initialValues.gender === g;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  key={g}
                  onPress={() => update({ gender: g })}
                  style={[styles.genderBtn, selected && styles.genderBtnSelected]}
                >
                  <Text style={[styles.genderText, selected && styles.genderTextSelected]}>
                    {g}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Age and Height */}
        <View style={styles.twoCol}>
          <View style={[styles.field, { flex: 1 }]}>
            <FieldLabel>Age</FieldLabel>
            <View style={styles.inputShell}>
              <TextInput
                accessibilityLabel="Age"
                inputMode="numeric"
                onChangeText={(age) => update({ age })}
                placeholder="e.g. 21"
                placeholderTextColor="#94a3b8"
                style={styles.input}
                value={initialValues.age}
              />
              <Text style={styles.suffix}>yrs</Text>
            </View>
          </View>

          <View style={[styles.field, { flex: 1 }]}>
            <FieldLabel>Height</FieldLabel>
            <View style={styles.inputShell}>
              <TextInput
                accessibilityLabel="Height"
                inputMode="decimal"
                onChangeText={(height) => update({ height })}
                placeholder={imperial ? "e.g. 65" : "e.g. 165"}
                placeholderTextColor="#94a3b8"
                style={styles.input}
                value={initialValues.height}
              />
              <Text style={styles.suffix}>{imperial ? "in" : "cm"}</Text>
            </View>
          </View>
        </View>

        {/* Weight and Target Weight */}
        <View style={styles.twoCol}>
          <View style={[styles.field, { flex: 1 }]}>
            <FieldLabel>Current Weight</FieldLabel>
            <View style={styles.inputShell}>
              <TextInput
                accessibilityLabel="Current Weight"
                inputMode="decimal"
                onChangeText={(weight) => update({ weight })}
                placeholder={imperial ? "e.g. 130" : "e.g. 60.0"}
                placeholderTextColor="#94a3b8"
                style={styles.input}
                value={initialValues.weight}
              />
              <Text style={styles.suffix}>{imperial ? "lb" : "kg"}</Text>
            </View>
          </View>

          <View style={[styles.field, { flex: 1 }]}>
            <FieldLabel>Target Goal</FieldLabel>
            <View style={styles.inputShell}>
              <TextInput
                accessibilityLabel="Target Weight"
                inputMode="decimal"
                onChangeText={(target) => update({ target })}
                placeholder={imperial ? "e.g. 125" : "e.g. 56.0"}
                placeholderTextColor="#94a3b8"
                style={styles.input}
                value={initialValues.target}
              />
              <Text style={styles.suffix}>{imperial ? "lb" : "kg"}</Text>
            </View>
          </View>
        </View>
      </View>

      <ActionButton
        icon="arrow"
        label="Continue to Activity"
        onPress={handleNext}
        primary
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  form: {
    width: "100%",
    gap: 16,
  },
  errorBox: {
    width: "100%",
    padding: 12,
    backgroundColor: "#fef2f2",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 13,
    fontFamily: fonts.interMedium,
    textAlign: "center" as unknown as undefined,
  },
  unitsSection: {
    width: "100%",
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unitsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  unitsLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.ink,
    fontFamily: fonts.interSemiBold,
  },
  pillSwitch: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 3,
  },
  pillOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    cursor: "pointer" as unknown as undefined,
  },
  pillSelected: {
    backgroundColor: colors.white,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  pillText: {
    fontSize: 12,
    color: colors.muted,
    fontFamily: fonts.interMedium,
  },
  pillTextSelected: {
    color: colors.ink,
    fontWeight: "700",
  },
  field: {
    gap: 6,
  },
  fieldHint: {
    fontSize: 12,
    color: colors.muted,
    fontFamily: fonts.interRegular,
  },
  genderRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer" as unknown as undefined,
  },
  genderBtnSelected: {
    borderColor: colors.mintInk,
    backgroundColor: colors.mint,
  },
  genderText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "500",
    fontFamily: fonts.interMedium,
  },
  genderTextSelected: {
    color: colors.mintInk,
    fontWeight: "700",
  },
  twoCol: {
    flexDirection: "row",
    gap: 12,
  },
  inputShell: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.ink,
    outlineStyle: "none" as unknown as undefined,
    fontFamily: fonts.interRegular,
  },
  suffix: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "500",
    fontFamily: fonts.interMedium,
  },
});
