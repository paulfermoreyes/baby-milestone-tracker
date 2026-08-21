import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { CareLogType } from "@shared/types";

export default function CareScreen() {
  const [selectedType, setSelectedType] = useState<CareLogType>("feeding");

  const types: { key: CareLogType; label: string; icon: string }[] = [
    { key: "feeding", label: "Feeding", icon: "🍼" },
    { key: "diaper", label: "Diaper", icon: "🧷" },
    { key: "sleep", label: "Sleep", icon: "🌙" },
    { key: "tummy_time", label: "Tummy Time", icon: "👶" },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Log Daily Care Activity</Text>

      <View style={styles.grid}>
        {types.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[
              styles.tile,
              selectedType === t.key && styles.activeTile,
            ]}
            onPress={() => setSelectedType(t.key)}
          >
            <Text style={styles.icon}>{t.icon}</Text>
            <Text
              style={[
                styles.tileLabel,
                selectedType === t.key && styles.activeTileLabel,
              ]}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Log {types.find(t => t.key === selectedType)?.label}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090d16",
  },
  content: {
    padding: 20,
  },
  header: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  tile: {
    width: "47%",
    backgroundColor: "#1e293b",
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    justify: "center",
  },
  activeTile: {
    borderColor: "#0284c7",
    backgroundColor: "rgba(2, 132, 199, 0.15)",
  },
  icon: {
    fontSize: 32,
    marginBottom: 8,
  },
  tileLabel: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "600",
  },
  activeTileLabel: {
    color: "#38bdf8",
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "#0284c7",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
