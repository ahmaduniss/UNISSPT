import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { trpc, trpcClient } from "@/lib/trpc";
import Colors from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isLoading } = useApp();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
        headerStyle: { backgroundColor: Colors.dark.background },
        headerTintColor: Colors.dark.text,
        contentStyle: { backgroundColor: Colors.dark.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="gym-select" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="routines"
        options={{
          title: "Routines",
          presentation: "modal",
          headerStyle: { backgroundColor: Colors.dark.card },
        }}
      />
      <Stack.Screen
        name="create-routine"
        options={{
          title: "Create Routine",
          presentation: "modal",
          headerStyle: { backgroundColor: Colors.dark.card },
        }}
      />
      <Stack.Screen
        name="exercise-library"
        options={{
          title: "Exercise Library",
          presentation: "modal",
          headerStyle: { backgroundColor: Colors.dark.card },
        }}
      />
      <Stack.Screen
        name="analytics"
        options={{
          title: "Analytics",
          presentation: "modal",
          headerStyle: { backgroundColor: Colors.dark.card },
        }}
      />
      <Stack.Screen
        name="achievements"
        options={{
          title: "Achievements",
          presentation: "modal",
          headerStyle: { backgroundColor: Colors.dark.card },
        }}
      />
      <Stack.Screen
        name="admin-dashboard"
        options={{
          title: "Admin Panel",
          headerStyle: { backgroundColor: Colors.dark.background },
        }}
      />
      <Stack.Screen
        name="admin-members"
        options={{
          title: "Members",
          headerStyle: { backgroundColor: Colors.dark.background },
        }}
      />
      <Stack.Screen
        name="admin-competitions"
        options={{
          title: "Competitions",
          headerStyle: { backgroundColor: Colors.dark.background },
        }}
      />
      <Stack.Screen
        name="admin-analytics"
        options={{
          title: "Gym Analytics",
          headerStyle: { backgroundColor: Colors.dark.background },
        }}
      />
      <Stack.Screen
        name="admin-announce"
        options={{
          title: "Announcement",
          headerStyle: { backgroundColor: Colors.dark.background },
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          title: "Profile",
          presentation: "modal",
          headerShown: false,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AppProvider>
            <RootLayoutNav />
          </AppProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
