import { useState, useEffect } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Feather } from "@expo/vector-icons"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "./firebase/config"

// Import các màn hình xác thực
import LoginScreen from "./screens/LoginScreen"
import RegisterScreen from "./screens/RegisterScreen"
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen"

// Import các màn hình chính
import HomeScreen from "./screens/HomeScreen"
import SearchScreen from "./screens/SearchScreen"
import CartScreen from "./screens/CartScreen"
import NotificationScreen from "./screens/NotificationScreen"
import ProfileScreen from "./screens/ProfileScreen"
import EditProfileScreen from './screens/EditProfileScreen';

// Import các màn hình con
import ProductDetailScreen from "./screens/ProductDetailScreen"
import CheckoutScreen from './screens/CheckoutScreen'
import OrderHistoryScreen from './screens/OrderHistoryScreen'
import PendingOrdersScreen from './screens/PendingOrdersScreen'
import OrderDetailScreen from './screens/OrderDetailScreen'

const Stack = createStackNavigator()
const Tab = createBottomTabNavigator()

// Component TabBar chính
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName

          switch (route.name) {
            case "Home":
              iconName = "home"
              break
            case "Search":
              iconName = "search"
              break
            case "Cart":
              iconName = "shopping-cart"
              break
            case "Notification":
              iconName = "bell"
              break
            case "Profile":
              iconName = "user"
              break
            default:
              iconName = "circle"
          }

          return <Feather name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: "#009245",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: "Trang chủ" }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ title: "Tìm kiếm" }} />
      <Tab.Screen name="Cart" component={CartScreen} options={{ title: "Giỏ hàng" }} />
      <Tab.Screen name="Notification" component={NotificationScreen} options={{ title: "Thông báo" }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Tài khoản" }} />
    </Tab.Navigator>
  )
}

export default function App() {
  const [initializing, setInitializing] = useState(true)
  const [user, setUser] = useState(null)

  // Xử lý trạng thái đăng nhập
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      if (initializing) setInitializing(false)
    })

    return unsubscribe
  }, [initializing])

  // Hiển thị loading khi khởi tạo
  if (initializing) return null

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          cardStyle: { backgroundColor: '#fff' }
        }}
      >
        {!user ? (
          // Stack màn hình xác thực
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        ) : (
          // Stack màn hình chính
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
            <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
            <Stack.Screen name="PendingOrders" component={PendingOrdersScreen} />
            <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen 
  name="Profile" 
  component={ProfileScreen}
  options={{
    unmountOnBlur: true
  }}
/>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}