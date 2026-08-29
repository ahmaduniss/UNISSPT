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
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(client)" options={{ headerShown: false }} />
      <Stack.Screen
        name="coach/[id]/index"
        options={{
          title: "Coach",
          headerStyle: { backgroundColor: Colors.dark.background },
        }}
      />
      <Stack.Screen
        name="coach/[id]/history"
        options={{
          title: "History",
          headerStyle: { backgroundColor: Colors.dark.background },
        }}
      />
      <Stack.Screen
        name="coach/[id]/photos"
        options={{
          title: "Progress Photos",
          headerStyle: { backgroundColor: Colors.dark.background },
        }}
      />
      <Stack.Screen
        name="coach/[id]/performance"
        options={{
          title: "Performance Testing",
          headerStyle: { backgroundColor: Colors.dark.background },
        }}
      />
      <Stack.Screen
        name="trainer/[trainerId]"
        options={{
          title: "Trainer",
          headerStyle: { backgroundColor: Colors.dark.background },
        }}
      />
      <Stack.Screen
        name="trainer-public-profile"
        options={{
          title: "Public Profile",
          presentation: "modal",
          headerStyle: { backgroundColor: Colors.dark.card },
        }}
      />
      <Stack.Screen
        name="add-client"
        options={{
          title: "Add Client",
          presentation: "modal",
          headerStyle: { backgroundColor: Colors.dark.card },
        }}
      />
      <Stack.Screen
        name="client/[id]/index"
        options={{
          title: "Client",
          headerStyle: { backgroundColor: Colors.dark.background },
        }}
      />
      <Stack.Screen
        name="client/[id]/edit"
        options={{
          title: "Edit Client",
          presentation: "modal",
          headerStyle: { backgroundColor: Colors.dark.card },
        }}
      />
      <Stack.Screen
        name="client/[id]/history"
        options={{
          title: "History",
          headerStyle: { backgroundColor: Colors.dark.background },
        }}
      />
      <Stack.Screen
        name="client/[id]/photos"
        options={{
          title: "Progress Photos",
          headerStyle: { backgroundColor: Colors.dark.background },
        }}
      />
      <Stack.Screen
        name="client/[id]/add-photo"
        options={{
          title: "Add Photo",
          presentation: "modal",
          headerStyle: { backgroundColor: Colors.dark.card },
        }}
      />
      <Stack.Screen
        name="client/[id]/analytics"
        options={{
          title: "Analytics",
          headerStyle: { backgroundColor: Colors.dark.background },
        }}
      />
      <Stack.Screen
        name="client/[id]/performance"
        options={{
          title: "Performance Testing",
          headerStyle: { backgroundColor: Colors.dark.background },
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
