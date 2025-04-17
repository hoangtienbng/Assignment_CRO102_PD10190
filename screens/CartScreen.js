"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native"
import { Feather } from "@expo/vector-icons"
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { db } from "../firebase/config"

const CartScreen = ({ navigation }) => {
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState({})
  const [totalPrice, setTotalPrice] = useState(0)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false)

  useEffect(() => {
    fetchCartItems()
  }, [])

  useEffect(() => {
    calculateTotal()
  }, [cartItems, selectedItems])

  const fetchCartItems = async () => { //xử lý lấy dữ liệu giỏ hàng
    try {
      const auth = getAuth()
      if (!auth.currentUser) {
        setLoading(false)
        return
      }

      const userId = auth.currentUser.uid
      const cartQuery = query(collection(db, "carts"),
       where("userId", "==", userId))

      const cartSnapshot = await getDocs(cartQuery)
      const cartData = []

      // Lấy thông tin chi tiết của từng sản phẩm
      for (const cartDoc of cartSnapshot.docs) {
        const cartItem = {
          id: cartDoc.id,
          ...cartDoc.data(),
        }

        // Lấy thông tin sản phẩm từ collection products
        try {
          const productDoc = await getDoc(doc(db, "products", cartItem.productId))
          if (productDoc.exists()) {
            const productData = productDoc.data()
            cartItem.name = productData.name || cartItem.name
            cartItem.imageUrl = productData.imageUrl || cartItem.imageUrl
            cartItem.price = productData.price || cartItem.price
            cartItem.type = productData.type || ""
            cartItem.lightRequirement = productData.lightRequirement || "Ưa bóng"
          }
        } catch (error) {
          console.error("Error fetching product details:", error)
        }

        cartData.push(cartItem)
      }

      setCartItems(cartData)

      // Khởi tạo tất cả các mục đều được chọn
      const initialSelectedItems = {}
      cartData.forEach((item) => {
        initialSelectedItems[item.id] = true
      })
      setSelectedItems(initialSelectedItems)
    } catch (error) {
      console.error("Error fetching cart items:", error)
      Alert.alert("Lỗi", "Không thể tải giỏ hàng")
    } finally {
      setLoading(false)
    }
  }

  const calculateTotal = () => {
    let total = 0
    cartItems.forEach((item) => {
      if (selectedItems[item.id]) {
        total += item.price * item.quantity
      }
    })
    setTotalPrice(total)
  }

  const toggleSelectItem = (itemId) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }))
  }

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) {
      return
    }

    try {
      // Cập nhật UI trước để tạo trải nghiệm mượt mà
      setCartItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item)))

      // Cập nhật trong Firestore
      await updateDoc(doc(db, "carts", itemId), {
        quantity: newQuantity,
      })
    } catch (error) {
      console.error("Error updating quantity:", error)
      Alert.alert("Lỗi", "Không thể cập nhật số lượng")
      // Khôi phục lại dữ liệu nếu cập nhật thất bại
      fetchCartItems()
    }
  }

  const confirmDeleteItem = (itemId) => {
    setItemToDelete(itemId)
    setShowDeleteModal(true)
  }

  const deleteItem = async () => {
    if (!itemToDelete) return

    try {
      await deleteDoc(doc(db, "carts", itemToDelete))

      // Cập nhật state
      setCartItems((prev) => prev.filter((item) => item.id !== itemToDelete))

      // Xóa khỏi danh sách đã chọn
      const newSelectedItems = { ...selectedItems }
      delete newSelectedItems[itemToDelete]
      setSelectedItems(newSelectedItems)

      setShowDeleteModal(false)
      setItemToDelete(null)
    } catch (error) {
      console.error("Error removing item:", error)
      Alert.alert("Lỗi", "Không thể xóa sản phẩm")
    }
  }

  const confirmDeleteAll = () => {
    setShowDeleteAllModal(true)
  }

  const deleteAllItems = async () => {
    try {
      const auth = getAuth()
      if (!auth.currentUser) return

      const userId = auth.currentUser.uid
      const cartQuery = query(collection(db, "carts"), where("userId", "==", userId))
      const cartSnapshot = await getDocs(cartQuery)

      // Xóa từng mục trong giỏ hàng
      for (const cartDoc of cartSnapshot.docs) {
        await deleteDoc(doc(db, "carts", cartDoc.id))
      }

      setCartItems([])
      setSelectedItems({})
      setShowDeleteAllModal(false)
    } catch (error) {
      console.error("Error deleting all items:", error)
      Alert.alert("Lỗi", "Không thể xóa tất cả sản phẩm")
    }
  }

  const handleCheckout = () => {
    const selectedCount = Object.values(selectedItems).filter((value) => value).length

    if (selectedCount === 0) {
      Alert.alert("Thông báo", "Vui lòng chọn ít nhất một sản phẩm để thanh toán")
      return
    }

    // Lấy các sản phẩm đã chọn
    const itemsToCheckout = cartItems.filter((item) => selectedItems[item.id])

    // Chuyển đến màn hình thanh toán với các sản phẩm đã chọn
    navigation.navigate("Checkout", { items: itemsToCheckout, totalPrice })
  }

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItemContainer}>
      <TouchableOpacity style={styles.checkboxContainer} onPress={() => toggleSelectItem(item.id)}>
        <View style={[styles.checkbox, selectedItems[item.id] && styles.checkboxSelected]}>
          {selectedItems[item.id] && <Feather name="check" size={16} color="#fff" />}
        </View>
      </TouchableOpacity>

      <Image source={{ uri: item.imageUrl }} style={styles.productImage} resizeMode="cover" />

      <View style={styles.productInfo}>
        <Text style={styles.productName}>
          {item.name} | <Text style={styles.lightRequirement}>{item.lightRequirement}</Text>
        </Text>
        <Text style={styles.productPrice}>{item.price?.toLocaleString("vi-VN")}đ</Text>

        <View style={styles.quantityContainer}>
          <TouchableOpacity style={styles.quantityButton} onPress={() => updateQuantity(item.id, item.quantity - 1)}>
            <Feather name="minus" size={16} color="#000" />
          </TouchableOpacity>

          <Text style={styles.quantityText}>{item.quantity}</Text>

          <TouchableOpacity style={styles.quantityButton} onPress={() => updateQuantity(item.id, item.quantity + 1)}>
            <Feather name="plus" size={16} color="#000" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDeleteItem(item.id)}>
            <Text style={styles.deleteText}>Xoá</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#009245" />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="chevron-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>GIỎ HÀNG</Text>
        <TouchableOpacity onPress={confirmDeleteAll} style={styles.trashButton}>
          <Feather name="trash-2" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {cartItems.length === 0 ? (
        <View style={styles.emptyCartContainer}>
          <Text style={styles.emptyCartText}>Giỏ hàng của bạn hiện đang trống</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.cartList}
          />

          {/* Bottom Bar */}
          <View style={styles.bottomBar}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Tổng</Text>
              <Text style={styles.totalPrice}>{totalPrice.toLocaleString("vi-VN")}đ</Text>
            </View>

            <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
              <Text style={styles.checkoutText}>Tiến hành thanh toán</Text>
              <Feather name="chevron-right" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Modal xác nhận xóa một sản phẩm */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Xác nhận xoá đơn hàng?</Text>
            <Text style={styles.modalText}>Thao tác này sẽ không thể khôi phục.</Text>

            <TouchableOpacity style={styles.confirmButton} onPress={deleteItem}>
              <Text style={styles.confirmButtonText}>Đồng ý</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowDeleteModal(false)
                setItemToDelete(null)
              }}
            >
              <Text style={styles.cancelButtonText}>Huỷ bỏ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal xác nhận xóa tất cả sản phẩm */}
      <Modal
        visible={showDeleteAllModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteAllModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Xác nhận xoá tất cả đơn hàng?</Text>
            <Text style={styles.modalText}>Thao tác này sẽ không thể khôi phục.</Text>

            <TouchableOpacity style={styles.confirmButton} onPress={deleteAllItems}>
              <Text style={styles.confirmButtonText}>Đồng ý</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowDeleteAllModal(false)}>
              <Text style={styles.cancelButtonText}>Huỷ bỏ</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  trashButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyCartText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#333",
    textAlign: "center",
  },
  cartList: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  cartItemContainer: {
    flexDirection: "row",
    marginBottom: 30,
    alignItems: "center",
  },
  checkboxContainer: {
    marginRight: 15,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  checkboxSelected: {
    backgroundColor: "#333",
    borderColor: "#333",
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 15,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    marginBottom: 8,
  },
  lightRequirement: {
    color: "#999",
    fontWeight: "normal",
  },
  productPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#009245",
    marginBottom: 12,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    width: 40,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "500",
  },
  deleteButton: {
    marginLeft: 20,
  },
  deleteText: {
    fontSize: 16,
    color: "#333",
    textDecorationLine: "underline",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 30,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  totalLabel: {
    fontSize: 16,
    color: "#666",
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  checkoutButton: {
    backgroundColor: "#009245",
    borderRadius: 4,
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  checkoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 10,
    textAlign: "center",
  },
  modalText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  confirmButton: {
    backgroundColor: "#009245",
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 30,
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  cancelButtonText: {
    color: "#333",
    fontSize: 16,
    textDecorationLine: "underline",
  },
})

export default CartScreen

