import React, { useState, useEffect } from 'react'
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Image,
  Alert 
} from 'react-native'
import { 
  addDoc, 
  collection, 
  serverTimestamp, 
  query, 
  where, 
  getDocs,
  deleteDoc,
  doc 
} from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { db } from '../firebase/config'

const CheckoutScreen = ({ navigation }) => {
  const [cartItems, setCartItems] = useState([])
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    address: '',
    phone: '',
  })
  const [shippingMethod, setShippingMethod] = useState('fast')
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [loading, setLoading] = useState(true)

  // Tính toán giá tiền
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const shippingFee = shippingMethod === 'fast' ? 15000 : 20000
  const total = subtotal + shippingFee

  useEffect(() => {
    fetchCartItems()
  }, [])

  const fetchCartItems = async () => {
    try {
      const auth = getAuth()
      if (!auth.currentUser) {
        Alert.alert("Thông báo", "Vui lòng đăng nhập để tiếp tục")
        navigation.goBack()
        return
      }

      const cartQuery = query(
        collection(db, "carts"),
        where("userId", "==", auth.currentUser.uid)
      )

      const querySnapshot = await getDocs(cartQuery)
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      setCartItems(items)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching cart:", error)
      Alert.alert("Lỗi", "Không thể tải giỏ hàng")
      setLoading(false)
    }
  }

  // Trong hàm handleCheckout, sau khi thêm đơn hàng thành công:
  const handleCheckout = async () => {
    try {
      const auth = getAuth();
      if (!auth.currentUser) {
        Alert.alert("Thông báo", "Vui lòng đăng nhập để tiếp tục");
        return;
      }
  
      setLoading(true); // Thêm loading state
  
      // Kiểm tra lại giỏ hàng trước khi đặt hàng
      const cartQuery = query(
        collection(db, "carts"),
        where("userId", "==", auth.currentUser.uid)
      );
      const cartSnapshot = await getDocs(cartQuery);
      
      if (cartSnapshot.empty) {
        Alert.alert("Thông báo", "Giỏ hàng trống");
        return;
      }
  
      // Tạo orderData
      const orderData = {
        userId: auth.currentUser.uid,
        items: cartItems,
        customer: customerInfo,
        shippingMethod,
        paymentMethod,
        subtotal,
        shippingFee,
        total,
        status: "pending",
        createdAt: serverTimestamp(),
      };
  
      // Thêm đơn hàng
      const orderRef = await addDoc(collection(db, 'orders'), orderData);
  
      // Thêm thông báo
      await addDoc(collection(db, 'notifications'), {
        userId: auth.currentUser.uid,
        title: 'Đơn hàng đã được xác nhận',
        message: `Đơn hàng #${orderRef.id.slice(-5)} của bạn đã được xác nhận và đang được xử lý.`,
        time: serverTimestamp(),
        read: false,
        type: 'order'
      });
  
      // Xóa giỏ hàng
      const deletePromises = cartItems.map(item => 
        deleteDoc(doc(db, "carts", item.id))
      );
      await Promise.all(deletePromises);
  
      Alert.alert(
        "Thành công",
        "Đơn hàng của bạn đã được đặt thành công!",
        [
          {
            text: "OK",
            onPress: () => navigation.reset({
              index: 0,
              routes: [{ name: 'Main' }]
            })
          }
        ]
      );
  
    } catch (error) {
      console.error("Lỗi khi đặt hàng:", error);
      Alert.alert(
        "Lỗi",
        "Không thể hoàn tất đơn hàng. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  // Kiểm tra form hợp lệ
  const isFormValid = 
    customerInfo.name &&
    customerInfo.email &&
    customerInfo.address &&
    customerInfo.phone &&
    shippingMethod &&
    paymentMethod

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Đang tải...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>THANH TOÁN</Text>

      {/* Hiển thị giỏ hàng */}
      <View style={styles.cartSection}>
        <Text style={styles.sectionTitle}>Giỏ hàng của bạn</Text>
        {cartItems.map(item => (
          <View key={item.id} style={styles.cartItem}>
            <Image 
              source={{ uri: item.imageUrl }} 
              style={styles.itemImage} 
            />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text>Số lượng: {item.quantity}</Text>
              <Text>Giá: {(item.price * item.quantity).toLocaleString()}đ</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Form thông tin khách hàng */}
      <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
      <TextInput
        style={styles.input}
        placeholder="Họ tên"
        value={customerInfo.name}
        onChangeText={(text) => setCustomerInfo({ ...customerInfo, name: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={customerInfo.email}
        onChangeText={(text) => setCustomerInfo({ ...customerInfo, email: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Địa chỉ"
        value={customerInfo.address}
        onChangeText={(text) => setCustomerInfo({ ...customerInfo, address: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Số điện thoại"
        keyboardType="phone-pad"
        value={customerInfo.phone}
        onChangeText={(text) => setCustomerInfo({ ...customerInfo, phone: text })}
      />

      {/* Phương thức vận chuyển */}
      <Text style={styles.sectionTitle}>Phương thức vận chuyển</Text>
      <TouchableOpacity 
        onPress={() => setShippingMethod('fast')} 
        style={styles.optionContainer}
      >
        <Text style={[styles.optionText, shippingMethod === 'fast' && styles.selectedText]}>
          Giao hàng Nhanh - 15.000đ
          {"\n"}
          <Text style={styles.subText}>Dự kiến giao hàng 1-2 ngày</Text>
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        onPress={() => setShippingMethod('standard')} 
        style={styles.optionContainer}
      >
        <Text style={[styles.optionText, shippingMethod === 'standard' && styles.selectedText]}>
          Giao hàng Tiêu chuẩn - 20.000đ
          {"\n"}
          <Text style={styles.subText}>Dự kiến giao hàng 3-5 ngày</Text>
        </Text>
      </TouchableOpacity>

      {/* Phương thức thanh toán */}
      <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
      <TouchableOpacity 
        onPress={() => setPaymentMethod('cod')} 
        style={styles.optionContainer}
      >
        <Text style={[styles.optionText, paymentMethod === 'cod' && styles.selectedText]}>
          Thanh toán khi nhận hàng (COD)
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        onPress={() => setPaymentMethod('banking')} 
        style={styles.optionContainer}
      >
        <Text style={[styles.optionText, paymentMethod === 'banking' && styles.selectedText]}>
          Chuyển khoản ngân hàng
        </Text>
      </TouchableOpacity>

      {/* Tổng tiền */}
      <View style={styles.summary}>
        <Text style={styles.summaryText}>Tổng: {subtotal.toLocaleString()}đ</Text>
        <Text style={styles.summaryText}>Phí vận chuyển: {shippingFee.toLocaleString()}đ</Text>
        <Text style={[styles.summaryText, styles.total]}>
          Tổng cộng: {total.toLocaleString()}đ
        </Text>
      </View>

      {/* Nút đặt hàng */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: isFormValid ? '#007bff' : '#ccc' }]}
        disabled={!isFormValid}
        onPress={handleCheckout}
      >
        <Text style={styles.buttonText}>ĐẶT HÀNG</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { 
    padding: 16, 
    backgroundColor: '#fff' 
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 20, 
    textAlign: 'center' 
  },
  cartSection: {
    marginBottom: 20,
  },
  cartItem: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 5,
  },
  itemInfo: {
    marginLeft: 10,
    flex: 1,
  },
  itemName: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    marginTop: 20, 
    marginBottom: 10 
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  optionContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
  },
  optionText: {
    color: '#333',
  },
  selectedText: {
    color: '#007bff',
    fontWeight: 'bold',
  },
  subText: {
    fontSize: 12,
    color: '#666',
  },
  summary: {
    marginTop: 20,
    borderTopWidth: 1,
    borderColor: '#eee',
    paddingTop: 10,
  },
  summaryText: {
    fontSize: 16,
    marginBottom: 5,
  },
  total: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#007bff',
  },
  button: {
    marginTop: 30,
    marginBottom: 30,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
})

export default CheckoutScreen