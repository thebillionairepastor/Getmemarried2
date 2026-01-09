import React from "react";
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Screens
import SignupScreen from "./screens/SignupScreen";
import LoginScreen from "./screens/LoginScreen";
import UserDashboard from "./screens/UserDashboard";
import GuardianDashboard from "./screens/GuardianDashboard";
import AdminDashboard from "./screens/AdminDashboard";
import SubAdminDashboard from "./screens/SubAdminDashboard";
import VerificationApproval from "./screens/VerificationApproval";
import GuardianTaskScreen from "./screens/GuardianTaskScreen";
import MatchesScreen from "./screens/MatchesScreen";
import ChatScreen from "./screens/ChatScreen";
import EngagementScreen from "./screens/EngagementScreen";
import GoLiveScreen from "./screens/GoLiveScreen";
import GuardianMetricsScreen from "./screens/GuardianMetricsScreen";

// Firebase setup
import "./firebase/config";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <>
      <StatusBar style="auto" />
      <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: true }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="UserDashboard" component={UserDashboard} />
        <Stack.Screen name="GuardianDashboard" component={GuardianDashboard} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        <Stack.Screen name="SubAdminDashboard" component={SubAdminDashboard} />
        <Stack.Screen
          name="VerificationApproval"
          component={VerificationApproval}
        />
        <Stack.Screen
          name="GuardianTaskScreen"
          component={GuardianTaskScreen}
        />
        <Stack.Screen name="MatchesScreen" component={MatchesScreen} />
        <Stack.Screen name="ChatScreen" component={ChatScreen} />
        <Stack.Screen name="EngagementScreen" component={EngagementScreen} />
        <Stack.Screen name="GoLiveScreen" component={GoLiveScreen} />
        <Stack.Screen name="GuardianMetricsScreen" component={GuardianMetricsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
    </>
  );
}
