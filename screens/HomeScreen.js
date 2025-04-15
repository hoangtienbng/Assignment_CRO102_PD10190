"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  FlatList,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native"
import { Feather } from "@expo/vector-icons"
import { collection, getDocs, query, limit } from "firebase/firestore"
import { db } from "../firebase/config"

const { width } = Dimensions.get("window")
const ITEM_WIDTH = (width - 48) / 2

const HomeScreen = ({ navigation }) => {
  const [plants, setPlants] = useState([])
  const [accessories, setAccessories] = useState([])
  const [planters, setPlanters] = useState([])
  const [growKits, setGrowKits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching data from Firestore...")

        // Kiểm tra kết nối đến Firestore
        if (!db) {
          throw new Error("Firestore connection not established")
        }

        // Lấy tất cả sản phẩm từ collection 'products'
        const productsRef = collection(db, "products")
        console.log("Collection reference created")

        // Giới hạn số lượng sản phẩm để tránh tải quá nhiều dữ liệu
        const productsQuery = query(productsRef, limit(20))
        console.log("Query created")

        const productsSnapshot = await getDocs(productsQuery)
        console.log(`Fetched ${productsSnapshot.docs.length} products`)

        // Chuyển đổi snapshot thành mảng dữ liệu
        const allProducts = productsSnapshot.docs.map((doc) => {
          const data = doc.data()
          console.log(`Product ID: ${doc.id}, Type: ${data.type || "undefined"}`)
          return {
            id: doc.id,
            ...data,
            // Đảm bảo các trường bắt buộc luôn có giá trị
            name: data.name || "Sản phẩm không tên",
            price: data.price || 0,
            imageUrl: data.imageUrl || "https://via.placeholder.com/300",
            type: data.type || "unknown",
          }
        })

        // Lọc sản phẩm theo loại ở phía client
        const plantsData = allProducts.filter((product) => product.type === "plant").slice(0, 6)
        const accessoriesData = allProducts.filter((product) => product.type === "accessory").slice(0, 4)
        const plantersData = allProducts.filter((product) => product.type === "planter").slice(0, 4)
        const growKitsData = allProducts.filter((product) => product.type === "growkit").slice(0, 2)

        console.log(
          `Filtered: ${plantsData.length} plants, ${accessoriesData.length} accessories, ${plantersData.length} planters, ${growKitsData.length} grow kits`,
        )

        // Cập nhật state
        setPlants(plantsData)
        setAccessories(accessoriesData)
        setPlanters(plantersData)
        setGrowKits(growKitsData)
        setError(null)
      } catch (error) {
        console.error("Error fetching data:", error)
        setError(error.message)
        // Hiển thị thông báo lỗi cho người dùng
        Alert.alert("Lỗi kết nối", "Không thể tải dữ liệu sản phẩm. Vui lòng kiểm tra kết nối mạng và thử lại.", [
          { text: "OK" },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const renderProductItem = ({ item }) => {
    if (!item) return null

    return (
      <TouchableOpacity
        style={styles.productItem}
        onPress={() => navigation.navigate("ProductDetail", { productId: item.id })}
      >
        <View style={styles.productImageContainer}>
          <Image source={{ uri: item.imageUrl }} style={styles.productImage} resizeMode="cover" />
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.lightRequirement && <Text style={styles.productAttribute}>{item.lightRequirement}</Text>}
          <Text style={styles.productPrice}>{item.price.toLocaleString("vi-VN")}đ</Text>
        </View>
      </TouchableOpacity>
    )
  }

  const renderGrowKitItem = ({ item }) => {
    if (!item) return null

    return (
      <TouchableOpacity
        style={styles.growKitItem}
        onPress={() => navigation.navigate("ProductDetail", { productId: item.id })}
      >
        <View style={styles.growKitContent}>
          <View>
            <Text style={styles.growKitName}>{item.name}</Text>
            <Text style={styles.growKitDescription} numberOfLines={3}>
              {item.shortDescription || ""}
            </Text>
          </View>
        </View>
        <Image source={{ uri: item.imageUrl }} style={styles.growKitImage} resizeMode="cover" />
      </TouchableOpacity>
    )
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#009245" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Feather name="alert-circle" size={50} color="#ff3d00" />
        <Text style={styles.errorText}>Đã xảy ra lỗi khi tải dữ liệu</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setLoading(true)
            setError(null)
            // Gọi lại useEffect
            const fetchData = async () => {
              try {
                // Lấy tất cả sản phẩm từ collection 'products'
                const productsRef = collection(db, "products")
                const productsSnapshot = await getDocs(productsRef)

                // Chuyển đổi snapshot thành mảng dữ liệu
                const allProducts = productsSnapshot.docs.map((doc) => ({
                  id: doc.id,
                  ...doc.data(),
                  // Đảm bảo các trường bắt buộc luôn có giá trị
                  name: doc.data().name || "Sản phẩm không tên",
                  price: doc.data().price || 0,
                  imageUrl: doc.data().imageUrl || "https://via.placeholder.com/300",
                  type: doc.data().type || "unknown",
                }))

                // Lọc sản phẩm theo loại ở phía client
                const plantsData = allProducts.filter((product) => product.type === "plant").slice(0, 6)
                const accessoriesData = allProducts.filter((product) => product.type === "accessory").slice(0, 4)
                const plantersData = allProducts.filter((product) => product.type === "planter").slice(0, 4)
                const growKitsData = allProducts.filter((product) => product.type === "growkit").slice(0, 2)

                // Cập nhật state
                setPlants(plantsData)
                setAccessories(accessoriesData)
                setPlanters(plantersData)
                setGrowKits(growKitsData)
                setError(null)
              } catch (error) {
                console.error("Error fetching data:", error)
                setError(error.message)
              } finally {
                setLoading(false)
              }
            }

            fetchData()
          }}
        >
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Planta - toả sáng</Text>
            <Text style={styles.headerTitle}>không gian nhà bạn</Text>

            <TouchableOpacity style={styles.viewNewButton}>
              <Text style={styles.viewNewText}>Xem hàng mới về</Text>
              <Feather name="arrow-right" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <Image source={require("../assets/banner.jpg")} style={styles.headerImage} resizeMode="cover" />

          <TouchableOpacity style={styles.cartButton} onPress={() => navigation.navigate("Cart")}>
            <Feather name="shopping-cart" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Plants Section */}
        {plants.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Cây trồng</Text>
            </View>

            <FlatList
              data={plants.slice(0, 2)}
              renderItem={renderProductItem}
              keyExtractor={(item) => item.id}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={styles.productRow}
            />

            {plants.length > 2 && (
              <FlatList
                data={plants.slice(2, 4)}
                renderItem={renderProductItem}
                keyExtractor={(item) => item.id}
                numColumns={2}
                scrollEnabled={false}
                columnWrapperStyle={styles.productRow}
              />
            )}

            <TouchableOpacity style={styles.viewMoreContainer}>
              <Text style={styles.viewMoreText}>Xem thêm Cây trồng</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Planters Section */}
        {planters.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Chậu cây trồng</Text>
            </View>

            <FlatList
              data={planters.slice(0, 2)}
              renderItem={renderProductItem}
              keyExtractor={(item) => item.id}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={styles.productRow}
            />

            {planters.length > 2 && (
              <FlatList
                data={planters.slice(2, 4)}
                renderItem={renderProductItem}
                keyExtractor={(item) => item.id}
                numColumns={2}
                scrollEnabled={false}
                columnWrapperStyle={styles.productRow}
              />
            )}
          </View>
        )}

        {/* Accessories Section */}
        {accessories.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Phụ kiện</Text>
            </View>

            <FlatList
              data={accessories.slice(0, 2)}
              renderItem={renderProductItem}
              keyExtractor={(item) => item.id}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={styles.productRow}
            />

            {accessories.length > 2 && (
              <FlatList
                data={accessories.slice(2, 4)}
                renderItem={renderProductItem}
                keyExtractor={(item) => item.id}
                numColumns={2}
                scrollEnabled={false}
                columnWrapperStyle={styles.productRow}
              />
            )}

            <TouchableOpacity style={styles.viewMoreContainer}>
              <Text style={styles.viewMoreText}>Xem thêm Phụ kiện</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Grow Kits Section */}
        {growKits.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Combo chăm sóc (mới)</Text>
            </View>

            <FlatList
              data={growKits}
              renderItem={renderGrowKitItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: 80 }} />
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
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#009245",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  headerBanner: {
    position: "relative",
    height: 300,
    marginBottom: 20,
  },
  headerContent: {
    position: "absolute",
    top: 60,
    left: 20,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  viewNewButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
  },
  viewNewText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
    marginRight: 5,
  },
  headerImage: {
    width: "100%",
    height: "100%",
  },
  cartButton: {
    position: "absolute",
    top: 60,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1,
  },
  sectionContainer: {
    marginBottom: 30,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  productRow: {
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  productItem: {
    width: ITEM_WIDTH,
    backgroundColor: "#f6f6f6",
    borderRadius: 8,
    overflow: "hidden",
  },
  productImageContainer: {
    width: "100%",
    height: ITEM_WIDTH,
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    marginBottom: 4,
  },
  productAttribute: {
    fontSize: 14,
    color: "#7d7b7b",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#009245",
  },
  viewMoreContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  viewMoreText: {
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  growKitItem: {
    flexDirection: "row",
    backgroundColor: "#f6f6f6",
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: "hidden",
    height: 150,
  },
  growKitContent: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  growKitName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  growKitDescription: {
    fontSize: 14,
    color: "#7d7b7b",
    lineHeight: 20,
  },
  growKitImage: {
    width: 150,
    height: 150,
  },
})

export default HomeScreen

