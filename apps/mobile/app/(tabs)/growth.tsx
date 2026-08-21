import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { GrowthLog } from "@shared/types";

export default function GrowthScreen() {
  const [weight, setWeight] = useState("");
  const [length, setLength] = useState("");
  const [head, setHead] = useState("");

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Record Growth Measurements</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Weight (kg)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 5.4"
          placeholderTextColor="#64748b"
          keyboardType="decimal-pad"
          value={weight}
          onChangeText={setWeight}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Length (cm)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 58.5"
          placeholderTextColor="#64748b"
          keyboardType="decimal-pad"
          value={length}
          onChangeText={setLength}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Head Circumference (cm)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 39.0"
          placeholderTextColor="#64748b"
          keyboardType="decimal-pad"
          value={head}
          onChangeText={setHead}
        />
      </View>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Save Growth Record</Text>
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
  formGroup: {
    marginBottom: 16,
  },
  label: {
    color: "#94a3b8",
    fontSize: 14,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#1e293b",
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    color: "#ffffff",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#0284c7",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
