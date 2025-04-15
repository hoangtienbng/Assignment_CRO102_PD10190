"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TextInput,
  Dimensions,
  ActivityIndicator,
  Modal,
} from "react-native"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "../firebase/config"
import CheckBox from "expo-checkbox"
import { Feather } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"

const { width } = Dimensions.get("window")

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // Kiểm tra thông tin đăng nhập đã lưu khi màn hình được tải
  useEffect(() => {
    const checkSavedCredentials = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem("savedEmail")
        const savedPassword = await AsyncStorage.getItem("savedPassword")
        const savedRememberMe = await AsyncStorage.getItem("rememberMe")

        if (savedEmail && savedPassword && savedRememberMe === "true") {
          setEmail(savedEmail)
          setPassword(savedPassword)
          setRememberMe(true)
        }
      } catch (error) {
        console.log("Error retrieving saved credentials:", error)
      }
    }

    checkSavedCredentials()
  }, [])

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Vui lòng nhập email và mật khẩu")
      return
    }

    setLoading(true)
    setError("")

    try {
      await signInWithEmailAndPassword(auth, email, password)

      // Lưu thông tin đăng nhập nếu người dùng chọn "Nhớ tài khoản"
      if (rememberMe) {
        await AsyncStorage.setItem("savedEmail", email)
        await AsyncStorage.setItem("savedPassword", password)
        await AsyncStorage.setItem("rememberMe", "true")
      } else {
        // Xóa thông tin đã lưu nếu không chọn "Nhớ tài khoản"
        await AsyncStorage.removeItem("savedEmail")
        await AsyncStorage.removeItem("savedPassword")
        await AsyncStorage.removeItem("rememberMe")
      }

      // Hiển thị modal thông báo đăng nhập thành công
      setShowSuccessModal(true)
    } catch (error) {
      console.log("Login error:", error)
      setError("Email hoặc mật khẩu không đúng. Vui lòng thử lại.")
    } finally {
      setLoading(false)
    }
  }

  const closeSuccessModal = () => {
    setShowSuccessModal(false)
    // Chuyển hướng đến màn hình chính
    navigation.reset({
      index: 0,
      routes: [{ name: "Main" }],
    })
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Header Image */}
          <View style={styles.imageContainer}>
            <Image source={require("../assets/plant-header.png")} style={styles.headerImage} resizeMode="cover" />
            <TouchableOpacity style={styles.backButton}>
              <Image source={require("../assets/back-button.png")} style={styles.backIcon} />
            </TouchableOpacity>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>Chào mừng bạn</Text>
            <Text style={styles.subtitle}>Đăng nhập tài khoản</Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Email Input */}
            <View style={[styles.inputContainer, emailFocused && styles.inputFocused]}>
              <TextInput
                style={styles.input}
                placeholder="Nhập email hoặc số điện thoại"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>

            {/* Password Input */}
            <View style={[styles.inputContainer, passwordFocused && styles.inputFocused]}>
              <TextInput
                style={styles.input}
                placeholder="Mật khẩu"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Feather name={showPassword ? "eye" : "eye-off"} size={24} color="#8b8b8b" />
              </TouchableOpacity>
            </View>

            <View style={styles.rememberContainer}>
              <View style={styles.checkboxContainer}>
                <CheckBox
                  value={rememberMe}
                  onValueChange={setRememberMe}
                  color={rememberMe ? "#009245" : undefined}
                  style={styles.checkbox}
                />
                <Text style={styles.rememberText}>Nhớ tài khoản</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
                <Text style={styles.forgotText}>Quên mật khẩu ?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Đăng nhập</Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>Hoặc</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.socialContainer}>
              <TouchableOpacity style={styles.socialButton} onPress={() => console.log("Google login")}>
                <Image source={require("../assets/google-icon.png")} style={styles.socialIcon} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton} onPress={() => console.log("Facebook login")}>
                <Image source={require("../assets/facebook-icon.png")} style={styles.socialIcon} />
              </TouchableOpacity>
            </View>

            <View style={styles.signupContainer}>
              <Text style={styles.noAccountText}>Bạn không có tài khoản </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={styles.signupText}>Tạo tài khoản</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal thông báo đăng nhập thành công */}
      <Modal visible={showSuccessModal} transparent={true} animationType="fade" onRequestClose={closeSuccessModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Feather name="check-circle" size={50} color="#009245" />
            </View>
            <Text style={styles.modalTitle}>Đăng nhập thành công!</Text>
            <Text style={styles.modalText}>Bạn đã đăng nhập thành công với tài khoản {email}.</Text>
            <TouchableOpacity style={styles.modalButton} onPress={closeSuccessModal}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flexGrow: 1,
  },
  imageContainer: {
    position: "relative",
  },
  headerImage: {
    width: "100%",
    height: 300,
    borderBottomRightRadius: 50,
    borderBottomLeftRadius: 50,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8eec0",
    justifyContent: "center",
    alignItems: "center",
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 5,
    textAlign: "center",
    color: "#000",
  },
  subtitle: {
    fontSize: 18,
    color: "#8b8b8b",
    marginBottom: 30,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 55,
    backgroundColor: "#fff",
  },
  inputFocused: {
    borderColor: "#009245",
    borderWidth: 2,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
  },
  eyeIcon: {
    padding: 5,
  },
  rememberContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    marginRight: 8,
    borderRadius: 5,
  },
  rememberText: {
    fontSize: 14,
    color: "#8b8b8b",
  },
  forgotText: {
    fontSize: 14,
    color: "#009245",
    fontWeight: "500",
  },
  loginButton: {
    backgroundColor: "#009245",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    height: 55,
  },
  disabledButton: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  dividerText: {
    paddingHorizontal: 10,
    color: "#8b8b8b",
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 30,
  },
  socialButton: {
    marginHorizontal: 10,
  },
  socialIcon: {
    width: 40,
    height: 40,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  noAccountText: {
    fontSize: 14,
    color: "#000",
  },
  signupText: {
    fontSize: 14,
    color: "#009245",
    fontWeight: "500",
  },
  errorText: {
    color: "#ff3d00",
    textAlign: "center",
    marginBottom: 10,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  modalHeader: {
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#000",
  },
  modalText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: "#666",
  },
  modalButton: {
    backgroundColor: "#009245",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
})

export default LoginScreen

