"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
  FlatList,
} from "react-native"
import { Feather } from "@expo/vector-icons"
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  increment,
  deleteDoc,
  limit,
} from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { db } from "../firebase/config"

const { width } = Dimensions.get("window")

const ProductDetailScreen = ({ route, navigation }) => {
  const { productId } = route.params
  const [product, setProduct] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(0)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        // Fetch product details
        const productDoc = await getDoc(doc(db, "products", productId));
    
        if (!productDoc.exists()) {
          Alert.alert("Thông báo", "Không tìm thấy sản phẩm");
          navigation.goBack();
          return;
        }
    
        const productData = {
          id: productDoc.id,
          ...productDoc.data(),
        };
    
        // Đảm bảo dữ liệu hợp lệ
        productData.images = productData.images || [productData.imageUrl];
        if (productData.imageUrl && !productData.images.includes(productData.imageUrl)) {
          productData.images = [productData.imageUrl, ...productData.images];
        }
    
        setProduct(productData);
    
        // Fetch related products
        if (productData.categoryId) {
          const relatedQuery = query(
            collection(db, "products"),
            where("categoryId", "==", productData.categoryId),
            where("id", "!=", productId),
            limit(5)
          );
    
          const relatedSnapshot = await getDocs(relatedQuery);
          const relatedData = relatedSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
    
          setRelatedProducts(relatedData);
        }
    
      } catch (error) {
        console.error("Lỗi khi tải thông tin sản phẩm:", error);
        Alert.alert(
          "Lỗi",
          "Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.",
          [
            { 
              text: "Thử lại", 
              onPress: () => fetchProductData() 
            },
            {
              text: "Quay lại",
              onPress: () => navigation.goBack(),
              style: "cancel"
            }
          ]
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProductData()
  }, [productId])

  const increaseQuantity = () => {
    if (quantity < 10) {
      setQuantity(quantity + 1)
    }
  }

  const decreaseQuantity = () => {
    if (quantity > 0) {
      setQuantity(quantity - 1)
    }
  }

  const toggleFavorite = async () => {
    try {
      const auth = getAuth()
      if (!auth.currentUser) {
        Alert.alert("Thông báo", "Vui lòng đăng nhập để thêm sản phẩm vào danh sách yêu thích")
        return
      }

      const userId = auth.currentUser.uid
      const favoritesQuery = query(
        collection(db, "favorites"),
        where("userId", "==", userId),
        where("productId", "==", productId),
      )

      const favoritesSnapshot = await getDocs(favoritesQuery)

      if (favoritesSnapshot.empty) {
        // Add to favorites
        await addDoc(collection(db, "favorites"), {
          userId,
          productId,
          addedAt: new Date(),
        })
        setIsFavorite(true)
      } else {
        // Remove from favorites
        const favoriteDoc = favoritesSnapshot.docs[0]
        await deleteDoc(doc(db, "favorites", favoriteDoc.id))
        setIsFavorite(false)
      }
    } catch (error) {
      console.error("Error toggling favorite:", error)
      Alert.alert("Lỗi", "Không thể cập nhật danh sách yêu thích")
    }
  }

  const addToCart = async () => {
    if (quantity === 0) {
      Alert.alert("Thông báo", "Vui lòng chọn số lượng sản phẩm");
      return;
    }
  
    try {
      const auth = getAuth();
      if (!auth.currentUser) {
        Alert.alert("Thông báo", "Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng");
        return;
      }
  
      const userId = auth.currentUser.uid;
  
      // Kiểm tra sản phẩm trong giỏ hàng
      const cartQuery = query(
        collection(db, "carts"),
        where("userId", "==", userId),
        where("productId", "==", productId)
      );
  
      const cartSnapshot = await getDocs(cartQuery);
  
      if (cartSnapshot.empty) {
        // Thêm sản phẩm mới vào giỏ hàng
        const cartItem = {
          userId,
          productId,
          quantity,
          price: product.price,
          name: product.name,
          imageUrl: product.imageUrl,
          addedAt: new Date()
        };
  
        await addDoc(collection(db, "carts"), cartItem);
      } else {
        // Cập nhật số lượng sản phẩm đã có
        const cartDoc = cartSnapshot.docs[0];
        await updateDoc(doc(db, "carts", cartDoc.id), {
          quantity: increment(quantity)
        });
      }
  
      Alert.alert(
        "Thành công", 
        `Đã thêm ${quantity} ${product.name} vào giỏ hàng`,
        [
          { text: "Tiếp tục mua sắm" },
          { 
            text: "Xem giỏ hàng",
            onPress: () => navigation.navigate("Main", { screen: "Cart" })
          }
        ]
      );
      
      setQuantity(0); // Reset số lượng sau khi thêm
  
    } catch (error) {
      console.error("Lỗi khi thêm vào giỏ hàng:", error);
      Alert.alert(
        "Lỗi",
        "Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại sau."
      );
    }
  };

  const renderImageItem = ({ item, index }) => (
    <TouchableOpacity
      style={[styles.thumbnailItem, selectedImage === index && styles.thumbnailItemActive]}
      onPress={() => setSelectedImage(index)}
    >
      <Image source={{ uri: item }} style={styles.thumbnailImage} resizeMode="cover" />
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#009245" />
      </View>
    )
  }

  // Tính toán tổng tiền
  const totalPrice = product ? product.price * quantity : 0

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Feather name="chevron-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{product.name}</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Cart")} style={styles.headerButton}>
          <Feather name="shopping-cart" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Product Images Slider */}
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri:
                product.images && product.images.length > 0
                  ? product.images[selectedImage]
                  : product.imageUrl || "https://via.placeholder.com/400?text=No+Image",
            }}
            style={styles.productImage}
            resizeMode="cover"
          />

          {/* Navigation arrows */}
          <TouchableOpacity
            style={[styles.navArrow, styles.leftArrow]}
            onPress={() => {
              if (product.images && product.images.length > 1) {
                setSelectedImage((prev) => (prev === 0 ? product.images.length - 1 : prev - 1))
              }
            }}
          >
            <Feather name="chevron-left" size={24} color="#000" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navArrow, styles.rightArrow]}
            onPress={() => {
              if (product.images && product.images.length > 1) {
                setSelectedImage((prev) => (prev === product.images.length - 1 ? 0 : prev + 1))
              }
            }}
          >
            <Feather name="chevron-right" size={24} color="#000" />
          </TouchableOpacity>

          {/* Image indicators */}
          {product.images && product.images.length > 1 && (
            <View style={styles.indicators}>
              {product.images.map((_, index) => (
                <View key={index} style={[styles.indicator, selectedImage === index ? styles.activeIndicator : {}]} />
              ))}
            </View>
          )}
        </View>

        {/* Image Thumbnails - Chỉ hiển thị khi có nhiều hơn 1 ảnh */}
        {product.images && product.images.length > 1 && (
          <FlatList
            data={product.images}
            renderItem={renderImageItem}
            keyExtractor={(_, index) => `image_${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnailsContainer}
          />
        )}

        {/* Tags */}
        <View style={styles.tagsContainer}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>Cây trồng</Text>
          </View>
          {product.lightRequirement && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{product.lightRequirement}</Text>
            </View>
          )}
        </View>

        {/* Price */}
        <Text style={styles.price}>{product.price?.toLocaleString("vi-VN")}đ</Text>

        {/* Product Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.sectionTitle}>Chi tiết sản phẩm</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Kích cỡ</Text>
            <Text style={styles.detailValue}>{product.size || "Nhỏ"}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Xuất xứ</Text>
            <Text style={styles.detailValue}>{product.origin || "Châu Phi"}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tình trạng</Text>
            <Text style={[styles.detailValue, styles.inStock]}>Còn {product.stock || 156} sp</Text>
          </View>
        </View>

        {/* Description */}
        {product.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>Mô tả sản phẩm</Text>
            <Text style={styles.descriptionText} numberOfLines={showFullDescription ? undefined : 3}>
              {product.description}
            </Text>
            {product.description.length > 150 && (
              <TouchableOpacity
                style={styles.readMoreButton}
                onPress={() => setShowFullDescription(!showFullDescription)}
              >
                <Text style={styles.readMoreText}>{showFullDescription ? "Thu gọn" : "Xem thêm"}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Care Instructions */}
        {product.careInstructions && (
          <View style={styles.careContainer}>
            <Text style={styles.careTitle}>Hướng dẫn chăm sóc</Text>
            <View style={styles.careInstructions}>
              {product.waterRequirement && (
                <View style={styles.careItem}>
                  <Feather name="droplet" size={20} color="#009245" style={styles.careIcon} />
                  <Text style={styles.careText}>{product.waterRequirement}</Text>
                </View>
              )}
              {product.lightRequirement && (
                <View style={styles.careItem}>
                  <Feather name="sun" size={20} color="#009245" style={styles.careIcon} />
                  <Text style={styles.careText}>{product.lightRequirement}</Text>
                </View>
              )}
              {product.temperatureRequirement && (
                <View style={styles.careItem}>
                  <Feather name="thermometer" size={20} color="#009245" style={styles.careIcon} />
                  <Text style={styles.careText}>{product.temperatureRequirement}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <View style={styles.relatedProductsContainer}>
            <Text style={styles.relatedProductsTitle}>Sản phẩm liên quan</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.relatedProductsList}
            >
              {relatedProducts.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.relatedProductCard}
                  onPress={() => navigation.replace("ProductDetail", { productId: item.id })}
                >
                  <Image source={{ uri: item.imageUrl }} style={styles.relatedProductImage} resizeMode="cover" />
                  <View style={styles.relatedProductInfo}>
                    <Text style={styles.relatedProductName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.relatedProductPrice}>{item.price.toLocaleString("vi-VN")}đ</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.quantitySection}>
          <Text style={styles.quantityLabel}>Đã chọn {quantity} sản phẩm</Text>

          <View style={styles.quantityControls}>
            <TouchableOpacity style={styles.quantityButton} onPress={decreaseQuantity}>
              <Feather name="minus" size={20} color="#000" />
            </TouchableOpacity>

            <Text style={styles.quantityValue}>{quantity}</Text>

            <TouchableOpacity style={styles.quantityButton} onPress={increaseQuantity}>
              <Feather name="plus" size={20} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.priceSection}>
          <Text style={styles.totalLabel}>Tổng</Text>
          <Text style={styles.totalPrice}>{totalPrice.toLocaleString("vi-VN")}đ</Text>
        </View>

        <TouchableOpacity
          style={[styles.buyButton, quantity === 0 ? styles.disabledButton : {}]}
          onPress={addToCart}
          disabled={quantity === 0}
        >
          <Text style={styles.buyButtonText}>CHỌN MUA</Text>
        </TouchableOpacity>
      </View>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#fff",
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: width,
    backgroundColor: "#f6f6f6",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  navArrow: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    top: "50%",
    marginTop: -20,
  },
  leftArrow: {
    left: 16,
  },
  rightArrow: {
    right: 16,
  },
  indicators: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ccc",
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: "#000",
  },
  thumbnailsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  thumbnailItem: {
    width: 60,
    height: 60,
    borderRadius: 4,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    overflow: "hidden",
  },
  thumbnailItemActive: {
    borderColor: "#009245",
    borderWidth: 2,
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  tagsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tag: {
    backgroundColor: "#009245",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginRight: 8,
  },
  tagText: {
    color: "#fff",
    fontWeight: "500",
  },
  price: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#009245",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  detailsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingBottom: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  detailLabel: {
    fontSize: 16,
    color: "#333",
  },
  detailValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  inStock: {
    color: "#009245",
  },
  descriptionContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#333",
  },
  readMoreButton: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  readMoreText: {
    color: "#009245",
    fontWeight: "500",
  },
  careContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  careTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
  },
  careInstructions: {
    marginTop: 8,
  },
  careItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  careIcon: {
    marginRight: 12,
  },
  careText: {
    fontSize: 14,
    color: "#333",
  },
  relatedProductsContainer: {
    padding: 16,
  },
  relatedProductsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 16,
  },
  relatedProductsList: {
    paddingBottom: 8,
  },
  relatedProductCard: {
    width: 150,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  relatedProductImage: {
    width: 150,
    height: 150,
  },
  relatedProductInfo: {
    padding: 8,
  },
  relatedProductName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
    height: 36,
  },
  relatedProductPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#009245",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 30,
  },
  quantitySection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  quantityLabel: {
    fontSize: 16,
    color: "#666",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityValue: {
    width: 40,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "500",
  },
  priceSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    color: "#666",
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  buyButton: {
    backgroundColor: "#009245",
    borderRadius: 4,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  buyButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
})

export default ProductDetailScreen

