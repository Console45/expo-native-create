import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NativeStackParamList, Screens } from "./navigations";
import { Home } from "./screens";

const Stack = createNativeStackNavigator<NativeStackParamList>();
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={Screens.HOME}>
        <Stack.Screen name={Screens.HOME} component={Home} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
