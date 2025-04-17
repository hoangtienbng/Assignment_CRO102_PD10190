"use client"

import { useState, useEffect } from "react"
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    StatusBar,
    Alert,
} from "react-native"
import { Feather } from "@expo/vector-icons"
import { getAuth, signOut } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../firebase/config"
import AsyncStorage from "@react-native-async-storage/async-storage"

const ProfileScreen = ({ navigation, route }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      if (route.params?.updatedUser) {
        setUser(prevUser => ({
          ...prevUser,
          ...route.params.updatedUser,
        }));
        // Clear params after update
        navigation.setParams({ updatedUser: null });
      }
    }, [route.params?.updatedUser]);

    useEffect(() => {
        if (route.params?.updatedUser) {
          setUser(prevUser => ({
            ...prevUser,
            ...route.params.updatedUser
          }));
        }
      }, [route.params?.updatedUser]);
  
    useEffect(() => {
      const fetchUserData = async () => {
        try {
          const auth = getAuth();
          const currentUser = auth.currentUser;
  
          if (currentUser) {
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
  
            if (userDoc.exists()) {
              setUser({
                uid: currentUser.uid,
                displayName: currentUser.displayName,
                email: currentUser.email,
                ...userDoc.data(),
              });
            } else {
              setUser({
                uid: currentUser.uid,
                displayName: currentUser.displayName,
                email: currentUser.email,
              });
            }
          }
        } catch (error) {
          console.error("Lỗi khi tải thông tin người dùng:", error);
        } finally {
          setLoading(false);
        }
      };
  
      fetchUserData();
    }, []);
  
    // ...rest of the code remains the same

    const handleLogout = async () => {
        try {
          const auth = getAuth(); // Get auth instance
          await signOut(auth);
          // Chuyển về màn hình Login
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        } catch (error) {
          console.error("Lỗi đăng xuất:", error);
          Alert.alert("Lỗi", "Không thể đăng xuất. Vui lòng thử lại.");
        }
      };
    if (loading) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <Text>Đang tải...</Text>
            </View>
        )
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Tài khoản</Text>
                <TouchableOpacity>
                    <Feather name="settings" size={24} color="#000" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.profileSection}>
  <Image 
    source={
      user?.avatarUrl 
        ? { uri: user.avatarUrl }
        : require("../assets/avatar2.png")
    } 
    style={styles.avatar}
  />
  <View style={styles.profileInfo}>
    <Text style={styles.userName}>{user?.displayName || "Người dùng"}</Text>
    <Text style={styles.userEmail}>{user?.email}</Text>
  </View>
  <TouchableOpacity 
    style={styles.editButton}
    onPress={() => navigation.navigate('EditProfile', { user })}
  >
    <Feather name="edit" size={20} color="#009245" />
  </TouchableOpacity>
</View>

                <View style={styles.menuSection}>
    <Text style={styles.menuTitle}>Đơn hàng của tôi</Text>

    <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => navigation.navigate('PendingOrders')}
    >
        <View style={styles.menuIconContainer}>
            <Feather name="package" size={20} color="#009245" />
        </View>
        <Text style={styles.menuText}>Đơn hàng đang xử lý</Text>
        <Feather name="chevron-right" size={20} color="#8b8b8b" />
    </TouchableOpacity>

    <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => navigation.navigate('OrderHistory')}
    >
        <View style={styles.menuIconContainer}>
            <Feather name="truck" size={20} color="#009245" />
        </View>
        <Text style={styles.menuText}>Lịch sử đơn hàng</Text>
        <Feather name="chevron-right" size={20} color="#8b8b8b" />
    </TouchableOpacity>

    <TouchableOpacity style={styles.menuItem}>
        <View style={styles.menuIconContainer}>
            <Feather name="heart" size={20} color="#009245" />
        </View>
        <Text style={styles.menuText}>Sản phẩm yêu thích</Text>
        <Feather name="chevron-right" size={20} color="#8b8b8b" />
    </TouchableOpacity>
</View>

                <View style={styles.menuSection}>
                    <Text style={styles.menuTitle}>Tài khoản</Text>

                   
<TouchableOpacity 
    style={styles.menuItem}
    onPress={() => navigation.navigate('EditProfile')}
>
    <View style={styles.menuIconContainer}>
        <Feather name="user" size={20} color="#009245" />
    </View>
    <Text style={styles.menuText}>Thông tin cá nhân</Text>
    <Feather name="chevron-right" size={20} color="#8b8b8b" />
</TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuIconContainer}>
                            <Feather name="map-pin" size={20} color="#009245" />
                        </View>
                        <Text style={styles.menuText}>Địa chỉ giao hàng</Text>
                        <Feather name="chevron-right" size={20} color="#8b8b8b" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuIconContainer}>
                            <Feather name="credit-card" size={20} color="#009245" />
                        </View>
                        <Text style={styles.menuText}>Phương thức thanh toán</Text>
                        <Feather name="chevron-right" size={20} color="#8b8b8b" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                        <View style={styles.menuIconContainer}>
                            <Feather name="log-out" size={20} color="#ff3d00" />
                        </View>
                        <Text style={[styles.menuText, { color: "#ff3d00" }]}>Đăng xuất</Text>
                        <Feather name="chevron-right" size={20} color="#8b8b8b" />
                    </TouchableOpacity>
                </View>

                <View style={styles.menuSection}>
                    <Text style={styles.menuTitle}>Hỗ trợ</Text>

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuIconContainer}>
                            <Feather name="help-circle" size={20} color="#009245" />
                        </View>
                        <Text style={styles.menuText}>Trung tâm trợ giúp</Text>
                        <Feather name="chevron-right" size={20} color="#8b8b8b" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuIconContainer}>
                            <Feather name="message-circle" size={20} color="#009245" />
                        </View>
                        <Text style={styles.menuText}>Liên hệ với chúng tôi</Text>
                        <Feather name="chevron-right" size={20} color="#8b8b8b" />
                    </TouchableOpacity>
                </View>

                <View style={styles.versionInfo}>
                    <Text style={styles.versionText}>Phiên bản 1.0.0</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    loadingContainer: {
        justifyContent: "center",
        alignItems: "center",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 10,
        backgroundColor: "#fff",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#000",
    },
    profileSection: {
        flexDirection: "row",
        alignItems: "center",
        padding: 20,
        backgroundColor: "#f9f9f9",
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 15,
    },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
    },
    profileInfo: {
        flex: 1,
        marginLeft: 15,
    },
    userName: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#000",
        marginBottom: 5,
    },
    userEmail: {
        fontSize: 14,
        color: "#8b8b8b",
    },
    editButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#e6f7ee",
        justifyContent: "center",
        alignItems: "center",
    },
    menuSection: {
        marginTop: 25,
        paddingHorizontal: 20,
    },
    menuTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#000",
        marginBottom: 15,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#f0f0f0",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 15,
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        color: "#333",
    },
    versionInfo: {
        alignItems: "center",
        marginTop: 30,
        marginBottom: 20,
    },
    versionText: {
        fontSize: 14,
        color: "#8b8b8b",
    },
})

export default ProfileScreen

