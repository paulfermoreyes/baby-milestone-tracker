import { Tabs } from "expo-router";
import React from "react";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: "#0f172a",
          borderTopColor: "#1e293b",
        },
        tabBarActiveTintColor: "#38bdf8",
        tabBarInactiveTintColor: "#64748b",
        headerStyle: { backgroundColor: "#0f172a" },
        headerTintColor: "#ffffff",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Milestones",
          headerTitle: "Baby Milestones",
        }}
      />
      <Tabs.Screen
        name="growth"
        options={{
          title: "Growth",
          headerTitle: "Growth Tracking",
        }}
      />
      <Tabs.Screen
        name="care"
        options={{
          title: "Care Log",
          headerTitle: "Daily Care Logger",
        }}
      />
    </Tabs>
  );
}
